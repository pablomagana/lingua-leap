
# App para aprender inglés (A1–C1) con gamificación

Aplicación web para practicar **vocabulario y gramática** desde A1 hasta C1, con ejercicios variados (incluida práctica conversacional con IA) y un sistema de gamificación que motive a practicar a diario.

## Onboarding y cuentas
- Registro / login con **email + contraseña** y **Google** (Lovable Cloud Auth).
- Pantalla de bienvenida donde el usuario **elige su nivel** (A1, A2, B1, B2, C1) y los temas que más le interesan (viajes, trabajo, gramática, etc.).
- Perfil editable: nombre, avatar, nivel actual, idioma de la interfaz (español).

## Dashboard principal
- Saludo + **racha diaria** 🔥, XP de hoy y barra de progreso al siguiente nivel.
- Botón grande **"Practicar hoy"** que arma una sesión mixta de ~10 ejercicios.
- Accesos rápidos: Vocabulario, Gramática, Conversación con IA, Mis logros.
- Recordatorio del objetivo diario (XP) y tarjeta motivacional.

## Módulo de vocabulario
Lecciones organizadas por nivel (A1–C1) y por temas (familia, trabajo, phrasal verbs, idioms, etc.). Cada palabra incluye traducción, ejemplo y pronunciación (Web Speech API).
Ejercicios:
- **Flashcards** con repetición espaciada (mostrar palabras que toca repasar).
- **Opción múltiple** (elegir traducción correcta).
- **Emparejar** palabra ↔ definición/traducción.
- **Escribir la traducción** (con corrección flexible).

## Módulo de gramática
Lecciones por nivel con explicación breve + ejercicios:
- **Completar huecos** (rellenar con la forma correcta del verbo, preposición, etc.).
- **Opción múltiple** sobre reglas gramaticales.
- **Traducción** de frases ES↔EN.
- **Reordenar palabras** para formar una frase correcta.

## Práctica con IA (Lovable AI)
- **Corrector de frases**: el usuario escribe una frase en inglés y la IA la corrige, explica el error y propone una versión mejor.
- **Conversación libre por temas** (pedir un café, entrevista de trabajo, small talk) adaptada al nivel del usuario, con feedback al final de la sesión.
- **Generador de ejercicios personalizados** según los errores recientes del usuario.

## Sistema de gamificación
- **XP** por cada ejercicio correcto (más XP en niveles altos y respuestas seguidas sin error).
- **Niveles de usuario** (1, 2, 3...) con barra de progreso.
- **Racha diaria** 🔥 que aumenta cada día que se cumple el objetivo de XP; aviso visual si está en riesgo.
- **Objetivo diario** configurable (suave / normal / intenso).
- Animaciones de feedback (correcto/incorrecto) y celebración al subir de nivel o completar la racha del día.

## Progreso y estadísticas
- Página "Mi progreso" con: XP total, racha actual y máxima, palabras aprendidas, precisión por habilidad (vocab/gramática), nivel CEFR estimado y gráfico de actividad de los últimos 30 días.

## Diseño
- Estilo moderno, amigable y limpio (inspirado en apps de aprendizaje tipo Duolingo pero más sobrio).
- Paleta cálida con acento verde/azul, tipografía clara, totalmente **responsive** (mobile-first) y modo claro por defecto.
- Microinteracciones y animaciones suaves para reforzar el feedback positivo.

## Stack técnico
- **Lovable Cloud**: auth (email + Google), base de datos para usuarios, progreso, ejercicios, XP, rachas y logros, con RLS para que cada usuario solo vea sus datos.
- **Lovable AI Gateway** (modelo por defecto Gemini Flash) en server functions para corrección, conversación y generación de ejercicios.
- Contenido inicial (lecciones de vocabulario y gramática A1–C1) precargado en la base de datos como seed.

## Alcance de la primera versión
Para no abarcar demasiado de una vez, en esta primera entrega construiremos:
1. Auth + onboarding con selección de nivel.
2. Dashboard con racha, XP y "Practicar hoy".
3. Módulo de vocabulario (flashcards + opción múltiple + escribir traducción) con contenido inicial para A1–B1.
4. Módulo de gramática (completar huecos + opción múltiple) con contenido inicial para A1–B1.
5. Corrector de frases con IA.
6. Gamificación básica: XP, niveles, racha diaria y objetivo diario.
7. Página de progreso con estadísticas clave.

Después podremos ampliar contenido a B2/C1, añadir conversación libre con IA, emparejar/reordenar y más estadísticas.
