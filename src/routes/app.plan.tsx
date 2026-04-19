import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Sparkles, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { recordAttempt } from "@/lib/progress";
import { notifyPromotion } from "@/lib/notify";
import { isAnswerCorrect } from "@/lib/answer-check";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/plan")({
  head: () => ({ meta: [{ title: "Plan de hoy — Lingua" }] }),
  component: PlanPage,
});

type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

interface VocabItem {
  id: string;
  word_en: string;
  translation_es: string;
  example_en: string | null;
  example_es: string | null;
}

interface GrammarItem {
  id: string;
  item_type: "multiple_choice" | "fill_blank";
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  topic: string;
}

type Step =
  | { kind: "vocab_flashcard"; item: VocabItem }
  | { kind: "vocab_multiple_choice"; item: VocabItem; pool: VocabItem[] }
  | { kind: "vocab_translate"; item: VocabItem }
  | { kind: "grammar_multiple_choice"; item: GrammarItem }
  | { kind: "grammar_fill_blank"; item: GrammarItem };

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildPlan(vocab: VocabItem[], grammar: GrammarItem[]): Step[] {
  const v = shuffle(vocab);
  const g = shuffle(grammar);
  const steps: Step[] = [];

  // 3 flashcards
  v.slice(0, 3).forEach((item) => steps.push({ kind: "vocab_flashcard", item }));
  // 3 multiple choice (need at least 4 in pool)
  if (v.length >= 4) {
    v.slice(3, 6).forEach((item) => steps.push({ kind: "vocab_multiple_choice", item, pool: v }));
  }
  // 2 translate
  v.slice(6, 8).forEach((item) => steps.push({ kind: "vocab_translate", item }));
  // grammar mix (up to 4)
  g.slice(0, 4).forEach((item) => {
    steps.push(
      item.item_type === "multiple_choice"
        ? { kind: "grammar_multiple_choice", item }
        : { kind: "grammar_fill_blank", item },
    );
  });

  return shuffle(steps);
}

