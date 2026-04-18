import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { correctSentence } from "@/server/ai.functions";
import { recordAttempt } from "@/lib/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai")({
  head: () => ({ meta: [{ title: "Corrector con IA — Lingua" }] }),
  component: AiPage,
});

interface Correction {
  is_correct: boolean;
  corrected: string;
  explanation_es: string;
  improved_alternative?: string;
}

function AiPage() {
  const { user } = useAuth();
  const correctFn = useServerFn(correctSentence);
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Correction | null>(null);

  const submit = async () => {
    if (!sentence.trim() || !user) return;
    setLoading(true);
    setResult(null);

    const { data: prof } = await supabase.from("profiles").select("cefr_level").eq("user_id", user.id).maybeSingle();
    const level = (prof?.cefr_level ?? "B1") as "A1" | "A2" | "B1" | "B2" | "C1";

    try {
      const res = await correctFn({ data: { sentence: sentence.trim(), level } });
      if (res.error) {
        toast.error(res.error);
      } else if (res.correction) {
        setResult(res.correction);
        await recordAttempt({
          userId: user.id,
          kind: "ai_correction",
          isCorrect: res.correction.is_correct,
          userAnswer: sentence,
        });
      }
    } catch (e) {
      toast.error("Error al contactar la IA");
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "I have went to the store yesterday.",
    "She don't likes coffee in the morning.",
    "If I would have time, I will help you.",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" />
          Corrector con IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escribe una frase en inglés. La IA la corrige y explica los errores en español.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <Textarea
          placeholder="Escribe tu frase en inglés..."
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          rows={3}
          maxLength={500}
          className="resize-none border-0 bg-transparent text-base focus-visible:ring-0"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{sentence.length}/500</span>
          <Button onClick={submit} disabled={!sentence.trim() || loading}>
            {loading ? "Analizando..." : <>Corregir <Send className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>

      {!result && !loading && (
        <div className="rounded-2xl border bg-secondary p-5">
          <p className="text-sm font-medium">Prueba con un ejemplo:</p>
          <div className="mt-3 space-y-2">
            {examples.map((e) => (
              <button
                key={e}
                onClick={() => setSentence(e)}
                className="block w-full rounded-lg border bg-background px-3 py-2 text-left text-sm hover:border-primary"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`rounded-2xl border-2 p-5 ${result.is_correct ? "border-success bg-success/5" : "border-accent bg-accent/5"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">
              {result.is_correct ? "✅ ¡Está correcta!" : "✍️ Versión corregida"}
            </p>
            <p className="mt-2 text-lg font-medium">{result.corrected}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explicación</p>
            <p className="mt-2 text-sm leading-relaxed">{result.explanation_es}</p>
          </div>
          {result.improved_alternative && (
            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                💡 Alternativa más natural
              </p>
              <p className="mt-2 text-sm">{result.improved_alternative}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
