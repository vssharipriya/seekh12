/* ═══════════════════════════════════════════════════════
   js/engine.js
   Local campaign generation using template-based logic.
   Exposes a global CampaignEngine object.
═══════════════════════════════════════════════════════ */

const CampaignEngine = (() => {

  /* ── Template library ── */
  const templates = {
    "Viral Hook": {
      hook: (trend, brand) => `Stop scrolling: ${trend.name} is happening right now.`,
      caption: (trend, brand, platform) => `${brand.name} is riding the ${trend.name} wave.\n\n${trend.insight}\n\nWho else is obsessed with this trend?`,
      visual: (trend, brand, platform) => `Trending ${trend.tags[0]} aesthetic, bright colors, platform-native format (16:9 for ${platform}), trending sound overlay suggestion.`,
      cta: (brand) => `Double-tap if you agree. 👇`,
    },
    "Caption": {
      hook: (trend, brand) => `Your caption starts here.`,
      caption: (trend, brand, platform) => `Every great trend tells a story.\n\n${brand.name} believes in ${trend.name}. Here's why it matters: ${trend.insight}`,
      visual: (trend, brand, platform) => `Clean, minimal aesthetic. Single hero image with complementary colors matching ${brand.name}'s brand. Focus on the trend element.`,
      cta: (brand) => `Tap the link in bio to learn more.`,
    },
    "Conversion Ad": {
      hook: (trend, brand) => `Limited time: Join the ${trend.name} movement.`,
      caption: (trend, brand, platform) => `${brand.name} is making waves with ${trend.name}.\n\n✓ Limited-time offer\n✓ Exclusive access\n✓ Join 10k+ others\n\n${trend.insight}`,
      visual: (trend, brand, platform) => `High-contrast ad format. Bold CTA button. Include social proof (testimonials/user count). Product or service front-and-center.`,
      cta: (brand) => `Claim your spot today →`,
    },
    "Trend Reel Script": {
      hook: (trend, brand) => `POV: ${brand.name} just nailed the ${trend.name} trend.`,
      caption: (trend, brand, platform) => `15-second reel hook: ${trend.insight}\n\nTransition idea: Trending sound → quick cuts → reveal\n\nEnding: Strong visual + product mention`,
      visual: (trend, brand, platform) => `Dynamic, fast-paced editing. Trending sound overlay. Multiple scene transitions. Text overlays on each cut. High energy throughout.`,
      cta: (brand) => `Follow for more trending content.`,
    },
    "Promotional Post": {
      hook: (trend, brand) => `This ${trend.name} trend is too good to miss.`,
      caption: (trend, brand, platform) => `${brand.name} is thrilled to announce our ${trend.name} collaboration.\n\n${trend.insight}\n\nEarly access for followers only.`,
      visual: (trend, brand, platform) => `Professional product shot on trending background. Brand colors prominent. Include call-to-action button/badge. Lifestyle context.`,
      cta: (brand) => `Shop now – link in bio.`,
    },
    "Meme Concept": {
      hook: (trend, brand) => `When your brand actually understands ${trend.name}.`,
      caption: (trend, brand, platform) => `POV: You're ${brand.name} and ${trend.name} just became your superpower.\n\n${trend.insight}\n\nTag yourself.`,
      visual: (trend, brand, platform) => `Template: Popular meme format (Drake meme, Distracted Boyfriend, etc.). Top: Old trend. Bottom: ${trend.name}. Include brand logo subtly.`,
      cta: (brand) => `Like if this is you.`,
    }
  };

  /* ── Generate campaign from template ── */
  function generate(brand, trend, contentType, platform, toneOverride) {
    const template = templates[contentType] || templates["Viral Hook"];

    // Generate hook, caption, visual, cta
    const hook = template.hook(trend, brand);
    const caption = template.caption(trend, brand, platform);
    const visual = template.visual(trend, brand, platform);
    const cta = template.cta(brand);

    // Generate hashtags
    const hashtags = [
      `#${trend.name.replace(/\s+/g, "")}`,
      `#${brand.industry.replace(/\s+/g, "")}`,
      `#${brand.name.replace(/\s+/g, "")}`,
      "#TrendingNow",
      "#TrendIdea"
    ];

    // Platform-specific posting times
    const postingTimes = {
      "Instagram": "6 PM – 9 PM (evenings)",
      "TikTok": "6 AM – 10 AM (morning commute)",
      "X (Twitter)": "12 PM – 3 PM (lunch break)",
      "YouTube": "6 PM – 8 PM (prime time)",
      "Facebook": "1 PM – 4 PM (afternoon)"
    };

    // Platform-specific meme recommendations
    const memeTemplates = {
      "Instagram": "Carousel posts, Reels meme template",
      "TikTok": "Trending audio sync, Quick cuts meme",
      "X (Twitter)": "Text-based meme, Quote retweet format",
      "YouTube": "Thumbnail meme, Intro/outro meme template",
      "Facebook": "Image meme, Reaction meme format"
    };

    // Platform-specific trending songs / audio suggestions
    const trendingSongs = {
  "TikTok": "Nasty - Tinashe",
  "Instagram": "Espresso - Sabrina Carpenter",
  "YouTube": "Not Like Us - Kendrick Lamar",
  "X (Twitter)": "Million Dollar Baby - Tommy Richman",
  "Facebook": "Birds of a Feather - Billie Eilish"
};
    return {
      hook,
      caption,
      visual,
      hashtags,
      cta,
      bestPostingTime: postingTimes[platform] || "6 PM – 9 PM",
      memeTemplate: memeTemplates[platform] || "Trending meme format",
      song: trendingSongs[platform] || "Espresso - Sabrina Carpenter"

    };
  }

  /* Public API */
  return { generate };

})();
