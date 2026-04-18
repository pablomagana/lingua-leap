import { supabase } from "@/integrations/supabase/client";
import { computeNewStreak, levelFromXp, todayDateString, XP_PER_CORRECT } from "./gamification";

type ExerciseKind =
  | "vocab_flashcard"
  | "vocab_multiple_choice"
  | "vocab_translate"
  | "grammar_multiple_choice"
  | "grammar_fill_blank"
  | "ai_correction";

export async function recordAttempt(params: {
  userId: string;
  kind: ExerciseKind;
  isCorrect: boolean;
  itemId?: string | null;
  userAnswer?: string | null;
}) {
  const xp = params.isCorrect ? XP_PER_CORRECT[params.kind] ?? 5 : 0;

  await supabase.from("exercise_attempts").insert({
    user_id: params.userId,
    exercise_kind: params.kind,
    is_correct: params.isCorrect,
    item_id: params.itemId ?? null,
    user_answer: params.userAnswer ?? null,
    xp_earned: xp,
  });

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
    }
  }

  return { xpEarned: xp };
}
