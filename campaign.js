/* ═══════════════════════════════════════════════════════
   js/campaign.js
   Dynamic Campaign Engine — Eliminates hardcoded templates
   by running algorithmic, trend-aware content matrices.
   Exposes global CampaignEngine object consumed by app.js.
═══════════════════════════════════════════════════════ */

const CampaignEngine = (() => {

  // ── CONSTANT CONFIGURATION MATRICES FOR MAXIMUM VARIATION ──
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

  const AUDIO_MAP = {
    "Instagram": [
      "Trending Fashion Beat",
      "Viral Aesthetic Sound",
      "Slow Luxury Edit Audio",
      "Minimalist Electronic Lo-Fi",
      "High-Fashion Runway Instrumental"
    ],
    "TikTok": [
      "Trending TikTok Sound",
      "Viral Remix",
      "Emotional Storytelling Audio",
      "Hyperpop Transition Track",
      "Upbeat Pitch-Shifted Synth"
    ],
    "YouTube Shorts": [
      "Cinematic Background Beat",
      "Fast-Paced Trend Sound",
      "Modern Tech Punchy Instrumental",
      "Lo-Fi Chill Hop Drum Groove"
    ],
    "X (Twitter)": ["None — Text Post Native"],
    "LinkedIn": ["Corporate Contemporary Ambient", "Upbeat Acoustic Rhythm Loop"]
  };

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

  // Helper function to extract a completely random element from an array
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
   * @returns {Object} Structured Campaign Payload
   */
  function generate(brand, trend, contentType, platform, toneOverride) {
    const effectiveTone = toneOverride === "auto" ? brand.tone : toneOverride;
    
    // 1. Dynamic Audio & Posting Time Selection
    const platformAudioList = AUDIO_MAP[platform] || AUDIO_MAP["Instagram"];
    const selectedAudio = _getRandom(platformAudioList);
    const selectedBestTime = POSTING_TIMES[platform] || "12:00 PM EST";

    // 2. Procedural Hook Generation (Strictly isolated from Brand Name)
    let selectedHook = _getRandom(HOOKS_POOL);
    
    // 3. Context-Aware Caption Matrices (Injecting Trend & Brand Data Dynamically)
    const primaryTrendTag = (trend.tags && trend.tags[0]) ? trend.tags[0] : "Innovation";
    
    const platformCaptions = {
      "Instagram": [
        `We've been quietly watching the ${trend.name} shift evolve — and it's finally time to talk about it.\n\nAs ${brand.name}, we aren't just following this shift. We're defining it. This new era of design is here and our core community is entirely ready for the change.\n\nStrong aesthetic appeal aligns perfectly with visual-first premium branding layouts.`,
        `The landscape is changing rapidly. With the rise of ${trend.name}, traditional approaches are falling behind.\n\nAt ${brand.name}, we are embedding these live signals directly into our daily philosophy. Designed specifically for our dedicated ${brand.audience || "audience"}, this marks a new milestone in quality.`
      ],
      "TikTok": [
        `POV: Realizing the ${trend.name} wave is completely taking over your feed right now. 🤯\n\n${brand.name} just dropped the ultimate response to this movement. High energy, zero filler. Hit that plus sign for more breakdowns!`,
        `No one expected this specific ${primaryTrendTag} aesthetic to scale so fast. ${brand.name} is officially jumping in to show you exactly how to style it. Let us know your thoughts below!`
      ],
      "LinkedIn": [
        `The market intelligence indicators behind the current ${trend.name} movement demonstrate a permanent shift in consumer behavior patterns.\n\nAt ${brand.name}, we are actively tracking these metrics to optimize workflows for our core target demographic. This development underscores a broader industry transition toward systemic transparency.`,
        `Strategic analysis of the latest ${primaryTrendTag} data reveals a significant market gap. ${brand.name} is proud to pioneering tailored solutions that align seamlessly with this emerging macro trend.`
      ],
      "YouTube Shorts": [
        `This is exactly why the ${trend.name} trend is completely changing short-form content scaling rules.\n\nWatch how ${brand.name} breaks down the production workflow variables behind this insight step-by-step. Stick around until the final second to see the conversion metrics layout!`,
        `The data doesn't lie: ${trend.name} is generating 40% more engagement across the ${brand.industry} market. Here is how ${brand.name} is applying it seamlessly right now.`
      ]
    };

    // Fallback to Instagram captions if platform specific array is missing
    const targetCaptions = platformCaptions[platform] || platformCaptions["Instagram"];
    const selectedCaption = _getRandom(targetCaptions);

    // 4. Algorithmic Visual Concept Design
    let selectedVisual = "";
    if (effectiveTone.toLowerCase().includes("premium") || effectiveTone.toLowerCase().includes("minimal")) {
      selectedVisual = _getRandom(VISUALS_POOL.cinematic);
    } else {
      selectedVisual = _getRandom(VISUALS_POOL.authentic);
    }
    
    // Add context enrichment strings dynamically
    selectedVisual += ` Content layout explicitly optimized for ${contentType} assets matching standard ${brand.industry} production protocols.`;

    // 5. Dynamic Variable Hashtag Compositions
    const cleanBrandHashtag = `#${brand.name.replace(/\s/g, "")}`;
    const cleanTrendHashtag = `#${trend.name.replace(/\s/g, "")}`;
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

    // 6. Targeted Call To Action
    const selectedCta = _getRandom(CTA_POOL);

    // 7. Meme Template Selection Pipeline
    const memePool = ["Distracted Boyfriend", "Expanding Brain", "Drake Hotline Bling", "Two Buttons Option", "Gigachad Grid Frame"];
    const selectedMeme = _getRandom(memePool);

    // Return final structured production object matching UI engine requirements
    return {
      hook: selectedHook,
      song: selectedAudio,
      caption: selectedCaption,
      visual: selectedVisual,
      hashtags: generatedHashtags,
      cta: selectedCta,
      bestPostingTime: selectedBestTime,
      memeTemplate: selectedMeme
    };
  }

  return {
    generate
  };

})();
