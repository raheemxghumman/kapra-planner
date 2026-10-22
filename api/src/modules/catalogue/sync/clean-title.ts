const SMALL_WORDS = new Set([
  'and',
  'or',
  'of',
  'with',
  'in',
  'on',
  'the',
  'a',
  'an',
  'for',
  'to',
  'by',
]);
const KEEP_UPPER = new Set(['rtw', 'rts', 'pc', 'pcs', 'ii', 'iii']);

/**
 * Brand titles arrive as "RTW | EMBROIDERED LAWN SHIRT (W25DE2038)". We drop shop codes and
 * internal prefixes and turn all-caps titles into normal case so the catalogue reads cleanly.
 */
export function cleanTitle(raw: string): string {
  let title = raw
    .replace(/\((?=[^)]*\d)[A-Z0-9\- ]{5,}\)/g, '') // "(W25DE2038)" style article codes
    .replace(/^\s*(rtw|rts|new|sale)\s*[|:-]\s*/i, '') // "RTW | ", "NEW - "
    .replace(/\b(\w+)\s+\1\b/gi, '$1') // "Pink Heels Heels" -> "Pink Heels"
    .replace(/\s{2,}/g, ' ')
    .trim();

  const letters = title.replace(/[^A-Za-z]/g, '');
  const upperShare = letters ? letters.replace(/[^A-Z]/g, '').length / letters.length : 0;
  if (upperShare > 0.7) {
    title = title
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (KEEP_UPPER.has(word)) return word.toUpperCase();
        if (index > 0 && SMALL_WORDS.has(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
  return title.slice(0, 200) || raw.slice(0, 200);
}
