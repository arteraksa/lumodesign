(() => {
  const PAGE_BASE = "/raksadesign";
  const CASES_PATH = `${PAGE_BASE}/cases/`;
  const BASIC_COLUMNS = "id,slug,title,tags,description,cover,images,updated_at";
  const EXTENDED_COLUMNS = `${BASIC_COLUMNS},excerpt,published,featured_on_home,home_order,content_blocks,created_at`;
  const FULL_COLUMNS = `${EXTENDED_COLUMNS},external_url`;
  const TAGS = ["Todos", "UI/UX Design", "Desenvolvimento", "Branding", "Editorial"];

  const config = window.RAKSA_SUPABASE || {};
  const hasConfig = Boolean(config.url && config.anonKey);
  let metricsStarted = false;
  let caseFiltersBound = false;
  let activeCaseFilter = "Todos";
  let contentGuardObserver = null;
  let contentGuardTimer = 0;
  let partialFilterControls = [];

  function sitePath(pathname = window.location.pathname) {
    if (pathname === PAGE_BASE) return "/";
    if (pathname.startsWith(`${PAGE_BASE}/`)) return pathname.slice(PAGE_BASE.length);
    return pathname;
  }

  function isCasesRoute() {
    return sitePath().replace(/\/+$/, "") === "/cases";
  }

  function isHomeRoute() {
    return sitePath().replace(/\/+$/, "") === "";
  }

  function caseSlugFromPath() {
    const match = sitePath().match(/^\/cases\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]).normalize("NFC") : "";
  }

  function routeType() {
    if (isHomeRoute()) return "home";
    if (isCasesRoute()) return "cases_index";
    if (caseSlugFromPath()) return "case_detail";
    return "page";
  }

  function internalPathFromUrl(url) {
    if (url.origin !== window.location.origin) return "";
    return sitePath(url.pathname);
  }

  function caseSlugFromUrl(url) {
    const match = internalPathFromUrl(url).match(/^\/cases\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]).normalize("NFC") : "";
  }

  function shortText(value = "", maxLength = 220) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanMetadata(metadata = {}) {
    return Object.fromEntries(
      Object.entries(metadata)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => {
          if (typeof value === "string") return [key, shortText(value, 500)];
          if (typeof value === "number" || typeof value === "boolean" || value === null) return [key, value];
          return [key, value];
        }),
    );
  }

  function referrerMetadata() {
    if (!document.referrer) return {};

    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin) return { referrer_path: sitePath(referrer.pathname) };
      return { referrer_host: referrer.hostname };
    } catch {
      return {};
    }
  }

  function normalizeAssetUrl(value = "") {
    if (value.startsWith("/framerusercontent.com/") || value.startsWith("/vendor/")) return `${PAGE_BASE}${value}`;
    return value;
  }

  function caseUrl(slug) {
    return `${PAGE_BASE}/cases/${encodeURIComponent(String(slug || "").normalize("NFC"))}/`;
  }

  async function rest(table, params) {
    const url = new URL(`/rest/v1/${table}`, config.url);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const response = await fetch(url, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || response.statusText);
    }

    return response.json();
  }

  function trackMetric(eventName, metadata = {}) {
    if (!hasConfig) return;

    const payload = {
      event_name: shortText(eventName, 120),
      path: sitePath(),
      metadata: cleanMetadata({
        route_type: routeType(),
        title: document.title,
        ...metadata,
      }),
    };

    fetch(new URL("/rest/v1/metrics_events", config.url), {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.warn("[RAKSA] Metrics event unavailable:", error);
    });
  }

  function isWhatsappUrl(url) {
    const href = url.href.toLowerCase();
    return url.protocol === "whatsapp:" || href.includes("wa.me/") || href.includes("api.whatsapp.com") || href.includes("web.whatsapp.com");
  }

  function trackPageView() {
    trackMetric("page_view", {
      case_slug: caseSlugFromPath(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      ...referrerMetadata(),
    });
  }

  function trackPublicClick(event) {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor) return;

    let url;
    try {
      url = new URL(anchor.getAttribute("href"), window.location.href);
    } catch {
      return;
    }

    if (isWhatsappUrl(url)) {
      trackMetric("whatsapp_click", {
        label: shortText(anchor.textContent),
        target_host: url.hostname,
      });
      return;
    }

    const caseSlug = caseSlugFromUrl(url);
    if (caseSlug) {
      trackMetric("case_click", {
        case_slug: caseSlug,
        label: shortText(anchor.getAttribute("aria-label") || anchor.textContent),
        target_path: internalPathFromUrl(url),
      });
    }
  }

  function trackPublicSubmit(event) {
    const form = event.target.closest?.("form");
    if (!form) return;

    trackMetric("form_submit", {
      form_id: form.id,
      form_name: form.getAttribute("name"),
      action: form.getAttribute("action") || window.location.pathname,
      method: (form.getAttribute("method") || "get").toLowerCase(),
    });
  }

  function startMetrics() {
    if (!hasConfig || metricsStarted) return;
    metricsStarted = true;

    trackPageView();
    document.addEventListener("click", trackPublicClick, true);
    document.addEventListener("submit", trackPublicSubmit, true);
  }

  async function loadCases() {
    try {
      return await rest("cases", {
        select: FULL_COLUMNS,
        published: "eq.true",
        order: "home_order.asc,title.asc",
      });
    } catch (error) {
      if (!/column|schema cache|does not exist/i.test(error.message || "")) throw error;
      try {
        return await rest("cases", {
          select: EXTENDED_COLUMNS,
          published: "eq.true",
          order: "home_order.asc,title.asc",
        });
      } catch (fallbackError) {
        if (!/column|schema cache|does not exist/i.test(fallbackError.message || "")) throw fallbackError;
        return rest("cases", {
          select: BASIC_COLUMNS,
          order: "title.asc",
        });
      }
    }
  }

  async function loadLocalCases() {
    const response = await fetch(`${PAGE_BASE}/admin/data/cases.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(response.statusText);
    const rows = await response.json();
    return rows.map((item) => ({
      ...item,
      external_url: item.external_url ?? item.externalUrl ?? "",
      featured_on_home: item.featured_on_home ?? item.featuredOnHome ?? false,
      home_order: item.home_order ?? item.homeOrder ?? 999,
      published: item.published ?? true,
      updated_at: item.updated_at ?? item.updatedAt ?? "",
    }));
  }

  function normalizedCase(item) {
    return {
      ...item,
      id: String(item.id || "").normalize("NFC"),
      slug: String(item.slug || "").normalize("NFC"),
      cover: normalizeAssetUrl(item.cover || ""),
      images: (item.images || []).map(normalizeAssetUrl),
      tags: item.tags || [],
      excerpt: item.excerpt || item.description || "",
      featured_on_home: item.featured_on_home ?? false,
      home_order: item.home_order ?? 999,
      external_url: item.external_url || "",
    };
  }

  function normalizeSlug(value = "") {
    let slug = String(value || "");
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // Keep the original value if Framer gives us an already-partial slug.
    }

    return slug.normalize("NFC").replace(/^\/+|\/+$/g, "");
  }

  function caseBySlug(cases) {
    const map = new Map();
    cases.forEach((item) => {
      if (item.slug) map.set(normalizeSlug(item.slug), item);
    });
    return map;
  }

  function caseSlugFromAnchor(anchor) {
    let url;
    try {
      url = new URL(anchor.getAttribute("href") || "", window.location.href);
    } catch {
      return "";
    }

    if (url.origin !== window.location.origin) return "";

    const nestedMatch = sitePath(url.pathname).match(/^\/cases\/cases\/([^/]+)\/?$/);
    if (nestedMatch) return normalizeSlug(nestedMatch[1]);

    const match = sitePath(url.pathname).match(/^\/cases\/([^/]+)\/?$/);
    if (!match || match[1] === "cases") return "";
    return normalizeSlug(match[1]);
  }

  function isInsideSiteChrome(element) {
    if (element.closest?.("[data-raksa-case-filters='true']")) return false;

    for (let node = element; node && node !== document.body; node = node.parentElement) {
      const name = String(node.getAttribute?.("data-framer-name") || "").toLowerCase();
      if (node.matches?.("header, footer, nav")) return true;
      if (name === "header" || name === "footer" || name === "menu") return true;
      if (name.includes("header") || name.includes("footer")) return true;
    }
    return false;
  }

  function isCaseCardAnchor(anchor) {
    const main = document.querySelector("#main");
    if (main && !main.contains(anchor)) return false;
    if (!caseSlugFromAnchor(anchor)) return false;
    if (isInsideSiteChrome(anchor)) return false;
    return Boolean(anchor.querySelector("img"));
  }

  function caseCardAnchors() {
    const root = document.querySelector("#main") || document;
    return Array.from(root.querySelectorAll("a[href]")).filter(isCaseCardAnchor);
  }

  function groupedCards(cards) {
    const groups = [];
    const seen = new Set();
    cards.forEach((card) => {
      const parent = card.parentElement;
      if (!parent || seen.has(parent)) return;
      seen.add(parent);
      groups.push(cards.filter((item) => item.parentElement === parent));
    });
    return groups;
  }

  function tagsFor(item) {
    return Array.isArray(item?.tags) ? item.tags.map((tag) => String(tag || "").trim()).filter(Boolean) : [];
  }

  function annotateCaseCard(anchor, item, slug = item?.slug || caseSlugFromAnchor(anchor)) {
    if (!slug) return;
    anchor.dataset.raksaCaseCard = "true";
    anchor.dataset.raksaCaseFilterable = "true";
    delete anchor.dataset.raksaCaseHomeExcluded;
    anchor.dataset.raksaCaseSlug = slug;
    anchor.dataset.raksaCaseTags = tagsFor(item).join("|");
    anchor.href = caseUrl(slug);
    if (item?.title) anchor.setAttribute("aria-label", item.title);
    if (item) {
      updateCardCover(anchor, item);
      if (anchor.dataset.raksaDynamicCard === "true") {
        updateDynamicCardTitle(anchor, item);
        ensureDynamicCardOverlay(anchor, item);
      }
    }
  }

  function updateDynamicCardTitle(anchor, item) {
    if (!item?.title) return;
    const textNodes = Array.from(anchor.querySelectorAll("p, h1, h2, h3, h4, h5, h6"))
      .filter((node) => {
        const text = shortText(node.textContent, 90);
        return text && !TAGS.includes(text) && !node.querySelector("img");
      })
      .sort((a, b) => shortText(b.textContent, 90).length - shortText(a.textContent, 90).length);

    if (textNodes[0]) textNodes[0].textContent = item.title;
  }

  function ensureDynamicCardOverlay(anchor, item) {
    const existing = anchor.querySelector(":scope > .raksa-dynamic-card-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("span");
    overlay.className = "raksa-dynamic-card-overlay";
    overlay.innerHTML = `
      <strong>${escapeHtml(item.title || item.slug)}</strong>
      <span>${escapeHtml(tagsFor(item).join(" / ") || "Case")}</span>
    `;
    anchor.appendChild(overlay);
  }

  function ensureCaseIndexCards(cases) {
    const cards = caseCardAnchors();
    if (!cards.length) return cards;

    const existingSlugs = new Set(cards.map(caseSlugFromAnchor).filter(Boolean));
    const missing = cases.filter((item) => item.slug && !existingSlugs.has(normalizeSlug(item.slug)));
    if (!missing.length) return cards;

    groupedCards(cards).forEach((group) => {
      const parent = group[0]?.parentElement;
      const template = group[group.length - 1];
      if (!parent || !template) return;

      missing.forEach((item) => {
        const clone = template.cloneNode(true);
        clone.dataset.raksaDynamicCard = "true";
        annotateCaseCard(clone, item, item.slug);
        parent.appendChild(clone);
      });
    });

    return caseCardAnchors();
  }

  function annotateCaseCards(cases) {
    const map = caseBySlug(cases);
    const cards = ensureCaseIndexCards(cases);

    cards.forEach((anchor) => {
      const slug = caseSlugFromAnchor(anchor);
      const item = map.get(slug);
      annotateCaseCard(anchor, item, slug);
    });

    return cards;
  }

  function injectEnhancementStyle() {
    if (document.querySelector("[data-raksa-public-content-style]")) return;
    const style = document.createElement("style");
    style.dataset.raksaPublicContentStyle = "true";
    style.textContent = `
      .raksa-case-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        grid-column: 1 / -1;
        margin: 0 0 20px;
        position: relative;
        width: 100%;
        z-index: 2;
      }
      .raksa-case-filter {
        appearance: none;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.72);
        cursor: pointer;
        font: inherit;
        font-size: 14px;
        line-height: 1;
        min-height: 38px;
        padding: 0 16px;
        transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
      }
      .raksa-case-filter.is-active {
        background: rgba(139, 81, 255, 0.18);
        border-color: rgba(139, 81, 255, 0.62);
        color: #fff;
      }
      #main a[data-raksa-case-card][hidden] { display: none !important; }
      #main a[data-raksa-dynamic-card] {
        filter: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
      #main a[data-raksa-dynamic-card] > :not(.raksa-dynamic-card-overlay),
      #main a[data-raksa-dynamic-card] > :not(.raksa-dynamic-card-overlay) * {
        filter: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
      #main a[data-raksa-dynamic-card] {
        isolation: isolate;
        overflow: hidden;
        position: relative;
      }
      #main a[data-raksa-dynamic-card]::after {
        background: linear-gradient(180deg, rgba(11, 3, 18, 0), rgba(11, 3, 18, 0.9));
        content: "";
        inset: 0;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        transition: opacity 180ms ease;
        z-index: 6;
      }
      #main a[data-raksa-dynamic-card]:hover::after,
      #main a[data-raksa-dynamic-card]:focus-visible::after {
        opacity: 1;
      }
      .raksa-dynamic-card-overlay {
        bottom: 18px;
        color: #fff;
        display: grid;
        gap: 6px;
        left: 18px;
        opacity: 0 !important;
        pointer-events: none;
        position: absolute;
        right: 18px;
        transform: translateY(8px) !important;
        transition: opacity 180ms ease, transform 180ms ease;
        z-index: 7;
      }
      #main a[data-raksa-dynamic-card]:hover .raksa-dynamic-card-overlay,
      #main a[data-raksa-dynamic-card]:focus-visible .raksa-dynamic-card-overlay {
        opacity: 1 !important;
        transform: none !important;
      }
      #main a[data-raksa-dynamic-card]:hover img,
      #main a[data-raksa-dynamic-card]:focus-visible img {
        transform: scale(1.035) !important;
      }
      .raksa-dynamic-card-overlay strong {
        color: #fff;
        font-size: clamp(18px, 2.3vw, 30px);
        line-height: 1.05;
      }
      .raksa-dynamic-card-overlay span {
        color: rgba(255, 255, 255, 0.72);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .raksa-dynamic-case {
        background: #0b0312;
        color: #fff;
        display: block;
        min-height: 100vh;
        padding: 42px clamp(18px, 7vw, 120px) 80px;
      }
      .raksa-dynamic-case__nav {
        align-items: center;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      .raksa-dynamic-case__nav a {
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 999px;
        color: #fff;
        padding: 14px 20px;
        text-decoration: none;
      }
      .raksa-dynamic-case__hero {
        display: grid;
        gap: 24px;
        max-width: 980px;
        position: sticky;
        top: 42px;
      }
      .raksa-dynamic-case__body {
        display: grid;
        gap: clamp(28px, 4vw, 64px);
        grid-template-columns: minmax(260px, 390px) minmax(0, 1fr);
        margin-top: 56px;
      }
      .raksa-dynamic-case__tags {
        color: #8b51ff;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .raksa-dynamic-case h1 {
        font-size: clamp(48px, 7vw, 104px);
        letter-spacing: 0;
        line-height: 0.96;
      }
      .raksa-dynamic-case__copy {
        color: rgba(255, 255, 255, 0.78);
        font-size: clamp(18px, 2vw, 24px);
        line-height: 1.45;
        max-width: 900px;
      }
      .raksa-dynamic-case__media {
        display: grid;
        gap: 24px;
      }
      .raksa-dynamic-case__media img {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        display: block;
        height: auto;
        width: 100%;
      }
      @media (max-width: 720px) {
        .raksa-case-filters { gap: 8px; }
        .raksa-case-filter {
          font-size: 13px;
          min-height: 36px;
          padding: 0 12px;
        }
        .raksa-dynamic-case { gap: 32px; padding: 28px 16px 56px; }
        .raksa-dynamic-case__nav { align-items: flex-start; flex-direction: column; }
        .raksa-dynamic-case__body { grid-template-columns: 1fr; margin-top: 36px; }
        .raksa-dynamic-case__hero { position: static; }
        .raksa-dynamic-case__media img { border-radius: 12px; }
      }
    `;
    document.head.appendChild(style);
  }

  function coverSrcSet(cover) {
    if (!cover) return "";
    if (cover.includes("width=788") && cover.includes("height=434")) {
      return `${cover.replace("?", "?scale-down-to=512&")} 512w,${cover} 788w`;
    }
    return cover;
  }

  function updateCardCover(anchor, item) {
    const images = Array.from(anchor.querySelectorAll("img"));
    if (!images.length || !item.cover) return;

    const srcset = coverSrcSet(item.cover);
    images.forEach((image) => {
      if (image.getAttribute("src") !== item.cover) image.setAttribute("src", item.cover);
      if (image.getAttribute("srcset") !== srcset) image.setAttribute("srcset", srcset);
      if ((item.title || image.alt || "") !== image.alt) image.alt = item.title || image.alt || "";
    });
  }

  function applyHomeCases(cases) {
    const featured = cases
      .filter((item) => item.featured_on_home)
      .sort((a, b) => Number(a.home_order ?? 999) - Number(b.home_order ?? 999));
    const selected = (featured.length ? featured : cases).slice(0, 9);
    const cards = caseCardAnchors();

    groupedCards(cards).forEach((group) => {
      group.forEach((anchor, index) => {
        const item = selected[index];
        if (!item) {
          anchor.hidden = true;
          anchor.dataset.raksaCaseFilterable = "false";
          anchor.dataset.raksaCaseHomeExcluded = "true";
          return;
        }

        anchor.hidden = false;
        anchor.dataset.raksaCaseCard = "true";
        anchor.dataset.raksaCaseFilterable = "true";
        delete anchor.dataset.raksaCaseHomeExcluded;
        anchor.dataset.raksaCaseSlug = item.slug;
        anchor.dataset.raksaCaseTags = tagsFor(item).join("|");
        anchor.href = caseUrl(item.slug);
        anchor.setAttribute("aria-label", item.title);
        updateCardCover(anchor, item);
      });
    });
  }

  function syncExistingCaseCards(cases) {
    const map = caseBySlug(cases);
    caseCardAnchors().forEach((anchor) => {
      const slug = caseSlugFromAnchor(anchor);
      const item = map.get(slug);
      if (item) annotateCaseCard(anchor, item, slug);
    });
  }

  function hasOwnFilterBar(parent) {
    return Array.from(parent.children).some((child) => child instanceof HTMLElement && child.dataset.raksaCaseFilters === "true");
  }

  function buildFilterBar() {
    const nav = document.createElement("nav");
    nav.className = "raksa-case-filters";
    nav.dataset.raksaCaseFilters = "true";
    nav.setAttribute("aria-label", "Filtros de cases");

    TAGS.forEach((tag) => {
      const button = document.createElement("button");
      button.className = "raksa-case-filter";
      button.type = "button";
      button.dataset.raksaFilter = tag;
      button.textContent = tag;
      nav.appendChild(button);
    });

    return nav;
  }

  function filterTagFromText(value = "") {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return TAGS.find((tag) => tag === text) || "";
  }

  function nativeButtonLike(element) {
    return element.matches("a, button, [role='button'], [tabindex], [data-highlight='true']");
  }

  function prepareFilterControl(element, tag) {
    element.dataset.raksaFilter = tag;
    element.setAttribute("aria-pressed", "false");
    if (element instanceof HTMLAnchorElement) {
      element.removeAttribute("href");
      element.removeAttribute("target");
    }
    element.querySelectorAll?.("a[href]").forEach((anchor) => {
      anchor.removeAttribute("href");
      anchor.removeAttribute("target");
    });
    if (!nativeButtonLike(element)) {
      element.setAttribute("role", "button");
      element.tabIndex = 0;
    }
  }

  function filterControlFromEvent(event) {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!target) return null;

    const prepared = target.closest("[data-raksa-filter]");
    if (prepared && !isInsideSiteChrome(prepared)) {
      return { element: prepared, tag: prepared.dataset.raksaFilter };
    }

    const root = document.querySelector("#main") || document.body;
    for (let node = target; node && node !== document.body; node = node.parentElement) {
      if (node === root.parentElement) break;
      if (isInsideSiteChrome(node)) return null;
      if (node.querySelector?.("img")) return null;

      const tag = filterTagFromText(node.textContent);
      if (tag) return { element: node, tag };
      if (node === root) break;
    }

    return null;
  }

  function existingFilterControls() {
    const root = document.querySelector("#main") || document;
    const controls = new Map();
    const nodes = Array.from(root.querySelectorAll("*"));

    nodes.forEach((node) => {
      const tag = filterTagFromText(node.textContent);
      if (!tag || isInsideSiteChrome(node)) return;

      const clickable = node.closest("a, button, [role='button'], [tabindex], [data-highlight='true']") || node;
      if (isInsideSiteChrome(clickable) || clickable.querySelector("img")) return;

      const key = `${tag}:${nodes.indexOf(clickable)}`;
      controls.set(key, { element: clickable, tag });
    });

    return Array.from(controls.values());
  }

  function enhanceExistingFilterControls() {
    const controls = existingFilterControls();
    const foundTags = new Set(controls.map((control) => control.tag));
    partialFilterControls = [];
    if (foundTags.size < 3) return false;

    controls.forEach(({ element, tag }) => {
      prepareFilterControl(element, tag);
    });

    if (TAGS.every((tag) => foundTags.has(tag))) return true;
    partialFilterControls = controls.map((control) => control.element);
    return false;
  }

  function hidePartialFilterControls() {
    partialFilterControls.forEach((element) => {
      element.hidden = true;
      element.style.display = "none";
    });
  }

  function applyCaseFilter(filter = activeCaseFilter) {
    activeCaseFilter = TAGS.includes(filter) ? filter : "Todos";

    document.querySelectorAll("[data-raksa-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.raksaFilter === activeCaseFilter);
      button.setAttribute("aria-pressed", String(button.dataset.raksaFilter === activeCaseFilter));
    });

    caseCardAnchors().forEach((anchor) => {
      if (anchor.dataset.raksaCaseFilterable === "false") {
        anchor.hidden = true;
        return;
      }

      const tags = (anchor.dataset.raksaCaseTags || "").split("|").filter(Boolean);
      anchor.hidden = activeCaseFilter !== "Todos" && !tags.includes(activeCaseFilter);
    });
  }

  function bindCaseFilters() {
    if (caseFiltersBound) return;
    caseFiltersBound = true;

    const intercept = (event, shouldApply) => {
      const control = filterControlFromEvent(event);
      if (!control?.tag) return;
      prepareFilterControl(control.element, control.tag);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      if (shouldApply) applyCaseFilter(control.tag);
    };

    document.addEventListener("pointerdown", (event) => intercept(event, false), true);
    document.addEventListener("mousedown", (event) => intercept(event, false), true);
    document.addEventListener("touchstart", (event) => intercept(event, false), { capture: true, passive: false });
    document.addEventListener("click", (event) => intercept(event, true), true);

    document.addEventListener("keydown", (event) => {
      const control = filterControlFromEvent(event);
      if (!control?.tag || !["Enter", " "].includes(event.key)) return;
      prepareFilterControl(control.element, control.tag);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      applyCaseFilter(control.tag);
    }, true);
  }

  function enhanceCaseFilters(cards) {
    if (!cards.length) return;

    injectEnhancementStyle();
    bindCaseFilters();
    const hasFramerFilters = enhanceExistingFilterControls();
    if (!hasFramerFilters) hidePartialFilterControls();

    groupedCards(cards).forEach((group) => {
      const parent = group[0]?.parentElement;
      if (!parent || hasFramerFilters || hasOwnFilterBar(parent)) return;
      parent.insertBefore(buildFilterBar(), group[0]);
    });

    applyCaseFilter(activeCaseFilter);
  }

  function enhanceCasesIndex(cases) {
    const cards = annotateCaseCards(cases);
    enhanceCaseFilters(cards);
  }

  function startContentGuard(sync) {
    const root = document.querySelector("#main") || document.body;
    if (!root) return;

    contentGuardObserver?.disconnect();
    window.clearTimeout(contentGuardTimer);
    contentGuardTimer = 0;

    const schedule = () => {
      if (contentGuardTimer) return;
      contentGuardTimer = window.setTimeout(() => {
        contentGuardTimer = 0;
        sync();
      }, 80);
    };

    contentGuardObserver = new MutationObserver(schedule);
    contentGuardObserver.observe(root, {
      attributes: true,
      attributeFilter: ["href", "src", "srcset", "hidden", "style"],
      childList: true,
      subtree: true,
    });

    [250, 800, 1800, 3200, 5000].forEach((delay) => window.setTimeout(sync, delay));
  }

  function renderDynamicCaseDetail(cases) {
    const slug = normalizeSlug(caseSlugFromPath());
    const item = caseBySlug(cases).get(slug);
    const root = document.querySelector("#main");
    if (!root || !item || item.published === false) return;
    if (root.querySelector(`.raksa-dynamic-case[data-raksa-case-slug="${CSS.escape(slug)}"]`)) return;

    injectEnhancementStyle();
    const tags = tagsFor(item);
    const description = item.description || item.excerpt || "";
    const images = [item.cover, ...(item.images || [])].filter(Boolean);
    document.title = `${item.title || "Case"} - Raksa`;
    root.innerHTML = `
      <main class="raksa-dynamic-case" data-raksa-case-slug="${escapeHtml(slug)}">
        <nav class="raksa-dynamic-case__nav" aria-label="Navegacao do case">
          <a href="${CASES_PATH}">Todos os cases</a>
          ${item.external_url ? `<a href="${escapeHtml(item.external_url)}" target="_blank" rel="noopener">Acessar website</a>` : ""}
        </nav>
        <div class="raksa-dynamic-case__body">
          <section class="raksa-dynamic-case__hero">
            <div class="raksa-dynamic-case__tags">${escapeHtml(tags.join(" / ") || "Case")}</div>
            <h1>${escapeHtml(item.title || item.slug)}</h1>
            ${description ? `<p class="raksa-dynamic-case__copy">${escapeHtml(description)}</p>` : ""}
          </section>
          <section class="raksa-dynamic-case__media" aria-label="Imagens do case">
            ${images.map((url) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(item.title || "")}" loading="lazy">`).join("")}
          </section>
        </div>
      </main>`;
  }

  function renderDynamicCaseLoading(slug) {
    const root = document.querySelector("#main");
    if (!root || root.querySelector(".raksa-dynamic-case")) return;

    injectEnhancementStyle();
    root.innerHTML = `
      <main class="raksa-dynamic-case" data-raksa-case-slug="${escapeHtml(slug)}">
        <nav class="raksa-dynamic-case__nav" aria-label="Navegacao do case">
          <a href="${CASES_PATH}">Todos os cases</a>
        </nav>
        <div class="raksa-dynamic-case__body">
          <section class="raksa-dynamic-case__hero">
            <div class="raksa-dynamic-case__tags">Case</div>
            <h1>Carregando</h1>
            <p class="raksa-dynamic-case__copy">Buscando conteudo do case.</p>
          </section>
          <section class="raksa-dynamic-case__media" aria-label="Imagens do case"></section>
        </div>
      </main>`;
  }

  async function boot() {
    const homeRoute = isHomeRoute();
    const casesRoute = isCasesRoute();
    const detailRoute = routeType() === "case_detail";
    window.RAKSA_PUBLIC_CONTENT_STATUS = {
      hasConfig,
      path: sitePath(),
      route: routeType(),
      startedAt: Date.now(),
    };
    if (!hasConfig || (!casesRoute && !homeRoute && !detailRoute)) return;

    try {
      if (detailRoute) renderDynamicCaseLoading(caseSlugFromPath());

      if (homeRoute) {
        loadLocalCases()
          .then((localCases) => {
            const cases = localCases.map(normalizedCase);
            if (!cases.length || window.RAKSA_PUBLIC_CONTENT_STATUS.mode === "home") return;
            const sync = () => syncExistingCaseCards(cases);
            window.RAKSA_PUBLIC_CONTENT_STATUS.localCases = cases.length;
            window.RAKSA_PUBLIC_CONTENT_STATUS.mode = "home_local_covers";
            sync();
            startContentGuard(sync);
          })
          .catch(() => {});
      }

      const cases = (await loadCases()).map(normalizedCase);
      window.RAKSA_PUBLIC_CONTENT_STATUS.cases = cases.length;
      if (!cases.length) return;
      if (homeRoute) {
        const sync = () => applyHomeCases(cases);
        window.RAKSA_PUBLIC_CONTENT_STATUS.mode = "home";
        sync();
        startContentGuard(sync);
      } else if (casesRoute) {
        const sync = () => enhanceCasesIndex(cases);
        window.RAKSA_PUBLIC_CONTENT_STATUS.mode = "cases_index";
        sync();
        startContentGuard(sync);
      } else if (detailRoute) {
        const sync = () => renderDynamicCaseDetail(cases);
        window.RAKSA_PUBLIC_CONTENT_STATUS.mode = "case_detail";
        sync();
        startContentGuard(sync);
      }
    } catch (error) {
      window.RAKSA_PUBLIC_CONTENT_STATUS.error = error.message || String(error);
      console.warn("[RAKSA] Supabase public content unavailable:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startMetrics);
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    startMetrics();
    boot();
  }
})();
