/* Antigravity RU — security shield in the chat toolbar (ТЗ §7, B-16, B-17).
 * Reads and writes the real 2.4.1 settings store (exported from the bundle as
 * window.__agySettings), so every change shows up in Settings and back.
 * The popover is one fixed element of its own: no full-screen layer, nothing
 * is styled outside it, and it is removed on close. */
(function () {
  "use strict";
  if (window.__agyShield) return;
  window.__agyShield = true;

  var BOX = "[data-testid='agent-input-box']";
  var SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>';

  function ru() {
    try { return window.__agyI18n ? window.__agyI18n.getLanguage() === "ru" : document.documentElement.getAttribute("data-agy-language") === "ru"; }
    catch (e) { return true; }
  }
  function T(r, e) { return ru() ? r : e; }
  function tr(s) { try { return window.__agyI18n ? window.__agyI18n.translate(s) : s; } catch (e) { return s; } }

  function api() {
    var x = window.__agySettings;
    if (!x || !x.store || !x.store.getState) return null;
    var st = x.store.getState();
    if (!st || typeof st.getPrefValue !== "function" || typeof st.setPrefValue !== "function") return null;
    return x;
  }
  function get(key) { var x = api(); return x ? x.store.getState().getPrefValue(x.Ui[key]) : undefined; }
  function set(key, v) { var x = api(); if (x) x.store.getState().setPrefValue(x.Ui[key], v); }

  function osGroup(x) { var os = x.qq(); return os === "macos" || os === "linux" ? "macos_linux" : "windows"; }

  /* --- reliable persistence for policy fields -----------------------------
   * In 2.4.1 the JS settings store cannot round-trip userSettings policy
   * fields (its proto schema predates internetAccessPolicy), so a pick used
   * to write nothing and the row snapped back ("Доступ в интернет" always
   * returned to "Всегда спрашивать"; the agent kept asking for approvals
   * although the shield showed the right values). Every pick now:
   *   1. normalises enum values (numbers AND config strings like
   *      "AGENT_SETTING_POLICY_ALLOW" match the option list);
   *   2. mirrors the pick into localStorage (instant, sticky UI);
   *   3. persists it to config.json via the AgyTools bridge (agy-tools.sh
   *      policy) — the Go core watches the file and applies the value. */
  function normEnum(v, E) {
    if (typeof v !== "string") return v;
    var u = v.toUpperCase(), best, bl = -1;
    for (var k in E) {
      if (typeof E[k] !== "number") continue;
      if (u.length >= k.length && u.lastIndexOf(k) === u.length - k.length && k.length > bl) { best = E[k]; bl = k.length; }
    }
    return best !== undefined ? best : E.UNSPECIFIED;
  }
  var OVK = "agyShieldOv";
  function ovAll() { try { return JSON.parse(window.localStorage.getItem(OVK) || "{}"); } catch (e) { return {}; } }
  function ovGet(id) { var o = ovAll(); return o[id]; }
  function ovSet(id, v) { try { var o = ovAll(); o[id] = v; window.localStorage.setItem(OVK, JSON.stringify(o)); } catch (e) {} }
  var pickAt = {};   // section id -> ms timestamp of the last user pick
  var SECTIONS_CFG = {
    file: { field: "nonWorkspaceFileAccessPolicy", prefix: "AGENT_SETTING_POLICY" },
    net:  { field: "internetAccessPolicy", prefix: "AGENT_SETTING_POLICY" },
    term: { field: "autoExecutionPolicy", prefix: "CASCADE_COMMANDS_AUTO_EXECUTION" },
    sbx:  { field: "enableTerminalSandbox", bool: true },
    js:   { field: "browserJsExecutionPolicy", prefix: "BROWSER_JS_EXECUTION_POLICY" }
  };
  function cfgStr(cfg, v) {
    if (cfg.bool) return v ? "true" : "false";
    return cfg.prefix + "_" + cfg.E[v];
  }
  function cfgValueFromStr(cfg, s) {
    if (cfg.bool) return String(s).toLowerCase() === "true";
    return normEnum(s, cfg.E);
  }
  function bridgePolicy(arg, done) {
    var b = window.AgyTools;
    if (!b || typeof b.start !== "function") { if (done) done(null); return; }
    var id;
    try { id = b.start("policy", arg); } catch (e) { if (done) done(null); return; }
    if (!id || /^ERR/.test(String(id))) { if (done) done(null); return; }
    var t0 = Date.now();
    (function poll() {
      var r = null;
      try { r = JSON.parse(b.read(id) || "{}"); } catch (e) {}
      if (r && r.rc !== undefined && r.rc !== "") { if (done) done(r); return; }
      if (Date.now() - t0 > 15000) { if (done) done(null); return; }
      setTimeout(poll, 300);
    })();
  }
  /* Pull the authoritative values from config.json and refresh the overlays —
     but never fight a pick the user made in the last seconds. */
  function syncFromBridge() {
    bridgePolicy("", function (r) {
      if (!r || !r.log) return;
      var changed = false;
      (String(r.log).match(/@@kv \S+ \S*/g) || []).forEach(function (line) {
        var m = /^@@kv (\S+) (\S*)$/.exec(line); if (!m) return;
        for (var id in SECTIONS_CFG) {
          var cfg = SECTIONS_CFG[id];
          if (cfg.field !== m[1]) continue;
          if (pickAt[id] && Date.now() - pickAt[id] < 3000) continue;
          ovSet(id, cfgValueFromStr(cfg, m[2])); changed = true;
        }
      });
      if (changed && pop) render();
    });
  }
  function mirrorPick(id, v) {
    var cfg = SECTIONS_CFG[id]; if (!cfg) return;
    pickAt[id] = Date.now();
    ovSet(id, v);
    bridgePolicy(cfg.field + "=" + cfgStr(cfg, v));
  }

  function sections() {
    var x = api(); if (!x) return null;
    var I = x.I, CAE = I.CascadeCommandsAutoExecution, ASP = I.AgentSettingPolicy, JS = I.BrowserJsExecutionPolicy;
    SECTIONS_CFG.file.E = ASP; SECTIONS_CFG.net.E = ASP;
    SECTIONS_CFG.term.E = CAE; SECTIONS_CFG.js.E = JS;
    var sandbox = get("ENABLE_TERMINAL_SANDBOX");
    var term = normEnum(get("CASCADE_AUTO_EXECUTION_POLICY"), CAE);
    var file = normEnum(get("NON_WORKSPACE_FILE_ACCESS_POLICY"), ASP);
    if (file === undefined || file === ASP.UNSPECIFIED) file = ASP.ASK;
    var js = normEnum(get("BROWSER_JS_EXECUTION_POLICY"), JS);
    var net = normEnum(get("INTERNET_ACCESS_POLICY"), ASP);
    if (net === undefined || net === ASP.UNSPECIFIED) net = ASP.ASK;
    if (js === undefined || js === JS.UNSPECIFIED) js = JS.ALWAYS_ASK;
    if (ovGet("sbx") !== undefined) sandbox = ovGet("sbx");
    if (ovGet("term") !== undefined) term = ovGet("term");
    if (ovGet("file") !== undefined) file = ovGet("file");
    if (ovGet("net") !== undefined) net = ovGet("net");
    if (ovGet("js") !== undefined) js = ovGet("js");
    var presets = x.hEa[x.qq()].presets;
    var cur = x.iEa(sandbox === undefined ? false : sandbox, term, file, presets);
    var labels = x.Mt[osGroup(x)];
    var presetOpts = presets.map(function (p) {
      return { v: p, label: tr(labels[p].displayName), desc: tr(labels[p].shortDescription) };
    });
    presetOpts.push({ v: "custom", label: T("Пользовательский", "Custom"), desc: T("Настройте отдельные параметры вручную.", "Manually customize individual settings."), passive: true });
    return [
      { id: "preset", title: T("Профиль безопасности", "Security preset"), value: cur, opts: presetOpts,
        pick: function (v) {
          var p = x.gEa[v]; if (!p) return;
          set("ENABLE_TERMINAL_SANDBOX", p.sandboxMode);
          set("CASCADE_AUTO_EXECUTION_POLICY", p.terminal);
          set("NON_WORKSPACE_FILE_ACCESS_POLICY", p.fileAccess);
        } },
      { id: "file", title: T("Доступ к файлам вне папок", "Non-workspace file access"), value: file, opts: [
          { v: ASP.ASK, label: T("Всегда спрашивать", "Always ask") },
          { v: ASP.ALLOW, label: T("Разрешить", "Allow") },
          { v: ASP.DENY, label: T("Запретить", "Deny") }],
        pick: function (v) { set("NON_WORKSPACE_FILE_ACCESS_POLICY", v); } },
      { id: "net", title: T("Доступ в интернет", "Internet access"), value: net, opts: [
          { v: ASP.ASK, label: T("Всегда спрашивать", "Always ask") },
          { v: ASP.ALLOW, label: T("Разрешить", "Allow") },
          { v: ASP.DENY, label: T("Запретить", "Deny") }],
        pick: function (v) { set("INTERNET_ACCESS_POLICY", v); } },
      { id: "term", title: T("Автовыполнение команд терминала", "Terminal auto execution"), value: term, opts: [
          { v: CAE.OFF, label: T("Требовать подтверждение", "Request review") },
          { v: CAE.PROCEED_IN_SANDBOX, label: T("Выполнять в песочнице", "Proceed in sandbox") },
          { v: CAE.EAGER, label: T("Не спрашивать", "Always proceed") }],
        pick: function (v) {
          set("CASCADE_AUTO_EXECUTION_POLICY", v);
          // Android has no bwrap: a sandboxed command fails and falls back to
          // "run outside sandbox", which always asks. "Always proceed" therefore
          // also turns the sandbox off; "Proceed in sandbox" turns it on.
          if (v === CAE.EAGER) set("ENABLE_TERMINAL_SANDBOX", false);
          if (v === CAE.PROCEED_IN_SANDBOX) set("ENABLE_TERMINAL_SANDBOX", true);
        } },
      { id: "sbx", title: T("Песочница", "Sandbox"), value: sandbox === true, opts: [
          { v: false, label: T("Выключена", "Off"), desc: T("Команды выполняются напрямую. Нужно для работы без подтверждений на Android.", "Commands run directly. Required for no-approval mode on Android.") },
          { v: true, label: T("Включена", "On"), desc: T("На Android не работает (нет bwrap): каждая команда будет запрашивать запуск вне песочницы.", "Does not work on Android (no bwrap): every command will ask to run outside the sandbox.") }],
        pick: function (v) { set("ENABLE_TERMINAL_SANDBOX", v); } },
      { id: "js", title: T("JavaScript в браузере", "Browser JavaScript"), value: js, opts: [
          { v: JS.DISABLED, label: T("Отключено", "Disabled") },
          { v: JS.ALWAYS_ASK, label: T("Запрашивать подтверждение", "Ask first") },
          { v: JS.TURBO, label: T("Не спрашивать", "Always run") }],
        pick: function (v) { set("BROWSER_JS_EXECUTION_POLICY", v); } }
    ];
  }

  var pop = null, openId = null, unsub = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    if (!pop) return;
    var secs = sections();
    if (!secs) {
      pop.innerHTML = '<div class="agy-sh-empty">' + esc(T("Настройки ещё загружаются…", "Settings are still loading…")) + "</div>";
      return;
    }
    var h = "";
    secs.forEach(function (s) {
      var cur = s.opts.filter(function (o) { return o.v === s.value; })[0];
      var open = openId === s.id;
      h += '<div class="agy-sh-sec' + (open ? " open" : "") + '">' +
        '<button type="button" class="agy-sh-head" data-sec="' + s.id + '"><span class="agy-sh-title">' + esc(s.title) + '</span>' +
        '<span class="agy-sh-cur">' + esc(cur ? cur.label : "—") + '</span>' +
        '<svg class="agy-sh-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>';
      if (open) {
        h += '<div class="agy-sh-opts" role="listbox">';
        s.opts.forEach(function (o, i) {
          var sel = o.v === s.value;
          h += '<button type="button" role="option" aria-selected="' + sel + '" class="agy-sh-opt' + (sel ? " sel" : "") + (o.passive ? " passive" : "") +
            '" data-sec="' + s.id + '" data-i="' + i + '"><span class="agy-sh-ol"><span>' + esc(o.label) + "</span>" +
            (o.desc ? '<span class="agy-sh-od">' + esc(o.desc) + "</span>" : "") + "</span>" +
            (sel ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12l5 5 9-10"/></svg>' : "") + "</button>";
        });
        h += "</div>";
      }
      h += "</div>";
    });
    pop.innerHTML = h;
    place();
  }

  function place() {
    if (!pop) return;
    var box = document.querySelector(BOX);
    if (!box) { close(); return; }
    var r = box.getBoundingClientRect();
    // Strictly the width of the context (input) box — both edges aligned with
    // it. The old 360px cap made the popover fall short on the right whenever
    // the box was wider (the projects screen).
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var w = Math.min(r.width, vw - 8);
    var left = Math.max(4, Math.min(r.left, vw - w - 4));
    pop.style.width = Math.round(w) + "px";
    pop.style.left = Math.round(left) + "px";
    pop.style.bottom = Math.round(window.innerHeight - r.top + 6) + "px";
    pop.style.maxHeight = Math.max(160, Math.round(r.top - 64)) + "px";
  }

  function open(btn) {
    if (pop) { close(); return; }
    pop = document.createElement("div");
    pop.id = "agy-shield";
    pop.setAttribute("data-agy-no-translate", "");
    pop.addEventListener("pointerdown", function (e) { e.preventDefault(); });
    pop.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var id = b.getAttribute("data-sec");
      if (b.classList.contains("agy-sh-head")) { openId = openId === id ? null : id; render(); return; }
      var secs = sections(); if (!secs) return;
      var s = secs.filter(function (q) { return q.id === id; })[0];
      var o = s && s.opts[+b.getAttribute("data-i")];
      if (!o || o.passive) return;
      try { s.pick(o.v); } catch (err) {}
      if (s.id === "preset") {
        // preset pick writes three fields at once — mirror all of them
        var xx = api(), pp = xx && xx.gEa && xx.gEa[o.v];
        if (pp) {
          mirrorPick("sbx", pp.sandboxMode === true);
          mirrorPick("term", pp.terminal);
          mirrorPick("file", pp.fileAccess);
        }
      } else {
        mirrorPick(s.id, o.v);
      }
      setTimeout(render, 30);
    });
    document.body.appendChild(pop);
    btn.setAttribute("aria-expanded", "true");
    var x = api();
    if (x && x.store.onDidChange) { var d = x.store.onDidChange(function () { render(); }); unsub = function () { try { d.dispose(); } catch (e) {} }; }
    render();
    syncFromBridge();
  }

  function close() {
    if (unsub) { unsub(); unsub = null; }
    if (pop) { pop.remove(); pop = null; }
    var b = document.querySelector(".agy-shield-btn"); if (b) b.setAttribute("aria-expanded", "false");
  }
  window.__agyShieldClose = function () { if (!pop) return false; close(); return true; };

  document.addEventListener("pointerdown", function (e) {
    if (!pop) return;
    if (e.target.closest && (e.target.closest("#agy-shield") || e.target.closest(".agy-shield-btn"))) return;
    close();
  }, true);
  window.addEventListener("resize", function () { place(); });

  /* Button: first item of the right-hand group of the toolbar (next to mic). */
  function ensureButton() {
    // Footer row of the input box: [+ / model …] [mic, send]. The right group
    // is the last child of the "@container/input-footer" row.
    var plus = document.querySelector(BOX + " button[aria-label='Add context'], " + BOX + " button[aria-label='Добавить контекст']");
    var footer = plus && plus.closest("[class*='input-footer']");
    if (!footer) { if (pop && !document.querySelector(BOX)) close(); return; }
    var group = footer.lastElementChild;
    if (!group || group.contains(plus)) return;
    if (group.querySelector(".agy-shield-btn")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "agy-shield-btn";
    b.setAttribute("aria-label", T("Безопасность", "Security"));
    b.setAttribute("aria-expanded", "false");
    b.innerHTML = SVG;
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); });
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); open(b); });
    group.insertBefore(b, group.firstChild);
  }
  var raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; ensureButton(); if (pop) place(); }); }
  function start() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
