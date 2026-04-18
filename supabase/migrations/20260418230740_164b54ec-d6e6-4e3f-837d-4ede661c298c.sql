
-- Enum para niveles CEFR
CREATE TYPE public.cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1');
CREATE TYPE public.exercise_kind AS ENUM ('vocab_flashcard', 'vocab_multiple_choice', 'vocab_translate', 'grammar_multiple_choice', 'grammar_fill_blank', 'ai_correction');
CREATE TYPE public.grammar_item_type AS ENUM ('multiple_choice', 'fill_blank');

-- Función para timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabla profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  cefr_level public.cefr_level NOT NULL DEFAULT 'A1',
  daily_xp_goal INTEGER NOT NULL DEFAULT 30,
  interests TEXT[] NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla user_progress (gamificación)
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  user_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vocabulario (contenido público de lectura)
CREATE TABLE public.vocabulary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word_en TEXT NOT NULL,
  translation_es TEXT NOT NULL,
  example_en TEXT,
  example_es TEXT,
  cefr_level public.cefr_level NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vocabulary_level_topic ON public.vocabulary_items(cefr_level, topic);

ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read vocabulary" ON public.vocabulary_items
  FOR SELECT TO authenticated USING (true);

-- Gramática
CREATE TABLE public.grammar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type public.grammar_item_type NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  cefr_level public.cefr_level NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grammar_level_topic ON public.grammar_items(cefr_level, topic);

ALTER TABLE public.grammar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read grammar" ON public.grammar_items
  FOR SELECT TO authenticated USING (true);

-- Intentos de ejercicios
CREATE TABLE public.exercise_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_kind public.exercise_kind NOT NULL,
  item_id UUID,
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  user_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_user_date ON public.exercise_attempts(user_id, created_at DESC);

ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" ON public.exercise_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON public.exercise_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Progreso por palabra (repetición espaciada simple)
CREATE TABLE public.vocabulary_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, vocabulary_id)
);

CREATE INDEX idx_vocab_progress_review ON public.vocabulary_progress(user_id, next_review_at);

ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vocab progress" ON public.vocabulary_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vocab progress" ON public.vocabulary_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vocab progress" ON public.vocabulary_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_vocab_progress_updated_at BEFORE UPDATE ON public.vocabulary_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear profile + progress automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
