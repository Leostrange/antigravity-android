/* Antigravity RU — small runtime fixes on top of the original 2.4.1 bundle.
 * Never moves or edits React-owned nodes; only adds its own fixed elements. */
(function () {
  "use strict";
  if (window.__agyRuFixes) return;
  window.__agyRuFixes = true;


  /* ---- Usage: "Refreshing…" without changing the panel height ----------
   * 2.4.1 inserts a status row (+ separator) above the quota list while it
   * refreshes, so the sheet grows and then shrinks. agy_ru.css hides that row;
   * here we mirror its presence as a small spinner pinned to the right end of
   * the sheet header (the row with "‹ Usage"). */
  var ROW_SEL = '[data-testid="model-quota-refreshing"]';
  var badge = null;
  var raf = 0;

  function inlineRow() {
    // Only the inline variant (the empty-state one is a tall flex-col block
    // that IS the content and stays as it is).
    var rows = document.querySelectorAll(ROW_SEL);
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i].classList.contains("flex-col") && rows[i].getClientRects().length === 0) return rows[i];
    }
    return null;
  }

  function headerFor(row) {
    // The scroll list is the row's parent; the header is the nearest preceding
    // block above it that starts higher on screen inside the same sheet.
    var list = row.parentElement;
    if (!list) return null;
    var listTop = list.getBoundingClientRect().top;
    var node = list;
    for (var depth = 0; node && depth < 6; depth++) {
      var prev = node.previousElementSibling;
      while (prev) {
        var r = prev.getBoundingClientRect();
        if (r.height > 16 && r.bottom <= listTop + 2 && r.width > 120) return prev;
        prev = prev.previousElementSibling;
      }
      node = node.parentElement;
    }
    return null;
  }

  function label() {
    var lang = "";
    try { lang = (window.AgyLang && window.AgyLang.getLang()) || ""; } catch (e) {}
    if (lang === "system" || !lang) lang = /^ru\b/i.test(navigator.language || "") ? "ru" : "en";
    return lang === "ru" ? "Обновление…" : "Refreshing…";
  }

  function place() {
    raf = 0;
    var row = inlineRow();
    var header = row && headerFor(row);
    if (!header) {
      if (badge) badge.style.display = "none";
      return;
    }
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "agy-usage-refreshing";
      badge.setAttribute("role", "status");
      badge.setAttribute("aria-live", "polite");
      badge.innerHTML = '<span class="agy-usage-spin" aria-hidden="true"></span><span class="agy-usage-text"></span>';
      document.body.appendChild(badge);
    }
    badge.querySelector(".agy-usage-text").textContent = label();
    var r = header.getBoundingClientRect();
    badge.style.display = "flex";
    badge.style.top = Math.round(r.top) + "px";
    badge.style.height = Math.round(r.height) + "px";
    badge.style.right = Math.max(12, Math.round(window.innerWidth - r.right + 16)) + "px";
  }

  function schedule() { if (!raf) raf = requestAnimationFrame(place); }

  function start() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("scroll", schedule, { passive: true, capture: true });
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start, { once: true });

  /* ---- Composer focus guard (ТЗ 6.3, B-08) ---------------------------------
   * 2.4.1 refocuses the chat editor after "+" / the model selector / menu
   * closes, which pops the keyboard. Block that programmatic focus when the
   * last touch was on those controls or inside an open menu/sheet. A touch on
   * the editor itself, and menu items that need typing (Mentions / Actions),
   * keep the original behaviour. */
  var BOX = "[data-testid='agent-input-box']";
  var MENUISH = "[role='menu'],[role='menuitem'],[role='listbox'],[role='option'],[role='dialog']," +
                "[data-testid^='model-selector'],[aria-label='Add context'],[aria-label='Добавить контекст']";
  var guard = { t: 0, block: false };

  function isEditor(el) {
    return !!(el && el.nodeType === 1 && el.closest && el.closest(BOX) &&
      (el.isContentEditable || el.tagName === "TEXTAREA"));
  }
  function menuOpen() {
    return !!document.querySelector("[role='menu'],[role='listbox'],[role='dialog'],[data-testid='model-selector-panel']");
  }
  document.addEventListener("pointerdown", function (e) {
    var t = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
    if (!t || !t.closest) return;
    var item = t.closest("[role='menuitem'],[role='option'],button");
    var label = item ? (item.textContent || "").trim() : "";
    var needsInput = /^(Mentions|Actions|Упоминания|Действия)$/.test(label);
    var onEditor = isEditor(t) || !!t.closest(BOX + " [contenteditable='true']");
    var onControls = !!t.closest(MENUISH);
    // The "+" (Add context) button must open its menu even while text is typed.
    // Blocking editor focus here blurred the editor, dismissed the keyboard and
    // the layout shift ate the tap, so "+" did nothing. Never guard on that tap.
    var onAdd = !!t.closest("[aria-label='Add context'],[aria-label='Добавить контекст']");
    guard = { t: Date.now(), block: !onEditor && !needsInput && !onAdd && (onControls || menuOpen()) };
  }, true);

  function shouldBlock(el) {
    return guard.block && Date.now() - guard.t < 1500 && isEditor(el) && document.activeElement !== el;
  }
  var nativeFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function () {
    if (shouldBlock(this)) return;
    return nativeFocus.apply(this, arguments);
  };
  document.addEventListener("focusin", function (e) {
    if (guard.block && Date.now() - guard.t < 1500 && isEditor(e.target)) {
      try { e.target.blur(); } catch (err) {}
    }
  }, true);

  /* ---- Focus allowed again once an attachment is really added (ТЗ 6.3) --- */
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var added = list[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType === 1 && (n.matches("[data-testid='input-attachment']") || n.querySelector("[data-testid='input-attachment']"))) {
          // After a file is attached the editor must NOT grab focus (it kept the
          // keyboard up and swallowed the next tap on "+").
          guard = { t: Date.now(), block: true };
          var ae = document.activeElement;
          if (ae && isEditor(ae)) { try { ae.blur(); } catch (err) {} }
          return;
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---- Chat input repaint nudge -------------------------------------------
   * Intermittently, after the keyboard opens on an empty focused input, the
   * WebView leaves the input card unpainted (black) until the next repaint
   * (typing or tapping the chat fixes it). Force that repaint ourselves while
   * the keyboard settles: read layout, then toggle a no-op opacity for 2 frames. */
  function nudge() {
    var box = document.querySelector(BOX);
    if (!box || !box.contains(document.activeElement)) return;
    // 1px scroll jiggle re-rasterizes without promoting a layer.
    try { window.scrollBy(0, 1); window.scrollBy(0, -1); } catch (e) {}
    // AND clear the black texture on the composer's own compositing layers (the
    // "input card goes black on focus" case) — repaint only elements that are
    // ALREADY their own layer, never <body>, so no flashing spots.
    compositingAncestors(document.activeElement || box).forEach(repaint);
  }
  function nudgeSeries() { [120, 350, 700, 1200].forEach(function (ms) { setTimeout(nudge, ms); }); }

  /* Whole-page repaint after returning from a system window (file picker,
   * permission dialog) and when an attachment/image appears: the WebView can
   * leave large areas unpainted (black) until something repaints them. */
  // Overlay containers that sit on their own compositing layer and can blacken:
  // the app's menus, selects, popovers, bottom sheets and modal/dialog roots.
  var OVERLAY_SEL = '[role="menu"],[role="listbox"],[role="dialog"],[data-select-popup],' +
    '[data-radix-popper-content-wrapper],.typeahead-popover,#typeahead-menu,' +
    '[data-testid="bottom-sheet"],[class*="animate-slideIn"],[class*="animate-in"],.z-\\[6000\\]';
  function repaintOverlays() {
    var nodes;
    try { nodes = document.querySelectorAll(OVERLAY_SEL); } catch (e) { return; }
    for (var i = 0; i < nodes.length; i++) repaint(nodes[i]);
  }
  function nudgePage() {
    // Compositing-safe: a 1px scroll jiggle re-rasterizes without promoting a
    // layer. Then clear the black texture on the overlay layers that are open and
    // on the focused field's compositing ancestors — never on <body> (that is what
    // caused the flashing black spots).
    try { window.scrollBy(0, 1); window.scrollBy(0, -1); } catch (e) {}
    try {
      var sc = document.scrollingElement || document.documentElement;
      if (sc) { var top = sc.scrollTop; sc.scrollTop = top + 1; sc.scrollTop = top; }
    } catch (e) {}
    repaintOverlays();
    var ae = document.activeElement;
    if (ae && ae !== document.body) compositingAncestors(ae).forEach(repaint);
  }
  var pageTimers = [];
  function nudgePageSeries() {
    pageTimers.forEach(clearTimeout);
    pageTimers = [0, 150, 400, 800, 1500, 2500].map(function (ms) { return setTimeout(nudgePage, ms); });
  }

  /* Settings / Providers inputs live inside the settings panel, which is a
   * transformed (animated) subtree with its own scroll container and compositing
   * layer. Toggling body opacity does not force that layer to repaint, so the
   * keyboard can leave a black overlay over the fields. Repaint the field's own
   * scroll ancestor directly (a 1px scroll jiggle + an opacity/transform no-op). */
  function scrollAncestor(el) {
    for (var p = el && el.parentElement; p; p = p.parentElement) {
      var cs;
      try { cs = getComputedStyle(p); } catch (e) { continue; }
      if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 2) return p;
    }
    return document.scrollingElement || document.documentElement;
  }
  // Ancestors that sit on their own compositing layer (transform/filter/opacity/
  // fixed) — on this WebView the keyboard can leave that layer's texture black,
  // and only repainting THAT layer clears it.
  function compositingAncestors(el) {
    var out = [];
    for (var p = el && el.parentElement; p && p !== document.body; p = p.parentElement) {
      var cs; try { cs = getComputedStyle(p); } catch (e) { continue; }
      if ((cs.transform && cs.transform !== "none") || (cs.filter && cs.filter !== "none") ||
          (cs.backdropFilter && cs.backdropFilter !== "none") || /transform|opacity/.test(cs.willChange || "") ||
          (cs.opacity && cs.opacity !== "1") || cs.position === "fixed" || cs.position === "sticky") out.push(p);
    }
    return out;
  }
  /* Clear the black GPU texture on an ALREADY-compositing element by forcing it
   * to re-rasterize. A brief opacity delta does this; 0.999 for two frames is
   * imperceptible. CRITICAL: only call this on an element that is ALREADY its own
   * compositing layer (transform/filter/opacity/fixed). Never on <body> or a big
   * content scroller — toggling opacity there restructures child layers and makes
   * them flash black ("черные пятна"). That is why the earlier broad version was
   * wrong: here we repaint ONLY the specific layer that blacked out. */
  // Do not mutate compositing transforms on live app layers. Concurrent
  // repaint timers can overwrite an animation or change stacking order.
  function repaint(n) { if (n) void n.offsetWidth; }
  function revealProviderField(el) {
    if (!el || !el.isConnected || document.activeElement !== el) return;
    var rect = el.getBoundingClientRect();
    var vv = window.visualViewport;
    var bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
    var top = vv ? vv.offsetTop : 0;
    if (rect.bottom > bottom - 12 || rect.top < top + 12) {
      try { el.scrollIntoView({block: "center", behavior: "auto"}); } catch (e) {}
    }
  }
  function revealProviderSeries(el) {
    fieldTimers.forEach(clearTimeout);
    fieldTimers = [0, 120, 300, 600].map(function (ms) { return setTimeout(function () { revealProviderField(el); }, ms); });
  }
  function nudgeField(el) {
    if (!el || !el.isConnected) return;
    try { el.scrollIntoView({ block: "center", behavior: "auto" }); } catch (e) {}
    // Compositing-safe: jiggle the scroll container by 1px (keeps the field above
    // the keyboard, re-rasterizes without layer changes).
    var sc = scrollAncestor(el);
    try { var top = sc.scrollTop; sc.scrollTop = top + 1; sc.scrollTop = top; } catch (e) {}
    // Clear the black texture ONLY on the containers that are already their own
    // compositing layer (the settings panel / popover). NOT body, NOT the scroll
    // container — repainting those causes the flashing black spots.
    compositingAncestors(el).forEach(repaint);
  }
  var fieldTimers = [];
  function nudgeFieldSeries(el) {
    fieldTimers.forEach(clearTimeout);
    fieldTimers = [0, 120, 300, 600, 1100, 1800].map(function (ms) { return setTimeout(function () { nudgeField(el); }, ms); });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      guard = { t: Date.now(), block: true };
      nudgePageSeries();
    }
  });

  /* Slash / mention list: show every item without an inner scroll (Out27),
   * compact rows, kept right above the input box. */
  function fitTypeahead() {
    var m = document.getElementById("typeahead-menu");
    if (!m) return;
    var all = m.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var cs = getComputedStyle(all[i]);
      if (/(auto|scroll)/.test(cs.overflowY) || cs.maxHeight !== "none") {
        all[i].style.setProperty("max-height", "none", "important");
        all[i].style.setProperty("overflow", "visible", "important");
      }
    }
    m.classList.add("agy-typeahead");
    var box = document.querySelector(BOX);
    if (!box) return;
    var br = box.getBoundingClientRect(), h = m.getBoundingClientRect().height;
    var top = Math.max(4, br.top - h - 6);
    m.style.setProperty("top", Math.round(top + window.pageYOffset) + "px", "important");
  }
  /* Popovers / menus (projects "+", filter, …): narrow vertical cards like
   * Out27 — width by content, and the current value shown next to a row with
   * a submenu ("Group by  Project >") is hidden: it is visible in the submenu. */
  function fitPopups() {
    var ps = document.querySelectorAll("[class*='animate-slideIn']");
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (p.closest("[data-testid^='model-selector']") || p.querySelector("[data-testid^='model-selector'],[data-testid='model-quota-refreshing']")) continue;
      if (p.matches("[data-select-popup],[role='listbox'],[role='menu']")) continue;   // menus keep their own width   // selects keep trigger width
      if (p.querySelector("input,textarea,[contenteditable='true']")) continue;
      p.style.setProperty("width", "max-content", "important");
      p.style.setProperty("min-width", "0", "important");
      p.style.setProperty("max-width", "min(240px, calc(100vw - 16px))", "important");
      var rows = p.querySelectorAll("button,[role='menuitem'],.main-row-trigger");
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var texts = [];
        for (var c = 0; c < row.children.length; c++) {
          var ch = row.children[c];
          if (ch.tagName !== "svg" && (ch.textContent || "").trim()) texts.push(ch);
        }
        if (texts.length < 2 || !row.querySelector("svg")) continue;
        for (var t = 1; t < texts.length; t++) {
          if (/text-(muted|secondary)-foreground/.test(texts[t].className || "") || texts[t].querySelector("[class*='text-muted'],[class*='text-secondary']") || t === texts.length - 1) {
            texts[t].style.setProperty("display", "none", "important");
          }
        }
      }
    }
  }
  /* Selects (Base UI select popup): short lists = exactly the trigger width;
   * lists with descriptions = width of the settings card that holds the row,
   * aligned to it (never wider than that card). */
  var selTrigger = null, selLoop = 0;
  function selTick() {
    selLoop = 0;
    if (!document.querySelector("[data-select-popup]")) return;
    fitSelects();
    selLoop = requestAnimationFrame(selTick);
  }
  document.addEventListener("pointerdown", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[role='combobox'],[aria-haspopup],button") : null;
    if (t && !t.closest("[data-select-popup]")) selTrigger = t;
  }, true);
  function fitSelects() {
    var ps = document.querySelectorAll("[data-select-popup]");
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      var tr = selTrigger && selTrigger.isConnected ? selTrigger : null;
      if (!tr) continue;
      var opts = p.querySelectorAll("[role='option']");
      var described = false;
      for (var o = 0; o < opts.length; o++) {
        var lines = (opts[o].innerText || "").split("\n").filter(function (x) { return x.trim(); });
        if (lines.length > 1) { described = true; break; }
      }
      var tw = tr.getBoundingClientRect();
      if (!described) {
        p.style.setProperty("width", Math.round(tw.width) + "px", "important");
        p.style.setProperty("min-width", "0", "important");
        p.style.setProperty("max-width", "none", "important");
        p.style.removeProperty("translate"); delete p.dataset.agyDx;
        continue;
      }
      var card = tr.parentElement, vw = window.innerWidth;
      while (card && card !== document.body) {
        var cs = getComputedStyle(card), r = card.getBoundingClientRect();
        if (r.width >= vw * 0.7 && parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderTopLeftRadius) > 0) break;
        card = card.parentElement;
      }
      var cr = card && card !== document.body ? card.getBoundingClientRect() : { left: 16, width: vw - 32 };
      p.style.setProperty("width", Math.round(cr.width) + "px", "important");
      p.style.setProperty("min-width", "0", "important");
      p.style.setProperty("max-width", "none", "important");
      var cur = parseFloat(p.dataset.agyDx || "0") || 0;
      var base = p.getBoundingClientRect().left - cur;      // where floating-ui put it
      var dx = Math.round(cr.left - base);
      if (dx !== cur) { p.dataset.agyDx = String(dx); p.style.setProperty("translate", dx + "px 0", "important"); }
    }
  }

  /* Settings: system Back (button or swipe gesture) goes one settings page
   * back instead of leaving to the chat. Every page with a "Back" header gets
   * one history entry; popping it clicks that page's own Back button. */
  function sheetBack() {
    var bs = document.querySelectorAll("[data-testid='bottom-sheet'] button");
    var found = null;
    for (var i = 0; i < bs.length; i++) {
      var t = (bs[i].innerText || bs[i].textContent || "").trim();
      if (!/(^|\s)(Назад|Back)$/.test(t) && !/^(Назад|Back)$/.test((bs[i].getAttribute("aria-label") || "").trim())) continue;
      var r = bs[i].getBoundingClientRect();
      if (r.width > 0 && r.left >= -1 && r.left < window.innerWidth / 2) found = bs[i];
    }
    return found;
  }
  /* Called by the native Back handler (button and edge swipe). Returns true
   * when the page handled Back: an open menu/list closes first, otherwise the
   * open settings page goes one level back. */
  window.__agyBack = function () {
    if (window.__agyShieldClose && window.__agyShieldClose()) return true;
    var open = document.querySelector("[data-select-popup],[class*='animate-slideIn'],#typeahead-menu");
    if (open) {
      (document.activeElement || document.body).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
      return true;
    }
    var btn = sheetBack();
    if (btn) { btn.click(); return true; }
    // Root settings screen: a side swipe must not close settings (ТЗ 9.4);
    // they close only with their own control or a swipe down.
    var sheets = document.querySelectorAll("[data-testid='bottom-sheet']");
    for (var i = 0; i < sheets.length; i++) {
      var tx = sheets[i].innerText || "";
      if (/(Общие|General)/.test(tx) && /(Оформление|Appearance)/.test(tx)) return true;
    }
    return false;
  };

  var popRaf = 0;
  new MutationObserver(function () {
    if (!popRaf) popRaf = requestAnimationFrame(function () { popRaf = 0; fitPopups(); if (!selLoop) selTick(); });
  }).observe(document.body, { childList: true, subtree: true });

  var taRaf = 0;
  new MutationObserver(function () {
    if (!taRaf) taRaf = requestAnimationFrame(function () { taRaf = 0; fitTypeahead(); });
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("focus", nudgePageSeries);
  window.addEventListener("pageshow", nudgePageSeries);
  document.addEventListener("load", function (e) {
    if (e.target && e.target.tagName === "IMG" && e.target.closest && e.target.closest("[data-testid='input-attachment']")) nudgePageSeries();
  }, true);
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var rm = list[i].removedNodes, ad = list[i].addedNodes, all = [];
      for (var a = 0; a < ad.length; a++) all.push(ad[a]);
      for (var r = 0; r < rm.length; r++) all.push(rm[r]);
      for (var j = 0; j < all.length; j++) {
        var n = all[j];
        if (n.nodeType === 1 && (n.matches("[data-testid='input-attachment']") || n.querySelector("[data-testid='input-attachment']"))) { nudgePageSeries(); return; }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* A context menu / select popover / bottom sheet opens on its own compositing
   * layer; on this WebView that layer can appear fully black. Repaint it the
   * moment it is added (and once more after its slide-in settles). */
  var ovTimers = [];
  function repaintOverlaysSeries() {
    ovTimers.forEach(clearTimeout);
    ovTimers = [0, 60, 180, 360].map(function (ms) { return setTimeout(repaintOverlays, ms); });
  }
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var ad = list[i].addedNodes;
      for (var j = 0; j < ad.length; j++) {
        var n = ad[j];
        if (n.nodeType !== 1) continue;
        try {
          if ((n.matches && n.matches(OVERLAY_SEL)) || (n.querySelector && n.querySelector(OVERLAY_SEL))) { repaintOverlaysSeries(); return; }
        } catch (e) {}
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* The reasoning ("Размышление"/Thinking) block is a maxHeight collapsible with
   * its own scroll/transform panel; on this WebView that panel renders fully
   * black while it streams or when expanded. Repaint its compositing layers as it
   * updates. */
  var THINK = "[data-testid='thinking-collapsible-trigger']";
  function repaintThinking() {
    var trigs;
    try { trigs = document.querySelectorAll(THINK); } catch (e) { return; }
    for (var i = 0; i < trigs.length; i++) {
      var blk = trigs[i].parentElement; if (!blk) continue;
      compositingAncestors(trigs[i]).forEach(repaint);
      var kids = blk.querySelectorAll("*");
      for (var j = 0; j < kids.length && j < 80; j++) {
        var cs; try { cs = getComputedStyle(kids[j]); } catch (e) { continue; }
        if ((cs.transform && cs.transform !== "none") || /(auto|scroll)/.test(cs.overflowY) ||
            /transform|opacity/.test(cs.willChange || "") || (cs.opacity && cs.opacity !== "1") ||
            cs.position === "sticky") repaint(kids[j]);
      }
    }
  }
  var thTimer = 0;
  function repaintThinkingSoon() {
    if (thTimer) return;                         // throttle to ~8/sec while streaming
    thTimer = setTimeout(function () { thTimer = 0; repaintThinking(); }, 120);
  }
  new MutationObserver(function () {
    try { if (document.querySelector(THINK)) repaintThinkingSoon(); } catch (e) {}
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  // Expand / collapse: repaint through the animation.
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest(THINK)) { [0, 80, 220, 420].forEach(function (ms) { setTimeout(repaintThinking, ms); }); }
  }, true);

  document.addEventListener("focusin", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(BOX)) { nudgeSeries(); return; }
    if (t.closest('.agy-providers')) {
      pageTimers.forEach(clearTimeout); revealProviderSeries(t);
      return;
    }
    // Any other editable field (settings inputs, Providers, Tools): opening the
    // keyboard can leave black areas on this WebView — repaint the whole page and
    // the field's own (transformed) scroll container.
    if (t.matches && t.matches("input:not([type='checkbox']):not([type='radio']),textarea,select,[contenteditable='true']")) { nudgePageSeries(); nudgeFieldSeries(t); }
  }, true);
  if (window.visualViewport) {
    var vvTimer = 0;
    window.visualViewport.addEventListener("resize", function () {
      clearTimeout(vvTimer);
      // Keyboard shown/hidden anywhere: nudge the focused chat input, the page,
      // and the focused settings field's container.
      vvTimer = setTimeout(function () {
        var active = document.activeElement;
        if (active && active.closest && active.closest('.agy-providers')) { revealProviderSeries(active); return; }
        nudgeSeries(); nudgePageSeries();
        var ae = document.activeElement;
        if (ae && ae.matches && ae.matches("input:not([type='checkbox']):not([type='radio']),textarea,select,[contenteditable='true']") && !ae.closest(BOX)) nudgeFieldSeries(ae);
      }, 60);
    }, { passive: true });
  }

  /* ---- Compact menus instead of bottom sheets (ТЗ 6.3, 6.4, B-15) ---------
   * 2.4.1 opens the "+" menu and the projects menu (New Project / Quick Start)
   * as a full-width bottom sheet. Only for those two sheets we pin the sheet
   * itself next to the button that opened it (≈240 px wide). The shared
   * fullscreen container is never styled; the backdrop of THAT sheet only
   * becomes transparent (it still closes the menu on an outside tap and is
   * removed by React together with the sheet). Model selector sheets are
   * never matched. */
  var lastTrigger = null;
  var sheetTriggers = new WeakMap();
  document.addEventListener("pointerdown", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("button,[role='button']") : null;
    if (t && !t.closest("[data-testid='bottom-sheet']")) lastTrigger = t;
  }, true);

  var ITEM = "[role='menuitem'],[role='menuitemradio'],[role='menuitemcheckbox'],[role='option']";
  function sheetKind(sheet, trigger) {
    // Original model selector / Usage stay exactly as in 2.4.1.
    if (sheet.querySelector("[data-testid^='model-selector'],[data-testid='model-quota-refreshing']")) return null;
    if (trigger && trigger.closest && trigger.closest("[data-testid='model-selector-trigger']")) return null;
    if (sheet.querySelector("input:not([type='checkbox']):not([type='radio']),textarea,[contenteditable='true']")) return null;
    if (sheet.querySelector("[role='option'],[role='menuitemradio']")) return "select";
    if (sheet.querySelector(ITEM)) return "menu";
    // Plain-button menus (e.g. New Project / Quick Start). Full screens such as
    // Settings are opened with an explicit sheet height and are skipped.
    var btns = sheet.querySelectorAll("button");
    if (!sheet.style.height && btns.length > 0 && btns.length <= 8 && (sheet.textContent || "").length < 300) return "menu";
    return null;
  }

  function lines(el) {
    return (el.innerText || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function layoutCompact() {
    var sheets = document.querySelectorAll("[data-testid='bottom-sheet']");
    var backs = document.querySelectorAll("[data-testid='bottom-sheet-backdrop']");
    var compactBacks = new Set();
    for (var i = 0; i < sheets.length; i++) {
      var sh = sheets[i];
      var kind = sheetKind(sh, sheetTriggers.get(sh) || lastTrigger);
      if (!kind) {
        sheetTriggers.delete(sh);
        if (sh.classList.contains("agy-compact-sheet")) {
          sh.classList.remove("agy-compact-sheet", "agy-tight-menu");
          ["left", "top", "bottom", "width"].forEach(function (k) { sh.style.removeProperty(k); });
        }
        continue;
      }
      if (!sheetTriggers.has(sh) && lastTrigger && lastTrigger.isConnected) sheetTriggers.set(sh, lastTrigger);
      sh.classList.add("agy-compact-sheet");
      var layer = sh.parentElement;
      var z = layer ? parseInt(getComputedStyle(layer).zIndex, 10) : NaN;
      for (var k = 0; k < backs.length; k++) {
        if (parseInt(getComputedStyle(backs[k]).zIndex, 10) === z - 1) compactBacks.add(backs[k]);
      }
      var viewport = window.visualViewport;
      var vw = window.innerWidth, vh = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      var trigger = sheetTriggers.get(sh);
      var r = trigger && trigger.isConnected ? trigger.getBoundingClientRect() : null;
      var tw = r ? r.width : 0;
      // Width like Out27: short menus min(188, max(trigger, 124)); selects = trigger width; else content width.
      var ls = lines(sh);
      var short = ls.length > 0 && ls.every(function (x) { return x.length <= 26; });
      var w;
      if (kind === "select" && tw >= 60) w = tw;
      else if (short) w = Math.round(Math.min(188, Math.max(tw, 124)));
      else w = 0;
      sh.classList.toggle("agy-tight-menu", short);
      if (w) sh.style.setProperty("width", Math.min(w, vw - 16) + "px", "important");
      else sh.style.removeProperty("width");
      var rect = sh.getBoundingClientRect();
      var ww = rect.width, h = rect.height;
      var left, placeAbove = false, top = 0, bottom = 0;
      if (r) {
        if (kind === "select") left = r.left;
        else left = (r.left + r.width / 2 > vw / 2) ? r.right - ww : r.left;
        var spaceBelow = vh - r.bottom - 8, spaceAbove = r.top - 8;
        placeAbove = spaceBelow < Math.min(h, 260) && spaceAbove > spaceBelow;
        if (placeAbove) bottom = Math.round(window.innerHeight - r.top + 6);
        else top = Math.round(r.bottom + 6);
      } else {
        left = (vw - ww) / 2; placeAbove = true; bottom = 16;
      }
      left = Math.max(8, Math.min(left, vw - ww - 8));
      sh.style.setProperty("left", Math.round(left) + "px", "important");
      if (placeAbove) {
        sh.style.setProperty("bottom", bottom + "px", "important");
        sh.style.setProperty("top", "auto", "important");
        sh.style.setProperty("max-height", Math.max(120, (r ? r.top : vh) - 14) + "px", "important");
      } else {
        sh.style.setProperty("top", top + "px", "important");
        sh.style.setProperty("bottom", "auto", "important");
        sh.style.setProperty("max-height", Math.max(120, vh - top - 8) + "px", "important");
      }
    }
    for (var b = 0; b < backs.length; b++) backs[b].classList.toggle("agy-compact-backdrop", compactBacks.has(backs[b]));
  }
  var compactRaf = 0;
  function scheduleCompact() { if (!compactRaf) compactRaf = requestAnimationFrame(function () { compactRaf = 0; layoutCompact(); }); }
  new MutationObserver(scheduleCompact).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleCompact, { passive: true });
  window.addEventListener("scroll", scheduleCompact, { passive: true });
  document.addEventListener("scroll", scheduleCompact, { passive: true, capture: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleCompact, { passive: true });
    window.visualViewport.addEventListener("scroll", scheduleCompact, { passive: true });
  }
  if (window.ResizeObserver) {
    var composerObserver = new ResizeObserver(scheduleCompact);
    function watchComposer() {
      var box = document.querySelector(BOX);
      if (box && !box.__agyCompactObserved) { box.__agyCompactObserved = true; composerObserver.observe(box); }
    }
    new MutationObserver(watchComposer).observe(document.documentElement, { childList: true, subtree: true });
    watchComposer();
  }

})();