function PlanPage() {
  const { user } = useAuth();
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [grammar, setGrammar] = useState<GrammarItem[]>([]);
  const [plan, setPlan] = useState<Step[]>([]);
  const [idx, setIdx] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("cefr_level")
        .eq("user_id", user.id)
        .maybeSingle();
      const level: CefrLevel = (prof?.cefr_level as CefrLevel) ?? "A1";
      const [v, g] = await Promise.all([
        supabase.from("vocabulary_items").select("id,word_en,translation_es,example_en,example_es").eq("cefr_level", level).limit(60),
        supabase.from("grammar_items").select("id,item_type,question,options,correct_answer,explanation,topic").eq("cefr_level", level).limit(40),
      ]);
      setVocab(v.data ?? []);
      setGrammar(g.data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const start = () => {
    const p = buildPlan(vocab, grammar);
    if (!p.length) {
      toast.error("No hay contenido disponible para tu nivel.");
      return;
    }
    setPlan(p);
    setIdx(0);
    setSessionXp(0);
    setDone(false);
    setStarted(true);
  };

  const next = (xp: number) => {
    setSessionXp((s) => s + xp);
    if (idx + 1 >= plan.length) setDone(true);
    else setIdx((i) => i + 1);
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground">Cargando plan...</div>;

  if (!started) {
    const totalSteps = Math.min(12, vocab.length + Math.min(4, grammar.length));
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-lg">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Sparkles className="h-4 w-4" /> Plan personalizado
          </div>
          <h1 className="mt-2 text-3xl font-bold">Tu plan de hoy</h1>
          <p className="mt-1 opacity-90">
            Una sesión mixta de ~{totalSteps} ejercicios de vocabulario y gramática adaptada a tu nivel.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-5"
            onClick={start}
            disabled={!vocab.length && !grammar.length}
          >
            Empezar plan <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <PlanInfo title="Vocabulario" desc={`${vocab.length} palabras disponibles. Flashcards, opción múltiple y traducción.`} />
          <PlanInfo title="Gramática" desc={`${grammar.length} ejercicios disponibles. Reglas y completar huecos.`} />
        </div>
        <Link to="/app" className="text-sm text-muted-foreground hover:text-primary">← Volver al dashboard</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-gradient-to-br from-primary to-primary-glow p-8 text-center text-primary-foreground shadow-lg">
        <div className="text-6xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold">¡Plan completado!</h2>
        <p className="mt-1 opacity-90">Has ganado</p>
        <p className="text-5xl font-bold">+{sessionXp} XP</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" variant="secondary" onClick={() => setStarted(false)}>Volver</Button>
          <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40" onClick={start}>
            Otro plan
          </Button>
        </div>
      </div>
    );
  }

  const step = plan[idx];
  if (!step) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setStarted(false)}>✕</Button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(idx / plan.length) * 100}%` }} />
        </div>
        <div className="text-sm font-bold text-primary">+{sessionXp} XP</div>
      </div>

      {step.kind === "vocab_flashcard" && <Flashcard key={`fc-${idx}`} item={step.item} userId={user!.id} onNext={next} />}
      {step.kind === "vocab_multiple_choice" && <VocabMC key={`vmc-${idx}`} item={step.item} pool={step.pool} userId={user!.id} onNext={next} />}
      {step.kind === "vocab_translate" && <VocabTranslate key={`vt-${idx}`} item={step.item} userId={user!.id} onNext={next} />}
      {step.kind === "grammar_multiple_choice" && <GrammarMC key={`gmc-${idx}`} item={step.item} userId={user!.id} onNext={next} />}
      {step.kind === "grammar_fill_blank" && <GrammarFill key={`gfb-${idx}`} item={step.item} userId={user!.id} onNext={next} />}
    </div>
  );
}

function PlanInfo({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
}


function Flashcard({ item, userId, onNext }: { item: VocabItem; userId: string; onNext: (xp: number) => void }) {
  const [flipped, setFlipped] = useState(false);
  const handle = async (knew: boolean) => {
    const { xpEarned, promotedTo } = await recordAttempt({ userId, kind: "vocab_flashcard", isCorrect: knew, itemId: item.id });
    notifyPromotion(promotedTo);
    onNext(xpEarned);
  };
  return (
    <div className="space-y-4">
      <button
        onClick={() => setFlipped(!flipped)}
        className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-primary/20 bg-card p-8 shadow-sm"
      >
        {!flipped ? (
          <>
            <div className="text-3xl font-bold md:text-4xl">{item.word_en}</div>
            <button onClick={(e) => { e.stopPropagation(); speak(item.word_en); }} className="text-muted-foreground hover:text-primary">
              <Volume2 className="h-5 w-5" />
            </button>
            <p className="mt-3 text-xs text-muted-foreground">Toca para ver traducción</p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-primary md:text-3xl">{item.translation_es}</div>
            {item.example_en && (
              <div className="mt-3 max-w-md text-center text-sm">
                <p className="italic">&ldquo;{item.example_en}&rdquo;</p>
                <p className="mt-1 text-muted-foreground">{item.example_es}</p>
              </div>
            )}
          </>
        )}
      </button>
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={() => handle(false)}><X className="h-4 w-4" /> No la sabía</Button>
          <Button size="lg" onClick={() => handle(true)} className="bg-success hover:bg-success/90"><Check className="h-4 w-4" /> ¡La sabía!</Button>
        </div>
      )}
    </div>
  );
}

function VocabMC({ item, pool, userId, onNext }: { item: VocabItem; pool: VocabItem[]; userId: string; onNext: (xp: number) => void }) {
  const options = useMemo(() => {
    const distractors = pool.filter((p) => p.id !== item.id).sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p.translation_es);
    return [item.translation_es, ...distractors].sort(() => Math.random() - 0.5);
  }, [item, pool]);
  const [picked, setPicked] = useState<string | null>(null);
  const pick = async (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const correct = opt === item.translation_es;
    const { xpEarned, promotedTo } = await recordAttempt({ userId, kind: "vocab_multiple_choice", isCorrect: correct, itemId: item.id, userAnswer: opt });
    notifyPromotion(promotedTo);
    setTimeout(() => onNext(xpEarned), 900);
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">¿Qué significa?</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-3xl font-bold">{item.word_en}</span>
          <button onClick={() => speak(item.word_en)} className="text-muted-foreground hover:text-primary"><Volume2 className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="grid gap-2">
        {options.map((opt) => {
          const isPicked = picked === opt;
          const isCorrect = opt === item.translation_es;
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
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

function VocabTranslate({ item, userId, onNext }: { item: VocabItem; userId: string; onNext: (xp: number) => void }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const submit = async () => {
    if (!answer.trim() || result) return;
    const correct = isAnswerCorrect(answer, item.translation_es);
    setResult(correct ? "ok" : "fail");
    const { xpEarned, promotedTo } = await recordAttempt({ userId, kind: "vocab_translate", isCorrect: correct, itemId: item.id, userAnswer: answer });
    if (!correct) toast.error(`Correcto: ${item.translation_es}`);
    notifyPromotion(promotedTo);
    setTimeout(() => onNext(xpEarned), 1200);
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Traduce al español</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-3xl font-bold">{item.word_en}</span>
          <button onClick={() => speak(item.word_en)} className="text-muted-foreground hover:text-primary"><Volume2 className="h-5 w-5" /></button>
        </div>
      </div>
      <Input
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Escribe la traducción..."
        className={cn("h-12 text-lg", result === "ok" && "border-success", result === "fail" && "border-destructive")}
        disabled={result !== null}
      />
      <Button size="lg" className="w-full" onClick={submit} disabled={!answer.trim() || result !== null}>
        Comprobar <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function GrammarMC({ item, userId, onNext }: { item: GrammarItem; userId: string; onNext: (xp: number) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = async (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const correct = opt === item.correct_answer;
    const { xpEarned, promotedTo } = await recordAttempt({ userId, kind: "grammar_multiple_choice", isCorrect: correct, itemId: item.id, userAnswer: opt });
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
            >{opt}</button>
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

function GrammarFill({ item, userId, onNext }: { item: GrammarItem; userId: string; onNext: (xp: number) => void }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const submit = async () => {
    if (!answer.trim() || result) return;
    const correct = isAnswerCorrect(answer, item.correct_answer);
    setResult(correct ? "ok" : "fail");
    const { xpEarned, promotedTo } = await recordAttempt({ userId, kind: "grammar_fill_blank", isCorrect: correct, itemId: item.id, userAnswer: answer });
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
        className={cn("h-12 text-lg", result === "ok" && "border-success", result === "fail" && "border-destructive")}
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
