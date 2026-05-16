(() => {
  const BASE_PATH = "/raksadesign";

  function normalizedHref(anchor) {
    const raw = anchor.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return "";

    const url = new URL(raw, window.location.href);
    if (url.origin !== window.location.origin) return "";

    const nestedCaseListMatch = url.pathname.match(new RegExp(`^${BASE_PATH}/cases/cases/([^/]+)/?$`));
    if (nestedCaseListMatch) {
      url.pathname = `${BASE_PATH}/cases/${nestedCaseListMatch[1]}/`;
      return url.href;
    }

    const caseDetailMatch = url.pathname.match(new RegExp(`^${BASE_PATH}/cases/([^/]+)/?$`));
    if (caseDetailMatch && !url.pathname.endsWith("/")) {
      url.pathname = `${BASE_PATH}/cases/${caseDetailMatch[1]}/`;
      return url.href;
    }

    if (
      url.pathname === `${BASE_PATH}/cases/cases` ||
      url.pathname === `${BASE_PATH}/cases/cases/` ||
      url.pathname.match(new RegExp(`^${BASE_PATH}/cases/[^/]+/cases/?$`))
    ) {
      url.pathname = `${BASE_PATH}/cases/`;
      return url.href;
    }

    return "";
  }

  function normalizeCaseLinks(root = document) {
    root.querySelectorAll?.("a[href]").forEach((anchor) => {
      const nextHref = normalizedHref(anchor);
      if (nextHref) anchor.href = nextHref;
    });
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;

      const nextHref = normalizedHref(anchor);
      if (!nextHref) return;

      event.preventDefault();
      window.location.href = nextHref;
    },
    true,
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => normalizeCaseLinks());
  } else {
    normalizeCaseLinks();
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        normalizeCaseLinks(record.target);
        continue;
      }

      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) normalizeCaseLinks(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["href"],
    childList: true,
    subtree: true,
  });

  window.setTimeout(() => normalizeCaseLinks(), 500);
  window.setTimeout(() => normalizeCaseLinks(), 1500);
})();
