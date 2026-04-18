import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Sparkles, Flame, Trophy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/app" });
    }
  },
  head: () => ({
    meta: [
      { title: "Lingua — Aprende inglés (A1 a C1) con IA" },
      { name: "description", content: "Vocabulario, gramática y conversación en inglés con ejercicios diarios, IA y gamificación. Mantén tu racha y mejora cada día." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            EN
          </span>
          <span className="text-xl tracking-tight">Lingua</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" size="sm">Iniciar sesión</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-10 pb-20 text-center md:pt-20">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Niveles A1 hasta C1 · Con IA
        </div>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
          Aprende inglés{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            sin aburrirte
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
          Vocabulario, gramática y conversación con IA. Sesiones cortas, gamificación y una
          racha diaria que te motiva a practicar todos los días.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/auth">
            <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25">
              Empezar gratis
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">No necesitas tarjeta · 2 min para empezar</p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Vocab + Gramática"
            text="Lecciones por nivel CEFR con flashcards, opción múltiple y completar huecos."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Corrector con IA"
            text="Escribe en inglés y la IA corrige y explica tus errores en español."
          />
          <FeatureCard
            icon={<Flame className="h-5 w-5" />}
            title="Racha diaria"
            text="Gana XP, sube de nivel y mantén tu racha. Pequeñas dosis cada día."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 text-left shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
