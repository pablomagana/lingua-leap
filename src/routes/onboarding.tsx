import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Configura tu nivel — Lingua" }] }),
  component: Onboarding,
});

const LEVELS = [
  { code: "A1", title: "A1 — Principiante", desc: "Acabo de empezar con el inglés." },
  { code: "A2", title: "A2 — Básico", desc: "Sé frases simples y vocabulario básico." },
  { code: "B1", title: "B1 — Intermedio", desc: "Me defiendo en situaciones cotidianas." },
  { code: "B2", title: "B2 — Intermedio alto", desc: "Hablo con fluidez sobre muchos temas." },
  { code: "C1", title: "C1 — Avanzado", desc: "Domino el idioma con matices." },
] as const;

const TOPICS = ["viajes", "trabajo", "familia", "comida", "tecnología", "películas", "música", "deporte"];

const GOALS = [
  { value: 15, label: "Suave", desc: "15 XP/día (~5 min)" },
  { value: 30, label: "Normal", desc: "30 XP/día (~10 min)" },
  { value: 60, label: "Intenso", desc: "60 XP/día (~20 min)" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<string>("A1");
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState(30);
  const [saving, setSaving] = useState(false);

  const toggleTopic = (t: string) => {
    setInterests((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const finish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        cefr_level: level as "A1" | "A2" | "B1" | "B2" | "C1",
        interests,
        daily_xp_goal: goal,
        onboarded: true,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("¡Todo listo! Vamos a empezar 🚀");
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold">¿Cuál es tu nivel actual?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                No te preocupes, podrás cambiarlo después.
              </p>
              <div className="mt-5 space-y-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLevel(l.code)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all",
                      level === l.code
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-primary/40 hover:bg-muted",
                    )}
                  >
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-sm text-muted-foreground">{l.desc}</div>
                  </button>
                ))}
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={() => setStep(1)}>
                Continuar
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold">¿Qué temas te interesan?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Elige todos los que quieras.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTopic(t)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm capitalize transition-all",
                      interests.includes(t)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary/40 hover:bg-muted",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                  Atrás
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold">Tu objetivo diario</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                ¿Cuánto quieres practicar al día?
              </p>
              <div className="mt-5 space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all",
                      goal === g.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-primary/40 hover:bg-muted",
                    )}
                  >
                    <div className="font-semibold">{g.label}</div>
                    <div className="text-sm text-muted-foreground">{g.desc}</div>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button className="flex-1" onClick={finish} disabled={saving}>
                  {saving ? "Guardando..." : "¡Empezar!"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
