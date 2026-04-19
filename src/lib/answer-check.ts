// Flexible answer checking: ignores accents, case, punctuation, articles,
// parentheticals, and accepts variants separated by "/" or ",".

const ARTICLES = new Set([
  "el", "la", "los", "las",
  "un", "una", "unos", "unas",
  "to", "the", "a", "an",
]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeAnswer(input: string): string {
  let s = stripAccents(input.toLowerCase().trim());
  // remove parentheticals: "ir (a pie)" -> "ir "
  s = s.replace(/\([^)]*\)/g, " ");
  // remove punctuation
  s = s.replace(/[.,!?¿¡;:"'`´]/g, " ");
  // collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  // drop leading article (el coche -> coche)
  const parts = s.split(" ");
  if (parts.length > 1 && ARTICLES.has(parts[0])) {
    parts.shift();
    s = parts.join(" ");
  }
  return s;
}

/**
 * Splits an expected answer into accepted variants.
 * Handles: "caro/a", "caro, cara", "expensive / pricey", "ir (a pie)/caminar".
 * Also expands gender slashes on word endings: "caro/a" -> ["caro","cara"].
 */
export function expandVariants(expected: string): string[] {
  // Split top-level by , or /  (but careful with "/a" suffix — handled below)
  // First, expand suffix gender pattern like "caro/a" or "amigo/a" → "caro|cara"
  const suffixExpanded = expected.replace(
    /([a-záéíóúñ]+)\/([a-záéíóúñ]{1,3})\b/gi,
    (_m, base: string, suffix: string) => {
      // Replace last vowel(s) of base with the suffix to form the variant
      // Heuristic: if suffix is short (1-3 chars), assume it replaces ending of same length
      const replaceLen = Math.min(suffix.length, base.length);
      const variant = base.slice(0, base.length - replaceLen) + suffix;
      return `${base}|${variant}`;
    },
  );

  // Now split by remaining separators
  const raw = suffixExpanded.split(/[|,/]| o /i);
  const variants = raw.map((v) => normalizeAnswer(v)).filter(Boolean);
  // Always include the fully normalized original as a fallback
  variants.push(normalizeAnswer(expected));
  return Array.from(new Set(variants));
}

export function isAnswerCorrect(userAnswer: string, expected: string): boolean {
  const user = normalizeAnswer(userAnswer);
  if (!user) return false;
  const variants = expandVariants(expected);
  return variants.includes(user);
}
