export type ContractType = 'NDA' | 'MSA'
export type ContractStatus = 'uploaded' | 'processing' | 'processed' | 'error'

export interface Contract {
  id: string
  user_id: string
  name: string
  contract_type: ContractType
  status: ContractStatus
  page_count: number
  file_path: string | null
  contract_text: string
  created_at: string
  updated_at: string
}

export interface KeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  value: string
  original_value: string | null
  page_number: number
  confidence_score: number
  source_sentence: string
  is_custom: boolean
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface CustomKeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  created_at: string
}

export type MessageRole = 'user' | 'assistant'

export interface ChatSession {
  id: string
  contract_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: MessageRole
  content: string
  page_citations: number[]
  created_at: string
}

export type FeedbackRating = 'up' | 'down'

export interface UserFeedback {
  id: string
  contract_id: string
  user_id: string
  rating: FeedbackRating
  comment: string | null
  created_at: string
}

// API Response Types
export interface UploadContractResponse {
  contract_id: string
  status: 'uploaded'
  page_count: number
  token_count: number
  standard_terms: string[]
}

export interface ProcessContractResponse {
  contract_id: string
  status: 'processed'
  key_terms: KeyTerm[]
}

export interface GetContractResponse {
  contract: Pick<Contract, 'id' | 'name' | 'contract_type' | 'status' | 'page_count' | 'created_at'> & {
    signed_url: string | null
  }
  key_terms: KeyTerm[]
  chat_session_id: string
}

export interface UpdateKeyTermRequest {
  value: string
}

export interface UpdateKeyTermResponse {
  id: string
  value: string
  original_value: string | null
  is_edited: true
}

export interface SendChatMessageRequest {
  session_id: string
  message: string
}

export interface SendChatMessageResponse {
  message_id: string
  role: 'assistant'
  content: string
  page_citations: number[]
  created_at: string
}

export interface GetChatHistoryResponse {
  session_id: string
  messages: Pick<ChatMessage, 'id' | 'role' | 'content' | 'page_citations' | 'created_at'>[]
}

export interface DashboardContract {
  id: string
  name: string
  contract_type: ContractType
  status: ContractStatus
  page_count: number
  term_count: number
  created_at: string
}

export interface GetDashboardResponse {
  contracts: DashboardContract[]
  stats: {
    total: number
    processed: number
    processing: number
    error: number
  }
}

export interface ApiError {
  error: string
  code: string
  message: string
}

export type UploadState = 'idle' | 'uploading' | 'preview' | 'processing' | 'done' | 'error'
