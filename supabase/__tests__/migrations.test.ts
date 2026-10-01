import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'

// Applies every migration in supabase/migrations, in order, to PGlite (Postgres
// compiled to WebAssembly, in memory), then checks the policies the 2026-10-01
// migrations add (docs/engine/rls-audit.md F5, F9, F10, F14).
//
// This is not Supabase: auth.uid(), the anon/authenticated roles and the
// storage schema are small stand-ins defined below, and the `subscriptions`
// table comes from the hand-run SQL (it is not created by any migration).
// It shows the SQL runs and the policies decide as intended; it says nothing
// about what is applied in the live database.

const MIGRATIONS = path.resolve(__dirname, '..', 'migrations')

const STUBS = `
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.role() returns text language sql stable as $$ select auth.jwt() ->> 'role' $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public bool, file_size_limit int, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb, created_at timestamptz default now());
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable
  as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
-- From supabase/CLOSEBOOKS_PASTE_ALL_IN_SUPABASE.sql (no migration creates it).
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key, stripe_customer_id text, stripe_subscription_id text unique,
  customer_email text, status text not null default 'active', amount_total int, currency text,
  checkout_session_id text, plan_slug text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
`

// A owns firm A; B owns firm B; D is an admin in firm A; C and E are other users.
// Every user gets their own firm from the signup trigger.
const U = {
  A: '00000000-0000-0000-0000-00000000000a',
  B: '00000000-0000-0000-0000-00000000000b',
  C: '00000000-0000-0000-0000-00000000000c',
  D: '00000000-0000-0000-0000-00000000000d',
  E: '00000000-0000-0000-0000-00000000000e',
}

let db: PGlite
let FA = ''
let FB = ''
const applied: string[] = []

async function firmOf(user: string): Promise<string> {
  const r = await db.query<{ id: string }>(`select id from public.firms where owner_id = $1`, [user])
  return r.rows[0].id
}

/** Run one statement as a signed-in user (or anon), the way PostgREST would. */
async function as(user: string | null, sql: string) {
  const claims = JSON.stringify({ role: user ? 'authenticated' : 'anon', sub: user ?? '' })
  await db.exec(`reset role;
    select set_config('request.jwt.claim.sub', '${user ?? ''}', false);
    select set_config('request.jwt.claims', '${claims}', false);
    set role ${user ? 'authenticated' : 'anon'};`)
  try {
    const r = await db.query<Record<string, unknown>>(sql)
    return { ok: true as const, rows: r.rows, affected: r.affectedRows ?? 0 }
  } catch (e) {
    return { ok: false as const, rows: [], affected: 0, error: (e as Error).message }
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claims', '', false); select set_config('request.jwt.claim.sub', '', false);`)
  }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(STUBS)
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(path.join(MIGRATIONS, f), 'utf8'))
    applied.push(f)
  }
  await db.exec(`grant usage on schema public, storage, auth to anon, authenticated;
    grant all on all tables in schema public to anon, authenticated;
    grant all on all tables in schema storage to anon, authenticated;
    grant execute on all functions in schema auth to anon, authenticated;`)
  for (const id of Object.values(U)) await db.query(`insert into auth.users (id) values ($1)`, [id])
  FA = await firmOf(U.A)
  FB = await firmOf(U.B)
  await db.query(`insert into public.firm_members (user_id, firm_id, role) values ($1, $2, 'admin')`, [U.D, FA])
  // C owns no firm, so making C an owner isn't stopped by unique (owner_id).
  await db.query(`delete from public.firms where owner_id = $1`, [U.C])
}, 60_000)

describe('migrations', () => {
  it('all apply in order', () => {
    const files = readdirSync(MIGRATIONS).filter((n) => n.endsWith('.sql'))
    expect(applied).toHaveLength(files.length)
  })
})

describe('F10: cb_is_member_of_firm answers only about the caller', () => {
  it('true for the caller in their firm', async () => {
    expect((await as(U.A, `select public.cb_is_member_of_firm('${FA}', '${U.A}') as v`)).rows[0].v).toBe(true)
  })
  it('false when asking about another user', async () => {
    expect((await as(U.E, `select public.cb_is_member_of_firm('${FA}', '${U.A}') as v`)).rows[0].v).toBe(false)
  })
  it('false (not null) for anon', async () => {
    expect((await as(null, `select public.cb_is_member_of_firm('${FA}', '${U.A}') as v`)).rows[0].v).toBe(false)
  })
  it('policies that use it still work', async () => {
    expect((await as(U.D, `select count(*)::int as c from public.firm_members where firm_id = '${FA}'`)).rows[0].c).toBe(2)
    expect((await as(U.E, `select count(*)::int as c from public.firm_members where firm_id = '${FA}'`)).rows[0].c).toBe(0)
  })
})

