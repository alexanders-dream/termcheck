// Smart text chunking for processing long documents

/**
 * Calculates the optimal chunk size based on total document length.
 * - Small docs (<5k chars): 5,000 char chunks
 * - Huge docs (>100k chars): 10,000 char chunks (to avoid timeouts)
 * - Standard: 15,000 char chunks (~3-4k tokens)
 */
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
 * Strategies:
 * 1. Sentences (punctuation)
 * 2. Paragraphs (double newlines)
 * 3. Words (whitespace)
 * 4. Characters (hard limit)
 */
export function chunkText(text: string, chunkSize: number = 15000, overlap: number = 500): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // If we reached the end of the text, just take it
    if (end === text.length) {
      chunks.push(text.slice(start, end));
      break;
    }

    // Fallback Strategy 1: Sentences (Punctuation)
    // Look for the last sentence ending punctuation within the chunk limit
    // We look back from 'end' to find a suitable break point
    let bestBreak = -1;
    const sentenceBreakRegex = /[.!?]\s+/g;
    let match;

    // Search for sentence breaks in the last 20% of the chunk to avoid too small chunks
    const searchStart = Math.max(start, end - Math.floor(chunkSize * 0.2));
    const searchEnd = end;

    // We need to find the last match before 'end'
    // Since JS regex exec is iterative, we can just loop
    sentenceBreakRegex.lastIndex = searchStart;
    while ((match = sentenceBreakRegex.exec(text)) !== null) {
      if (match.index + match[0].length <= searchEnd) {
        bestBreak = match.index + match[0].length;
      } else {
        break;
      }
    }

    // Fallback Strategy 2: Paragraphs (Double Newlines)
    if (bestBreak === -1) {
      const lastDoubleNewline = text.lastIndexOf('\n\n', end);
      if (lastDoubleNewline > searchStart) {
        bestBreak = lastDoubleNewline + 2; // Include the newlines
      }
    }

    // Fallback Strategy 3: Words (Whitespace)
    if (bestBreak === -1) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > searchStart) {
        bestBreak = lastSpace + 1;
      }
    }

    // Fallback Strategy 4: Characters (Hard Limit)
    // If no suitable break point found, just cut at 'end'
    if (bestBreak === -1) {
      bestBreak = end;
    }

    chunks.push(text.slice(start, bestBreak));

    // Move start for next chunk, accounting for overlap
    // But ensure we don't go backwards or get stuck
    start = Math.max(bestBreak - overlap, start + 1);

    // Ensure we don't overlap past the end of the text
    if (start >= text.length) break;
  }

  return chunks;
}

export function mergeFlags(allFlags: any[][]): any[] {
  const seen = new Set<string>();
  const merged: any[] = [];

  for (const flags of allFlags) {
    for (const flag of flags) {
      const key = `${flag.category}-${flag.summary}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(flag);
      }
    }
  }

  return merged;
}