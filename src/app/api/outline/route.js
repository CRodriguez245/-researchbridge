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
      audience = "high-school",
      language = "English",
      interests = "",
      community = "",
      outputStyle = "bullets",
      languageStyle = "everyday",
      explainTerms = true,
      keepTechnicalTerms = false,
      text,
      url,
    } = payload || {};

    const sourceText = await loadTextFromInput({ text, url });
    if (!sourceText) {
      return Response.json(
        { error: "Provide `text` or a valid `url`." },
        { status: 400 }
      );
    }

    const styleInstruction =
      languageStyle === "everyday"
        ? "Use everyday language for clarity; short sentences are fine."
        : "Use an academic-friendly tone that retains key terms, while staying approachable.";

    const termInstruction = [
      explainTerms ? "Include brief definitions for key terms on first mention." : "",
      keepTechnicalTerms ? "Keep important technical terms where appropriate." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const personalization = [
      `Respond in ${language}.`,
      "Use an inclusive, strengths-based tone. Avoid stereotypes.",
      interests ? `When giving examples, connect to these interests: ${interests}.` : "",
      community ? `When relevant, include contexts or examples related to: ${community}.` : "",
      outputStyle === "bullets"
        ? "Prefer concise bullet points."
        : "Prefer short, plain-language paragraphs.",
    ]
      .filter(Boolean)
      .join(" ");

    const messages = [
      {
        role: "system",
        content:
          "You create structured, student-friendly study guides and research outlines with respectful, strengths-based language.",
      },
      {
        role: "user",
        content: [
          personalization,
          styleInstruction,
          termInstruction,
          "Create a clear outline with: key idea bullets, definitions, important data, and a short step-by-step plan to present or write about it.",
          audience === "high-school"
            ? "Keep language accessible to high school students."
            : "Use general audience language.",
          "Include a short section: 'Why this matters in my life/community' using the student's interests/community when provided.",
          "End with 2-3 next steps using free or low-cost resources.",
          "\n\nSource:\n\n" + sourceText,
        ].join("\n\n"),
      },
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.2,
    });

    const outline = completion.choices?.[0]?.message?.content?.trim() || "";

    return Response.json({ outline });
  } catch (error) {
    console.error("/api/outline error", error);
    return Response.json({ error: "Failed to create outline." }, { status: 500 });
  }
} 