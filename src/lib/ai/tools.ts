import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const AI_TOOLS: Tool[] = [
  {
    name: 'findTransactions',
    description:
      'Find transactions in the current job matching a natural-language query (e.g., "all Amazon charges over $500"). Returns matching transaction ids.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Natural-language filter' } },
      required: ['query'],
    },
  },
  {
    name: 'flagTransactions',
    description: 'Flag the given transaction ids for human review. Undoable by the CPA.',
    input_schema: {
      type: 'object',
      properties: {
        txIds:  { type: 'array', items: { type: 'string' } },
        reason: { type: 'string' },
      },
      required: ['txIds'],
    },
  },
  {
    name: 'approveTransactions',
    description: 'Mark the given transaction ids as approved.',
    input_schema: {
      type: 'object',
      properties: { txIds: { type: 'array', items: { type: 'string' } } },
      required: ['txIds'],
    },
  },
  {
    name: 'changeCategoryBulk',
    description: 'Change the category and account code for a set of transactions.',
    input_schema: {
      type: 'object',
      properties: {
        txIds:        { type: 'array', items: { type: 'string' } },
        accountCode:  { type: 'string' },
        categoryName: { type: 'string' },
      },
      required: ['txIds', 'accountCode', 'categoryName'],
    },
  },
  {
    name: 'runAutoClose',
    description:
      'Start the Autonomous Close Agent for the current client. Returns a stream id the client will subscribe to.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'getOverdueJobs',
    description: 'List clients whose month-end close is overdue.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'explainVariance',
    description: 'Explain a variance for the current client. For example, why office expenses jumped 40%.',
    input_schema: {
      type: 'object',
      properties: { category: { type: 'string' } },
      required: ['category'],
    },
  },
]

export const TOOL_NAMES = AI_TOOLS.map((t) => t.name)

export type ToolName =
  | 'findTransactions'
  | 'flagTransactions'
  | 'approveTransactions'
  | 'changeCategoryBulk'
  | 'runAutoClose'
  | 'getOverdueJobs'
  | 'explainVariance'