/* ===================================================================== *
 * Provider-mode voice input (local, on-device) — drives the NATIVE mic button.
 *
 * In provider mode the core's own Gemini transcription is unavailable, so the
 * core streaming path can't work. Instead of a separate button, we hijack the
 * app's own mic button: when it is tapped in provider mode we intercept the tap
 * in the capture phase (React's handler never runs), drive Android's on-device
 * SpeechRecognizer (AgySTT bridge — no key, no cost) and insert the recognised
 * text straight into the chat editor. In standard mode we do nothing and the
 * button behaves exactly as before.
 *
 * The native mic button is `vA`: <button aria-label="Record voice memo"> (or
 * "Stop recording" while recording). We match it by that aria-label.
 * ===================================================================== */
(function () {
  // Prefer the offline streaming engine (Vosk: continuous, no beep, no reconnect)
  // when the model is bundled; otherwise fall back to the system SpeechRecognizer
  // (AgySTT: one phrase per tap). Both expose the same poll protocol, so the UI
  // below is identical for either.
  function voskReady() { try { return !!(window.AgyVosk && window.AgyVosk.available && window.AgyVosk.available()); } catch (e) { return false; } }
  var VOSK = voskReady() ? window.AgyVosk : null;   // offline streaming (preferred)
  var SYS = window.AgySTT || null;                   // system recognizer (fallback)
  if (!VOSK && !SYS) return;
  var BOX = "[data-testid='agent-input-box']";
  var MIC_SEL = 'button[aria-label="Record voice memo"],button[aria-label="Stop recording"],button[aria-label="Записать голосовое сообщение"],button[aria-label="Остановить запись"]';
  var listening = false, pollTimer = null, liveBtn = null, lastPartial = "", gotFinal = false;
  var curEng = null, sawEvent = false, wdTimer = 0;

  function providerMode() {
    try { var s = window.__agyProviderSpecs && window.__agyProviderSpecs(); return !!(s && s.length); }
    catch (e) { return false; }
  }
  function editorEl() {
    var box = document.querySelector(BOX);
    if (!box) return null;
    return box.querySelector("[contenteditable='true']") || box.querySelector("textarea");
  }
  function placeCaret(ed) {
    // execCommand("insertText") needs a live selection INSIDE the editor;
    // tapping the mic button leaves the caret elsewhere, so put it at the end.
    try {
      var sel = window.getSelection();
      if (!sel) return;
      if (!sel.rangeCount || !ed.contains(sel.anchorNode)) {
        var r = document.createRange();
        r.selectNodeContents(ed); r.collapse(false);
        sel.removeAllRanges(); sel.addRange(r);
      }
    } catch (e) {}
  }
  function insertText(text) {
    var ed = editorEl();
    if (!ed) return false;
    try { ed.focus(); } catch (e) {}
    placeCaret(ed);
    var ok = false;
    try { ok = document.execCommand("insertText", false, text); } catch (e) {}
    if (!ok) {
      try {
        ed.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: text, bubbles: true, cancelable: true }));
        ed.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: text, bubbles: true }));
        ok = true;
      } catch (e2) {}
    }
    return ok;
  }
  function mark(on) {
    // Visual feedback on the native button (re-applied each poll tick, since React re-renders).
    var b = liveBtn && liveBtn.isConnected ? liveBtn : document.querySelector(MIC_SEL);
    if (!b) return;
    if (on) b.classList.add("agy-stt-live"); else b.classList.remove("agy-stt-live");
  }
  function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } mark(false); }
  // If an utterance produced only interim results (no final arrived), commit the
  // last interim so speech is never silently lost.
  function flushPartial() {
    if (!gotFinal && lastPartial) { insertText(lastPartial.replace(/\s+$/, "") + " "); }
    lastPartial = ""; gotFinal = false;
  }
  function startPoll() {
    stopPoll();
    pollTimer = setInterval(function () {
      if (listening) mark(true);
      var e; try { e = curEng ? curEng.pollStt() : ""; } catch (err) { e = ""; }
      if (!e) return;
      sawEvent = true;
      var tag = e.charAt(0);
      if (tag === "F") { var t = e.slice(2); if (t) { insertText(t.replace(/\s+$/, "") + " "); gotFinal = true; } lastPartial = ""; }
      else if (tag === "P") { lastPartial = e.slice(2); }       // remember newest interim
      else if (tag === "R" || tag === "B") { lastPartial = ""; gotFinal = false; } // new utterance
      else if (tag === "E") {
        // Offline engine failed (e.g. model/native-lib load) -> fall back to the
        // system recogniser instead of dying.
        if (curEng === VOSK && SYS && listening) { clearWd(); lastPartial = ""; gotFinal = false; engStart(SYS); }
        else { flushPartial(); listening = false; stopPoll(); }
      }
      else if (tag === "X") {
        // Vosk "X" only on real stop; but if it ended without ever producing a
        // result and we have a fallback, switch to it.
        if (curEng === VOSK && SYS && listening && !gotFinal && !lastPartial) { clearWd(); engStart(SYS); }
        else { flushPartial(); listening = false; stopPoll(); }
      }
    }, 180);
  }
  function dictCfg() { try { return (window.__agyDictationCfg && window.__agyDictationCfg()) || {}; } catch (e) { return {}; } }
  function uiLang() {
    // Dictation language: the explicit choice from the Dictation tab, else the
    // app's UI language (agy_i18n sets <html data-agy-language="ru|en">).
    var c = dictCfg();
    if (c.lang === "ru") return "ru-RU";
    if (c.lang === "en") return "en-US";
    var l;
    try { l = (document.documentElement.getAttribute("data-agy-language") || "ru").toLowerCase(); } catch (e) { l = "ru"; }
    return l.indexOf("en") === 0 ? "en-US" : "ru-RU";
  }
  function pickEngine() {
    // Engine from the Dictation tab: system / vosk / auto (Vosk if present).
    var c = dictCfg();
    if (c.engine === "system") return SYS || VOSK;
    if (c.engine === "vosk") return VOSK || SYS;
    return VOSK || SYS;
  }
  function clearWd() { if (wdTimer) { clearTimeout(wdTimer); wdTimer = 0; } }
  function engStart(eng) {
    curEng = eng; sawEvent = false;
    try { eng.ensurePermission && eng.ensurePermission(); } catch (e) {}
    var r = "ERR"; try { r = eng.start(uiLang()); } catch (e) {}
    return !(typeof r === "string" && r.indexOf("ERR") === 0);
  }
  function startListening(btn) {
    liveBtn = btn || null;
    var eng = pickEngine();
    if (!eng) { listening = false; return; }
    if (!engStart(eng)) { listening = false; return; } // e.g. permission just requested — tap again
    listening = true;
    var ed = editorEl(); if (ed) try { ed.focus(); } catch (e) {}
    mark(true); startPoll();
    // Watchdog: if the offline engine (Vosk) produces nothing (e.g. native lib
    // failed to load), fall back to the system recogniser so the mic still works.
    clearWd();
    if (eng === VOSK && SYS) {
      wdTimer = setTimeout(function () {
        if (listening && !sawEvent) {
          try { VOSK.stop && VOSK.stop(); } catch (e) {}
          lastPartial = ""; gotFinal = false;
          engStart(SYS);
        }
      }, 4500);
    }
  }
  function stopListening() {
    if (!listening) return;
    clearWd();
    try { if (curEng) curEng.stop(); } catch (e) {}
    listening = false;
    flushPartial();
    setTimeout(stopPoll, 600);
  }
  function toggle(btn) { if (listening) stopListening(); else startListening(btn); }

  // Capture-phase: intercept the native mic tap BEFORE React, only in provider mode.
  document.addEventListener("click", function (e) {
    if (!providerMode()) return;
    if (dictCfg().enabled === false) return;   // voice input turned off in the Dictation tab
    var b = e.target && e.target.closest && e.target.closest(MIC_SEL);
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    toggle(b);
  }, true);

  // Hard stop: cancel recognition immediately and clear state. Used whenever the
  // app is backgrounded or the chat is left, so the recogniser never keeps
  // running (and beeping) off-screen.
  function hardStop() {
    clearWd();
    try { if (curEng) { if (curEng.cancel) curEng.cancel(); else curEng.stop(); } } catch (e) {}
    listening = false; lastPartial = ""; gotFinal = false; stopPoll();
  }
  // App backgrounded / tab hidden -> stop at once (this was the "keeps beeping in
  // the background" bug: we only stopped when leaving provider mode before).
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible" && listening) hardStop();
  });
  window.addEventListener("pagehide", function () { if (listening) hardStop(); }, true);
  window.addEventListener("blur", function () { if (listening && document.visibilityState !== "visible") hardStop(); }, true);
  // Also stop if we are no longer in a provider-mode chat.
  setInterval(function () {
    if (listening && (!providerMode() || !document.querySelector(BOX))) hardStop();
  }, 1200);

})();
