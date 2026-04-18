import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { StreakBadge } from "@/components/streak-badge";

export const Route = createFileRoute("/app/progress")({
  head: () => ({ meta: [{ title: "Mi progreso — Lingua" }] }),
  component: ProgressPage,
});

interface Attempt {
  exercise_kind: string;
  is_correct: boolean;
  xp_earned: number;
  created_at: string;
}

function ProgressPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<{ total_xp: number; current_streak: number; longest_streak: number; user_level: number } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [profile, setProfile] = useState<{ cefr_level: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const [up, att, prof] = await Promise.all([
        supabase.from("user_progress").select("total_xp,current_streak,longest_streak,user_level").eq("user_id", user.id).maybeSingle(),
        supabase.from("exercise_attempts").select("exercise_kind,is_correct,xp_earned,created_at").eq("user_id", user.id).gte("created_at", since.toISOString()),
        supabase.from("profiles").select("cefr_level").eq("user_id", user.id).maybeSingle(),
      ]);
      setProgress(up.data);
      setAttempts(att.data ?? []);
      setProfile(prof.data);
    })();
  }, [user]);

  if (!progress || !profile) return <div className="py-20 text-center text-muted-foreground">Cargando...</div>;

  // Build last-30-days XP series
  const dayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(5, 10), 0);
  }
  for (const a of attempts) {
    const k = a.created_at.slice(5, 10);
    dayMap.set(k, (dayMap.get(k) ?? 0) + a.xp_earned);
  }
  const chartData = Array.from(dayMap.entries()).map(([day, xp]) => ({ day, xp }));

  // Accuracy by skill
  const vocabAttempts = attempts.filter((a) => a.exercise_kind.startsWith("vocab"));
  const grammarAttempts = attempts.filter((a) => a.exercise_kind.startsWith("grammar"));
  const vocabAcc = vocabAttempts.length ? Math.round((vocabAttempts.filter((a) => a.is_correct).length / vocabAttempts.length) * 100) : 0;
  const grammarAcc = grammarAttempts.length ? Math.round((grammarAttempts.filter((a) => a.is_correct).length / grammarAttempts.length) * 100) : 0;
  const vocabLearned = new Set(attempts.filter((a) => a.exercise_kind.startsWith("vocab") && a.is_correct).map((a) => `${a.exercise_kind}-${a.created_at}`)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi progreso</h1>
          <p className="mt-1 text-sm text-muted-foreground">Últimos 30 días</p>
        </div>
        <StreakBadge count={progress.current_streak} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="XP total" value={progress.total_xp} />
        <Stat label="Nivel" value={progress.user_level} />
        <Stat label="Racha máxima" value={`${progress.longest_streak}d`} />
        <Stat label="Nivel CEFR" value={profile.cefr_level} highlight />
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Actividad (XP/día)</h2>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
              />
              <Bar dataKey="xp" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SkillCard title="Vocabulario" pct={vocabAcc} count={vocabAttempts.length} />
        <SkillCard title="Gramática" pct={grammarAcc} count={grammarAttempts.length} />
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">Palabras practicadas</p>
          <p className="mt-2 text-3xl font-bold">{vocabLearned}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${highlight ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground" : "bg-card"}`}>
      <p className={`text-xs uppercase ${highlight ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function SkillCard({ title, pct, count }: { title: string; pct: number; count: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{title}</p>
        <span className="text-sm text-muted-foreground">{count} intentos</span>
      </div>
      <p className="mt-2 text-3xl font-bold">{pct}%</p>
      <p className="text-xs text-muted-foreground">precisión</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
