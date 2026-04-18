import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  sentence: z.string().min(1).max(500),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]).default("B1"),
});

export const correctSentence = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { error: "AI service not configured", correction: null };
    }

    const systemPrompt = `Eres un profesor experto de inglés. El estudiante tiene nivel CEFR ${data.level}. Corrige la frase en inglés que te envíe. Responde SIEMPRE llamando la función return_correction.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "return_correction",
          description: "Devuelve la corrección de la frase del estudiante",
          parameters: {
            type: "object",
            properties: {
              is_correct: {
                type: "boolean",
                description: "Si la frase original ya es correcta y natural",
              },
              corrected: {
                type: "string",
                description: "Versión corregida y natural de la frase en inglés",
              },
              explanation_es: {
                type: "string",
                description: "Explicación breve en español de los errores y por qué",
              },
              improved_alternative: {
                type: "string",
                description: "Alternativa mejorada o más natural en inglés (opcional)",
              },
            },
            required: ["is_correct", "corrected", "explanation_es"],
            additionalProperties: false,
          },
        },
      },
    ];

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: data.sentence },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "return_correction" } },
        }),
      });

      if (res.status === 429) {
        return { error: "Demasiadas peticiones. Espera un momento.", correction: null };
      }
      if (res.status === 402) {
        return { error: "Sin créditos de IA. Añade créditos en Settings > Workspace > Usage.", correction: null };
      }
      if (!res.ok) {
        const txt = await res.text();
        console.error("AI gateway error", res.status, txt);
        return { error: "Error en el servicio de IA", correction: null };
      }

      const json = await res.json();
      const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return { error: "No se pudo procesar la respuesta", correction: null };
      }

      const args = JSON.parse(toolCall.function.arguments);
      return { error: null, correction: args };
    } catch (e) {
      console.error("correctSentence error", e);
      return { error: "Error inesperado", correction: null };
    }
  });
