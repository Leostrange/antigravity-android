/* Antigravity RU — Settings › Tools (ТЗ 9.3, B-22).
 * Rendered into the "Tools" settings screen (main.js calls
 * window.__agyToolsMount(el)). Every action goes through the native
 * window.AgyTools bridge, which runs the bundled agy-tools.sh with a
 * validated operation; the page only polls the job log. */
(function () {
  "use strict";
  if (window.__agyToolsReady) return;
  window.__agyToolsReady = true;

  function ru() {
    try { return window.__agyI18n ? window.__agyI18n.getLanguage() === "ru" : true; } catch (e) { return true; }
  }
  function T(r, e) { return ru() ? r : e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

  /* ------------------------------------------------------------ catalog */
  // kind: pkg (Termux package via pkg), npm (global npm), sdk (sdkmanager id), ndk (full NDK)
  var GROUPS = [
    { id: "node", ru: "Node.js — плагины и расширения", en: "Node.js — plugins and extensions", items: [
      { id: "nodejs-lts", kind: "pkg", ru: "Node.js LTS + npm", en: "Node.js LTS + npm", dru: "Рекомендуется. Нужен для плагинов, MCP-серверов и расширений.", den: "Recommended. Required by plugins, MCP servers and extensions.", verify: "node,npm" },
      { id: "nodejs", kind: "pkg", ru: "Node.js (текущая версия)", en: "Node.js (current)", dru: "Вместо LTS, если нужна самая новая версия. Не ставить вместе с LTS.", den: "Instead of LTS when the newest version is needed. Do not install together with LTS.", verify: "node,npm" },
      { id: "yarn", kind: "pkg", ru: "Yarn", en: "Yarn", dru: "Менеджер пакетов JavaScript.", den: "JavaScript package manager." },
      { id: "pnpm", kind: "npm", ru: "pnpm", en: "pnpm", dru: "Устанавливается через npm -g.", den: "Installed with npm -g.", verify: "pnpm" },
      { id: "typescript", kind: "npm", ru: "TypeScript (tsc)", en: "TypeScript (tsc)", dru: "Компилятор TypeScript через npm -g.", den: "TypeScript compiler via npm -g.", verify: "tsc" }
    ] },
    { id: "build", ru: "Сборка нативного кода", en: "Native build tools", items: [
      { id: "clang", kind: "pkg", ru: "Clang / LLVM", en: "Clang / LLVM", dru: "C/C++ компилятор; нужен node-gyp и NDK-сборкам.", den: "C/C++ compiler; needed by node-gyp and NDK builds.", verify: "clang" },
      { id: "lld", kind: "pkg", ru: "LLD", en: "LLD", dru: "Линкер LLVM.", den: "LLVM linker." },
      { id: "make", kind: "pkg", ru: "Make", en: "Make", dru: "", den: "" },
      { id: "cmake", kind: "pkg", ru: "CMake", en: "CMake", dru: "", den: "", verify: "cmake" },
      { id: "ninja", kind: "pkg", ru: "Ninja", en: "Ninja", dru: "", den: "" },
      { id: "pkg-config", kind: "pkg", ru: "pkg-config", en: "pkg-config", dru: "", den: "" },
      { id: "binutils", kind: "pkg", ru: "Binutils", en: "Binutils", dru: "objdump, readelf, strip…", den: "objdump, readelf, strip…" },
      { id: "python", kind: "pkg", ru: "Python 3", en: "Python 3", dru: "Нужен node-gyp и многим скриптам.", den: "Needed by node-gyp and many scripts.", verify: "python" },
      { id: "python-pip", kind: "pkg", ru: "pip", en: "pip", dru: "", den: "" }
    ] },
    { id: "java", ru: "Java и Kotlin", en: "Java and Kotlin", items: [
      { id: "openjdk-17", kind: "pkg", ru: "OpenJDK 17", en: "OpenJDK 17", dru: "Для Gradle и Android Gradle Plugin 8.x.", den: "For Gradle and Android Gradle Plugin 8.x.", verify: "java,javac" },
      { id: "openjdk-21", kind: "pkg", ru: "OpenJDK 21", en: "OpenJDK 21", dru: "Новее; AGP 8.x работает и с 17.", den: "Newer; AGP 8.x works with 17 as well.", verify: "java,javac" },
      { id: "kotlin", kind: "pkg", ru: "Kotlin (kotlinc)", en: "Kotlin (kotlinc)", dru: "", den: "", verify: "kotlin" },
      { id: "gradle", kind: "pkg", ru: "Gradle", en: "Gradle", dru: "Сборка Android-проектов.", den: "Builds Android projects.", verify: "gradle" },
      { id: "maven", kind: "pkg", ru: "Maven", en: "Maven", dru: "", den: "" }
    ] },
    { id: "android", ru: "Android: сборка APK", en: "Android: APK build", items: [
      { id: "aapt", kind: "pkg", ru: "aapt", en: "aapt", dru: "Упаковка ресурсов (старый).", den: "Resource packaging (legacy)." },
      { id: "aapt2", kind: "pkg", ru: "aapt2", en: "aapt2", dru: "Нативный aapt2 — Gradle использует его вместо x86-версии.", den: "Native aapt2 — Gradle uses it instead of the x86 build.", verify: "aapt2" },
      { id: "d8", kind: "pkg", ru: "d8", en: "d8", dru: "Компиляция в DEX.", den: "DEX compiler.", verify: "d8" },
      { id: "apksigner", kind: "pkg", ru: "apksigner", en: "apksigner", dru: "Подпись APK v1–v4.", den: "APK signing v1–v4.", verify: "apksigner" },
      { id: "android-tools", kind: "pkg", ru: "adb / fastboot", en: "adb / fastboot", dru: "Отладка по Wi-Fi и через Shizuku.", den: "Debugging over Wi-Fi and via Shizuku.", verify: "adb" },
      { id: "apktool", kind: "pkg", ru: "apktool", en: "apktool", dru: "Разбор и сборка APK.", den: "Decode and rebuild APKs." },
      { id: "jadx", kind: "pkg", ru: "jadx", en: "jadx", dru: "Декомпилятор DEX → Java.", den: "DEX → Java decompiler." }
    ] },
    { id: "sdk", ru: "Android SDK", en: "Android SDK", note: { ru: "Загружается с dl.google.com через sdkmanager. Нужен OpenJDK — поставится сам. x86-бинарники build-tools заменяются нативными aapt/aapt2/zipalign.", en: "Downloaded from dl.google.com with sdkmanager. Needs OpenJDK (installed automatically). x86 build-tools binaries are replaced with native aapt/aapt2/zipalign." }, items: [
      { id: "platforms;android-35", kind: "sdk", ru: "Платформа Android 15 (API 35)", en: "Android 15 platform (API 35)", dru: "android.jar для компиляции.", den: "android.jar for compilation." },
      { id: "platforms;android-34", kind: "sdk", ru: "Платформа Android 14 (API 34)", en: "Android 14 platform (API 34)", dru: "", den: "" },
      { id: "build-tools;35.0.0", kind: "sdk", ru: "Build-tools 35.0.0", en: "Build-tools 35.0.0", dru: "Нужны Gradle (d8, lib).", den: "Required by Gradle (d8, lib)." },
      { id: "build-tools;34.0.0", kind: "sdk", ru: "Build-tools 34.0.0", en: "Build-tools 34.0.0", dru: "", den: "" }
    ] },
    { id: "ndk", ru: "Android NDK", en: "Android NDK", items: [
      { id: "ndk-sysroot", kind: "pkg", ru: "NDK sysroot", en: "NDK sysroot", dru: "Заголовки и библиотеки Android для clang.", den: "Android headers and libraries for clang." },
      { id: "ndk-multilib", kind: "pkg", ru: "NDK multilib", en: "NDK multilib", dru: "Библиотеки для arm, x86, x86_64.", den: "Libraries for arm, x86, x86_64." },
      { id: "ndk-full", kind: "ndk", ru: "Полный NDK (сборка Termux)", en: "Full NDK (Termux build)", dru: "ndk-build и CMake toolchain для Gradle. ~1 ГБ, из github.com/lzhiyong/termux-ndk.", den: "ndk-build and CMake toolchain for Gradle. ~1 GB, from github.com/lzhiyong/termux-ndk.", verify: "ndk" }
    ] },
    { id: "lang", ru: "Другие языки", en: "Other languages", items: [
      { id: "rust", kind: "pkg", ru: "Rust (cargo)", en: "Rust (cargo)", dru: "", den: "", verify: "rust" },
      { id: "golang", kind: "pkg", ru: "Go", en: "Go", dru: "", den: "", verify: "go" }
    ] },
    { id: "util", ru: "Git и утилиты", en: "Git and utilities", items: [
      { id: "git", kind: "pkg", ru: "Git", en: "Git", dru: "", den: "", verify: "git" },
      { id: "gh", kind: "pkg", ru: "GitHub CLI", en: "GitHub CLI", dru: "", den: "" },
      { id: "openssh", kind: "pkg", ru: "OpenSSH", en: "OpenSSH", dru: "", den: "" },
      { id: "curl", kind: "pkg", ru: "curl", en: "curl", dru: "", den: "" },
      { id: "wget", kind: "pkg", ru: "wget", en: "wget", dru: "", den: "" },
      { id: "zip", kind: "pkg", ru: "zip", en: "zip", dru: "", den: "" },
      { id: "unzip", kind: "pkg", ru: "unzip", en: "unzip", dru: "", den: "" },
      { id: "jq", kind: "pkg", ru: "jq", en: "jq", dru: "", den: "" },
      { id: "ripgrep", kind: "pkg", ru: "ripgrep (rg)", en: "ripgrep (rg)", dru: "", den: "" },
      { id: "fd", kind: "pkg", ru: "fd", en: "fd", dru: "", den: "" },
      { id: "tree", kind: "pkg", ru: "tree", en: "tree", dru: "", den: "" }
    ] }
  ];
  var PRESETS = [
    { id: "plugins", ru: "Плагины приложения", en: "App plugins", dru: "Node.js LTS, Python, clang, make", den: "Node.js LTS, Python, clang, make",
      items: ["nodejs-lts", "python", "clang", "make", "pkg-config"] },
    { id: "apk", ru: "Android-приложение (Gradle)", en: "Android app (Gradle)", dru: "OpenJDK 17, Gradle, Kotlin, aapt2, d8, apksigner, SDK 35", den: "OpenJDK 17, Gradle, Kotlin, aapt2, d8, apksigner, SDK 35",
      items: ["openjdk-17", "gradle", "kotlin", "aapt", "aapt2", "d8", "apksigner", "android-tools", "platforms;android-35", "build-tools;35.0.0"] },
    { id: "native", ru: "Нативный код (NDK)", en: "Native code (NDK)", dru: "clang, CMake, Ninja, NDK sysroot/multilib", den: "clang, CMake, Ninja, NDK sysroot/multilib",
      items: ["clang", "lld", "cmake", "ninja", "make", "ndk-sysroot", "ndk-multilib"] }
  ];
  var ITEMS = {};
  GROUPS.forEach(function (g) { g.items.forEach(function (it) { it.group = g.id; ITEMS[it.id] = it; }); });

  /* ------------------------------------------------------------ state */
  var host = null, root = null;
  var status = {};          // id -> {avail, inst}
  var special = { cmdline: false, platforms: {}, buildtools: {}, ndk: [] };
  var checks = {};          // verify name -> {ok, text}
  var selected = {};
  var job = null;           // {id, op, label, log, rc}
  var queue = [];
  var logOpen = false;
  var loaded = false;

  function bridge() { return window.AgyTools && typeof window.AgyTools.start === "function" ? window.AgyTools : null; }

  function installed(it) {
    if (it.kind === "pkg") { var s = status[it.id]; return !!(s && s.inst && s.inst !== "-"); }
    if (it.kind === "sdk") { var p = it.id.split(";"); return p[0] === "platforms" ? !!special.platforms[p[1]] : !!special.buildtools[p[1]]; }
    if (it.kind === "ndk") return special.ndk.length > 0;
    if (it.kind === "npm") { var n = status["npm:" + it.id]; return !!(n && n.inst); }
    return false;
  }
  function availability(it) {
    if (it.kind !== "pkg") return true;
    var s = status[it.id];
    return !hasIndex || !s || s.avail !== "-";
  }

  /* ------------------------------------------------------------ jobs */
  function run(op, arg, label, after) {
    queue.push({ op: op, arg: arg || "", label: label, after: after });
    if (!job) next();
    render();
  }
  function next() {
    var q = queue.shift();
    if (!q) { job = null; render(); return; }
    var b = bridge();
    if (!b) { job = { op: q.op, label: q.label, log: T("Нативный мост AgyTools недоступен.", "Native AgyTools bridge is not available."), rc: "1", after: q.after }; finish(); return; }
    var id = b.start(q.op, q.arg);
    if (!id || /^ERR/.test(id)) {
      job = { op: q.op, label: q.label, log: T("Не удалось запустить: ", "Could not start: ") + String(id), rc: "1", after: q.after };
      finish();
      return;
    }
    job = { id: id, op: q.op, arg: q.arg, label: q.label, log: "", rc: "", after: q.after, t0: Date.now() };
    store("agyToolsJob", JSON.stringify({ id: id, op: q.op, arg: q.arg, label: q.label }));

    poll();
  }
  var pollTimer = 0;
  function poll() {
    clearTimeout(pollTimer);
    if (!job || !job.id) return;
    var b = bridge(); if (!b) return;
    var r = {};
    try { r = JSON.parse(b.read(job.id) || "{}"); } catch (e) {}
    job.log = r.log || job.log || "";
    if (r.rc !== undefined && r.rc !== "") { job.rc = r.rc; finish(); return; }
    renderLog();
    pollTimer = setTimeout(poll, job.op === "status" ? 400 : 700);
  }
  function finish() {
    var j = job;
    store("agyToolsJob", null);
    parse(j);
    if ((j.op !== "status" && j.op !== "verify") || j.rc !== "0") {
      j.done = true;
      lastDone = j;
      if (j.rc !== "0") logOpen = true;
    }
    if (typeof j.after === "function") { try { j.after(j); } catch (e) {} }
    job = null;
    next();
    render();
  }
  var lastDone = null;

  function parse(j) {
    if (j.op === "status") special = { cmdline: false, platforms: {}, buildtools: {}, ndk: [] };
    (j.log || "").split("\n").forEach(function (line) {
      var m;
      if ((m = /^@@pkg (\S+) (\S+) (\S+)/.exec(line))) status[m[1]] = { avail: m[2], inst: m[3] };
      else if ((m = /^@@special cmdline-tools (\S+)/.exec(line))) special.cmdline = m[1] === "ok";
      else if ((m = /^@@special platform (\S+)/.exec(line))) special.platforms[m[1]] = true;
      else if ((m = /^@@special build-tools (\S+)/.exec(line))) special.buildtools[m[1]] = true;
      else if ((m = /^@@special ndk (\S+)/.exec(line))) { if (special.ndk.indexOf(m[1]) < 0) special.ndk.push(m[1]); }
      else if ((m = /^@@(ok|fail) (\S+) ?(.*)$/.exec(line))) checks[m[2]] = { ok: m[1] === "ok", text: m[3] };
      else if ((m = /^@@npm (\S+) (\S+)/.exec(line))) status["npm:" + m[1]] = { inst: m[2] !== "-" };
      else if ((m = /^@@index (\S+)/.exec(line))) hasIndex = m[1] === "ok";
    });
    saveCache();
  }
  var hasIndex = true;
  function saveCache() {
    store("agyToolsCache", JSON.stringify({ t: Date.now(), status: status, special: special, checks: checks, hasIndex: hasIndex }));
  }
  function loadCache() {
    var c = null;
    try { c = JSON.parse(store("agyToolsCache") || "null"); } catch (e) {}
    if (!c) return false;
    status = c.status || {}; special = c.special || special; checks = c.checks || {}; hasIndex = c.hasIndex !== false;
    loaded = true;
    return true;
  }

  function refresh(withVerify) {
    var names = [];
    GROUPS.forEach(function (g) { g.items.forEach(function (it) { if (it.kind === "pkg") names.push(it.id); }); });
    run("status", names.join(","), T("Обновление состояния", "Refreshing status"), function () {
      loaded = true;
      if (!withVerify) return;
      var v = [];
      GROUPS.forEach(function (g) { g.items.forEach(function (it) { if (it.verify && installed(it)) v = v.concat(it.verify.split(",")); }); });
      v = v.filter(function (x, i) { return v.indexOf(x) === i; });
      if (v.length) run("verify", v.join(","), T("Самопроверка", "Self-test"));
    });
  }

  function installIds(ids) {
    var pk = [], sdk = [], npm = [], ndk = false;
    ids.forEach(function (id) {
      var it = ITEMS[id]; if (!it) return;
      if (it.kind === "pkg") { if (availability(it)) pk.push(id); }
      else if (it.kind === "sdk") sdk.push(id);
      else if (it.kind === "npm") npm.push(id);
      else if (it.kind === "ndk") ndk = true;
    });
    if (pk.length) run("install", pk.join(" "), T("Установка: ", "Install: ") + pk.join(", "));
    if (npm.length) run("npm", npm.join(" "), "npm -g " + npm.join(" "));
    if (sdk.length) run("sdk", sdk.join(" "), "sdkmanager " + sdk.join(" "));
    if (ndk) run("ndk", "", T("Полный NDK", "Full NDK"));
    refresh(true);
  }
  function removeId(id) {
    var it = ITEMS[id]; if (!it) return;
    if (it.kind === "pkg") run("remove", id, T("Удаление: ", "Remove: ") + id);
    else if (it.kind === "sdk") run("sdkremove", id, T("Удаление: ", "Remove: ") + id);
    else if (it.kind === "ndk") run("ndkremove", "", T("Удаление NDK", "Remove NDK"));
    else return;
    refresh(true);
  }

  /* ------------------------------------------------------------ render */
  function badge(it) {
    if (job && job.arg && (" " + job.arg.replace(/,/g, " ") + " ").indexOf(" " + it.id + " ") >= 0 && /install|sdk|npm/.test(job.op))
      return '<span class="agy-t-badge run">' + esc(T("Устанавливается…", "Installing…")) + "</span>";
    if (it.kind === "pkg") {
      var s = status[it.id];
      if (!loaded || !s) return '<span class="agy-t-badge">…</span>';
      if (s.inst !== "-") return '<span class="agy-t-badge ok">' + esc(T("Установлено ", "Installed ") + s.inst) + "</span>";
      if (s.avail === "-") return '<span class="agy-t-badge off">' + esc(T("Нет в репозитории", "Not in repository")) + "</span>";
      return '<span class="agy-t-badge">' + esc(T("Доступно ", "Available ") + s.avail) + "</span>";
    }
    if (!loaded) return '<span class="agy-t-badge">…</span>';
    return installed(it) ? '<span class="agy-t-badge ok">' + esc(T("Установлено", "Installed")) + "</span>"
                         : '<span class="agy-t-badge">' + esc(T("Не установлено", "Not installed")) + "</span>";
  }
  function checkLine(it) {
    if (!it.verify || !installed(it)) return "";
    var out = "";
    it.verify.split(",").forEach(function (v) {
      var c = checks[v]; if (!c) return;
      out += '<div class="agy-t-check ' + (c.ok ? "ok" : "bad") + '">' + (c.ok ? "✓ " : "✗ ") + esc(v + ": " + c.text) + "</div>";
    });
    return out;
  }

  function render() {
    if (!root || !root.isConnected) return;
    var busy = !!job || queue.length > 0;
    var nsel = Object.keys(selected).filter(function (k) { return selected[k]; }).length;
    var h = '<div class="agy-t-head"><div class="agy-t-title">' + esc(T("Инструменты", "Tools")) + "</div>" +
      '<div class="agy-t-sub">' + esc(T("Компоненты для разработки прямо в приложении: Node.js для плагинов, Java, Android SDK/NDK, компиляторы. Устанавливаются в окружение агента и сразу доступны ему.", "Development components inside the app: Node.js for plugins, Java, Android SDK/NDK, compilers. Installed into the agent environment and available to it right away.")) + "</div>" +
      '<div class="agy-t-actions"><button type="button" data-act="refresh"' + (busy ? " disabled" : "") + ">" + esc(T("Проверить", "Check")) + "</button>" +
      '<button type="button" data-act="upgrade"' + (busy ? " disabled" : "") + ">" + esc(T("Обновить всё", "Upgrade all")) + "</button></div></div>";

    h += '<div class="agy-t-job" hidden>' +
      '<div class="agy-t-jtop"><span class="agy-t-jicon"></span><span class="agy-t-jlabel"></span><span class="agy-t-jpct"></span></div>' +
      '<div class="agy-t-pbar"><div class="agy-t-pfill"></div></div>' +
      '<div class="agy-t-jrow"><span class="agy-t-jphase"></span><span class="agy-t-jtime"></span></div>' +
      '<div class="agy-t-jfacts"></div>' +
      '<div class="agy-t-jrow"><span class="agy-t-jtail"></span><button type="button" class="agy-t-jlog" data-act="log"></button></div>' +
      '<pre class="agy-t-log" hidden></pre></div>';
    if (loaded && !hasIndex) h += '<div class="agy-t-warn">' + esc(T("Список пакетов ещё не загружен — состояние неполное.", "Package list is not downloaded yet — status is incomplete.")) +
      ' <button type="button" class="agy-t-btn" data-act="index"' + (busy ? " disabled" : "") + ">" + esc(T("Загрузить", "Download")) + "</button></div>";
    if (!bridge()) h += '<div class="agy-t-warn">' + esc(T("Нативный мост недоступен в этой сборке.", "Native bridge is not available in this build.")) + "</div>";

    h += '<div class="agy-t-sec">' + esc(T("Готовые наборы", "Presets")) + "</div>";
    PRESETS.forEach(function (p) {
      var all = p.items.every(function (id) { var it = ITEMS[id]; return it && ((it.kind === "pkg" && !availability(it)) || installed(it)); });
      h += '<div class="agy-t-card"><div class="agy-t-main"><div class="agy-t-name">' + esc(T(p.ru, p.en)) + '</div><div class="agy-t-desc">' + esc(T(p.dru, p.den)) + "</div></div>" +
        (all ? '<span class="agy-t-badge ok">' + esc(T("Готово", "Ready")) + "</span>"
             : '<button type="button" class="agy-t-btn" data-preset="' + p.id + '"' + (busy ? " disabled" : "") + ">" + esc(T("Установить", "Install")) + "</button>") + "</div>";
    });

    GROUPS.forEach(function (g) {
      h += '<div class="agy-t-sec">' + esc(T(g.ru, g.en)) + "</div>";
      if (g.note) h += '<div class="agy-t-note">' + esc(T(g.note.ru, g.note.en)) + "</div>";
      h += '<div class="agy-t-group">';
      g.items.forEach(function (it) {
        var inst = installed(it), av = availability(it);
        h += '<div class="agy-t-row">' +
          '<label class="agy-t-chk"><input type="checkbox" data-sel="' + esc(it.id) + '"' + (selected[it.id] ? " checked" : "") + (inst || !av || busy ? " disabled" : "") + "></label>" +
          '<div class="agy-t-main"><div class="agy-t-name">' + esc(T(it.ru, it.en)) + " " + badge(it) + "</div>" +
          (T(it.dru, it.den) ? '<div class="agy-t-desc">' + esc(T(it.dru, it.den)) + "</div>" : "") + checkLine(it) + "</div>" +
          (inst && it.kind !== "npm"
            ? '<button type="button" class="agy-t-btn sec" data-rm="' + esc(it.id) + '"' + (busy ? " disabled" : "") + ">" + esc(T("Удалить", "Remove")) + "</button>"
            : (!inst && av ? '<button type="button" class="agy-t-btn" data-in="' + esc(it.id) + '"' + (busy ? " disabled" : "") + ">" + esc(T("Установить", "Install")) + "</button>" : "")) +
          "</div>";
      });
      h += "</div>";
    });

    h += '<div class="agy-t-bar">' +
      '<button type="button" class="agy-t-btn" data-act="install-sel"' + (!nsel || busy ? " disabled" : "") + ">" + esc(T("Установить выбранные", "Install selected") + (nsel ? " (" + nsel + ")" : "")) + "</button>" +
      "</div>";
    root.innerHTML = h;
    renderLog();
  }
  var QUIET = { status: 1, verify: 1 };
  // Log text: drop machine lines and curl "####" bars; keep the last state of \r-lines.
  function cleanLog(raw) {
    return (raw || "").split("\n").map(function (l) { var p = l.split("\r"); return p[p.length - 1]; })
      .filter(function (l) { return !/^@@/.test(l) && !/^[#\s]*(\d{1,3}[.,]\d%?|\d{1,3}%)?\s*$/.test(l) && !/^#{3,}/.test(l); }).join("\n");
  }
  // Progress model from pkg / curl / sdkmanager output.
  function progress(j) {
    var raw = j.log || "", r = { pct: -1, phase: "", facts: [] };
    var mNew = /The following NEW packages will be installed:\n([\s\S]*?)\n(?:Need to get|\S)/.exec(raw);
    var names = mNew ? mNew[1].trim().split(/\s+/) : [];
    var total = names.length;
    var size = (/Need to get ([^\n]+?) of archives/.exec(raw) || [])[1];
    var gets = (raw.match(/^Get:\d+ /gm) || []).length;
    var sets = raw.match(/^Setting up (\S+)/gm) || [];
    var pcts = raw.match(/(\d{1,3}[.,]\d)%/g) || [];
    var cur = pcts.length ? parseFloat(pcts[pcts.length - 1].replace(",", ".")) : 0;
    if (/install|upgrade/.test(j.op) && total) {
      var dl = Math.max(0, gets - 1) + (gets ? Math.min(1, cur / 100) : 0);
      r.pct = Math.min(99, Math.round((dl / total) * 50 + (sets.length / total) * 50));
      var lastName = sets.length ? sets[sets.length - 1].replace(/^Setting up /, "") : "";
      r.phase = sets.length >= gets && gets
        ? T("Установлено ", "Installed ") + sets.length + T(" из ", " of ") + total + (lastName ? " · " + lastName : "")
        : T("Загрузка ", "Downloading ") + Math.max(gets, 1) + T(" из ", " of ") + total + (cur ? " · " + Math.round(cur) + "%" : "");
      r.facts.push(T("Пакетов: ", "Packages: ") + total + (size ? T(" · объём ", " · size ") + size : ""));
    } else if (/sdk|ndk|npm/.test(j.op) && pcts.length) {
      r.pct = Math.min(99, Math.round(cur));
      r.phase = T("Загрузка · ", "Downloading · ") + Math.round(cur) + "%";
    } else if (/^== pkg update/m.test(raw) && !/Reading package lists/.test(raw)) {
      r.phase = T("Загрузка списка пакетов…", "Downloading package list…");
    } else if (/Reading package lists/.test(raw) && !total && j.op === "install") {
      r.phase = T("Подготовка…", "Preparing…");
    }
    var steps = raw.match(/^== .+$/gm);
    if (!r.phase && steps) r.phase = steps[steps.length - 1].slice(3);
    return r;
  }
  function elapsed(j) {
    if (!j.t0) return "";
    var s = Math.round((Date.now() - j.t0) / 1000);
    return (s >= 60 ? Math.floor(s / 60) + T(" мин ", " min ") : "") + (s % 60) + T(" с", " s");
  }
  var tick = 0;
  function renderLog() {
    if (!root || !root.isConnected) return;
    var panel = root.querySelector(".agy-t-job");
    if (!panel) return;
    var j = job && !QUIET[job.op] ? job : lastDone;
    if (!j) { panel.hidden = true; return; }
    panel.hidden = false;
    var running = j === job;
    var ok = !running && j.rc === "0";
    panel.className = "agy-t-job" + (running ? " run" : ok ? " ok" : " bad");
    var pr = running ? progress(j) : { pct: ok ? 100 : -1, phase: "", facts: [] };
    tick = (tick + 1) % 4;
    panel.querySelector(".agy-t-jicon").textContent = running ? ["◐", "◓", "◑", "◒"][tick] : ok ? "✓" : "✗";
    panel.querySelector(".agy-t-jlabel").textContent = j.label;
    panel.querySelector(".agy-t-jpct").textContent = running && pr.pct >= 0 ? pr.pct + "%" : "";
    panel.querySelector(".agy-t-jphase").textContent = running ? (pr.phase || T("Выполняется…", "Running…"))
      : ok ? T("Готово", "Done") : T("Ошибка — откройте журнал", "Failed — open the log");
    panel.querySelector(".agy-t-jtime").textContent = running ? elapsed(j) + (queue.filter(function (q) { return !QUIET[q.op]; }).length ? T(" · ещё в очереди: ", " · queued: ") + queue.filter(function (q) { return !QUIET[q.op]; }).length : "") : "";
    panel.querySelector(".agy-t-jfacts").textContent = pr.facts.join("  ");
    var bar = panel.querySelector(".agy-t-pbar"), fill = panel.querySelector(".agy-t-pfill");
    bar.hidden = !running && !ok;
    fill.style.width = (pr.pct >= 0 ? Math.max(3, pr.pct) : 3) + "%";
    var text = cleanLog(j.log);
    var lines = text.split("\n").filter(function (l) { return l.trim(); });
    panel.querySelector(".agy-t-jtail").textContent = logOpen ? "" : (lines[lines.length - 1] || "");
    panel.querySelector(".agy-t-jlog").textContent = logOpen ? T("Скрыть журнал", "Hide log") : T("Журнал", "Log");
    var pre = panel.querySelector(".agy-t-log");
    pre.hidden = !logOpen;
    if (logOpen) {
      var stick = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 20;
      pre.textContent = text.slice(-20000) || T("(пока пусто)", "(empty so far)");
      if (stick) pre.scrollTop = pre.scrollHeight;
    }
  }

  function onClick(e) {
    var b = e.target.closest("button,input"); if (!b || b.disabled) return;
    if (b.matches("input[data-sel]")) { selected[b.getAttribute("data-sel")] = b.checked; render(); return; }
    var act = b.getAttribute("data-act");
    if (act === "refresh") refresh(true);
    else if (act === "upgrade") { run("upgrade", "", T("Обновление пакетов", "Upgrading packages")); refresh(true); }
    else if (act === "install-sel") { var ids = Object.keys(selected).filter(function (k) { return selected[k]; }); selected = {}; installIds(ids); }
    else if (act === "index") { run("index", "", T("Загрузка списка пакетов", "Downloading package list")); refresh(false); }
    else if (act === "log") { logOpen = !logOpen; renderLog(); }
    else if (b.getAttribute("data-preset")) {
      var p = PRESETS.filter(function (x) { return x.id === b.getAttribute("data-preset"); })[0];
      if (p) installIds(p.items.filter(function (id) { return ITEMS[id] && !installed(ITEMS[id]); }));
    }
    else if (b.getAttribute("data-in")) installIds([b.getAttribute("data-in")]);
    else if (b.getAttribute("data-rm")) removeId(b.getAttribute("data-rm"));
  }

  window.__agyToolsMount = function (el) {
    if (!el) return;
    host = el;
    if (root && root.parentElement === el) return;
    root = document.createElement("div");
    root.className = "agy-tools";
    root.setAttribute("data-agy-no-translate", "");
    root.addEventListener("click", onClick);
    el.appendChild(root);
    // Re-attach to a job that was running when the page was closed.
    if (!job) {
      var saved = null;
      try { saved = JSON.parse(store("agyToolsJob") || "null"); } catch (e) {}
      if (saved && saved.id && bridge()) { job = { id: saved.id, op: saved.op, arg: saved.arg, label: saved.label, log: "", rc: "" }; logOpen = true; poll(); }
    }
    render();
    if (!loaded) loadCache();
    render();
    // Quiet, fast refresh (reads pkg's files, no network) at most every 2 min.
    var c = null; try { c = JSON.parse(store("agyToolsCache") || "null"); } catch (e) {}
    if (!job && (!c || Date.now() - c.t > 120000)) refresh(false);
  };
})();
