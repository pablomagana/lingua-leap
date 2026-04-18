import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Sparkles, Target, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { StreakBadge } from "@/components/streak-badge";
import { Progress } from "@/components/ui/progress";
import { progressToNextLevel, todayDateString } from "@/lib/gamification";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

interface Profile {
  display_name: string | null;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1";
  daily_xp_goal: number;
}
interface UserProgress {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  user_level: number;
  last_practice_date: string | null;
}

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [todayXp, setTodayXp] = useState(0);

  useEffect(() => {
    if (!user) return;
    void load(user.id);
    async function load(uid: string) {
      const [p, up, attempts] = await Promise.all([
        supabase.from("profiles").select("display_name,cefr_level,daily_xp_goal").eq("user_id", uid).maybeSingle(),
        supabase.from("user_progress").select("total_xp,current_streak,longest_streak,user_level,last_practice_date").eq("user_id", uid).maybeSingle(),
        supabase.from("exercise_attempts").select("xp_earned").eq("user_id", uid).gte("created_at", `${todayDateString()}T00:00:00`),
      ]);
      setProfile(p.data);
      setProgress(up.data);
      setTodayXp((attempts.data ?? []).reduce((sum, a) => sum + a.xp_earned, 0));
    }
  }, [user]);

  if (!profile || !progress) {
    return <div className="py-20 text-center text-muted-foreground">Cargando...</div>;
  }

  const lvl = progressToNextLevel(progress.total_xp);
  const goalPct = Math.min(100, (todayXp / profile.daily_xp_goal) * 100);
  const goalMet = todayXp >= profile.daily_xp_goal;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">¡Hola, {profile.display_name ?? "amig@"}!</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Sigue tu progreso de hoy
          </h1>
        </div>
        <StreakBadge count={progress.current_streak} atRisk={!goalMet && progress.current_streak > 0} />
      </div>

      {/* XP cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-accent" />
            Nivel {progress.user_level}
          </div>
          <div className="mt-2 text-3xl font-bold">{progress.total_xp} XP</div>
          <Progress value={lvl.pct} className="mt-3 h-2" />
          <div className="mt-1 text-xs text-muted-foreground">
            {lvl.next - progress.total_xp} XP para nivel {progress.user_level + 1}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4 text-primary" />
            Objetivo de hoy
          </div>
          <div className="mt-2 text-3xl font-bold">
            {todayXp}<span className="text-base font-normal text-muted-foreground">/{profile.daily_xp_goal}</span>
          </div>
          <Progress value={goalPct} className="mt-3 h-2" />
          <div className="mt-1 text-xs text-muted-foreground">
            {goalMet ? "🎉 ¡Objetivo cumplido!" : `Te faltan ${profile.daily_xp_goal - todayXp} XP`}
          </div>
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-lg shadow-primary/25">
          <div className="text-sm opacity-90">Tu nivel CEFR</div>
          <div className="mt-2 text-4xl font-bold">{profile.cefr_level}</div>
          <div className="mt-1 text-xs opacity-90">Racha máxima: {progress.longest_streak} días</div>
        </div>
      </div>

      {/* CTA principal */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold">Practica ahora</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige un módulo y suma XP. Cada minuto cuenta.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Link to="/app/vocabulary">
            <ModuleCard icon={<BookOpen />} title="Vocabulario" desc="Flashcards y traducción" />
          </Link>
          <Link to="/app/grammar">
            <ModuleCard icon={<GraduationCap />} title="Gramática" desc="Reglas y huecos" />
          </Link>
          <Link to="/app/ai">
            <ModuleCard icon={<Sparkles />} title="Corrector IA" desc="Mejora tus frases" />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-secondary p-5">
        <p className="text-sm font-medium">💡 Consejo del día</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Practicar 10 minutos al día es más efectivo que 1 hora una vez por semana. ¡Mantén tu racha!
        </p>
      </div>
    </div>
  );
}

function ModuleCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group h-full rounded-xl border bg-background p-4 transition-all hover:border-primary hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

