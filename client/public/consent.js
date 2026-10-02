/*
 * Acqlerate cookie consent + Google Analytics loader.
 *
 * One file, loaded synchronously in the <head> of every page (the React app's
 * index.html and every static page), in place of the old inline GA snippet.
 * It defines gtag/dataLayer exactly like Google's snippet did, so inline
 * gtag('event', ...) calls elsewhere on a page keep working.
 *
 * Rules (Privacy Policy section 8):
 *   - Visitors in Europe (EU/EEA, UK, Switzerland) are asked first. Google
 *     Analytics does not load, and sets no cookies, until they click Accept.
 *     Spain's LSSI art. 22.2 and the AEPD cookie guide require this.
 *   - Everyone else gets analytics by default, with no banner. They can turn it
 *     off any time via "Cookie settings" (footer, app sidebar, My Account,
 *     /privacy#cookies).
 *   - "Europe" is guessed from the browser's time zone, because a static page
 *     can't know the visitor's country. As a backstop, Google Consent Mode is
 *     told to deny analytics storage for every EEA/UK/CH country by IP, so a
 *     European visitor whose device says New York still gets no GA cookies.
 *   - Accept and Decline carry equal weight. The choice is kept for 12 months
 *     in a first-party cookie (acq_consent), which is strictly necessary to
 *     remember it and needs no consent itself.
 *   - Advertising signals are always denied. Acqlerate doesn't do ads.
 *   - Tokens that unlock something (Stripe session_id, reset-link token,
 *     email) are stripped from the URL GA receives.
 *
 * window.acqConsent.open()  shows the choice again (used by Cookie settings)
 * window.acqConsent.get()   'granted' | 'denied' | null (no choice yet)
 */
