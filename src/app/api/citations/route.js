import OpenAI from "openai";
import { loadTextFromInput } from "@/lib/text";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function extractUrls(text) {
  if (!text) return [];
  const urlRegex = /https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?/gi;
  const found = text.match(urlRegex) || [];
  const unique = Array.from(new Set(found));
  return unique.slice(0, 10);
}

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
    const { language = "English", interests = "", community = "" } = payload || {};
    const source = await loadTextFromInput(payload);

    const urls = extractUrls(source);

    if (urls.length === 0) {
      // Ask model to suggest verification queries
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You help students verify information by suggesting credible sources and search queries.",
          },
          {
            role: "user",
            content: [
              `Respond in ${language}. Use an inclusive tone with markdown formatting (**bold** for emphasis, *italic* for key terms).`,
              interests ? `If helpful, relate queries to these interests: ${interests}.` : "",
              community ? `Include ideas for local/community organizations or public resources relevant to: ${community}.` : "",
              "Structure your response with:",
              "- ### **Search Queries** (3-5 specific search terms)",
              "- ### **Credible Sources** (example websites and organizations)",
              "- ### **Local Resources** (community-specific verification options)",
              "Text:\n\n" + (source || "(none)"),
            ].join("\n\n"),
          },
        ],
        temperature: 0.2,
      });

      const suggestions = completion.choices?.[0]?.message?.content?.trim() || "";
      return Response.json({ citations: [], suggestions });
    }

    // Ask model to convert URLs into brief MLA-style citations
    const citationPrompt = [
      `Respond in ${language}.`,
      "Turn these URLs into brief MLA-style citations (author or site, title, publisher/site, date if available, URL).",
      "Use markdown formatting with **bold** for titles and *italic* for authors.",
      "Return as a structured list with ### **MLA Citations** as the header.",
      urls.map((u, i) => `${i + 1}. ${u}`).join("\n"),
    ].join("\n\n");

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You format quick MLA-style citations." },
        { role: "user", content: citationPrompt },
      ],
      temperature: 0.2,
    });

    const formatted = completion.choices?.[0]?.message?.content?.trim() || "";

    return Response.json({ citations: urls, formatted });
  } catch (error) {
    console.error("/api/citations error", error);
    return Response.json({ error: "Failed to process citations." }, { status: 500 });
  }
} 