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
     API KEY MANAGEMENT
  ════════════════════════════════════════ */
  function saveApiKey() {
    const input = document.getElementById("groq-api-key");
    if (!input) return;
    const result = GroqAI.saveKey(input.value);
    UI.setApiKeyStatus(result.ok ? "✓ " + result.msg : "✗ " + result.msg, result.ok ? "success" : "error");
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

  function _renderTrends() {
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

    if (useGroq) {
      // ── Groq AI path ──
      if (!GroqAI.hasKey()) {
        UI.setGenLoading(false);
        UI.renderOutputError(
          "No Groq API key found. Please go to the Brand Setup tab, enter your key (gsk_…) and click Save."
        );
        return;
      }
      try {
        campaign = await GroqAI.generateCampaign(brand, selectedTrend, contentType, platform, effectiveTone);
        isAI = true;
      } catch (err) {
        UI.setGenLoading(false);
        UI.renderOutputError(GroqAI.errorMessage(err));
        return;
      }
    } else {
      // ── Local template path ──
      // Small artificial delay so shimmer is visible
      await _delay(600);
      campaign = CampaignEngine.generate(brand, selectedTrend, contentType, platform, toneOverride);
      isAI = false;
    }

    UI.setGenLoading(false);
    UI.renderCampaignOutput(campaign, contentType, platform, brand, selectedTrend, isAI);
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

    // Restore API key display if available
    const saved = sessionStorage.getItem("trendidea_groq_key");
    if (saved) {
      UI.prefillApiKeyInput(saved);
      UI.setApiKeyStatus("✓ Key loaded from this session.", "success");
    }
  }

  // Auto-init on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", init);

  /* Public API */
  return {
    openApp,
    goHome,
    saveApiKey,
    analyzeBrand,
    filterTrends,
    selectTrend,
    generateCampaign
  };

})();