(function () {
  "use strict";
  var GA_ID = "G-SW42SFY999";
  var COOKIE = "acq_consent";
  var MAX_AGE = 365 * 24 * 60 * 60; // 12 months
  var EEA_UK_CH = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH",
    "GF","GP","MQ","RE","YT","MF"];
  var EU_TZ_EXTRA = ["Atlantic/Canary","Atlantic/Madeira","Atlantic/Azores","Atlantic/Reykjavik","Atlantic/Faroe",
    "Arctic/Longyearbyen","Africa/Ceuta","Asia/Nicosia","Asia/Famagusta","Indian/Reunion","Indian/Mayotte",
    "America/Martinique","America/Guadeloupe","America/Cayenne","America/Marigot"];
  var SENSITIVE_PARAMS = ["session_id","token","email","reset","code"];

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  if (typeof window.gtag !== "function") window.gtag = gtag;

  function readChoice() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)acq_consent=(granted|denied)/);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }
  function saveChoice(v) {
    try {
      var secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = COOKIE + "=" + v + "; Max-Age=" + MAX_AGE + "; Path=/; SameSite=Lax" + secure;
    } catch (e) {}
  }
  function looksEuropean() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (!tz) return true; // can't tell: ask
      return tz.indexOf("Europe/") === 0 || EU_TZ_EXTRA.indexOf(tz) !== -1;
    } catch (e) { return true; }
  }
  function cleanUrl(href) {
    try {
      var u = new URL(href);
      SENSITIVE_PARAMS.forEach(function (p) { u.searchParams.delete(p); });
      var h = u.hash, q = h.indexOf("?");
      if (q !== -1) {
        var hp = new URLSearchParams(h.slice(q + 1));
        SENSITIVE_PARAMS.forEach(function (p) { hp.delete(p); });
        var rest = hp.toString();
        u.hash = h.slice(0, q) + (rest ? "?" + rest : "");
      }
      return u.toString();
    } catch (e) { return location.origin + location.pathname; }
  }

  var choice = readChoice();
  var european = looksEuropean();
  var analytics = choice || (european ? "denied" : "granted");

  gtag("consent", "default", {
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    analytics_storage: analytics === "granted" ? "granted" : "denied"
  });
  if (!choice) {
    // Backstop by IP country, evaluated by Google (see top of file).
    gtag("consent", "default", { analytics_storage: "denied", region: EEA_UK_CH });
  } else if (choice === "granted") {
    gtag("consent", "update", { analytics_storage: "granted" });
  }
  gtag("js", new Date());
  gtag("config", GA_ID, { page_location: cleanUrl(location.href) });

  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return;
    gaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    (document.head || document.documentElement).appendChild(s);
  }
  if (analytics === "granted") loadGA();

  function clearGaCookies() {
    try {
      var host = location.hostname;
      var parts = host.split(".");
      var domains = ["", host, "." + host];
      if (parts.length > 2) domains.push("." + parts.slice(-2).join("."));
      document.cookie.split(";").forEach(function (c) {
        var name = c.split("=")[0].trim();
        if (name.indexOf("_ga") !== 0) return;
        domains.forEach(function (d) {
          document.cookie = name + "=; Max-Age=0; Path=/" + (d ? "; Domain=" + d : "");
        });
      });
    } catch (e) {}
  }

  // ── Banner ──────────────────────────────────────────────────────────────
  var CSS =
    "#acq-consent{position:fixed;z-index:2147483000;left:50%;bottom:16px;transform:translateX(-50%);" +
    "width:calc(100% - 32px);max-width:560px;box-sizing:border-box;background:#0C2340;color:#fff;" +
    "border-radius:14px;padding:18px 20px;border:1px solid rgba(79,195,203,.45);box-shadow:0 10px 32px rgba(0,0,0,.35);" +
    "font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
    "margin-bottom:env(safe-area-inset-bottom,0px)}" +
    "#acq-consent p{margin:0 0 14px;color:rgba(255,255,255,.88)}" +
    "#acq-consent strong{display:block;color:#fff;font-size:15px;margin-bottom:4px}" +
    "#acq-consent a{color:#4FC3CB;text-decoration:underline}" +
    "#acq-consent .acq-row{display:flex;gap:10px}" +
    "#acq-consent button{flex:1;min-height:44px;border-radius:10px;border:1.5px solid #fff;background:#fff;color:#0C2340;" +
    "font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;cursor:pointer}" +
    "#acq-consent button:focus-visible{outline:3px solid #4FC3CB;outline-offset:2px}" +
    "#acq-consent button[aria-pressed=true]{background:#4FC3CB;border-color:#4FC3CB}" +
    "@media (prefers-reduced-motion:no-preference){#acq-consent{animation:acqIn .25s ease-out}}" +
    "@keyframes acqIn{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}";

  function removeBanner() {
    var el = document.getElementById("acq-consent");
    if (el) el.parentNode.removeChild(el);
  }

  function decide(v) {
    saveChoice(v);
    choice = v;
    gtag("consent", "update", { analytics_storage: v });
    if (v === "granted") loadGA(); else clearGaCookies();
    removeBanner();
  }

  function showBanner() {
    if (!document.body) { document.addEventListener("DOMContentLoaded", showBanner); return; }
    removeBanner();
    if (!document.getElementById("acq-consent-css")) {
      var st = document.createElement("style");
      st.id = "acq-consent-css";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var box = document.createElement("div");
    box.id = "acq-consent";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", "Cookie choice");
    box.innerHTML =
      "<p><strong>Can we count your visit?</strong>" +
      "We'd like to use Google Analytics cookies to see which pages and lessons actually help people. " +
      "Nothing is sold or used for ads. <a href=\"/privacy#cookies\">Privacy Policy</a></p>" +
      "<div class=\"acq-row\"><button type=\"button\" data-v=\"denied\">Decline</button>" +
      "<button type=\"button\" data-v=\"granted\">Accept</button></div>";
    var current = readChoice();
    Array.prototype.forEach.call(box.querySelectorAll("button"), function (b) {
      if (current) b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === current));
      b.addEventListener("click", function () { decide(b.getAttribute("data-v")); });
    });
    document.body.appendChild(box);
  }

  // ── "Cookie settings" links in static-page footers ─────────────────────
  function addFooterLinks() {
    try {
      var footer = document.querySelector("footer");
      if (!footer || footer.querySelector("[data-acq-cookie-settings]")) return;
      var privacy = footer.querySelector('a[href="/privacy"],a[href="/privacy.html"],a[href="https://acqlerate.com/privacy"]');
      var link = document.createElement("a");
      link.href = "/privacy#cookies";
      link.textContent = "Cookie settings";
      link.setAttribute("data-acq-cookie-settings", "");
      if (privacy) {
        link.className = privacy.className;
        privacy.parentNode.insertBefore(link, privacy.nextSibling);
        privacy.parentNode.insertBefore(document.createTextNode(" "), link);
        return;
      }
      // No privacy link in this footer (blog posts): add both to its link row.
      var row = footer.querySelector(".footer-links") || footer;
      var sample = row.querySelector("a");
      var p = document.createElement("a");
      p.href = "/privacy";
      p.textContent = "Privacy";
      if (sample) { p.className = sample.className; link.className = sample.className; }
      row.appendChild(document.createTextNode(" "));
      row.appendChild(p);
      row.appendChild(document.createTextNode(" "));
      row.appendChild(link);
    } catch (e) {}
  }

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-acq-cookie-settings]") : null;
    if (!t) return;
    e.preventDefault();
    showBanner();
  });

  function onReady() {
    addFooterLinks();
    if (!choice && european) showBanner();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onReady);
  else onReady();

  window.acqConsent = {
    open: showBanner,
    get: readChoice
  };
})();
