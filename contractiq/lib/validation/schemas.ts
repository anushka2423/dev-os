import { z } from 'zod'

export const UploadContractSchema = z.object({
  contract_type: z.enum(['NDA', 'MSA']),
  name: z.string().max(200).optional(),
})

export const ProcessContractSchema = z.object({
  custom_term_ids: z.array(z.string().uuid()).max(5).optional().default([]),
})

export const UpdateKeyTermSchema = z.object({
  value: z.string().min(1, 'Value cannot be empty').max(1000),
})

export const SendChatMessageSchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(1000),
})

export const KeyTermExtractionSchema = z.object({
  terms: z.array(
    z.object({
      term_name: z.string().min(1),
      value: z.string().default(''),
      page_number: z.number().int().min(0),
      confidence_score: z.number().min(0).max(100),
      source_sentence: z.string().default(''),
    })
  ),
})
