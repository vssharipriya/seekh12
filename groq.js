/* ═══════════════════════════════════════════════════════
   js/groq.js
   Groq API integration — handles all calls to
   api.groq.com using the llama-3.3-70b-versatile model.
   Enforces maximum output variation and uniqueness via
   algorithmic scenario anchors and dynamic temperature.
   Exposes a global GroqAI object.
═══════════════════════════════════════════════════════ */

const GroqAI = (() => {

  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
  const MODEL        = "llama-3.3-70b-versatile";
  const MAX_TOKENS   = 1100; // Increased slightly to accommodate deeper, descriptive layouts
  const GROQ_API_KEY = ""; // Kept for standalone fallback

  /* ── Algorithmic Angles to Prevent Content Repetition ── */
  const SCENARIO_ANGLES = [
    "Focus heavily on an unexpected micro-problem or hidden friction point your community faces daily within this niche.",
    "Write from an industry-insider perspective, leading with an 'unpopular opinion' or a bold truth that challenges legacy thinking.",
    "Frame the narrative around an immediate paradigm shift happening right now, emphasizing what is gained by adapting instantly.",
    "Use a highly relatable, human-centric storytelling approach (e.g., 'day-in-the-life' realization or behind-the-scenes discovery).",
    "Directly contrast a legacy, old-school methodology against this newly optimized modern framework.",
    "Take an educational deep-dive approach, breaking down an abstract operational concept into a highly practical blueprint.",
    "Focus on the aesthetic and lifestyle impact, painting a vivid picture of how this concept elevates the user's daily status or workspace workflow."
  ];

  /* ── Checks sessionStorage so user-entered keys work perfectly ── */
  function getKey() {
    return sessionStorage.getItem("trendidea_groq_key") || GROQ_API_KEY;
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

  /* ── Build the system prompt with strict copy constraints ── */
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
4. CRITICAL: NEVER mention the raw trend name or database title (e.g., do not say "The [Trend Name] trend is here"). Instead, seamlessly absorb the concept, format, lifestyle element, or theme of the trend into a natural, human-written caption.
5. Always return a valid JSON object — no markdown fences, no preamble.`;
  }

  /* ── Tone guidance map ── */
  function toneGuide(tone) {
    const guide = {
      "Premium & Minimal":   "restrained, elegant, few words, high-end vocabulary, whitespace in language, sophisticated cadence",
      "Bold & Energetic":    "loud, exciting, lots of energy, short punchy sentences, CAPS for emphasis sometimes, highly motivating",
      "Warm & Friendly":     "conversational, approachable, like a friend texting, inclusive language, highly empathetic",
      "Edgy & Creative":     "unconventional, slightly provocative, creative metaphors, unexpected angles, raw and stylistic",
      "Professional & Clean":"clear, authoritative, benefit-led, structured, no slang, highly polished executive presence",
      "Playful & Fun":       "lighthearted, emoji-friendly, puns welcome, keeps it fun, witty, and highly engaging"
    };
    return guide[tone] || "balanced and on-brand";
  }

  /* ── Build highly contextual user prompt with variation anchors ── */
  function buildUserPrompt(trend, contentType, platform, effectiveTone, randomAngle, randomSeed) {
    const platformTips = {
      "Instagram":      "Instagram posts: strong visual hook, emojis OK, 5–10 hashtags ideal, caption length 100–200 words.",
      "TikTok":         "TikTok captions are short (<150 chars). Hook must appear in first second. Use highly trending FYP hashtags. Focus on loop-ability.",
      "X (Twitter)":    "Twitter: max 280 chars for caption, 1–3 hashtags only, punchy hook, one-liners or quick setups win.",
      "YouTube Shorts": "YouTube Shorts: High-impact opening frame hook in first 2 seconds, fast narrative pacing, punchy description context.",
      "Facebook":       "Facebook: Community engagement focus, relatable storytelling framing, longer text with an invitation to discuss.",
      "LinkedIn":       "LinkedIn: Professional storytelling framework, clear line breaks, value-first breakdown, tactical takeaways."
    };

    return `Generate a unique, highly specific ${contentType} campaign tailored for the platform "${platform}".

Context Matrix:
- Industry Landscape: This must apply directly to the standards of the "${trend.tags ? trend.tags.join(', ') : 'Innovation'}" niches.
- Core Trend Concept to adapt: "${trend.insight}"
- Creative Tone Requirement: ${effectiveTone}
- Platform Constraints: ${platformTips[platform] || ""}
- UNIQUE SYSTEM SEED: ${randomSeed}
- MANDATORY PERSPECTIVE ANGLE: ${randomAngle}

STRICT WRITING GUIDELINES FOR UNIQUE VARIATION:

1. DO NOT include the phrase "${trend.name}" anywhere in the caption body or hook.

2. Direct Copy Variation: Ensure this generation feels completely distinct from previous requests by strictly anchoring your copy around the assigned MANDATORY PERSPECTIVE ANGLE.

3. Completely vary vocabulary, sentence structure, opening punchlines, paragraph layouts, CTA wording, and hook formats.

4. Every generation must feel radically different from previous generations.

5. Never reuse:
   - hook structures
   - opening sentence structures
   - CTA structures
   - hashtag combinations
   - visual concept structures

6. Write like a different creator every time.

7. Avoid corporate, agency, or marketing language.

8. NEVER use words such as:
   paradigm,
   ecosystem,
   framework,
   optimization,
   synergy,
   innovation,
   transformation,
   leverage,
   disrupt,
   revolutionary,
   game-changing.

9. Hooks must feel native to social media and sound human-written.

10. Brand names should not appear in hooks.

11. If it's a script, include realistic dialogue and delivery beats.

12. If it's a viral hook, make it short, curiosity-driven, and scroll-stopping.

13. If it's a value post, make it practical and actionable rather than inspirational.

Return ONLY a JSON object in this exact shape (no markdown fences, no extra text, no trailing comments):
{
  "hook": "A short social-media hook under 8 words. No brand names. No corporate language.",
  "song": "Recommend a highly specific real song and artist matching this vibe structured strictly as a single string format: 'Song Name — Artist'",
  "caption": "The full realistic caption body (platform-appropriate length, completely dynamic, include line breaks with \\n)",
  "visual": "A detailed visual direction for the post (lighting, composition, color palette, camera movement, format)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "cta": "The call-to-action line (1 sentence)",
  "bestPostingTime": "Best posting time range specific to this strategy",
  "memeTemplate": "Recommended contextual meme template name matched to this specific angle"
}`;
  }

  /* ── Main generate function ── */
  async function generateCampaign(brand, trend, contentType, platform, effectiveTone) {
    const key = getKey();
    if (!key) {
      throw new Error("NO_KEY");
    }

    // Algorithmic variation parameters generated on-the-fly per request
    const randomAngle = SCENARIO_ANGLES[Math.floor(Math.random() * SCENARIO_ANGLES.length)];
    const randomSeed = Math.floor(Math.random() * 1000000);
    
    // Fluctuating temperature variance limits (0.85 to 0.98) for maximum token divergence
    const creativeTemperature = parseFloat((0.98 + Math.random() * 0.02).toFixed(2));

    const payload = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: creativeTemperature,
      response_format: { type: "json_object" }, 
      messages: [
        { role: "system", content: buildSystemPrompt(brand) },
        { 
          role: "user", 
          content: buildUserPrompt(trend, contentType, platform, effectiveTone, randomAngle, randomSeed) 
        }
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
      // Attempt to extract JSON substring if extra conversational noise leaked
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { throw new Error("PARSE_ERROR"); }
      } else {
        throw new Error("PARSE_ERROR");
      }
    }

    // 🛡️ UI EXPECTATION SAFEGUARD — Formats song output to match app.js expectation
    let standardizedSong = "No track found — Unknown";
    if (parsed.song) {
      if (typeof parsed.song === "object") {
        standardizedSong = `${parsed.song.name || "No track found"} — ${parsed.song.artist || "Unknown"}`;
      } else if (typeof parsed.song === "string") {
        standardizedSong = parsed.song;
      }
    }

    // Defensive fallback architecture to prevent UI execution breaks
    return {
      hook:     parsed.hook     || `Unlocking the next level of strategy.`,
      song:     standardizedSong,
      caption:  parsed.caption  || `Taking a closer look at what's driving the industry forward today. This approach is completely reshaping how our community connects, delivers value, and stays ahead. \n\nWhat's your take on this direction?`,
      visual:   parsed.visual   || `Clean, platform-native production layout optimized for ${platform}.`,
      hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length
                  ? parsed.hashtags
                  : [`#${brand.industry.replace(/\s/g,"")}`, `#SocialStrategy`, `#TrendIdea`],
      cta:              parsed.cta             || "Tap the link to learn more.",
      bestPostingTime:  parsed.bestPostingTime || "6 PM – 9 PM",
      memeTemplate:     parsed.memeTemplate    || "POV Meme"
    };
  }

  /* ── Human-readable error messages ── */
  function errorMessage(err) {
    const map = {
      "NO_KEY":        "No Groq API key found. Please enter and save your key in the Brand Setup panel configuration tab.",
      "INVALID_KEY":   "Your Groq API key is invalid or expired. Please check it at console.groq.com.",
      "RATE_LIMIT":    "You've hit Groq's rate limit. Wait a moment and try again.",
      "NETWORK_ERROR": "Could not reach Groq's servers. Check your internet connection.",
      "PARSE_ERROR":   "The AI returned an unexpected format structure. Try generating again."
    };
    const code = err?.message || "";
    return map[code] || `Groq API error: ${code}. Please try again.`;
  }

  /* Public API */
  return { saveKey, hasKey, generateCampaign, errorMessage };

})();
