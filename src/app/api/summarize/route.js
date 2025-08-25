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
      language = "English",
      interests = "",
      community = "",
      outputStyle = "bullets",
      languageStyle = "everyday", // "everyday" | "academic"
      explainTerms = true,
      keepTechnicalTerms = false,
      includeExamples = false,
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
        ? "Use everyday language with short sentences as a strategy for quick understanding."
        : "Use an academic-friendly tone that keeps key terms but stays clear and approachable.";

    const termInstruction = [
      explainTerms ? "Briefly define key terms on first mention." : "",
      keepTechnicalTerms ? "Keep important technical terms where they matter." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const personalization = [
      `Respond in ${language}.`,
      "Use an inclusive, strengths-based, empowering tone.",
      interests ? `When giving examples, connect to these interests: ${interests}.` : "",
      community ? `When relevant, include contexts or examples related to: ${community}.` : "",
      outputStyle === "bullets"
        ? "Prefer concise bullet points over long paragraphs."
        : "Prefer short, plain-language paragraphs.",
      includeExamples ? "Include real-world examples and practical applications to make concepts more concrete and relatable." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const messages = [
      {
        role: "system",
        content:
          "You are an educator helping a high school student understand research articles with respectful, strengths-based language.",
      },
      {
        role: "user",
        content: [
          personalization,
          styleInstruction,
          termInstruction,
          "Summarize the following with clear section headings using markdown formatting (**bold** for emphasis, *italic* for key terms, ### for section headers).",
          "Structure your response with:",
          "- **Main Points** (use ### for section headers)",
          "- *Key Terms* (italicize important concepts)",
          "- **Key Takeaways** (bold for emphasis)",
          "- **Questions to Consider** (3-5 guiding questions)",
          "- **Next Steps** (2-3 actionable steps with free/low-cost resources)",
          "\n\nArticle Content:\n\n" + sourceText,
        ].join("\n\n"),
      },
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.2,
    });

    const summary = completion.choices?.[0]?.message?.content?.trim() || "";

    return Response.json({ summary });
  } catch (error) {
    console.error("/api/summarize error", error);
    return Response.json({ error: "Failed to summarize." }, { status: 500 });
  }
} 