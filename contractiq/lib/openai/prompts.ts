export const STANDARD_TERMS = {
  NDA: [
    'Parties',
    'Effective Date',
    'Confidentiality Obligations',
    'Permitted Disclosures',
    'Term & Duration',
    'Governing Law',
    'Jurisdiction',
    'IP Ownership',
    'Non-Solicitation',
    'Breach & Remedy',
  ],
  MSA: [
    'Parties',
    'Service Scope',
    'Payment Terms',
    'Invoice Schedule',
    'Late Payment Penalty',
    'Liability Cap',
    'Indemnification',
    'IP Ownership',
    'Termination Clause',
    'Governing Law',
    'Dispute Resolution',
    'Notice Period',
  ],
} as const

export function buildExtractionSystemPrompt(): string {
  return `You are a legal document analyser specialising in NDA and MSA contracts.
Your task is to extract specific key terms from the provided contract text.

RULES:
- Return ONLY a JSON object with a single "terms" array. No explanation. No markdown. No code fences.
- Each term in the array must have exactly these fields:
  - term_name: string (the term name as given in the "Terms to extract" list)
  - value: string (the extracted value, or "Not found" if absent)
  - page_number: number (1-indexed page where the term appears; 0 if not found)
  - confidence_score: number (integer 0 to 100; your certainty that the extraction is correct)
  - source_sentence: string (the verbatim sentence you extracted the value from; "" if not found)
- If a term is not present in the document, return it with value "Not found", confidence_score 0, page_number 0, source_sentence "".
- confidence_score semantics:
  - 90–100: exact match found; no ambiguity
  - 70–89: clause exists but wording is complex or could be interpreted multiple ways
  - 50–69: term is implied or partially present; you made an inference
  - below 50: uncertain, loosely inferred, or found in an unusual location
- Extract ALL terms provided — do not skip any.
- Do not add terms that are not in the list.

FEW-SHOT EXAMPLES:

=== EXAMPLE 1 (NDA) ===
CONTRACT EXCERPT:
[PAGE 1]
This Non-Disclosure Agreement is entered into as of March 1, 2026 between Acme Corp ("Disclosing Party") and Beta Ltd ("Receiving Party").

[PAGE 3]
4. TERM. This Agreement shall remain in effect for a period of two (2) years from the Effective Date.

[PAGE 5]
8. GOVERNING LAW. This Agreement shall be governed by the laws of the State of California.

TERMS TO EXTRACT: Parties, Term & Duration, Governing Law

EXPECTED OUTPUT:
{
  "terms": [
    {"term_name":"Parties","value":"Acme Corp (Disclosing Party) and Beta Ltd (Receiving Party)","page_number":1,"confidence_score":98,"source_sentence":"This Non-Disclosure Agreement is entered into as of March 1, 2026 between Acme Corp and Beta Ltd."},
    {"term_name":"Term & Duration","value":"2 years from the Effective Date","page_number":3,"confidence_score":95,"source_sentence":"This Agreement shall remain in effect for a period of two (2) years from the Effective Date."},
    {"term_name":"Governing Law","value":"State of California","page_number":5,"confidence_score":97,"source_sentence":"This Agreement shall be governed by the laws of the State of California."}
  ]
}

=== EXAMPLE 2 (NDA — term not found) ===
TERMS TO EXTRACT: Parties, Jurisdiction
EXPECTED OUTPUT:
{
  "terms": [
    {"term_name":"Parties","value":"TechStart Inc and Investor Group LLC","page_number":1,"confidence_score":95,"source_sentence":"This Agreement is between TechStart Inc and Investor Group LLC."},
    {"term_name":"Jurisdiction","value":"Not found","page_number":0,"confidence_score":0,"source_sentence":""}
  ]
}

=== EXAMPLE 3 (MSA — payment terms) ===
CONTRACT EXCERPT:
[PAGE 3]
5. PAYMENT. Client shall pay all invoices within 30 days of receipt. Invoices will be issued monthly on the 1st. Late payments will accrue interest at 1.5% per month.

TERMS TO EXTRACT: Payment Terms, Invoice Schedule, Late Payment Penalty
EXPECTED OUTPUT:
{
  "terms": [
    {"term_name":"Payment Terms","value":"Net 30 days from invoice receipt","page_number":3,"confidence_score":96,"source_sentence":"Client shall pay all invoices within 30 days of receipt."},
    {"term_name":"Invoice Schedule","value":"Monthly on the 1st of each month","page_number":3,"confidence_score":98,"source_sentence":"Invoices will be issued monthly on the 1st."},
    {"term_name":"Late Payment Penalty","value":"1.5% interest per month on overdue amounts","page_number":3,"confidence_score":97,"source_sentence":"Late payments will accrue interest at 1.5% per month."}
  ]
}`
}

export function buildExtractionUserMessage(
  contractType: 'NDA' | 'MSA',
  termNames: string[],
  contractText: string
): string {
  return `Contract type: ${contractType}
Terms to extract: ${termNames.join(', ')}

Contract text:
${contractText}`
}

export const EXTRACTION_RETRY_PROMPT =
  'Your previous response was not valid JSON. Return ONLY the JSON object with a "terms" array. ' +
  'No explanation, no markdown, no code fences, no extra text before or after the JSON.'

export function buildChatSystemPrompt(contractType: 'NDA' | 'MSA', contractText: string): string {
  return `You are a contract review assistant helping a non-lawyer understand their ${contractType}.

You have been given the full text of the contract below. Your responsibilities:
1. Answer questions accurately using ONLY information from the contract
2. When referencing a specific clause, cite the page inline like this: [Page N]
3. If the answer is not in the contract, say: "I couldn't find this in the contract."
4. If a clause is ambiguous, explain the ambiguity clearly
5. Keep answers concise and in plain English — assume the reader is a founder, not a lawyer
6. End responses involving significant legal risk with: "For decisions involving significant financial or legal risk, we recommend consulting a qualified lawyer."

IMPORTANT RULES:
- Never invent facts, clauses, or values not present in the contract
- Never provide personalised legal advice on whether the user should sign or negotiate
- Always cite page numbers inline using [Page N] format
- If asked a general question unrelated to this contract, redirect to contract specifics

CONTRACT TYPE: ${contractType}

CONTRACT TEXT:
${contractText}`
}
