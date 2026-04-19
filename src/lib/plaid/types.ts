export interface PlaidAccount {
  account_id: string
  name: string
  official_name: string | null
  type: string
  subtype: string | null
  mask: string | null
  current_balance: number | null
  available_balance: number | null
  currency: string
}

export interface PlaidConnection {
  id: string
  firmId: string
  clientId: string
  itemId: string
  institutionId: string | null
  institutionName: string | null
  accounts: PlaidAccount[]
  cursor: string | null
  status: 'active' | 'error' | 'login_required'
  errorCode: string | null
  lastSyncedAt: string | null
  createdAt: string
}

export interface PlaidTransaction {
  id: string
  firmId: string
  clientId: string
  plaidTransactionId: string
  accountId: string
  date: string
  name: string
  amount: number
  currency: string
  categoryPrimary: string | null
  categoryDetailed: string | null
  merchantName: string | null
  pending: boolean
  importedAt: string
}

export interface SyncResult {
  added: number
  modified: number
  removed: number
}
