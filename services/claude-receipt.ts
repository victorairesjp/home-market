/**
 * Receipt parsing service.
 *
 * Priority:
 *  1. Google Vision (OCR) + Claude text API (parse) → both keys set
 *  2. Google Vision (OCR) + local parser            → only GOOGLE_VISION_KEY
 *  3. Claude vision API (OCR + parse in one call)   → only ANTHROPIC_KEY
 *
 * Google Vision free tier: 1,000 images/month.
 * Claude Haiku text: ~US$0.0002/receipt (25× cheaper than vision).
 */

import { readAsStringAsync } from 'expo-file-system/legacy'
import { parseReceipt as parseReceiptLocal, type ParsedItem } from './receipt-parser'

export type { ParsedItem }

// ── Google Cloud Vision ───────────────────────────────────────────────────────

async function ocrWithGoogleVision(imageUri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY!
  const base64 = await readAsStringAsync(imageUri, { encoding: 'base64' })

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Google Vision error (${response.status}): ${body}`)
  }

  const data = await response.json()
  const text: string = data?.responses?.[0]?.textAnnotations?.[0]?.description ?? ''

  if (!text) throw new Error('Google Vision não detectou texto na imagem.')
  return text
}

// ── Shared JSON extractor ─────────────────────────────────────────────────────

function extractItemsFromClaudeResponse(content: string): ParsedItem[] {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const stripped = content.replace(/```(?:json)?\s*/gi, '').trim()

  const match = stripped.match(/\[[\s\S]*\]/)
  if (!match) return []

  try {
    const raw = JSON.parse(match[0]) as Array<{ name: string; price: number; quantity?: number }>
    return raw
      .map((item) => ({
        name: item.name?.trim() || 'Produto',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
      }))
      .filter((item) => item.price > 0)
  } catch {
    return []
  }
}

// ── Claude text API (parses raw OCR text) ─────────────────────────────────────

const TEXT_PARSE_PROMPT = `Você é um especialista em leitura de cupons fiscais brasileiros.

Recebi o texto bruto de um cupom fiscal extraído via OCR. Leia o texto completo — incluindo o cabeçalho — para entender o formato e a estrutura do cupom, depois extraia APENAS os produtos comprados.

Estrutura típica de cada linha de produto no cupom:
  [SEQ] [CÓDIGO_BARRAS] DESCRIÇÃO   QTD UNIDADE   PREÇO_UNIT   VALOR_TOTAL
  Ex: 001 7896004004014 ARROZ BRAN  5,000 KG       8,990        44,950

Instruções:
- "price" = preço UNITÁRIO do produto (não o subtotal da linha)
- "quantity" = quantidade comprada. Pode ser decimal para itens por peso ou volume (ex: 1.5 para 1,5 kg)
- Normalize os nomes: expanda abreviações óbvias, use Título Case, sem códigos numéricos
- Indicadores de unidade (KG, UN, LT, L, ML, PC, PCT, CX, GR, DZ) NÃO são parte do nome do produto
- Ignore completamente: TOTAL, SUBTOTAL, taxas, CNPJ, endereço, COO, CCF, NSU, troco, formas de pagamento, cabeçalho da loja, rodapé fiscal, datas, chave NF-e
- Use ponto como separador decimal no JSON (ex: 8.99, não 8,99)
- Retorne APENAS o JSON array, sem texto adicional, sem bloco de código markdown

Resposta esperada:
[{ "name": "Nome Do Produto", "price": 0.00, "quantity": 1 }]`

async function parseTextWithClaude(ocrText: string): Promise<ParsedItem[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${TEXT_PARSE_PROMPT}\n\nTexto do cupom:\n${ocrText}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Claude API error (${response.status}): ${body}`)
  }

  const data = await response.json()
  const content: string = data?.content?.[0]?.text ?? ''
  return extractItemsFromClaudeResponse(content)
}

// ── Claude vision API (OCR + parse in one call) ───────────────────────────────

const VISION_PROMPT = `Você é um assistente especializado em extrair itens de cupons fiscais brasileiros.
Analise a imagem do cupom fiscal e retorne APENAS um JSON array com os produtos comprados.

Formato de cada objeto:
{ "name": "Nome do Produto", "price": 0.00, "quantity": 1 }

Regras:
- "price" = valor unitário do item (não o subtotal da linha)
- "quantity" = quantidade comprada (pode ser decimal para itens por peso/volume)
- Normalize os nomes: sem abreviações, use título case (ex: "TOMA" → "Tomate")
- Ignore: TOTAL, SUBTOTAL, taxas, CNPJ, endereço, cabeçalho, rodapé
- Use ponto como separador decimal (ex: 12.99)
- Retorne APENAS o JSON array, sem texto adicional`

type MediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

function resolveMediaType(uri: string, mimeType?: string): MediaType {
  if (mimeType === 'image/png') return 'image/png'
  if (mimeType === 'image/gif') return 'image/gif'
  if (mimeType === 'image/webp') return 'image/webp'
  if (uri.toLowerCase().endsWith('.png')) return 'image/png'
  return 'image/jpeg'
}

async function parseWithClaudeVision(imageUri: string, mimeType?: string): Promise<ParsedItem[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!
  const base64 = await readAsStringAsync(imageUri, { encoding: 'base64' })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: resolveMediaType(imageUri, mimeType),
                data: base64,
              },
            },
            { type: 'text', text: VISION_PROMPT },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Claude API error (${response.status}): ${body}`)
  }

  const data = await response.json()
  const content: string = data?.content?.[0]?.text ?? ''
  return extractItemsFromClaudeResponse(content)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parse a receipt image into structured items.
 *
 * Best path: Google Vision OCR → Claude text API (understands receipt structure from header).
 * Fallbacks: local rule-based parser (no Claude key) or Claude vision (no Google key).
 */
export async function parseReceipt(
  imageUri: string,
  mimeType?: string
): Promise<{ items: ParsedItem[]; usedClaude: boolean }> {
  const googleKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_KEY
  const claudeKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY

  if (!googleKey && !claudeKey) {
    throw new Error(
      'Nenhuma chave de API configurada. Adicione EXPO_PUBLIC_GOOGLE_VISION_KEY no arquivo .env.'
    )
  }

  if (googleKey) {
    const text = await ocrWithGoogleVision(imageUri)

    // Claude text API understands the header/structure → much more accurate
    if (claudeKey) {
      const items = await parseTextWithClaude(text)
      return { items, usedClaude: true }
    }

    // Local parser fallback when no Claude key
    const items = parseReceiptLocal(text)
    return { items, usedClaude: false }
  }

  // No Google Vision: Claude vision does OCR + parsing in one shot
  const items = await parseWithClaudeVision(imageUri, mimeType)
  return { items, usedClaude: true }
}
