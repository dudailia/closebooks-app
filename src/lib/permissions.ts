/**
 * Role-based access (aligns with public.firm_members.role).
 */

export type FirmRole =
  | 'owner'
  | 'admin'
  | 'senior_accountant'
  | 'staff'
  | 'readonly'

const RANK: Record<FirmRole, number> = {
  readonly: 1,
  staff: 2,
  senior_accountant: 3,
  admin: 4,
  owner: 5,
}

export function rank(role: FirmRole | string | null | undefined): number {
  if (!role) return 0
  return RANK[role as FirmRole] ?? 0
}

export function atLeast(
  role: FirmRole | string | null | undefined,
  min: FirmRole
): boolean {
  return rank(role) >= RANK[min]
}

export type Permission =
  | 'billing'
  | 'team'
  | 'approve_journal'
  | 'complete_close'
  | 'manage_clients'
  | 'categorize'
  | 'review'
  | 'upload'
  | 'view'

export function can(role: FirmRole | string | null | undefined, p: Permission): boolean {
  if (!role) return false
  switch (p) {
    case 'billing':
    case 'team':
      return atLeast(role, 'admin')
    case 'approve_journal':
    case 'complete_close':
    case 'manage_clients':
      return atLeast(role, 'senior_accountant')
    case 'categorize':
    case 'review':
    case 'upload':
      return atLeast(role, 'staff')
    case 'view':
      return atLeast(role, 'readonly')
    default:
      return false
  }
}
