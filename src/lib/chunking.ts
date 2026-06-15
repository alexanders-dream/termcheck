import { LegalFlag } from './types';

// Smart text chunking for processing long documents

export function getChunkSize(totalLength: number): number {
  if (totalLength < 5000) {
    return 5000;
  } else if (totalLength > 100000) {
    return 10000;
  } else {
    return 15000;
  }
}

/**
 * Splits text into chunks using a multi-stage fallback strategy to preserve semantic meaning.
 */
export function chunkText(text: string, chunkSize: number = 15000, overlap: number = 500): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end === text.length) {
      chunks.push(text.slice(start, end));
      break;
    }

    let bestBreak = -1;
    const searchStart = Math.max(start, end - Math.floor(chunkSize * 0.2));
    const searchEnd = end;

    // Strategy 1: Sentence breaks
    const sentenceBreakRegex = /[.!?]\s+/g;
    sentenceBreakRegex.lastIndex = searchStart;
    let match: RegExpExecArray | null;
    while ((match = sentenceBreakRegex.exec(text)) !== null) {
      if (match.index + match[0].length <= searchEnd) {
        bestBreak = match.index + match[0].length;
      } else {
        break;
      }
    }

    // Strategy 2: Paragraph breaks
    if (bestBreak === -1) {
      const lastDoubleNewline = text.lastIndexOf('\n\n', end);
      if (lastDoubleNewline > searchStart) {
        bestBreak = lastDoubleNewline + 2;
      }
    }

    // Strategy 3: Word boundaries
    if (bestBreak === -1) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > searchStart) {
        bestBreak = lastSpace + 1;
      }
    }

    // Strategy 4: Hard limit
    if (bestBreak === -1) {
      bestBreak = end;
    }

    chunks.push(text.slice(start, bestBreak));
    start = Math.max(bestBreak - overlap, start + 1);

    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Deduplicate and merge flags from all chunks.
 * Uses quote-based hashing to avoid dropping near-duplicates.
 */
export function mergeFlags(allFlags: LegalFlag[][]): LegalFlag[] {
  const seen = new Set<string>();
  const merged: LegalFlag[] = [];

  for (const flags of allFlags) {
    for (const flag of flags) {
      // Normalize key: lowercased, stripped of extra whitespace
      const normalizedQuote = flag.quote.toLowerCase().replace(/\s+/g, ' ').trim();
      // Include category for broader deduplication scope
      const key = `${flag.category}-${flag.summary}-${normalizedQuote}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(flag);
      }
    }
  }

  return merged;
}