describe('F14: firms.owner_id is pinned for API sessions', () => {
  it('the owner can still rename the firm', async () => {
    expect((await as(U.A, `update public.firms set name = 'A renamed' where id = '${FA}'`)).affected).toBe(1)
  })
  it('an admin cannot change owner_id', async () => {
    const r = await as(U.D, `update public.firms set owner_id = '${U.C}' where id = '${FA}'`)
    expect(r.ok).toBe(false)
    expect(await db.query(`select owner_id from public.firms where id = '${FA}'`).then((x) => (x.rows[0] as { owner_id: string }).owner_id)).toBe(U.A)
  })
  it('a direct database session can transfer ownership', async () => {
    expect((await db.query(`update public.firms set owner_id = $1 where id = $2`, [U.C, FB])).affectedRows).toBe(1)
    await db.query(`update public.firms set owner_id = $1 where id = $2`, [U.B, FB])
  })
})

describe('F5: firm_members role limits, cb_firm_id order', () => {
  it('an admin cannot add an owner or another admin', async () => {
    expect((await as(U.D, `insert into public.firm_members (user_id, firm_id, role) values ('${U.E}', '${FA}', 'owner')`)).ok).toBe(false)
    expect((await as(U.D, `insert into public.firm_members (user_id, firm_id, role) values ('${U.E}', '${FA}', 'admin')`)).ok).toBe(false)
  })
  it('an admin can add staff', async () => {
    expect((await as(U.D, `insert into public.firm_members (user_id, firm_id, role) values ('${U.E}', '${FA}', 'staff')`)).ok).toBe(true)
  })
  it('an admin cannot promote to admin; the owner can', async () => {
    expect((await as(U.D, `update public.firm_members set role = 'admin' where user_id = '${U.E}' and firm_id = '${FA}'`)).ok).toBe(false)
    expect((await as(U.A, `update public.firm_members set role = 'admin' where user_id = '${U.E}' and firm_id = '${FA}'`)).affected).toBe(1)
  })
  it('a user cannot add themselves to a firm they do not own', async () => {
    expect((await as(U.C, `insert into public.firm_members (user_id, firm_id, role) values ('${U.C}', '${FA}', 'staff')`)).ok).toBe(false)
  })
  it('cb_firm_id() returns the firm the user owns, even when they joined another', async () => {
    await as(U.A, `insert into public.firm_members (user_id, firm_id, role) values ('${U.B}', '${FA}', 'staff')`)
    // Put B's own owner row after the firm A row (newer and later in the heap),
    // so an unordered `limit 1` would return firm A.
    await db.query(`delete from public.firm_members where user_id = $1 and firm_id = $2`, [U.B, FB])
    await db.query(`insert into public.firm_members (user_id, firm_id, role, created_at) values ($1, $2, 'owner', now() + interval '1 day')`, [U.B, FB])
    expect((await as(U.B, `select public.cb_firm_id() as v`)).rows[0].v).toBe(FB)
  })
})

describe('F9: brand-assets uploads only into the caller’s firm folder', () => {
  const upload = (user: string, name: string) =>
    as(user, `insert into storage.objects (bucket_id, name) values ('brand-assets', '${name}')`)

  it('an owner uploads into their firm folder', async () => {
    expect((await upload(U.A, `${FA}/logo-1.png`)).ok).toBe(true)
  })
  it('not into another firm folder, and not at the root', async () => {
    expect((await upload(U.A, `${FB}/logo-1.png`)).ok).toBe(false)
    expect((await upload(U.A, 'logo.png')).ok).toBe(false)
  })
  it('staff cannot upload branding', async () => {
    expect((await upload(U.B, `${FA}/x.png`)).ok).toBe(false)
  })
  it('SVG is no longer an allowed type', async () => {
    const r = await db.query<{ allowed_mime_types: string[] }>(`select allowed_mime_types from storage.buckets where id = 'brand-assets'`)
    expect(r.rows[0].allowed_mime_types).toEqual(['image/png', 'image/jpeg', 'image/webp'])
  })
})
