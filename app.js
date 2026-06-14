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

  /**
   * Called by the Login button on the page-auth panel.
   * Simulates credential validation, sets the auth token,
   * and forwards the user to the main landing dashboard.
   */
  function login() {
    _isAuthenticated = true;
    UI.showPage("page-landing");
  }

  /**
   * Called by the Sign-Up button on the page-auth panel.
   * Simulates new identity registration, sets the auth token,
   * and forwards the user directly to the main landing dashboard.
   */
  function signUp() {
    _isAuthenticated = true;
    UI.showPage("page-landing");
  }

  /**
   * Switches the auth panel to the Login state (State B).
   * Delegates visual transition (pill shift + form crossfade) to UI.
   */
  function showLogin() {
    UI.switchAuthPanel("login");
  }

  /**
   * Switches the auth panel to the Sign-Up state (State A).
   * Delegates visual transition (pill shift + form crossfade) to UI.
   */
  function showSignUp() {
    UI.switchAuthPanel("signup");
  }

  /**
   * Returns whether a simulated auth token is currently set.
   * Can be used by other modules to guard access.
   */
  function isAuthenticated() {
    return _isAuthenticated;
  }

  /* ════════════════════════════════════════
     BRAND ANALYSIS
  ════════════════════════════════════════ */
  function analyzeBrand() {
    // Read form values
    brand.name     = document.getElementById("brand-name")?.value.trim()    || "My Brand";
    brand.industry = document.getElementById("brand-industry")?.value        || "Fashion";
    brand.tone     = document.getElementById("brand-tone")?.value            || "Premium & Minimal";
    brand.platform = document.getElementById("brand-platform")?.value        || "Instagram";
    brand.audience = document.getElementById("brand-audience")?.value.trim() || "";

    UI.setAnalyzeLoading(true);

    // Simulate brief analysis delay for UX feel
    setTimeout(() => {
      _runAnalysis(false);
      UI.setAnalyzeLoading(false);
      UI.switchTab("trends", document.querySelector('[data-tab="trends"]'));
    }, 550);
  }

  function _runAnalysis(silent) {
    // 1. STRICT FILTER: Only keep trends that belong to the selected industry
    const industryTrends = TRENDS_DB.filter(t => 
      t.industries.includes(brand.industry)
    );

    // 2. SCORE: Only score the trends that passed the filter
    allScoredTrends = industryTrends.map(t => {
      let score = t.relevance;
      // Bonus if tone matches
      if (t.tones.includes(brand.tone)) score = Math.min(100, score + 10);
      // Bonus if platform matches
      if (t.platform === brand.platform) score = Math.min(100, score + 5);
      
      return { ...t, matchScore: Math.round(score) };
    }).sort((a, b) => b.matchScore - a.matchScore);

    // 3. RESET UI
    activeFilter = "all";
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    const allChip = document.querySelector(".filter-chip");
    if (allChip) allChip.classList.add("active");

    _renderTrends();
    UI.renderBrandSummary(brand);
    
    // Update count based on the new filtered list
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

  _renderTrends = function() {
    // Separate risky trends
    const goodTrends  = allScoredTrends.filter(t => !(t.risk === "High" && t.matchScore < 80));
    const riskyTrends = allScoredTrends.filter(t =>   t.risk === "High" && t.matchScore < 80);

    // Apply active filter
    let display = goodTrends;
    if (activeFilter === "Rising") display = goodTrends.filter(t => t.stage === "Rising");
    if (activeFilter === "Peak")   display = goodTrends.filter(t => t.stage === "Peak");
    if (activeFilter === "Low")    display = goodTrends.filter(t => t.risk === "Low");

    UI.renderTrendCards(display, selectedTrend);
    UI.setTrendsCount(goodTrends.length, brand.name);

    // Show risk section only on "All" filter
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
    _renderTrends(); // Refresh card UI to show selected state
    UI.switchTab("studio", document.querySelector('[data-tab="studio"]'));
  }

  /* ════════════════════════════════════════
     CAMPAIGN GENERATION
  ════════════════════════════════════════ */
  async function generateCampaign() {
    if (!selectedTrend) {
      UI.renderStudioEmpty();
      return;
    }

    const contentType   = document.getElementById("content-type")?.value  || "Viral Hook";
    const platform      = document.getElementById("studio-platform")?.value || "Instagram";
    const toneOverride  = document.getElementById("tone-override")?.value  || "auto";
    const useGroq       = document.getElementById("use-groq")?.checked;
    const effectiveTone = toneOverride === "auto" ? brand.tone : toneOverride;

    UI.setGenLoading(true);
    UI.showGeneratingShimmer();

    let campaign;
    let isAI = false;

    try {
      if (useGroq) {
        // ── Groq AI Engine Pipeline ──
        if (!GroqAI.hasKey()) {
          UI.setGenLoading(false);
          UI.renderOutputError(
            "No Groq API key found. Please enter and save your key in the Brand Setup panel configuration tab."
          );
          return;
        }
        campaign = await GroqAI.generateCampaign(brand, selectedTrend, contentType, platform, effectiveTone);
        isAI = true;
      } else {
        // ── Local Template Engine Pipeline ──
        await _delay(600);
        campaign = CampaignEngine.generate(brand, selectedTrend, contentType, platform, toneOverride);
        isAI = false;
      }

      if (!campaign) {
        throw new Error("Engine returned an empty campaign payload.");
      }

      // Fallback structural safety values to avoid crashing UI render passes
      campaign.hook = campaign.hook || "Discover the latest updates.";
      campaign.caption = campaign.caption || "Elevating your daily lookbook seamlessly.";
      campaign.visual = campaign.visual || "Clean composition layout framing.";

      // Send to UI for final DOM paint
      UI.setGenLoading(false);
      UI.renderCampaignOutput(campaign, contentType, platform, brand, selectedTrend, isAI);

      // ── Archive Persistence Hook Integration ──
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

        // Internal archival logger method trigger
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

    } catch (globalErr) {
      console.error("Critical generator failure intercepted:", globalErr);
      UI.setGenLoading(false);
      UI.renderOutputError(GroqAI.errorMessage ? GroqAI.errorMessage(globalErr) : "Generation breakdown. Please verify key rules or check network connections.");
    }
  }

  /* ── Utility: simple delay ── */
  function _delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  /* ════════════════════════════════════════
     INIT
  ════════════════════════════════════════ */
  function init() {
    // Pre-score trends silently so app is instant when opened
    _runAnalysis(true);
  }

  // Auto-init on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", init);

  /* Public API */
  return {
    // Navigation
    openApp,
    goHome,

    // Auth gateway
    login,
    signUp,
    showLogin,
    showSignUp,
    isAuthenticated,

    // Core features
    analyzeBrand,
    filterTrends,
    selectTrend,
    generateCampaign
  };

})();
