import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Volume2, ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { recordAttempt } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/vocabulary")({
  head: () => ({ meta: [{ title: "Vocabulario — Lingua" }] }),
  component: VocabPage,
});

interface VocabItem {
  id: string;
  word_en: string;
  translation_es: string;
  example_en: string | null;
  example_es: string | null;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "C1";
  topic: string;
}

type Mode = "menu" | "flashcard" | "multiple_choice" | "translate";

function VocabPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("menu");
  const [items, setItems] = useState<VocabItem[]>([]);
  const [allItems, setAllItems] = useState<VocabItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    void load(user.id);
    async function load(uid: string) {
      const { data: prof } = await supabase.from("profiles").select("cefr_level").eq("user_id", uid).maybeSingle();
      const level = prof?.cefr_level ?? "A1";
      const { data } = await supabase
        .from("vocabulary_items")
        .select("*")
        .eq("cefr_level", level)
        .limit(50);
      setAllItems(data ?? []);
    }
  }, [user]);

  const startSession = (m: Mode) => {
    const shuffled = [...allItems].sort(() => Math.random() - 0.5).slice(0, 8);
    setItems(shuffled);
    setIdx(0);
    setSessionXp(0);
    setDone(false);
    setMode(m);
  };

  const next = (xp: number) => {
    setSessionXp((s) => s + xp);
    if (idx + 1 >= items.length) setDone(true);
    else setIdx(idx + 1);
  };

  if (mode === "menu") {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vocabulario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allItems.length} palabras disponibles para tu nivel.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ModeCard
            title="Flashcards"
            desc="Mira la palabra, intenta recordar, voltea."
            onClick={() => startSession("flashcard")}
            disabled={!allItems.length}
          />
          <ModeCard
            title="Opción múltiple"
            desc="Elige la traducción correcta."
            onClick={() => startSession("multiple_choice")}
            disabled={allItems.length < 4}
          />
          <ModeCard
            title="Escribir traducción"
            desc="Traduce la palabra escribiéndola."
            onClick={() => startSession("translate")}
            disabled={!allItems.length}
          />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <SessionComplete xp={sessionXp} onDone={() => setMode("menu")} />
    );
  }

  const item = items[idx];
  if (!item) return null;

  return (
    <div className="space-y-4">
      <SessionHeader idx={idx} total={items.length} xp={sessionXp} onExit={() => setMode("menu")} />
      {mode === "flashcard" && <Flashcard key={item.id} item={item} userId={user!.id} onNext={next} />}
      {mode === "multiple_choice" && <MultipleChoice key={item.id} item={item} pool={allItems} userId={user!.id} onNext={next} />}
      {mode === "translate" && <TranslateWrite key={item.id} item={item} userId={user!.id} onNext={next} />}
    </div>
  );
}

function ModeCard({ title, desc, onClick, disabled }: { title: string; desc: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </button>
  );
}

function SessionHeader({ idx, total, xp, onExit }: { idx: number; total: number; xp: number; onExit: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onExit}>
        ✕
      </Button>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((idx) / total) * 100}%` }}
        />
      </div>
      <div className="text-sm font-bold text-primary">+{xp} XP</div>
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

  const handleResult = async (knew: boolean) => {
    const { xpEarned } = await recordAttempt({
      userId,
      kind: "vocab_flashcard",
      isCorrect: knew,
      itemId: item.id,
    });
    onNext(xpEarned);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setFlipped(!flipped)}
        className="flex min-h-[280px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-primary/20 bg-card p-8 shadow-sm transition-all hover:shadow-md"
      >
        {!flipped ? (
          <>
            <div className="text-3xl font-bold md:text-4xl">{item.word_en}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(item.word_en);
              }}
              className="text-muted-foreground hover:text-primary"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <p className="mt-4 text-xs text-muted-foreground">Toca para ver traducción</p>
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
          <Button variant="outline" size="lg" onClick={() => handleResult(false)}>
            <X className="h-4 w-4" /> No la sabía
          </Button>
          <Button size="lg" onClick={() => handleResult(true)} className="bg-success hover:bg-success/90">
            <Check className="h-4 w-4" /> ¡La sabía!
          </Button>
        </div>
      )}
    </div>
  );
}

function MultipleChoice({ item, pool, userId, onNext }: { item: VocabItem; pool: VocabItem[]; userId: string; onNext: (xp: number) => void }) {
  const options = useMemo(() => {
    const distractors = pool
      .filter((p) => p.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.translation_es);
    return [item.translation_es, ...distractors].sort(() => Math.random() - 0.5);
  }, [item, pool]);

  const [picked, setPicked] = useState<string | null>(null);

  const handlePick = async (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const correct = opt === item.translation_es;
    const { xpEarned } = await recordAttempt({
      userId,
      kind: "vocab_multiple_choice",
      isCorrect: correct,
      itemId: item.id,
      userAnswer: opt,
    });
    setTimeout(() => onNext(xpEarned), 900);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">¿Qué significa?</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-3xl font-bold">{item.word_en}</span>
          <button onClick={() => speak(item.word_en)} className="text-muted-foreground hover:text-primary">
            <Volume2 className="h-5 w-5" />
          </button>
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
              onClick={() => handlePick(opt)}
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
    </div>
  );
}

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/[.,!?¿¡]/g, "").replace(/\s+/g, " ");
}

function TranslateWrite({ item, userId, onNext }: { item: VocabItem; userId: string; onNext: (xp: number) => void }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"ok" | "fail" | null>(null);

  const submit = async () => {
    if (!answer.trim() || result) return;
    const correct = normalize(answer) === normalize(item.translation_es);
    setResult(correct ? "ok" : "fail");
    const { xpEarned } = await recordAttempt({
      userId,
      kind: "vocab_translate",
      isCorrect: correct,
      itemId: item.id,
      userAnswer: answer,
    });
    if (!correct) toast.error(`Correcto: ${item.translation_es}`);
    setTimeout(() => onNext(xpEarned), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Traduce al español</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="text-3xl font-bold">{item.word_en}</span>
          <button onClick={() => speak(item.word_en)} className="text-muted-foreground hover:text-primary">
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Input
        autoFocus
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Escribe la traducción..."
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
    </div>
  );
}

function SessionComplete({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary to-primary-glow p-8 text-center text-primary-foreground shadow-lg">
      <div className="text-6xl">🎉</div>
      <h2 className="mt-4 text-2xl font-bold">¡Sesión completada!</h2>
      <p className="mt-1 opacity-90">Has ganado</p>
      <p className="text-5xl font-bold">+{xp} XP</p>
      <Button size="lg" variant="secondary" className="mt-6" onClick={onDone}>
        Volver
      </Button>
    </div>
  );
}
