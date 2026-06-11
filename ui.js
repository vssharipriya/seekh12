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
    const previewCaption = campaign.caption ? campaign.caption.split("\n")[0].split(".")[0] : "";

    // Aesthetic rounded rectangle button token
    const copyButtonHtml = `
      <button class="btn-copy" style="border-radius: 6px; padding: 4px 12px; font-family: inherit; font-size: 11px; font-weight: 500; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; border: 1px solid var(--border, #e2e8f0); background: transparent; transition: all 0.2s ease;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Copy</span>
      </button>`;

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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Hook</div>
              ${copyButtonHtml}
            </div>
            <div class="output-hook txt-target">${escHtml(campaign.hook)}</div>
          </div>

          <div class="output-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Suggested Audio</div>
              ${copyButtonHtml}
            </div>
            <div class="output-audio txt-target" style="font-family: 'SF Pro Mono', 'Courier New', monospace; font-size: 13px; font-weight: 600; color: var(--accent, #3b82f6); display: inline-flex; align-items: center; gap: 6px; letter-spacing: -0.2px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
              ${escHtml(campaign.song || "Trending Track")}
            </div>
          </div>

          <div class="output-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Caption</div>
              ${copyButtonHtml}
            </div>
            <div class="output-caption txt-target">${escHtml(campaign.caption)}</div>
          </div>

          <div class="output-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Visual Concept</div>
              ${copyButtonHtml}
            </div>
            <div class="output-visual txt-target">${escHtml(campaign.visual)}</div>
          </div>

          <div class="output-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Hashtags</div>
              ${copyButtonHtml}
            </div>
            <div class="hashtag-row txt-target">${campaign.hashtags.map(h => `<span class="hashtag">${escHtml(h)}</span>`).join(" ")}</div>
          </div>

          <div class="output-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Call to Action</div>
              ${copyButtonHtml}
            </div>
            <div class="output-cta txt-target">${escHtml(campaign.cta)}</div>
          </div>

          <div class="output-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Best Posting Time</div>
              ${copyButtonHtml}
            </div>
            <div class="output-best-posting-time txt-target">${escHtml(campaign.bestPostingTime)}</div>
          </div>

          <div class="output-block">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="output-block-label" style="margin: 0;">Meme Template</div>
              ${copyButtonHtml}
            </div>
            <div class="output-meme-template txt-target">${escHtml(campaign.memeTemplate)}</div>
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
          <div class="preview-image-text">${escHtml(trend.tags && trend.tags[0] ? trend.tags[0] : "Trend")} Aesthetic</div>
          <div class="preview-image-tag">${escHtml(brand.industry)}</div>
          <div style="position: absolute; bottom: 8px; left: 8px; display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: 20px; font-size: 10px; color: #fff; font-family: monospace;">
            🎵 ${escHtml(campaign.song || "Original Audio")}
          </div>
        </div>
        <div class="preview-body">
          <div class="preview-caption-text">
            <strong>${escHtml(brand.name)}</strong> ${escHtml(previewCaption)}.<br>
            <span style="color:var(--text-light);font-size:12px">${campaign.hashtags ? campaign.hashtags.slice(0,3).join(" ") : ""}</span>
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

  // ==========================================
  // MARKTREND AI — CLIPBOARD COPY MECHANICS
  // ==========================================
  document.addEventListener('click', async (event) => {
    const copyBtn = event.target.closest('.btn-copy');
    if (!copyBtn) return;

    const parentBlock = copyBtn.closest('.output-block');
    const textTarget = parentBlock ? parentBlock.querySelector('.txt-target') : null;

    if (textTarget) {
      // Strips internal SVG/HTML tag artifacts when copying the audio line text structure
      const textToCopy = textTarget.innerText.trim();

      try {
        await navigator.clipboard.writeText(textToCopy);

        const label = copyBtn.querySelector('span');
        if (label) {
          label.textContent = 'Copied!';
          copyBtn.style.borderColor = 'var(--accent, #3b82f6)';
          
          setTimeout(() => {
            label.textContent = 'Copy';
            copyBtn.style.borderColor = '';
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  });

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
