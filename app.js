/* ═══════════════════════════════════════════════════════
   js/app.js
   Main application controller — manages global state,
   wires together UI, GroqAI, CampaignEngine, and TRENDS_DB.
   Exposes a global App object.
═══════════════════════════════════════════════════════ */

const App = (() => {

  /* ════════════════════════════════════════
     STATE
     ════════════════════════════════════════ */
  let brand = {
    name:     "Luna Studio",
    industry: "Fashion",
    tone:     "Premium & Minimal",
    platform: "Instagram",
    audience: "Style-conscious women 22–35"
  };

  let allScoredTrends = [];  // Full scored list (used by filter)
  let selectedTrend   = null;
  let activeFilter    = "all";

  // Auth state — simulated identity token
  let _isAuthenticated = false;

  /* ════════════════════════════════════════
     NAVIGATION
     ════════════════════════════════════════ */
  function openApp() {
    UI.showPage("page-app");
    // Auto-run analysis with defaults so the Trends tab is ready
    if (!allScoredTrends.length) _runAnalysis(true);
  }

  function goHome() {
    UI.showPage("page-landing");
  }

  /* ════════════════════════════════════════
     AUTH — Login / Sign-Up Gateway
     ════════════════════════════════════════ */
  function login() {
    _isAuthenticated = true;
    UI.showPage("page-landing");
  }

  function signUp() {
    _isAuthenticated = true;
    UI.showPage("page-landing");
  }

  function showLogin() {
    UI.switchAuthPanel("login");
  }

  function showSignUp() {
    UI.switchAuthPanel("signup");
  }

  function isAuthenticated() {
    return _isAuthenticated;
  }

  /* ════════════════════════════════════════
     BRAND ANALYSIS
     ════════════════════════════════════════ */
  function analyzeBrand() {
    brand.name     = document.getElementById("brand-name")?.value.trim()    || "My Brand";
    brand.industry = document.getElementById("brand-industry")?.value        || "Fashion";
    brand.tone     = document.getElementById("brand-tone")?.value            || "Premium & Minimal";
    brand.platform = document.getElementById("brand-platform")?.value        || "Instagram";
    brand.audience = document.getElementById("brand-audience")?.value.trim() || "";

    UI.setAnalyzeLoading(true);

    setTimeout(() => {
      _runAnalysis(false);
      UI.setAnalyzeLoading(false);
      UI.switchTab("trends", document.querySelector('[data-tab="trends"]'));
    }, 550);
  }

  function _runAnalysis(silent) {
    const industryTrends = TRENDS_DB.filter(t => 
      t.industries.includes(brand.industry)
    );

    allScoredTrends = industryTrends.map(t => {
      let score = t.relevance;
      if (t.tones.includes(brand.tone)) score = Math.min(100, score + 10);
      if (t.platform === brand.platform) score = Math.min(100, score + 5);
      
      return { ...t, matchScore: Math.round(score) };
    }).sort((a, b) => b.matchScore - a.matchScore);

    activeFilter = "all";
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    const allChip = document.querySelector(".filter-chip");
    if (allChip) allChip.classList.add("active");

    _renderTrends();
    UI.renderBrandSummary(brand);
    UI.setTrendsCount(allScoredTrends.length, brand.name);
  }

  /* ════════════════════════════════════════
     TREND FILTERING & RENDERING
     ════════════════════════════════════════ */
  function filterTrends(filter, btn) {
    activeFilter = filter;
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    if (btn) btn.classList.add("active");
    _renderTrends();
  }

  function _renderTrends() {
    const goodTrends  = allScoredTrends.filter(t => !(t.risk === "High" && t.matchScore < 80));
    const riskyTrends = allScoredTrends.filter(t =>   t.risk === "High" && t.matchScore < 80);

    let display = goodTrends;
    if (activeFilter === "Rising") display = goodTrends.filter(t => t.stage === "Rising");
    if (activeFilter === "Peak")   display = goodTrends.filter(t => t.stage === "Peak");
    if (activeFilter === "Low")    display = goodTrends.filter(t => t.risk === "Low");

    UI.renderTrendCards(display, selectedTrend);
    UI.setTrendsCount(goodTrends.length, brand.name);

    if (activeFilter === "all" && riskyTrends.length) {
      UI.renderRiskCards(riskyTrends, brand.tone);
    } else {
      UI.hideRiskSection();
    }
  }

  /* ════════════════════════════════════════
     TREND SELECTION
     ════════════════════════════════════════ */
  function selectTrend(trend) {
    selectedTrend = trend;
    UI.setStudioTrend(trend);
    _renderTrends(); 
    UI.switchTab("studio", document.querySelector('[data-tab="studio"]'));
  }

  /* ════════════════════════════════════════
     CAMPAIGN GENERATION PIPELINE
     ════════════════════════════════════════ */
  async function generateCampaign() {
    if (!selectedTrend) {
      UI.renderStudioEmpty();
      return;
    }

    const contentType   = document.getElementById("content-type")?.value  || "Viral Hook";
    const platform      = document.getElementById("studio-platform")?.value || "Instagram";
    const toneOverride  = document.getElementById("tone-override")?.value  || "auto";
    const effectiveTone = toneOverride === "auto" ? brand.tone : toneOverride;

    UI.setGenLoading(true);
    UI.showGeneratingShimmer();

    let campaign;
    let isAI = false;

    try {
      // ⚡ ROUTING ARCHITECTURE: AI OR DYNAMIC TEMPLATE POOLS
      if (GroqAI.hasKey()) {
        campaign = await GroqAI.generateCampaign(
          brand,
          selectedTrend,
          contentType,
          platform,
          effectiveTone
        );
        isAI = true;
      } else {
        console.log("Groq API key missing. Gracefully falling back to local CampaignEngine matrices...");
        
        // Pass control to your local structural generator fallback
        campaign = await CampaignEngine.generate(
          brand,
          selectedTrend,
          contentType,
          platform,
          toneOverride
        );
        isAI = false;
      }

      if (!campaign) {
        throw new Error("Engine returned an empty campaign payload.");
      }

      // 🛡️ DEFENSIVE DATA ARCHITECTURE & CAPTION SHORTENER ENFORCEMENT
      campaign.hook    = campaign.hook || "Discover the latest updates.";
      campaign.visual  = campaign.visual || "Clean composition layout framing.";
      
      let baseCaption = campaign.caption || "Elevating your daily lookbook seamlessly.";

      // Enforce the 1–2 lines max constraint across all incoming engine payloads
      baseCaption = baseCaption
        .split("\n")
        .slice(0, 2)
        .join(" ")
        .trim();

      // Enforce strict 120 character ceiling safeguard to eliminate paragraph clutter
      campaign.caption = baseCaption.length > 120
        ? baseCaption.slice(0, 117) + "..."
        : baseCaption;
      
      // Safety conversion: Ensure song object matches UI string interpretation constraints
      if (campaign.song && typeof campaign.song === "object") {
        campaign.song = `${campaign.song.name || "No track found"} — ${campaign.song.artist || "Unknown"}`;
      } else if (!campaign.song) {
        campaign.song = "No track found — Unknown";
      }

      UI.setGenLoading(false);
      UI.renderCampaignOutput(campaign, contentType, platform, brand, selectedTrend, isAI);

      // 📁 BACKGROUND ARCHIVAL PIPELINE
      try {
        let bodyLayoutText = "";
        if (campaign.hook) bodyLayoutText += `HOOK:\n${campaign.hook}\n\n`;
        if (campaign.song) bodyLayoutText += `SUGGESTED AUDIO:\n🎵 ${campaign.song}\n\n`;
        if (campaign.caption) bodyLayoutText += `CAPTION:\n${campaign.caption}\n\n`;
        if (campaign.visual) bodyLayoutText += `VISUAL CONCEPT:\n${campaign.visual}\n\n`;

        if (campaign.hashtags && Array.isArray(campaign.hashtags)) {
          bodyLayoutText += `HASHTAGS:\n${campaign.hashtags.join(" ")}\n\n`;
        } else if (typeof campaign.hashtags === "string") {
          bodyLayoutText += `HASHTAGS:\n${campaign.hashtags}\n\n`;
        }

        if (campaign.cta) bodyLayoutText += `CALL TO ACTION:\n${campaign.cta}\n\n`;
        if (campaign.bestPostingTime) bodyLayoutText += `BEST POSTING TIME:\n📅 ${campaign.bestPostingTime}\n\n`;
        if (campaign.memeTemplate) bodyLayoutText += `MEME TEMPLATE:\n${campaign.memeTemplate}`;

        let archiveCategory = "Campaign";
        if (contentType.toLowerCase().includes("script")) archiveCategory = "Reel Script";
        if (contentType.toLowerCase().includes("post")) archiveCategory = "Marketing Post";

        if (typeof _archiveProjectEntry === "function") {
          _archiveProjectEntry(
            `${brand.name} — ${selectedTrend.name}`,
            archiveCategory,
            bodyLayoutText.trim()
          );
        }
      } catch (archiveErr) {
        console.warn("Background archival intercept paused safely:", archiveErr);
      }

    } catch (err) {
      UI.setGenLoading(false);
      UI.renderOutputError(
        GroqAI.errorMessage ? GroqAI.errorMessage(err) : "Generation breakdown. Please verify settings or network connections."
      );
    }
  }

  function _delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  function init() {
    _runAnalysis(true);

    const urlParams = new URLSearchParams(window.location.search);
    const requestedView = urlParams.get('view');

    if (requestedView === 'login') {
      showLogin();
    } else if (requestedView === 'signup') {
      showSignUp();
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  /* Public API */
  return {
    openApp,
    goHome,
    login,
    signUp,
    showLogin,
    showSignUp,
    isAuthenticated,
    analyzeBrand,
    filterTrends,
    selectTrend,
    generateCampaign
  };

})();
