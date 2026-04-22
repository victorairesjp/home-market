/**
 * Parser for Brazilian fiscal receipts (cupom fiscal / NF-e).
 *
 * Typical line format:
 *   [SEQ] [BARCODE] DESCRIPTION   QTY UNIT   UNIT_PRICE   TOTAL
 *   001   7896004   TOMATE S/AGROT 1,000 KG   3,990        3,990
 *
 * Key insight: only pick numbers that use the Brazilian decimal format
 * (comma separator, e.g. "3,99" or "1,000"). This automatically excludes
 * item codes, barcodes, and sequence numbers.
 */

export type ParsedItem = {
  name: string
  price: number
  quantity: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const UNIT_KEYWORDS = ['KG', 'GR', 'G', 'LT', 'UN', 'PC', 'PCT', 'CX', 'DZ', 'ML', 'L', 'M']

const NOISE_PATTERNS = [
  /^\s*$/,
  /cnpj/i,
  /inscri[çc][aã]o/i,
  /endere[çc]o/i,
  /telefone/i,
  /fone/i,
  /^\s*total\b/i,
  /subtotal/i,
  /desconto/i,
  /acr[eé]scimo/i,
  /troco/i,
  /\bdinheiro\b/i,
  /\bcart[ãa]o\b/i,
  /\btef\b/i,
  /\bnsu\b/i,
  /\bcupom\b/i,
  /\b(coo|ccf|ecf)\b/i,
  /\bchave\b.*\bnfe\b/i,
  /www\./i,
  /\bprotocolo\b/i,
  /\bautorizad/i,
  /\bval[oi]d/i,
  /\bvencimento\b/i,
  /\bdata\b.*\bemiss/i,
  /\bserie\b/i,
  /\bnota\s+fiscal\b/i,
  /\bnf-?e\b/i,
  /\bsefaz\b/i,
  /\bcpf\b/i,
  /\btroca\b/i,
  /\bpag(amento)?\b/i,
  /\btroco\b/i,
  /\brecibo\b/i,
  /\bcaixa\b/i,
  /\boperador\b/i,
  /\bponto\s+de\s+venda\b/i,
  // Lines that are only punctuation / symbols / dashes
  /^[-=*#\s]{3,}$/,
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a Brazilian-formatted number string to float. */
function parseBR(s: string): number | null {
  // "1.234,56" → 1234.56  |  "3,990" → 3.99  |  "12,99" → 12.99
  const clean = s
    .replace(/\.(?=\d{3}(?:[,\s]|$))/g, '') // remove thousands dot
    .replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

/** Extract Brazilian-formatted numbers (those with a comma decimal separator). */
function extractBRNumbers(s: string): number[] {
  const matches = s.match(/\d+,\d+/g) ?? []
  return matches
    .map(parseBR)
    .filter((n): n is number => n !== null && n > 0 && n < 100_000)
}

/** Title-case a product name and strip leftover garbage. */
function cleanName(raw: string): string {
  return raw
    .replace(/[/*\\|]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 0 && !/^\d+$/.test(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function isNoise(line: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(line))
}

// ── Core parser ───────────────────────────────────────────────────────────────

function parseLine(line: string): ParsedItem | null {
  if (isNoise(line)) return null

  // 1. Remove leading item sequence numbers (e.g., "001 ", "12 ")
  let cleaned = line.replace(/^\d{1,3}\s+/, '')

  // 2. Remove EAN / PLU barcodes (7+ consecutive digits)
  cleaned = cleaned.replace(/\b\d{7,}\b\s*/g, '').trim()

  if (!cleaned || cleaned.length < 3) return null
  if (isNoise(cleaned)) return null

  // 3. Try to split at a unit keyword — this is the most reliable anchor
  const unitRe = new RegExp(`\\b(${UNIT_KEYWORDS.join('|')})\\b`, 'i')
  const unitMatch = cleaned.match(unitRe)

  let nameSection: string
  let valueSection: string

  if (unitMatch && unitMatch.index !== undefined) {
    nameSection = cleaned.slice(0, unitMatch.index).trim()
    valueSection = cleaned.slice(unitMatch.index + unitMatch[0].length).trim()
  } else {
    // No unit keyword: split at first comma-number
    const firstCommaNum = cleaned.search(/\d+,\d+/)
    if (firstCommaNum === -1) return null
    nameSection = cleaned.slice(0, firstCommaNum).trim()
    valueSection = cleaned.slice(firstCommaNum).trim()
  }

  // 4. Extract BR-formatted numbers from the value section
  //    These are always qty / unit_price / total — never codes or barcodes
  const nums = extractBRNumbers(valueSection)
  if (nums.length === 0) return null

  let price: number
  let quantity = 1

  if (nums.length === 1) {
    price = nums[0]
  } else if (nums.length === 2) {
    const [a, b] = nums
    // If a ≤ 999 and a × b is plausible, treat as qty × price
    if (a <= 999 && a * b < 100_000) {
      quantity = Math.round(a) || 1
      price = b
    } else {
      // Last number is price (unit price, not total)
      price = a
    }
  } else {
    // 3+ numbers: typically [qty, unit_price, total]
    // Validate with: qty × unit_price ≈ total
    const [qty, unitPrice, total] = nums
    const expected = qty * unitPrice
    const diff = Math.abs(expected - total)
    if (diff <= expected * 0.05 + 0.05) {
      quantity = Math.round(qty) || 1
      price = unitPrice
    } else {
      // Fallback: use second-to-last number as price
      price = nums[nums.length - 2]
    }
  }

  if (price < 0.01 || price > 10_000) return null

  // 5. Clean up the product name
  const name = cleanName(nameSection || cleaned.split(/\d/)[0])
  if (name.length < 2) return null

  return { name, price, quantity }
}

/** Parse raw OCR text from a Brazilian receipt into structured items. */
export function parseReceipt(text: string): ParsedItem[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseLine)
    .filter((item): item is ParsedItem => item !== null)
}
