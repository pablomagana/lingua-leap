import { supabase } from "@/integrations/supabase/client";
import {
  type CefrLevel,
  CEFR_PROMOTION,
  computeNewStreak,
  levelFromXp,
  nextCefr,
  shouldPromote,
  todayDateString,
  XP_PER_CORRECT,
} from "./gamification";

type ExerciseKind =
  | "vocab_flashcard"
  | "vocab_multiple_choice"
  | "vocab_translate"
  | "grammar_multiple_choice"
  | "grammar_fill_blank"
  | "ai_correction";

export interface AttemptResult {
  xpEarned: number;
  promotedTo?: CefrLevel | null;
}

export async function recordAttempt(params: {
  userId: string;
  kind: ExerciseKind;
  isCorrect: boolean;
  itemId?: string | null;
  userAnswer?: string | null;
}): Promise<AttemptResult> {
  const xp = params.isCorrect ? XP_PER_CORRECT[params.kind] ?? 5 : 0;

  await supabase.from("exercise_attempts").insert({
    user_id: params.userId,
    exercise_kind: params.kind,
    is_correct: params.isCorrect,
    item_id: params.itemId ?? null,
    user_answer: params.userAnswer ?? null,
    xp_earned: xp,
  });

  let promotedTo: CefrLevel | null = null;

  if (xp > 0) {
    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", params.userId)
      .maybeSingle();

    if (progress) {
      const newTotal = progress.total_xp + xp;
      const newLevel = levelFromXp(newTotal);
      const newStreak = computeNewStreak(progress.last_practice_date, progress.current_streak);
      const longest = Math.max(progress.longest_streak, newStreak);

      await supabase
        .from("user_progress")
        .update({
          total_xp: newTotal,
          user_level: newLevel,
          current_streak: newStreak,
          longest_streak: longest,
          last_practice_date: todayDateString(),
        })
        .eq("user_id", params.userId);

      // Check CEFR promotion
      const { data: prof } = await supabase
        .from("profiles")
        .select("cefr_level")
        .eq("user_id", params.userId)
        .maybeSingle();

      if (prof) {
        const currentCefr = prof.cefr_level as CefrLevel;
        const next = nextCefr(currentCefr);
        if (next) {
          // Solo evaluamos si ya hay XP suficiente, para evitar query innecesaria
          const req = CEFR_PROMOTION[currentCefr];
          if (newTotal >= req.minXp) {
            // Mira los últimos N intentos para precisión reciente
            const { data: attempts } = await supabase
              .from("exercise_attempts")
              .select("is_correct")
              .eq("user_id", params.userId)
              .order("created_at", { ascending: false })
              .limit(req.minAttempts);

            const total = attempts?.length ?? 0;
            const correct = (attempts ?? []).filter((a) => a.is_correct).length;

            if (shouldPromote(currentCefr, newTotal, total, correct)) {
              await supabase
                .from("profiles")
                .update({ cefr_level: next })
                .eq("user_id", params.userId);
              promotedTo = next;
            }
          }
        }
      }
    }
  }

  return { xpEarned: xp, promotedTo };
}
