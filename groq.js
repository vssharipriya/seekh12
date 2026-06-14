/* ═══════════════════════════════════════════════════════
   js/groq.js
   Groq API integration — handles all calls to
   api.groq.com using the llama-3.3-70b-versatile model.
   Exposes a global GroqAI object.
═══════════════════════════════════════════════════════ */

const GroqAI = (() => {

  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
  const MODEL        = "llama-3.3-70b-versatile";
  const MAX_TOKENS   = 900;
  const GROQ_API_KEY = "";

  /* ── Internal: get hardcoded API key ── */
  function getKey() {
    return GROQ_API_KEY;
  }

  /* ── Save key (called from UI) ── */
  function saveKey(key) {
    const k = key.trim();
    if (!k) return { ok: false, msg: "Key cannot be empty." };
    if (!k.startsWith("gsk_")) return { ok: false, msg: "Groq keys start with gsk_. Please check your key." };
    sessionStorage.setItem("trendidea_groq_key", k);
    return { ok: true, msg: "Key saved for this session." };
  }

  /* ── Check if key exists ── */
  function hasKey() {
    return !!getKey();
  }

  /* ── Build the system prompt ── */
  function buildSystemPrompt(brand) {
    return `You are TrendIdea's expert social media campaign strategist.
You specialise in creating scroll-stopping, platform-native content for brands.

Brand Profile:
- Name: ${brand.name}
- Industry: ${brand.industry}
- Brand Tone: ${brand.tone}
- Primary Platform: ${brand.platform}
- Target Audience: ${brand.audience || "General audience"}

Rules:
1. Always write in the brand's exact tone. "${brand.tone}" means: ${toneGuide(brand.tone)}
2. Make content feel native to ${brand.platform} — not generic.
3. Be creative, punchy, and memorable. No corporate fluff.
4. Always return a valid JSON object — no markdown fences, no preamble.`;
  }

  /* ── Tone guidance map ── */
  function toneGuide(tone) {
    const guide = {
      "Premium & Minimal":   "restrained, elegant, few words, high-end vocabulary, whitespace in language",
      "Bold & Energetic":    "loud, exciting, lots of energy, short punchy sentences, CAPS for emphasis sometimes",
      "Warm & Friendly":     "conversational, approachable, like a friend texting, inclusive language",
      "Edgy & Creative":     "unconventional, slightly provocative, creative metaphors, unexpected angles",
      "Professional & Clean":"clear, authoritative, benefit-led, structured, no slang",
      "Playful & Fun":       "lighthearted, emoji-friendly, puns welcome, keeps it fun and lighthearted"
    };
    return guide[tone] || "balanced and on-brand";
  }

  /* ── Build the user prompt ── */
  function buildUserPrompt(trend, contentType, platform, effectiveTone) {
    const platformTips = {
      "Instagram":   "Instagram posts: strong visual hook, emojis OK, 5–10 hashtags ideal, caption length 100–200 words.",
      "TikTok":      "TikTok captions are short (<150 chars). Hook must appear in first second. FYP/trending hashtags.",
      "X (Twitter)": "Twitter: max 280 chars for caption, 1–3 hashtags only, punchy one-liners win.",
      "YouTube":     "YouTube: longer-form content, engaging hook in first 10 seconds, detailed descriptions, SEO friendly keywords.",
      "Facebook":    "Facebook: mix of image and video content, community engagement focus, longer captions, relatable storytelling."
    };

    return `Generate a ${contentType} campaign for the trend: "${trend.name}"

Trend Details:
- Tags: ${trend.tags.join(", ")}
- Stage: ${trend.stage}
- Risk Level: ${trend.risk}
- Platform: ${platform}
- Trend Insight: "${trend.insight}"

Tone for this campaign: ${effectiveTone}
Platform guidance: ${platformTips[platform] || ""}

Also recommend:
1. The best posting time range for maximum engagement on the selected platform.
2. ONE meme template format that best suits this campaign.

Return ONLY a JSON object in this exact shape (no markdown, no extra text):
{
  "hook": "The opening line that stops the scroll (1–2 sentences, max 20 words)",
  "caption": "The full caption body (platform-appropriate length, include line breaks with \\n)",
  "visual": "A detailed visual direction for the post (lighting, composition, color palette, format)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "cta": "The call-to-action line (1 sentence)",
  "bestPostingTime": "Best posting time range",
  "memeTemplate": "Recommended meme template name"

}`;
  }

  /* ── Main generate function ── */
  async function generateCampaign(brand, trend, contentType, platform, effectiveTone) {
    const key = getKey();
    if (!key) {
      throw new Error("NO_KEY");
    }

    const payload = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.85,
      messages: [
        { role: "system", content: buildSystemPrompt(brand) },
        { role: "user",   content: buildUserPrompt(trend, contentType, platform, effectiveTone) }
      ]
    };

    let res;
    try {
      res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      throw new Error("NETWORK_ERROR");
    }

    if (res.status === 401) throw new Error("INVALID_KEY");
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

    const data = await res.json();
    const raw  = data?.choices?.[0]?.message?.content || "";

    return parseResponse(raw, trend, brand, contentType, platform);
  }

  /* ── Parse & validate the JSON response ── */
  function parseResponse(raw, trend, brand, contentType, platform) {
    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Attempt to extract JSON substring
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { throw new Error("PARSE_ERROR"); }
      } else {
        throw new Error("PARSE_ERROR");
      }
    }

    // Validate required fields; fill missing ones with fallbacks
    return {
      hook:     parsed.hook     || `Discover the ${trend.name} trend.`,
      caption:  parsed.caption  || `${brand.name} embraces ${trend.name}. ${trend.insight}`,
      visual:   parsed.visual   || `${trend.tags[0]} aesthetic. Platform-native format for ${platform}.`,
      hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length
                  ? parsed.hashtags
                  : [`#${trend.name.replace(/\s/g,"")}`, `#${brand.industry.replace(/\s/g,"")}`, `#TrendIdea`],
      cta:      parsed.cta      || "Tap to explore.",
      bestPostingTime: parsed.bestPostingTime || "6 PM – 9 PM",
      memeTemplate: parsed.memeTemplate || "POV Meme"
    };
  }

  /* ── Human-readable error messages ── */
  function errorMessage(err) {
    const map = {
      "NO_KEY":        "No Groq API key found. Please enter and save your key in the Brand Setup tab.",
      "INVALID_KEY":   "Your Groq API key is invalid or expired. Please check it at console.groq.com.",
      "RATE_LIMIT":    "You've hit Groq's rate limit. Wait a moment and try again.",
      "NETWORK_ERROR": "Could not reach Groq's servers. Check your internet connection.",
      "PARSE_ERROR":   "The AI returned an unexpected format. Try generating again."
    };
    const code = err?.message || "";
    return map[code] || `Groq API error: ${code}. Please try again.`;
  }

  /* Public API */
  return { saveKey, hasKey, generateCampaign, errorMessage };

})();
