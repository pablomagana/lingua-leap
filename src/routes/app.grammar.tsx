import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { recordAttempt } from "@/lib/progress";
import { notifyPromotion } from "@/lib/notify";
import { isAnswerCorrect } from "@/lib/answer-check";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/grammar")({
  head: () => ({ meta: [{ title: "Gramática — Lingua" }] }),
  component: GrammarPage,
});

interface GItem {
  id: string;
  item_type: "multiple_choice" | "fill_blank";
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  cefr_level: string;
  topic: string;
}

function GrammarPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GItem[]>([]);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: prof } = await supabase.from("profiles").select("cefr_level").eq("user_id", user.id).maybeSingle();
      const level = prof?.cefr_level ?? "A1";
      const { data } = await supabase.from("grammar_items").select("*").eq("cefr_level", level).limit(50);
      setItems(data ?? []);
    })();
  }, [user]);

  const start = () => {
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5).slice(0, 8));
    setIdx(0);
    setSessionXp(0);
    setDone(false);
    setStarted(true);
  };

  const next = (xp: number) => {
    setSessionXp((s) => s + xp);
    if (idx + 1 >= items.length) setDone(true);
    else setIdx(idx + 1);
  };

  if (!started) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gramática</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} ejercicios disponibles. Sesión de 8 preguntas.
          </p>
        </div>
        <Button size="lg" className="w-full md:w-auto" disabled={!items.length} onClick={start}>
          Empezar sesión
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-gradient-to-br from-primary to-primary-glow p-8 text-center text-primary-foreground shadow-lg">
        <div className="text-6xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold">¡Sesión completada!</h2>
        <p className="mt-1 opacity-90">Has ganado</p>
        <p className="text-5xl font-bold">+{sessionXp} XP</p>
        <Button size="lg" variant="secondary" className="mt-6" onClick={() => setStarted(false)}>
          Volver
        </Button>
      </div>
    );
  }

  const item = items[idx];
  if (!item) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setStarted(false)}>✕</Button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>
        <div className="text-sm font-bold text-primary">+{sessionXp} XP</div>
      </div>

      {item.item_type === "multiple_choice" ? (
        <GrammarMC key={item.id} item={item} userId={user!.id} onNext={next} />
      ) : (
        <GrammarFill key={item.id} item={item} userId={user!.id} onNext={next} />
      )}
    </div>
  );
}

function GrammarMC({ item, userId, onNext }: { item: GItem; userId: string; onNext: (xp: number) => void }) {
  const [picked, setPicked] = useState<string | null>(null);

  const pick = async (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const correct = opt === item.correct_answer;
    const { xpEarned, promotedTo } = await recordAttempt({
      userId,
      kind: "grammar_multiple_choice",
      isCorrect: correct,
      itemId: item.id,
      userAnswer: opt,
    });
    notifyPromotion(promotedTo);
    setTimeout(() => onNext(xpEarned), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.topic}</p>
        <p className="mt-2 text-xl font-medium">{item.question}</p>
      </div>
      <div className="grid gap-2">
        {item.options.map((opt) => {
          const isPicked = picked === opt;
          const isCorrect = opt === item.correct_answer;
          const showResult = picked !== null;
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              disabled={picked !== null}
              className={cn(
                "rounded-xl border-2 p-4 text-left font-medium transition-all",
                !showResult && "hover:border-primary hover:bg-primary/5",
                showResult && isCorrect && "border-success bg-success/10 text-success",
                showResult && isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                showResult && !isPicked && !isCorrect && "opacity-50",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked && item.explanation && (
        <div className="rounded-xl border bg-secondary p-4 text-sm">
          <span className="font-semibold">💡 </span>{item.explanation}
        </div>
      )}
    </div>
  );
}

function GrammarFill({ item, userId, onNext }: { item: GItem; userId: string; onNext: (xp: number) => void }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"ok" | "fail" | null>(null);

  const submit = async () => {
    if (!answer.trim() || result) return;
    const correct = isAnswerCorrect(answer, item.correct_answer);
    setResult(correct ? "ok" : "fail");
    const { xpEarned, promotedTo } = await recordAttempt({
      userId,
      kind: "grammar_fill_blank",
      isCorrect: correct,
      itemId: item.id,
      userAnswer: answer,
    });
    notifyPromotion(promotedTo);
    setTimeout(() => onNext(xpEarned), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.topic}</p>
        <p className="mt-2 text-xl font-medium">{item.question}</p>
      </div>
      <Input
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Escribe la respuesta..."
        className={cn(
          "h-12 text-lg",
          result === "ok" && "border-success",
          result === "fail" && "border-destructive",
        )}
        disabled={result !== null}
      />
      <Button size="lg" className="w-full" onClick={submit} disabled={!answer.trim() || result !== null}>
        Comprobar <ArrowRight className="h-4 w-4" />
      </Button>
      {result && (
        <div className={cn("rounded-xl border p-4 text-sm",
          result === "ok" ? "border-success bg-success/10" : "border-destructive bg-destructive/10",
        )}>
          {result === "ok" ? "✅ ¡Correcto!" : `❌ Respuesta correcta: ${item.correct_answer}`}
          {item.explanation && <p className="mt-1 text-muted-foreground">{item.explanation}</p>}
        </div>
      )}
    </div>
  );
}
