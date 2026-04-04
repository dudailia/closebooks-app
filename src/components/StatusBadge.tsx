import type { Transaction } from '@/types'

interface Props {
  status: Transaction['status']
}

const styles: Record<Transaction['status'], string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  edited:   'bg-blue-100 text-blue-800',
  flagged:  'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  )
}
