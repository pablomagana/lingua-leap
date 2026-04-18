// XP needed for each level (cumulative). Level n requires xpForLevel(n) total XP.
export function xpForLevel(level: number): number {
  // Quadratic curve: level 1 = 0, level 2 = 50, level 3 = 150, level 4 = 300, etc.
  return Math.round(50 * (level - 1) * level / 2 * (1 + (level - 1) * 0.1));
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

export function progressToNextLevel(totalXp: number): { current: number; next: number; pct: number } {
  const lvl = levelFromXp(totalXp);
  const current = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  const pct = Math.min(100, Math.max(0, ((totalXp - current) / (next - current)) * 100));
  return { current, next, pct };
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function computeNewStreak(
  lastPracticeDate: string | null,
  currentStreak: number,
): number {
  const today = todayDateString();
  if (lastPracticeDate === today) return currentStreak;
  if (lastPracticeDate === yesterdayDateString()) return currentStreak + 1;
  return 1;
}

export const XP_PER_CORRECT: Record<string, number> = {
  vocab_flashcard: 5,
  vocab_multiple_choice: 8,
  vocab_translate: 12,
  grammar_multiple_choice: 10,
  grammar_fill_blank: 12,
  ai_correction: 15,
};

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];

// XP acumulado mínimo y precisión mínima necesarios para promocionar AL siguiente nivel.
// Para subir de A1 → A2 necesitas cumplir los requisitos en la fila "A1".
export const CEFR_PROMOTION: Record<CefrLevel, { minXp: number; minAccuracy: number; minAttempts: number }> = {
  A1: { minXp: 200, minAccuracy: 0.8, minAttempts: 30 },
  A2: { minXp: 600, minAccuracy: 0.8, minAttempts: 50 },
  B1: { minXp: 1500, minAccuracy: 0.8, minAttempts: 80 },
  B2: { minXp: 3500, minAccuracy: 0.85, minAttempts: 120 },
  C1: { minXp: Number.POSITIVE_INFINITY, minAccuracy: 1, minAttempts: Number.POSITIVE_INFINITY }, // máximo
};

export function nextCefr(current: CefrLevel): CefrLevel | null {
  const idx = CEFR_ORDER.indexOf(current);
  if (idx < 0 || idx >= CEFR_ORDER.length - 1) return null;
  return CEFR_ORDER[idx + 1];
}

export function shouldPromote(
  current: CefrLevel,
  totalXp: number,
  recentAttempts: number,
  recentCorrect: number,
): boolean {
  const next = nextCefr(current);
  if (!next) return false;
  const req = CEFR_PROMOTION[current];
  if (totalXp < req.minXp) return false;
  if (recentAttempts < req.minAttempts) return false;
  const accuracy = recentAttempts > 0 ? recentCorrect / recentAttempts : 0;
  return accuracy >= req.minAccuracy;
}
