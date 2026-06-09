/* ═══════════════════════════════════════════════════════
   js/ui.js
   All DOM rendering, animations, and UI helper functions.
   Exposes a global UI object consumed by app.js.
═══════════════════════════════════════════════════════ */

const UI = (() => {

  /* ── Page / Tab navigation ── */
  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo(0, 0);
  }

  function switchTab(name, btn) {
    document.querySelectorAll(".app-section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".app-tab").forEach(b => b.classList.remove("active"));
    document.getElementById("tab-" + name).classList.add("active");
    if (btn) btn.classList.add("active");
    window.scrollTo(0, 0);
  }

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  /* ── API Key UI ── */
  function toggleApiKeyVisibility() {
    const input = document.getElementById("groq-api-key");
    const btn   = document.getElementById("toggle-key-btn");
    if (!input) return;
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "Hide";
    } else {
      input.type = "password";
      btn.textContent = "Show";
    }
  }

  function setApiKeyStatus(msg, type = "info") {
    const el = document.getElementById("api-key-status");
    if (!el) return;
    el.textContent = msg;
    el.className = "api-key-status " + type;
  }

  function prefillApiKeyInput(key) {
    const input = document.getElementById("groq-api-key");
    if (input && key) input.value = key;
  }

  /* ── Analyze button loading state ── */
  function setAnalyzeLoading(on) {
    const btn = document.getElementById("analyze-btn");
    if (!btn) return;
    btn.classList.toggle("loading", on);
    btn.disabled = on;
  }

  /* ── Brand summary bar ── */
  function renderBrandSummary(brand) {
    const bar = document.getElementById("brand-summary-bar");
    if (!bar) return;
    bar.style.display = "flex";
    bar.innerHTML = `
      <span class="brand-chip">${escHtml(brand.name)}</span>
      <span class="brand-chip">${escHtml(brand.industry)}</span>
      <span class="brand-chip">${escHtml(brand.tone)}</span>
      <span class="brand-chip">${escHtml(brand.platform)}</span>
      <button class="btn-edit" onclick="UI.switchTab('brand', document.querySelector('[data-tab=brand]'))">Edit Brand</button>`;
  }

  /* ── Trends count label ── */
  function setTrendsCount(n, brandName) {
    const el = document.getElementById("trends-count");
    if (el) el.textContent = `${n} trend${n !== 1 ? "s" : ""} matched for ${escHtml(brandName)}`;
    const sub = document.getElementById("trends-sub");
    if (sub) sub.textContent = `Personalized trend intelligence for ${escHtml(brandName)}`;
  }

  /* ── Render a single trend card HTML ── */
  function trendCardHTML(t, isSelected) {
    const badgeClass  = t.matchScore >= 95 ? "top" : t.matchScore >= 85 ? "high" : "";
    const stageClass  = "stage-" + t.stage.toLowerCase();
    const riskClass   = "risk-" + t.risk.toLowerCase();

    return `
      <div class="trend-card ${isSelected ? "selected" : ""}" id="tcard-${slugify(t.name)}">
        <div class="trend-top">
          <div class="trend-name">${escHtml(t.name)}</div>
          <div class="match-badge ${badgeClass}">${t.matchScore}% match</div>
        </div>
        <div class="trend-tags">
          ${t.tags.map(tag => `<span class="tag">${escHtml(tag)}</span>`).join("")}
          <span class="tag ${stageClass}">${t.stage}</span>
        </div>
        <div class="trend-progress">
          <div class="progress-labels"><span>Relevance</span><span>${t.relevance}%</span></div>
          <div class="progress-track">
            <div class="progress-fill" data-w="${t.relevance}"></div>
          </div>
        </div>
        <div class="trend-insight">"${escHtml(t.insight)}"</div>
        <div class="trend-footer">
          <div class="trend-meta">
            <span>📱 ${escHtml(t.platform)}</span>
            <span><span class="risk-dot ${riskClass}"></span>${t.risk} Risk</span>
          </div>
          <button class="btn-select-trend ${isSelected ? "active" : ""}"
                  onclick="App.selectTrend(${JSON.stringify(t).replace(/"/g, "&quot;")})">
            ${isSelected ? "✓ Selected" : "Use Trend →"}
          </button>
        </div>
      </div>`;
  }

  /* ── Render all trend cards into grid ── */
  function renderTrendCards(trends, selectedTrend) {
    const grid = document.getElementById("trends-grid");
    if (!grid) return;

    if (!trends.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-title">No trends match this filter</div>
          <div class="empty-desc">Try a different filter or update your brand profile.</div>
        </div>`;
      return;
    }

    grid.innerHTML = trends.map(t => trendCardHTML(t, selectedTrend && selectedTrend.name === t.name)).join("");

    // Animate progress bars after paint
    requestAnimationFrame(() => {
      document.querySelectorAll(".progress-fill[data-w]").forEach(el => {
        el.style.width = el.dataset.w + "%";
      });
    });
  }

  /* ── Risk cards ── */
  function renderRiskCards(riskyTrends, brandTone) {
    const section = document.getElementById("risk-section");
    const cards   = document.getElementById("risk-cards");
    if (!section || !cards) return;

    if (!riskyTrends.length) {
      section.style.display = "none";
      return;
    }

    section.style.display = "block";
    cards.innerHTML = riskyTrends.map(t => `
      <div class="risk-item">
        <span class="risk-name">${escHtml(t.name)}</span> — ${escHtml(t.platform)} · ${t.stage} stage.
        Audience mismatch for <em>${escHtml(brandTone)}</em> tone. Risk: ${t.risk}.
      </div>`).join("");
  }

  function hideRiskSection() {
    const section = document.getElementById("risk-section");
    if (section) section.style.display = "none";
  }

  /* ── Studio: selected trend label ── */
  function setStudioTrend(trend) {
    const el = document.getElementById("studio-trend-display");
    if (el) el.textContent = trend ? trend.name : "No trend selected";

    // Auto-set platform dropdown
    if (trend) {
      const plat = document.getElementById("studio-platform");
      if (plat) {
        if (trend.platform === "TikTok") plat.value = "TikTok";
        else if (trend.platform === "X (Twitter)") plat.value = "X (Twitter)";
        else if (trend.platform === "YouTube") plat.value = "YouTube";
        else if (trend.platform === "Facebook") plat.value = "Facebook";
        else plat.value = "Instagram";
      }
    }
  }

  /* ── Generate button loading state ── */
  function setGenLoading(on, label = "✦ Generate Campaign") {
    const btn = document.getElementById("gen-btn");
    if (!btn) return;
    btn.classList.toggle("loading", on);
    btn.disabled = on;
    if (!on) btn.textContent = label;
  }

  /* ── Shimmer skeleton while generating ── */
  function showGeneratingShimmer() {
    document.getElementById("output-area").innerHTML = `
      <div class="output-card">
        <div class="output-body">
          <div class="shimmer-box" style="height:24px;width:55%;margin-bottom:1.5rem"></div>
          <div class="shimmer-box" style="height:14px;width:100%;margin-bottom:8px"></div>
          <div class="shimmer-box" style="height:14px;width:88%;margin-bottom:8px"></div>
          <div class="shimmer-box" style="height:14px;width:76%;margin-bottom:1.5rem"></div>
          <div class="shimmer-box" style="height:58px;width:100%;margin-bottom:1.25rem"></div>
          <div class="shimmer-box" style="height:14px;width:60%"></div>
        </div>
      </div>`;
  }

  /* ── Render campaign output ── */
  function renderCampaignOutput(campaign, contentType, platform, brand, trend, isAI) {
    const initials = brand.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const previewCaption = campaign.caption.split("\n")[0].split(".")[0];

    document.getElementById("output-area").innerHTML = `

      <div class="output-card">
        <div class="output-header">
          <div class="output-header-title">
            ${isAI ? "🤖 Groq AI" : "📋 Template"} · ${escHtml(contentType)} · ${escHtml(trend.name)}
          </div>
          <div class="output-platform-badge">📱 ${escHtml(platform)}</div>
        </div>
        <div class="output-body">
          <div class="output-block">
            <div class="output-block-label">Hook</div>
            <div class="output-hook">${escHtml(campaign.hook)}</div>
          </div>
          <div class="output-block">
            <div class="output-block-label">Caption</div>
            <div class="output-caption">${escHtml(campaign.caption)}</div>
          </div>
          <div class="output-block">
            <div class="output-block-label">Visual Concept</div>
            <div class="output-visual">${escHtml(campaign.visual)}</div>
          </div>
          <div class="output-block">
            <div class="output-block-label">Hashtags</div>
            <div class="hashtag-row">
              ${campaign.hashtags.map(h => `<span class="hashtag">${escHtml(h)}</span>`).join("")}
            </div>
          </div>
          <div class="output-block">
            <div class="output-block-label">Call to Action</div>
            <div class="output-cta">${escHtml(campaign.cta)}</div>
          </div>
          <div class="output-block">
            <div class="output-block-label">Best Posting Time</div>
            <div class="output-best-posting-time">${escHtml(campaign.bestPostingTime)}</div>
          </div>
          <div class="output-block">
            <div class="output-block-label">Meme Template</div>
            <div class="output-meme-template">${escHtml(campaign.memeTemplate)}</div>
          </div>
        </div>
      </div>

      <div class="preview-card">
        <div class="preview-top">
          <div class="preview-avatar">${escHtml(initials)}</div>
          <div>
            <div class="preview-user-name">${escHtml(brand.name)}</div>
            <div class="preview-user-handle">@${escHtml(brand.name.toLowerCase().replace(/\s/g,""))} · ${escHtml(platform)}</div>
          </div>
        </div>
        <div class="preview-image-area">
          <div class="preview-image-text">${escHtml(trend.tags[0])} Aesthetic</div>
          <div class="preview-image-tag">${escHtml(brand.industry)}</div>
        </div>
        <div class="preview-body">
          <div class="preview-caption-text">
            <strong>${escHtml(brand.name)}</strong> ${escHtml(previewCaption)}.<br>
            <span style="color:var(--text-light);font-size:12px">${campaign.hashtags.slice(0,3).join(" ")}</span>
          </div>
          <div class="preview-actions">
            <span class="preview-action">♡ 2.4k</span>
            <span class="preview-action">💬 187</span>
            <span class="preview-action">↗ 304</span>
            <span class="preview-action" style="margin-left:auto">🔖</span>
          </div>
        </div>
      </div>`;
  }

  /* ── Render error in output area ── */
  function renderOutputError(msg) {
    document.getElementById("output-area").innerHTML = `
      <div class="error-box">
        <strong>⚠️ Generation failed</strong><br>${escHtml(msg)}
      </div>`;
  }

  /* ── Empty state for studio ── */
  function renderStudioEmpty() {
    document.getElementById("output-area").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <div class="empty-title">No trend selected</div>
        <div class="empty-desc">Go to the Trends tab and click "Use Trend →" to select one, then come back here.</div>
      </div>`;
  }

  /* ── Utility: escape HTML ── */
  function escHtml(str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ── Utility: slugify for IDs ── */
  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  return {
    showPage,
    switchTab,
    scrollTo,
    toggleApiKeyVisibility,
    setApiKeyStatus,
    prefillApiKeyInput,
    setAnalyzeLoading,
    renderBrandSummary,
    setTrendsCount,
    renderTrendCards,
    renderRiskCards,
    hideRiskSection,
    setStudioTrend,
    setGenLoading,
    showGeneratingShimmer,
    renderCampaignOutput,
    renderOutputError,
    renderStudioEmpty
  };

})();
