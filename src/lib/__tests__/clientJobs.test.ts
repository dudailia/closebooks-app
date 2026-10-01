import { beforeEach, describe, expect, it } from 'vitest'
import { clientForJob, jobBelongsToClient, jobsForClient, sameClientJobs, searchClients } from '@/lib/clientJobs'
import { isMissingClientIdColumn, resetJobColumnDetection, upsertJobRow } from '@/lib/jobPersistence'
import { mapJobFromRows } from '@/lib/hydrateMappers'

// Two clients with the same name, plus one other.
const acmeA = { id: 'c-a', business_name: 'Acme LLC', industry: 'Retail', contact_email: 'a@acme.test' }
const acmeB = { id: 'c-b', business_name: 'Acme LLC', industry: 'Technology', contact_email: 'b@acme.test' }
const other = { id: 'c-o', business_name: 'Other Co', industry: 'Other', contact_email: '' }
const clients = [acmeA, acmeB, other]

const jobA = { id: 'j1', client_id: 'c-a', client_name: 'Acme LLC' }
const jobB = { id: 'j2', client_id: 'c-b', client_name: 'Acme LLC' }
const legacyAcme = { id: 'j3', client_name: 'acme llc' } // saved before client_id
const legacyOther = { id: 'j4', client_name: 'Other Co' }

describe('closes are linked to clients by id', () => {
  it('two clients with the same name do not share closes', () => {
    expect(jobsForClient([jobA, jobB], acmeA).map((j) => j.id)).toEqual(['j1'])
    expect(jobsForClient([jobA, jobB], acmeB).map((j) => j.id)).toEqual(['j2'])
  })

  it('renaming a client keeps its closes', () => {
    expect(jobBelongsToClient(jobA, { ...acmeA, business_name: 'Acme Holdings' })).toBe(true)
  })

  it('finds the client for a job by id', () => {
    expect(clientForJob(jobB, clients)).toBe(acmeB)
    expect(clientForJob({ client_id: 'gone', client_name: 'Acme LLC' }, clients)).toBeNull()
  })

  it('two jobs are the same client only when their ids match', () => {
    expect(sameClientJobs(jobA, jobB)).toBe(false)
    expect(sameClientJobs(jobA, { client_id: 'c-a', client_name: 'Renamed' })).toBe(true)
  })
})

describe('old jobs without client_id keep working', () => {
  it('match by name, case-insensitive', () => {
    expect(jobBelongsToClient(legacyOther, other)).toBe(true)
    expect(jobBelongsToClient(legacyAcme, acmeA)).toBe(true)
  })

  it('find their client by name only when exactly one client has it', () => {
    expect(clientForJob(legacyOther, clients)).toBe(other)
    expect(clientForJob(legacyAcme, clients)).toBeNull()
  })

  it('a legacy job and a linked job compare by name', () => {
    expect(sameClientJobs(legacyAcme, jobA)).toBe(true)
  })

  it('a row with no client_id loads without one', () => {
    const job = mapJobFromRows({ id: 'j3', client_name: 'Acme LLC' }, [])
    expect(job.client_id).toBeUndefined()
    expect(mapJobFromRows({ id: 'j1', client_id: 'c-a', client_name: 'Acme LLC' }, []).client_id).toBe('c-a')
  })
})

describe('searchClients', () => {
  it('matches name, industry or email; empty query returns all', () => {
    expect(searchClients(clients, '')).toHaveLength(3)
    expect(searchClients(clients, 'acme').map((c) => c.id)).toEqual(['c-a', 'c-b'])
    expect(searchClients(clients, 'b@acme').map((c) => c.id)).toEqual(['c-b'])
    expect(searchClients(clients, 'retail').map((c) => c.id)).toEqual(['c-a'])
  })
})

describe('job save before the client_id migration runs', () => {
  beforeEach(() => resetJobColumnDetection())

  function fakeSupabase(columnExists: boolean) {
    const rows: Record<string, unknown>[] = []
    return {
      rows,
      from: () => ({
        upsert: async (row: Record<string, unknown>) => {
          if (!columnExists && 'client_id' in row) {
            return { error: { code: 'PGRST204', message: "Could not find the 'client_id' column of 'jobs' in the schema cache" } }
          }
          rows.push(row)
          return { error: null }
        },
      }),
    }
  }

  it('saves with client_id when the column exists', async () => {
    const db = fakeSupabase(true)
    const { error } = await upsertJobRow(db as never, { id: 'j1', client_id: 'c-a', client_name: 'Acme LLC' })
    expect(error).toBeNull()
    expect(db.rows).toEqual([{ id: 'j1', client_id: 'c-a', client_name: 'Acme LLC' }])
  })

  it('retries without client_id when the column is missing, and remembers', async () => {
    const db = fakeSupabase(false)
    expect((await upsertJobRow(db as never, { id: 'j1', client_id: 'c-a', client_name: 'Acme LLC' })).error).toBeNull()
    expect((await upsertJobRow(db as never, { id: 'j2', client_id: 'c-b', client_name: 'Acme LLC' })).error).toBeNull()
    expect(db.rows).toEqual([{ id: 'j1', client_name: 'Acme LLC' }, { id: 'j2', client_name: 'Acme LLC' }])
  })

  it('only a missing client_id column triggers the retry', () => {
    expect(isMissingClientIdColumn({ code: 'PGRST204', message: "Could not find the 'client_id' column" })).toBe(true)
    expect(isMissingClientIdColumn({ code: 'PGRST204', message: "Could not find the 'splits' column" })).toBe(false)
    expect(isMissingClientIdColumn({ code: '42501', message: 'permission denied' })).toBe(false)
    expect(isMissingClientIdColumn(null)).toBe(false)
  })
})
