import OpenAI from "openai";
import { loadTextFromInput } from "@/lib/text";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server is missing OPENAI_API_KEY. Add it to web/.env.local and restart the server." },
        { status: 500 }
      );
    }
    const project = process.env.OPENAI_PROJECT;
    const client = new OpenAI(project ? { apiKey, project } : { apiKey });

    const payload = await request.json();
    const {
      question,
      language = "English",
      interests = "",
      community = "",
      outputStyle = "bullets",
      languageStyle = "everyday",
      explainTerms = true,
      keepTechnicalTerms = false,
      includeExamples = false,
      text,
      url,
    } = payload || {};
    if (!question) {
      return Response.json({ error: "Missing `question`." }, { status: 400 });
    }

    const context = await loadTextFromInput({ text, url });

    const styleInstruction =
      languageStyle === "everyday"
        ? "Start with an everyday language answer in one sentence, then a short step-by-step explanation."
        : "Use an academic-friendly tone that keeps key terms and stays concise; begin with a one-sentence answer.";

    const termInstruction = [
      explainTerms ? "Define key terms briefly on first mention." : "",
      keepTechnicalTerms ? "Keep important technical terms where helpful." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const personalization = [
      `Respond in ${language}.`,
      "Use an inclusive, strengths-based tone. Avoid stereotypes.",
      interests ? `When giving examples, connect to these interests: ${interests}.` : "",
      community ? `When relevant, include contexts or examples related to: ${community}.` : "",
      outputStyle === "bullets"
        ? "Prefer concise bullet points for steps."
        : "Prefer short paragraphs for explanations.",
      includeExamples ? "Include real-world examples and practical applications to make concepts more concrete and relatable." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const messages = [
      {
        role: "system",
        content:
          "Answer as a helpful tutor for a high school student with respectful, strengths-based language. If unsure, say you are unsure.",
      },
      {
        role: "user",
        content: [
          personalization,
          styleInstruction,
          termInstruction,
          "Use the context to answer the question with clear markdown formatting (**bold** for emphasis, *italic* for key terms).",
          "Structure your response with:",
          "- **Direct Answer** (one clear sentence)",
          "- *Key Terms* (italicize important concepts)",
          "- **Explanation** (step-by-step breakdown)",
          "- **Related Questions** (2-3 follow-up questions)",
          "If the context does not contain the answer, say so and suggest how to find it in free or low-cost sources.",
          `Question: ${question}`,
          "\n\nContext:\n\n" + (context || "(no context provided)"),
        ].join("\n\n"),
      },
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.2,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || "";

    return Response.json({ answer });
  } catch (error) {
    console.error("/api/qa error", error);
    return Response.json({ error: "Failed to answer question." }, { status: 500 });
  }
} 