export async function loadTextFromInput(payload) {
  const { text, url } = payload || {};
  let content = "";

  if (url) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cache: "no-store",
      });
      const html = await res.text();
      content = extractReadableText(html);
    } catch (err) {
      content = text || "";
    }
  } else if (typeof text === "string") {
    content = text;
  }

  return limitLength(sanitizeWhitespace(content), 12000);
}

export function extractReadableText(html) {
  if (!html) return "";
  // Remove scripts/styles and strip tags
  const withoutScripts = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  const textOnly = withoutScripts.replace(/<[^>]+>/g, " ");
  // Decode a few common entities
  const decoded = textOnly
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return decoded;
}

export function sanitizeWhitespace(str) {
  return (str || "").replace(/\s+/g, " ").trim();
}

export function limitLength(str, maxChars) {
  if (!str) return "";
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars);
} 