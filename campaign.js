/* ═══════════════════════════════════════════════════════
   js/campaign.js
   Dynamic Campaign Engine — Eliminates hardcoded templates
   by running algorithmic, trend-aware content matrices.
   Isolated content pools eliminate repetitive generation passes.
   Exposes global CampaignEngine object consumed by app.js.
═══════════════════════════════════════════════════════ */

const CampaignEngine = (() => {

  // ── 1. GLOBAL COMPONENTS POOL ──
  const HOOKS_POOL = [
    "GET READY!",
    "This changes everything.",
    "Nobody saw this coming.",
    "Wait until you see this.",
    "This trend is exploding.",
    "The game just changed completely.",
    "Stop scrolling and look at this.",
    "This is officially taking over.",
    "This is your sign to pay attention.",
    "Everything is moving to this right now."
  ];

  const POSTING_TIMES = {
    "Instagram": "3-5 PM EST on weekdays",
    "TikTok": "6-9 PM Local Time",
    "YouTube Shorts": "4-7 PM EST",
    "X (Twitter)": "11 AM - 1 PM Weekdays",
    "LinkedIn": "8-10 AM Weekdays"
  };

  const VISUALS_POOL = {
    cinematic: [
      "A bold, vibrant video featuring futuristic neon-lit cityscapes, quick cuts between product angles, dynamic close-ups, and cinematic transitions. High-contrast color palette emphasizing innovation.",
      "A moody, richly cinematic sequence with soft lighting, sweeping tracking movements over high-end textures, subtle text overlays, and a minimalist color profile capturing understated luxury."
    ],
    authentic: [
      "Raw, flash-lit portrait frames showing unfiltered behind-the-scenes creation spaces. Fast camera whips, native lookups, tactile macro handling elements, and an industrial-chic finish.",
      "Split-screen narrative composition comparing traditional industry standards with this new paradigm. Sharp digital aspect switches, rapid focus shifts, and human-centric framing layouts."
    ]
  };

  const CTA_POOL = [
    "Download now.",
    "Save this post.",
    "Comment your thoughts.",
    "Follow for updates.",
    "Join the waitlist.",
    "Try it today.",
    "Click the link in bio.",
    "Share this with a friend who needs it."
  ];

  const MEME_POOL = [
    "Distracted Boyfriend", 
    "Expanding Brain", 
    "Drake Hotline Bling", 
    "Two Buttons Option", 
    "Gigachad Grid Frame",
    "Unpopular Opinion Matrix",
    "Arthur Fist Punch-in"
  ];

  // ── 2. ISOLATED CONTENT GENERATION POOLS ──
  const VIRAL_HOOK_POOL = {
    openers: [
      "POV: Realizing this layout layer is taking over feeds.",
      "Stop what you're doing. Workflows are shifting fast.",
      "Unpopular opinion: The old framework is broken.",
      "This is your sign to rethink your approach.",
      "No one expected this exact setup to speed up."
    ],
    bodies: [
      "High energy, clear focus, and zero fluff.",
      "It changes the conversation entirely.",
      "Cuts out hours of manual over-processing.",
      "A complete macro paradigm flip."
    ]
  };

  const SCRIPT_POOL = {
    setups: [
      "[Speaker Action: Fast cut to camera] What creators miss analyzing these signals.",
      "[Delivery: Conversational] Look at the numbers driving the space right now.",
      "[Speaker Action: Screen recording overlay] Standard workflows aren't cutting it.",
      "[Delivery: Confident insider tone] The exact layout we're executing behind the scenes."
    ],
    dialogues: [
      "Strip away noise and inject structural frameworks.",
      "Teams are over-complicating this execution layer.",
      "Notice the subtle shift toward product transparency."
    ]
  };

  const EDUCATIONAL_POOL = {
    openers: [
      "Quietly monitoring how things are shifting across the market.",
      "Recent macro intelligence reveals a structural transition.",
      "Standard operational approaches aren't delivering baseline value.",
      "Trying to scale output? This breakdown is your wake-up call."
    ],
    breakdowns: [
      "It requires modular separation and continuous platform alignment.",
      "Address two key parameters: systemic execution and data loops.",
      "It boils down to balancing strategic metrics with minimalism."
    ],
    closers: [
      "This philosophy marks our newest milestone. Thoughts?",
      "Pioneering tailored strategies that align with this layer.",
      "A permanent evolution in behavior patterns across the ecosystem."
    ]
  };

  function _getRandom(arr) {
    if (!arr || !arr.length) return "";
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generates a dynamic, multi-variant campaign block payload
   * @param {Object} brand 
   * @param {Object} trend 
   * @param {string} contentType 
   * @param {string} platform 
   * @param {string} toneOverride 
   * @param {string} [ACCESS_TOKEN] - Authorization identity token for API integration
   * @returns {Object} Structured Campaign Payload
   */
  async function generate(brand, trend, contentType, platform, toneOverride, ACCESS_TOKEN) {
    const effectiveTone = toneOverride === "auto" ? brand.tone : toneOverride;

    const selectedBestTime = POSTING_TIMES[platform] || "12:00 PM EST";
    const selectedMeme = _getRandom(MEME_POOL);
    const selectedHook = _getRandom(HOOKS_POOL);

    const primaryTrendTag = (trend.tags && trend.tags[0]) ? trend.tags[0] : "Innovation";

    // ── 🎵 REAL AUDIO RESOLVER ──
    let selectedAudio = { name: "No track found", artist: "Unknown" };

    if (!ACCESS_TOKEN) {
      console.warn("Spotify integration warning: ACCESS_TOKEN is missing or undefined.");
    }

    try {
      if (!ACCESS_TOKEN) throw new Error("Missing Spotify token context.");

      const query = `${trend.name || ""} ${brand.industry || ""} viral trending`;
      const res = await fetch(
        `http://googleusercontent.com/spotify.com/${encodeURIComponent(query)}&type=track&limit=5`,
        { headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` } }
      );

      if (res.ok) {
        const data = await res.json();
        const items = data?.tracks?.items || [];
        let track = items.find(t => t?.name && t?.artists?.length) || null;

        if (!track) {
          const fallbackQuery = `${brand.industry} ${primaryTrendTag} mood`;
          const retryRes = await fetch(
            `http://googleusercontent.com/spotify.com/${encodeURIComponent(fallbackQuery)}&type=track&limit=5`,
            { headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` } }
          );
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const retryItems = retryData?.tracks?.items || [];
            track = retryItems.find(t => t?.name && t?.artists?.length) || null;
          }
        }

        if (track) {
          selectedAudio = { name: track.name, artist: track.artists?.[0]?.name || "Unknown" };
        }
      }
    } catch (err) {
      console.warn("Audio processing subsystem bypassed safely:", err.message);
    }

    // ── 🧠 CAPTION GENERATION (ULTRA-SHORT REWRITE) ──
    let selectedCaption = "";

    if (contentType === "Viral Hook") {
      const opener = _getRandom(VIRAL_HOOK_POOL.openers);
      const body = _getRandom(VIRAL_HOOK_POOL.bodies);
      
      // Step 1 Fix: Tight, seamless one-liner composition
      selectedCaption = `${opener} — ${body}`;

    } else if (contentType === "Script") {
      const setup = _getRandom(SCRIPT_POOL.setups);
      
      // Step 2 Fix: Extracts only the raw spoken words, stripping dialogue delivery tags
      selectedCaption = `${setup.split("]")[1]?.trim() || setup}`;

    } else {
      const opener = _getRandom(EDUCATIONAL_POOL.openers);
      
      // Step 3 Fix: Removes stacking structure entirely to keep the baseline clean
      selectedCaption = `${opener}`;
    }

    // ── 🔥 CAPTION ENGINE SHORTENER & CHARACTER LIMIT ARCHITECTURE ──
    // Step 4: Flatten any stray structural line breaks and capture the top active components
    selectedCaption = selectedCaption
      .split("\n")
      .slice(0, 2)
      .join(" ")
      .trim();

    // Step 5: Enforce strict 120 character threshold ceiling to match social media standards
    selectedCaption = selectedCaption.length > 120
      ? selectedCaption.slice(0, 117) + "..."
      : selectedCaption;

    // Dynamic variable syntax substitutions
    selectedCaption = selectedCaption
      .replace(/\[brand\.name\]/g, brand.name)
      .replace(/\[brand\.industry\]/g, brand.industry)
      .replace(/\[primaryTrendTag\]/g, primaryTrendTag);

    // ── 4. Algorithmic Visual Concept Design ──
    let selectedVisual = "";
    if (effectiveTone.toLowerCase().includes("premium") || effectiveTone.toLowerCase().includes("minimal")) {
      selectedVisual = _getRandom(VISUALS_POOL.cinematic);
    } else {
      selectedVisual = _getRandom(VISUALS_POOL.authentic);
    }
    selectedVisual += ` Content layout explicitly optimized for ${contentType} assets matching standard ${brand.industry} production protocols on ${platform}.`;

    // ── 5. Dynamic Variable Hashtag Compositions ──
    const cleanBrandHashtag = `#${brand.name.replace(/\s/g, "")}`;
    const cleanTrendHashtag = `#${trend.name ? trend.name.replace(/\s/g, "") : "Trend"}`;
    const cleanIndustryHashtag = `#${brand.industry.replace(/\s/g, "")}`;
    const cleanPlatformHashtag = `#${platform.replace(/[^a-zA-Z0-9]/g, "")}`;
    
    const randomHashtagPool = ["#TrendIdea", "#TrendIntelligence", "#SocialStrategy", "#EmergingWave", "#NextGenAesthetic"];
    const dynamicDiscoverTag = _getRandom(randomHashtagPool);

    const generatedHashtags = [
      cleanTrendHashtag,
      cleanIndustryHashtag,
      `#${primaryTrendTag}`,
      dynamicDiscoverTag,
      cleanBrandHashtag,
      cleanPlatformHashtag
    ];

    return {
      hook: selectedHook,
      song: `${selectedAudio.name} — ${selectedAudio.artist}`,
      caption: selectedCaption,
      visual: selectedVisual,
      hashtags: generatedHashtags,
      cta: _getRandom(CTA_POOL),
      bestPostingTime: selectedBestTime,
      memeTemplate: _getRandom(MEME_POOL)
    };
  }

  return { generate };
})();
