(function () {
  "use strict";

  const RU = () => document.documentElement.dataset.agyLanguage === "ru" || document.documentElement.lang.startsWith("ru");
  let queued = false;
  let recording = false;
  let speechState = "idle";
  let speechMessage = "";
  let speechKnown = false;
  let transcriptionTimer = 0;
  let forceCustom = false;

  const visible = element => !!(element && element.isConnected && element.getClientRects().length);
  const leafText = element => (element?.textContent || "").replace(/\s+/g, " ").trim();
  const same = (left, right) => String(left) === String(right);
  const presetLabel = {
    request_review: "Запрашивать подтверждение",
    default: "По умолчанию",
    vetted: "Проверенный (бета)",
    turbo: "Турборежим",
    custom: "Пользовательский"
  };

  function readSecurity() {
    const api = window.__agySettings;
    if (!api?.store?.getPrefValue || !api.Kk || !api.H || !api.presets) return null;
    const get = key => api.store.getPrefValue(key);
    let presetId = "custom";
    for (const id of Object.keys(api.presets)) {
      const values = api.presets[id]?.prefValues;
      if (!values) continue;
      const keys = Object.keys(values);
      if (keys.length && keys.every(key => same(get(key), values[key]))) {
        presetId = id;
        break;
      }
    }
    if (forceCustom) presetId = "custom";
    return {
      api,
      presetId,
      file: get(api.Kk.NON_WORKSPACE_FILE_ACCESS_POLICY),
      terminal: get(api.Kk.CASCADE_AUTO_EXECUTION_POLICY),
      browser: get(api.Kk.BROWSER_JS_EXECUTION_POLICY)
    };
  }

  function updateModeButton(button) {
    const state = readSecurity();
    const turbo = state?.presetId === "turbo";
    const label = state ? (presetLabel[state.presetId] || "Безопасность") : "Безопасность";
    button.dataset.mode = state?.presetId || "pending";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.classList.toggle("agy-confirmation-auto", !!turbo);
  }

  function closeModeMenu() {
    document.querySelector("[data-agy-confirmation-menu]")?.remove();
  }

  function addGroup(menu, title, items, current, onPick) {
    const head = document.createElement("h4");
    head.textContent = title;
    menu.appendChild(head);
    items.forEach(item => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.setAttribute("role", "menuitemradio");
      const selected = same(item.value, current);
      choice.setAttribute("aria-checked", selected ? "true" : "false");
      const span = document.createElement("span");
      span.append(item.label);
      if (item.note) {
        const note = document.createElement("small");
        note.textContent = item.note;
        span.appendChild(note);
      }
      choice.append(span, document.createElement("i"));
      choice.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        onPick(item.value);
      });
      menu.appendChild(choice);
    });
  }

  async function applySecurity(button, action, keepOpen) {
    const api = window.__agySettings;
    if (!api) return;
    await action(api);
    document.querySelectorAll("[data-agy-confirmation-button]").forEach(updateModeButton);
    if (keepOpen) showModeMenu(button);
    else closeModeMenu();
  }

  function showModeMenu(button) {
    closeModeMenu();
    const state = readSecurity();
    const rect = button.getBoundingClientRect();
    const menu = document.createElement("div");
    menu.dataset.agyConfirmationMenu = "true";
    menu.dataset.agyNoTranslate = "true";
    menu.className = "agy-confirmation-menu agy-themed-overlay-surface";
    menu.setAttribute("role", "menu");
    const width = Math.min(336, window.innerWidth - 16);
    menu.style.width = `${width}px`;
    if (!state) {
      const empty = document.createElement("h4");
      empty.textContent = "Настройки ещё загружаются";
      menu.appendChild(empty);
    } else {
      const { api, presetId } = state;
      const H = api.H;
      const presets = ["request_review", "default", "vetted", "turbo"].filter(id => api.presets[id]?.prefValues).map(id => ({
        value: id,
        label: presetLabel[id],
        note: id === "turbo" ? "Выключает песочницу и разрешает файлы вне рабочих папок. JavaScript в браузере не меняет." : ""
      }));
      presets.push({ value: "custom", label: "Пользовательский" });
      addGroup(menu, "Профиль безопасности", presets, presetId, value => {
        if (value === "custom") {
          forceCustom = true;
          showModeMenu(button);
          updateModeButton(button);
          return;
        }
        forceCustom = false;
        applySecurity(button, api => api.setPreset(value), false);
      });
      if (presetId === "custom") {
        addGroup(menu, "Доступ к файлам вне папок", [
          { value: H.AgentSettingPolicy.ASK, label: "Всегда спрашивать" },
          { value: H.AgentSettingPolicy.ALLOW, label: "Разрешить" },
          { value: H.AgentSettingPolicy.DENY, label: "Запретить" }
        ], state.file, value => {
          forceCustom = true;
          applySecurity(button, api => api.setFileAccess(value), true);
        });
        addGroup(menu, "Автовыполнение команд терминала", [
          { value: H.CascadeCommandsAutoExecution.OFF, label: "Требовать подтверждение" },
          { value: H.CascadeCommandsAutoExecution.PROCEED_IN_SANDBOX, label: "Выполнять в песочнице" },
          { value: H.CascadeCommandsAutoExecution.EAGER, label: "Всегда выполнять" }
        ], state.terminal, value => {
          forceCustom = true;
          applySecurity(button, api => api.setTerminal(value), true);
        });
      }
      addGroup(menu, "Политика JavaScript в браузере", [
        { value: H.BrowserJsExecutionPolicy.DISABLED, label: "Отключено" },
        { value: H.BrowserJsExecutionPolicy.ALWAYS_ASK, label: "Запрашивать подтверждение" },
        { value: H.BrowserJsExecutionPolicy.TURBO, label: "Всегда выполнять" }
      ], state.browser, value => applySecurity(button, api => api.setBrowserJs(value), true));
    }
    document.body.appendChild(menu);
    const menuHeight = menu.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width));
    const above = rect.top - menuHeight - 8;
    menu.style.left = `${Math.round(left)}px`;
    if (above >= 8) menu.style.top = `${Math.round(above)}px`;
    else menu.style.top = `${Math.round(Math.min(rect.bottom + 8, window.innerHeight - menuHeight - 8))}px`;
  }

  function createModeButton(microphone) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.agyConfirmationButton = "true";
    button.dataset.agyNoTranslate = "true";
    button.className = "agy-confirmation-button";
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5.5 5.7v5.1c0 4.4 2.7 8.1 6.5 9.5 3.8-1.4 6.5-5.1 6.5-9.5V5.7L12 3Z"/><path class="agy-shield-mark" d="m9.2 12 1.8 1.8 3.9-4.1"/></svg>`;
    updateModeButton(button);
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      navigator.vibrate?.(18);
      const open = document.querySelector("[data-agy-confirmation-menu]");
      if (open) closeModeMenu();
      else showModeMenu(button);
    });
    microphone.parentElement?.insertBefore(button, microphone);
  }

  function isMicrophone(button) {
    if (!(button instanceof HTMLButtonElement) || !visible(button)) return false;
    const label = (button.getAttribute("aria-label") || "").toLowerCase();
    return label === "record voice memo" || label === "stop recording" || label.includes("record audio") || label.includes("записать аудио") || label.includes("остановить запись");
  }

  function enhanceMicrophone() {
    const microphones = [...document.querySelectorAll("button")].filter(isMicrophone);
    for (const microphone of microphones) {
      if (!microphone.parentElement?.querySelector(":scope > [data-agy-confirmation-button]")) createModeButton(microphone);
      microphone.classList.remove("agy-mic-active");
      microphone.querySelector(".agy-mic-meter")?.remove();
    }
    document.querySelectorAll(".agy-mic-meter, .agy-transcribing-label").forEach(element => element.remove());
    document.querySelectorAll("[data-agy-confirmation-button]").forEach(updateModeButton);
  }

  const toolGroups = [
    ["APK и пакеты", [
      { id: "aapt2", label: "aapt2 — ресурсы Android", commands: ["aapt2"], packages: ["aapt2"] },
      { id: "apktool", label: "apktool — разбор и сборка ресурсов", commands: ["apktool"], packages: ["apktool"] },
      { id: "apk-sign", label: "apksigner v1–v4 и zipalign", commands: ["apksigner", "zipalign"], packages: ["apksigner"] },
      { id: "bundletool", label: "bundletool — работа с AAB и APKS", commands: ["bundletool"], packages: [], fetch: "bundletool" }
    ]],
    ["DEX и исходный код", [
      { id: "d8", label: "d8 и r8 — компиляция и оптимизация", commands: ["d8", "r8"], packages: ["d8"] },
      { id: "dexdump", label: "dexdump — в репозитории нет, смотрите d8", commands: ["dexdump"], packages: [] },
      { id: "jadx", label: "jadx — просмотр Java-кода из DEX", commands: ["jadx"], packages: ["jadx"] },
      { id: "smali", label: "smali и baksmali — сборка и разбор DEX", commands: ["smali", "baksmali"], packages: [], fetch: "smali" }
    ]],
    ["Сборка", [
      { id: "android-jar", label: "android.jar API 35 — сборка без Gradle", commands: ["android-jar"], packages: [], fetch: "android-jar" },
      { id: "native", label: "clang, CMake и Ninja — нативный код", commands: ["clang", "cmake", "ninja"], packages: ["clang", "cmake", "ninja"] },
      { id: "gradle-kotlin", label: "Gradle и Kotlin — проекты Android", commands: ["gradle", "kotlinc"], packages: ["gradle", "kotlin"] },
      { id: "java", label: "OpenJDK — Java и javac", commands: ["java", "javac"], packages: ["openjdk-17"] }
    ]],
    ["Среда", [
      { id: "cli", label: "Git, curl, jq и ripgrep", commands: ["git", "curl", "jq", "rg"], packages: ["git", "curl", "jq", "ripgrep"] },
      { id: "node", label: "Node.js, npm и npx", commands: ["node", "npm", "npx"], packages: ["nodejs", "npm"] },
      { id: "python", label: "Python и pip", commands: ["python", "pip"], packages: ["python", "python-pip"] },
      { id: "archive", label: "zip, tar и OpenSSL", commands: ["zip", "tar", "openssl"], packages: ["zip", "tar", "openssl"] },
      { id: "tree", label: "tree — дерево файлов проекта", commands: ["tree"], packages: ["tree"] },
      { id: "tmux", label: "tmux — фоновые сборки", commands: ["tmux"], packages: ["tmux"] }
    ]],
    ["Устройство и диагностика", [
      { id: "android-tools", label: "adb и fastboot — управление устройством", commands: ["adb", "fastboot"], packages: ["android-tools"] },
      { id: "logcat", label: "logcat — журналы Android", commands: ["logcat"], packages: [] },
      { id: "rish", label: "rish — расширенный доступ через Shizuku", commands: ["rish"], packages: [] }
    ]]
  ];

  const allTools = () => toolGroups.flatMap(([, entries]) => entries);

  let lastShellRaw = "";

  function shell(command) {
    try {
      if (!window.Android || typeof window.Android.exec !== "function") throw new Error("Командный мост недоступен");
      const raw = window.Android.exec("export PATH=/data/user/0/com.agr/files/usr/bin:/data/user/0/com.agr/files/runtime/bin:/system/bin:$PATH; export HOME=/data/user/0/com.agr/files; export LD_LIBRARY_PATH=/data/user/0/com.agr/files/usr/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}; export SSL_CERT_FILE=/data/user/0/com.agr/files/usr/etc/tls/cert.pem; export CURL_CA_BUNDLE=/data/user/0/com.agr/files/usr/etc/tls/cert.pem; " + command);
      lastShellRaw = raw == null ? "" : typeof raw === "string" ? raw : String(raw);
      if (raw == null) return "";
      if (typeof raw !== "string") return String(raw);
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const stdout = parsed.stdout ?? parsed.output ?? parsed.result ?? parsed.message;
          if (stdout != null && String(stdout).length) return String(stdout);
          if (parsed.stderr != null && String(parsed.stderr).length) return String(parsed.stderr);
        }
      } catch (_) {}
      return raw;
    } catch (error) {
      lastShellRaw = `__AGY_ERROR__:${error?.message || error}`;
      return lastShellRaw;
    }
  }

  function toolsLog(page, text, open) {
    const panel = page?.querySelector?.("[data-tools-log]") || document.querySelector("[data-agy-tools-page] [data-tools-log]");
    const body = panel?.querySelector("[data-tools-log-body]");
    if (!body) return;
    const chunk = String(text || "").replace(/\s+$/, "");
    if (!chunk) return;
    body.textContent += `${body.textContent ? "\n" : ""}${chunk}\n`;
    body.closest("[data-tools-log]")?.removeAttribute("data-tools-log-empty");
    if (open) {
      panel.classList.add("open");
      panel.querySelector("[data-tools-log-toggle]")?.setAttribute("aria-expanded", "true");
    }
    body.scrollTop = body.scrollHeight;
  }

  function showInstallLog(page, text) {
    const body = (page?.querySelector?.("[data-tools-log-body]")) || document.querySelector("[data-agy-tools-page] [data-tools-log-body]");
    if (!body) return;
    body.textContent = String(text || "").replace(/\s+$/, "") || "Жду вывод pkg…";
    body.closest("[data-tools-log]")?.removeAttribute("data-tools-log-empty");
    body.scrollTop = body.scrollHeight;
  }

  function setProgress(page, step, total, label, state, button) {
    const box = page?.querySelector?.("[data-tools-progress]");
    const current = Math.max(0, Math.min(total, step));
    const pct = total ? Math.round((current / total) * 100) : 0;
    if (box) {
      box.classList.toggle("failed", state === "failed");
      box.classList.toggle("done", state === "done");
      const bar = box.querySelector("[data-tools-progress-bar]");
      const text = box.querySelector("[data-tools-progress-label]");
      if (bar) bar.style.width = `${pct}%`;
      if (text) text.textContent = `${current}/${total}  ${label}`;
    }
    if (!button) return;
    page?.querySelectorAll("button.agy-filling").forEach(other => {
      if (other !== button) {
        other.classList.remove("agy-filling", "agy-fill-failed", "agy-fill-done");
        other.style.removeProperty("--agy-fill");
      }
    });
    button.classList.add("agy-filling");
    button.classList.toggle("agy-fill-failed", state === "failed");
    button.classList.toggle("agy-fill-done", state === "done");
    button.style.setProperty("--agy-fill", `${state === "done" ? 100 : pct}%`);
    const group = button.closest("[data-tool-group]");
    if (group) {
      group.classList.add("is-open");
      const body = group.querySelector(".agy-tool-group-body");
      if (body) body.hidden = false;
      group.querySelector("[data-group-toggle]")?.setAttribute("aria-expanded", "true");
    }
  }

  function readInstallState(stepFile, statusFile, logFile) {
    const raw = shell(`step=$(cat ${shellQuote(stepFile)} 2>/dev/null || echo 1); if [ -f ${shellQuote(statusFile)} ]; then status=$(cat ${shellQuote(statusFile)}); else status=__AGY_WAIT__; fi; alive=0; pid=$(cat ${shellQuote(statusFile + ".pid")} 2>/dev/null || true); if [ "$status" = __AGY_WAIT__ ] && [ -n "$pid" ] && [ -d "/proc/$pid" ]; then alive=1; fi; printf 'STEP:%s\\nSTATUS:%s\\nALIVE:%s\\n__LOG__\\n' "$step" "$status" "$alive"; tail -n 40 ${shellQuote(logFile)} 2>/dev/null || true`);
    const cut = raw.indexOf("__LOG__");
    const head = cut < 0 ? raw : raw.slice(0, cut);
    const log = cut < 0 ? "" : raw.slice(cut + "__LOG__".length).replace(/^\n/, "");
    return {
      step: parseInt((head.match(/STEP:(\d+)/) || [])[1] || "1", 10) || 1,
      status: (head.match(/STATUS:([^\n]+)/) || [])[1] || "__AGY_WAIT__",
      alive: /ALIVE:1/.test(head),
      log
    };
  }

  const INSTALL_POLLS = 2000;

  function fetchLabel(log, fallback) {
    const lines = String(log || "").match(/pkg: fetch: \S+/g);
    if (!lines || !lines.length) return fallback;
    const name = lines[lines.length - 1].split("/").pop();
    return name ? `Скачивание ${name}` : fallback;
  }

  function checkCommand(tool) {
    const checks = tool.commands.map(command => `command -v ${command} >/dev/null 2>&1`).join(" && ");
    return `${checks} && echo __AGY_PRESENT__ || echo __AGY_MISSING__`;
  }

  function setToolState(row, state, text) {
    row.dataset.state = state;
    const status = row.querySelector("[data-tool-status]");
    const action = row.querySelector("[data-tool-install]");
    if (status) status.textContent = text;
    if (action) {
      action.hidden = state === "present" || (!row.dataset.packages && !row.dataset.fetch);
      action.disabled = state === "checking" || state === "installing";
      action.textContent = state === "installing" ? "Установка…" : state === "error" ? "Повторить" : "Установить";
    }
    updateGroupCount(row);
  }

  function updateGroupCount(row) {
    const group = row.closest("[data-tool-group]");
    if (!group) return;
    const total = group.querySelectorAll("[data-tool-id]").length;
    const done = group.querySelectorAll("[data-tool-id][data-state='present']").length;
    const counter = group.querySelector(".agy-tool-count");
    if (counter) counter.textContent = done > 0 ? `${done}/${total}` : String(total);
  }

  function checkTool(page, tool) {
    const row = page.querySelector(`[data-tool-id="${tool.id}"]`);
    if (!row) return false;
    setToolState(row, "checking", "Проверка…");
    const output = shell(checkCommand(tool));
    if (output.includes("__AGY_PRESENT__")) {
      setToolState(row, "present", "Установлено");
      return true;
    }
    if (output.includes("__AGY_ERROR__")) {
      setToolState(row, "error", "Проверка недоступна");
      toolsLog(page, `${tool.label}\n${output}\n${lastShellRaw}`);
      return false;
    }
    setToolState(row, "missing", tool.packages.length ? "Не установлено" : "Не найдено");
    return false;
  }

  function checkAllTools(page) {
    const button = page.querySelector("[data-tools-check-all]");
    if (button) {
      button.disabled = true;
      button.textContent = "Проверка…";
    }
    const tools = allTools();
    let index = 0;
    const next = () => {
      if (!page.isConnected || index >= tools.length) {
        if (button?.isConnected) {
          button.disabled = false;
          button.textContent = "Проверить всё";
        }
        return;
      }
      checkTool(page, tools[index]);
      index += 1;
      window.setTimeout(next, 25);
    };
    window.setTimeout(next, 30);
  }

  const AGY_FILES = "/data/user/0/com.agr/files";
  const AGY_PREFIX = "/data/user/0/com.agr/files/usr";
  const AGY_SDK_MARKER = AGY_PREFIX + "/var/lib/agy-sdk";

  function shellQuote(value) {
    return `'${String(value).replace(/'/g, "'\\''")}'`;
  }

  // ShellBridge.waitFor only waits for the shell it started. setsid/nohup moves
  // the install into its own session so that shell exiting does not SIGHUP it.
  function startDetached(command, logFile, statusFile) {
    const dir = statusFile.slice(0, statusFile.lastIndexOf("/"));
    const body = `echo $$ > ${shellQuote(statusFile + ".pid")}; ${command}; echo $? > ${shellQuote(statusFile)}`;
    return shell(`mkdir -p ${shellQuote(dir)} || exit 73; rm -f ${shellQuote(statusFile)} ${shellQuote(logFile)}; if command -v setsid >/dev/null 2>&1; then setsid sh -c ${shellQuote(body)} >${shellQuote(logFile)} 2>&1 </dev/null & else nohup sh -c ${shellQuote(body)} >${shellQuote(logFile)} 2>&1 </dev/null & fi; echo __AGY_STARTED__`);
  }

  function pkgPrelude() {
    return `PKG_BIN=; if [ -x /data/user/0/com.agr/files/usr/bin/pkg ]; then PKG_BIN=/data/user/0/com.agr/files/usr/bin/pkg; elif [ -x /data/data/com.agr/files/usr/bin/pkg ]; then PKG_BIN=/data/data/com.agr/files/usr/bin/pkg; elif command -v pkg >/dev/null 2>&1; then PKG_BIN=$(command -v pkg); fi; if [ -z "$PKG_BIN" ]; then echo __AGY_NO_PACKAGE_MANAGER__; exit 72; fi`;
  }

  function pkgUpdate() {
    const index = `${AGY_PREFIX}/var/lib/pkg/index`;
    return `if ! ls ${index}/repo.*.Packages >/dev/null 2>&1; then "$PKG_BIN" update || exit 1; fi`;
  }

  function installScript(tool, stepFile) {
    const step = n => `echo ${n} > ${shellQuote(stepFile)}`;
    const pkgs = tool.packages || [];
    const pkgLines = pkgs.map(name => `if "$PKG_BIN" install ${name}; then echo "[ok] ${name}"; else echo "[!] ${name} не установился"; fail=1; fi`).join("\n");
    return [
      step(1),
      pkgs.length ? pkgPrelude() : "true",
      step(2),
      pkgs.length ? pkgUpdate() : "echo '[*] индекс pkg не нужен'",
      step(3),
      "fail=0",
      pkgLines || "true",
      extraShell(tool) || "true",
      step(4),
      '[ "$fail" = 0 ]'
    ].join("\n");
  }

  function curlTo(url, dest) {
    return `mkdir -p "$(dirname ${shellQuote(dest)})" && if curl -fL --retry 2 --connect-timeout 30 --cacert ${shellQuote("/data/user/0/com.agr/files/usr/etc/tls/cert.pem")} -o ${shellQuote(dest)} ${shellQuote(url)}; then echo "[ok] скачан $(basename ${shellQuote(dest)})"; else echo "[!] не скачался ${url}"; fail=1; fi`;
  }

  function writeWrapper(binName, lines) {
    const path = `${AGY_PREFIX}/bin/${binName}`;
    const args = ["#!/system/bin/sh", ...lines].map(line => shellQuote(line)).join(" ");
    return `mkdir -p ${shellQuote(`${AGY_PREFIX}/bin`)} && printf '%s\\n' ${args} > ${shellQuote(path)} && chmod 755 ${shellQuote(path)}`;
  }

  function extraShell(tool) {
    const bits = [];
    if (tool.id === "python") {
      bits.push(`if ! command -v pip >/dev/null 2>&1 && command -v pip3 >/dev/null 2>&1; then ln -sfn "$(command -v pip3)" ${shellQuote(`${AGY_PREFIX}/bin/pip`)}; echo "[ok] pip -> pip3"; fi`);
    }
    if (tool.fetch === "bundletool") {
      const jar = `${AGY_PREFIX}/share/java/bundletool.jar`;
      bits.push(curlTo("https://github.com/google/bundletool/releases/download/1.18.1/bundletool-all-1.18.1.jar", jar));
      bits.push(`if [ "$fail" != 1 ]; then ${writeWrapper("bundletool", [`exec java -jar ${jar} "$@"`])}; echo "[ok] bundletool 1.18.1"; fi`);
    }
    if (tool.fetch === "smali") {
      const smali = `${AGY_PREFIX}/share/java/smali-2.5.2.jar`;
      const bak = `${AGY_PREFIX}/share/java/baksmali-2.5.2.jar`;
      bits.push(curlTo("https://bitbucket.org/JesusFreke/smali/downloads/smali-2.5.2.jar", smali));
      bits.push(curlTo("https://bitbucket.org/JesusFreke/smali/downloads/baksmali-2.5.2.jar", bak));
      bits.push(`if [ "$fail" != 1 ]; then ${writeWrapper("smali", [`exec java -jar ${smali} "$@"`])}; ${writeWrapper("baksmali", [`exec java -jar ${bak} "$@"`])}; echo "[ok] smali и baksmali 2.5.2"; fi`);
    }
    if (tool.fetch === "android-jar") {
      const jar = `${AGY_PREFIX}/share/java/android-35.jar`;
      bits.push(curlTo("https://github.com/Sable/android-platforms/raw/master/android-35/android.jar", jar));
      bits.push(`if [ "$fail" != 1 ]; then ${writeWrapper("android-jar", [`echo ${jar}`, "exit 0"])}; echo "[ok] android.jar API 35"; fi`);
    }
    return bits.join("\n");
  }

  function failureText(log, timedOut) {
    if (/unreachable|connect-timeout|нет сети|no index/i.test(log)) return "Ошибка сети: не удалось обновить индекс";
    if (timedOut) return "Превышено время ожидания";
    return log ? `Ошибка: ${log.slice(0, 120)}` : "Ошибка установки";
  }

  const INSTALL_STEPS = ["Подготовка", "Индекс репозитория", "Установка пакетов", "Проверка"];

  function runInstall(tool, onUpdate, button) {
    const page = document.querySelector("[data-agy-tools-page]");
    const statusFile = `${AGY_FILES}/.agy-tools/${tool.id}.status`;
    const logFile = `${AGY_FILES}/.agy-tools/${tool.id}.log`;
    const stepFile = `${AGY_FILES}/.agy-tools/${tool.id}.step`;
    setProgress(page, 1, INSTALL_STEPS.length, INSTALL_STEPS[0], undefined, button);
    showInstallLog(page, `> ${tool.packages.join(" ") || tool.fetch || tool.id}`);
    const started = startDetached(installScript(tool, stepFile), logFile, statusFile);
    if ((tool.packages.length && started.includes("__AGY_NO_PACKAGE_MANAGER__")) || !started.includes("__AGY_STARTED__")) {
      const message = started.includes("__AGY_NO_PACKAGE_MANAGER__") ? "Менеджер пакетов недоступен" : "Не удалось запустить установку";
      onUpdate("error", message);
      setProgress(page, 1, INSTALL_STEPS.length, message, "failed", button);
      showInstallLog(page, `${message}\n${started}\n${lastShellRaw}`);
      return;
    }
    let attempts = 0;
    let quiet = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const state = readInstallState(stepFile, statusFile, logFile);
      const step = Math.max(1, Math.min(INSTALL_STEPS.length, state.step));
      const waiting = state.status.includes("__AGY_WAIT__");
      if (waiting && state.alive) quiet = 0;
      else if (waiting) quiet += 1;
      const label = waiting && state.alive ? fetchLabel(state.log, INSTALL_STEPS[step - 1]) : INSTALL_STEPS[step - 1];
      setProgress(page, step, INSTALL_STEPS.length, label, undefined, button);
      if (state.log.trim()) showInstallLog(page, state.log);
      if (waiting && attempts < INSTALL_POLLS && (state.alive || quiet < 5)) return;
      window.clearInterval(timer);
      if (/\b0\b/.test(state.status) && shell(checkCommand(tool)).includes("__AGY_PRESENT__")) {
        onUpdate("present", "Установлено");
        setProgress(page, INSTALL_STEPS.length, INSTALL_STEPS.length, "Готово", "done", button);
        button?.classList.remove("agy-filling");
        return;
      }
      const stalled = waiting && state.alive;
      const message = stalled
        ? "Скачивание ещё идёт. Процесс не остановлен — зайдите позже и нажмите снова."
        : waiting
          ? "Установка оборвалась без кода завершения"
          : failureText(state.log.replace(/\s+/g, " ").trim(), false);
      onUpdate("error", message);
      setProgress(page, step, INSTALL_STEPS.length, message, "failed", button);
      showInstallLog(page, state.log.trim() || message);
    }, 1200);
  }

  function installTool(page, tool) {
    const row = page.querySelector(`[data-tool-id="${tool.id}"]`);
    if (!row || row.dataset.state === "installing") return;
    if (!tool.packages.length && !tool.fetch) return;
    setToolState(row, "installing", "Установка пакетов…");
    runInstall(tool, (state, text) => {
      if (!row.isConnected) return;
      setToolState(row, state, text);
    }, row.querySelector("[data-tool-install]"));
  }


  window.__agyNodePresent = () => shell(checkCommand({ commands: ["node"] })).includes("__AGY_PRESENT__");
  window.__agyInstallNode = (button, detail) => {
    if (!button || button.disabled) return;
    button.disabled = true;
    button.textContent = "Установка…";
    if (detail) detail.textContent = "";
    runInstall({ id: "node", commands: ["node", "npm", "npx"], packages: ["nodejs", "npm"] }, (state, message) => {
      if (state === "present") {
        button.textContent = "Node.js установлен";
        const banner = button.closest(".agy-nodejs-warning");
        window.setTimeout(() => banner?.remove(), 3000);
        return;
      }
      button.disabled = false;
      button.textContent = "Повторить";
      if (detail) detail.textContent = message;
    });
  };

  function closeToolsPage() {
    document.querySelector("[data-agy-tools-page]")?.remove();
  }

  function sdkHome(path) {
    return AGY_FILES + "/.agy-sdk/" + path;
  }

  function paintSdkButton(button, installed) {
    button.disabled = false;
    button.textContent = installed ? (RU() ? "Установлено" : "Installed") : (RU() ? "Установить" : "Install");
    button.classList.toggle("agy-sdk-installed", installed);
  }

  function linkJavaShell() {
    const bin = shellQuote(`${AGY_PREFIX}/bin`);
    const j17 = shellQuote(`${AGY_PREFIX}/lib/jvm/java-17-openjdk/bin`);
    const jvm = shellQuote(`${AGY_PREFIX}/lib/jvm`);
    return `JVM=; if [ -d ${j17} ]; then JVM=${j17}; else for d in ${jvm}/java-*-openjdk/bin; do [ -d "$d" ] && JVM="$d"; done; fi; if [ -n "$JVM" ]; then for b in java javac jar keytool jarsigner; do if [ -x "$JVM/$b" ]; then ln -sfn "$JVM/$b" ${bin}/$b; echo "[ok] $b -> $JVM/$b"; fi; done; else echo "[!] каталог JVM не найден"; fi`;
  }

  function tryPkg(names) {
    return names.map(name => `if [ "$ok" != 1 ]; then if "$PKG_BIN" install ${name}; then echo "[ok] ${name}"; ok=1; else echo "[!] ${name} не установился"; fi; fi`).join("; ");
  }

  function refreshSigner() {
    const target = shellQuote(`${AGY_PREFIX}/bin/agy-apk-sign`);
    const script = `#!/data/user/0/com.agr/files/usr/bin/bash
# agy-apk-sign — выравнивание и подпись APK схемами v1, v2, v3 и v4.
# Так же, как APK Signer Pro: ApkSigner
#   setV1SigningEnabled(true)
#   setV2SigningEnabled(true)
#   setV3SigningEnabled(true)
#   setV4SigningEnabled(true)
#   setV4SignatureOutputFile(<apk>.idsig)
# v4 требует включённую v2 или v3. Старый apksigner без v4 получает v1+v2+v3.
set -e
INPUT_APK="$1"
OUTPUT_APK="\${2:-\${INPUT_APK%.apk}-signed.apk}"
KEYSTORE="/data/user/0/com.agr/files/usr/etc/antigravity-debug.keystore"
STOREPASS="android"
ALIAS="androiddebugkey"
IDSIG="\${OUTPUT_APK}.idsig"

if [ -z "$INPUT_APK" ] || [ ! -f "$INPUT_APK" ]; then
    echo "Использование: agy-apk-sign <файл.apk> [выходной_файл.apk]"
    exit 1
fi
if ! command -v apksigner >/dev/null 2>&1; then
    echo "Ошибка: apksigner не найден. Поставьте компонент «Подпись» в Настройки → Инструменты."
    exit 1
fi
if ! command -v keytool >/dev/null 2>&1; then
    echo "Ошибка: keytool не найден. Нужен OpenJDK в каталоге bin."
    exit 1
fi

echo "==> Ключ подписи..."
mkdir -p "$(dirname "$KEYSTORE")"
if [ ! -f "$KEYSTORE" ]; then
    keytool -genkey -keystore "$KEYSTORE" -alias "$ALIAS" \\
        -keyalg RSA -keysize 2048 -validity 10000 \\
        -storepass "$STOREPASS" -keypass "$STOREPASS" \\
        -dname "CN=Android Debug, O=Android, C=US" >/dev/null
    echo "  Создан debug-ключ: $KEYSTORE (alias $ALIAS)"
elif keytool -list -keystore "$KEYSTORE" -storepass "$STOREPASS" -alias androiddebugkey >/dev/null 2>&1; then
    ALIAS="androiddebugkey"
elif keytool -list -keystore "$KEYSTORE" -storepass "$STOREPASS" -alias debug >/dev/null 2>&1; then
    ALIAS="debug"
fi
echo "  alias: $ALIAS"

TMP_ALIGNED="$(mktemp /data/user/0/com.agr/files/usr/tmp/aligned_XXXXXX.apk 2>/dev/null || mktemp /data/user/0/com.agr/files/runtime/aligned_XXXXXX.apk)"
echo "==> Выравнивание..."
if command -v zipalign >/dev/null 2>&1; then
    if zipalign -P 16 -p -f 4 "$INPUT_APK" "$TMP_ALIGNED"; then
        echo "  4 байта и страницы 16KB для .so"
    else
        echo "  этот zipalign без -P 16, только 4 байта"
        zipalign -p -f 4 "$INPUT_APK" "$TMP_ALIGNED"
    fi
else
    echo "  zipalign нет, подпись пойдёт без выравнивания"
    cp "$INPUT_APK" "$TMP_ALIGNED"
fi

sign_with() {
    # $1 — флаг v4: "--v4-signing-enabled true" или false
    apksigner sign \\
        --ks "$KEYSTORE" \\
        --ks-key-alias "$ALIAS" \\
        --ks-pass "pass:$STOREPASS" \\
        --key-pass "pass:$STOREPASS" \\
        --v1-signing-enabled true \\
        --v2-signing-enabled true \\
        --v3-signing-enabled true \\
        $1 \\
        --out "$OUTPUT_APK" \\
        "$TMP_ALIGNED"
}

echo "==> Подпись v1 + v2 + v3 + v4..."
if ! sign_with "--v4-signing-enabled true"; then
    echo "  Этот apksigner не принял v4. Повторяю v1 + v2 + v3."
    rm -f "$OUTPUT_APK" "$IDSIG"
    sign_with "--v4-signing-enabled false"
fi
rm -f "$TMP_ALIGNED"

echo "==> Проверка схем..."
apksigner verify --verbose "$OUTPUT_APK"
if [ -f "$IDSIG" ]; then
    echo "  v4: $IDSIG"
    echo "Схемы: v1 v2 v3 v4"
else
    echo "Схемы: v1 v2 v3"
fi
echo "Подписано: $OUTPUT_APK"
`;
    shell(`if ! grep -q "zipalign -P 16" ${target} 2>/dev/null; then cat > ${target} << 'AGY_SIGN_EOF'\n${script}AGY_SIGN_EOF\nchmod 700 ${target}; echo refreshed; fi`);
  }

  function readSdkStatus(page) {
    refreshSigner();
    const output = shell([
      linkJavaShell(),
      "if command -v apktool >/dev/null 2>&1 && command -v aapt2 >/dev/null 2>&1 && command -v jadx >/dev/null 2>&1; then echo decompile:1; else echo decompile:0; fi",
      "if command -v java >/dev/null 2>&1 && command -v d8 >/dev/null 2>&1 && command -v ecj >/dev/null 2>&1; then echo build:1; else echo build:0; fi",
      "if command -v apksigner >/dev/null 2>&1 && command -v zipalign >/dev/null 2>&1; then echo sign:1; else echo sign:0; fi"
    ].join("\n"));
    const flags = {};
    for (const line of output.split(/\n+/)) {
      const match = line.trim().match(/^(decompile|build|sign):([01])$/);
      if (match) flags[match[1]] = match[2] === "1";
    }
    page.querySelectorAll("[data-sdk-install]").forEach(button => {
      const name = button.dataset.sdkInstall;
      if (name === "all") paintSdkButton(button, flags.decompile && flags.build && flags.sign);
      else paintSdkButton(button, !!flags[name]);
    });
    return flags;
  }

  function installSdk(page, component, button) {
    if (button.disabled) return;
    if (!/^(?:decompile|build|sign|all)$/.test(component)) return;
    const steps = component === "all"
      ? ["Подготовка", "Индекс", "Декомпиляция", "Сборка", "zipalign", "apksigner", "OpenSSL", "Проверка"]
      : component === "sign"
        ? ["Подготовка", "Индекс", "zipalign", "apksigner", "OpenSSL", "Проверка"]
        : component === "build"
          ? ["Подготовка", "Индекс", "Пакеты", "Ссылки Java", "Проверка"]
          : ["Подготовка", "Индекс", "Декомпиляция", "Проверка"];
    const statusFile = sdkHome(`${component}.status`);
    const logFile = sdkHome(`${component}.log`);
    const stepFile = sdkHome(`${component}.step`);
    const step = n => `echo ${n} > ${shellQuote(stepFile)}`;
    const mark = name => `mkdir -p ${shellQuote(AGY_SDK_MARKER)} && touch ${shellQuote(`${AGY_SDK_MARKER}/${name}.installed`)}`;
    const eachPkg = names => ["fail=0", ...names.map(name => `if "$PKG_BIN" install ${name}; then echo "[ok] ${name}"; else echo "[!] ${name} не установился"; fail=1; fi`), '[ "$fail" = 0 ]'].join("\n");
    const signTail = [
      `if command -v zipalign >/dev/null 2>&1; then echo "[ok] zipalign уже в системе"; else echo "[!] zipalign не найден в образе"; fi`,
      eachPkg(["apksigner"]),
      `ok=0; ${tryPkg(["openssl-tool", "openssl"])}; [ "$ok" = 1 ] || echo "[!] openssl CLI нет. Библиотеки SSL уже стоят, подпись идёт через apksigner."`,
      linkJavaShell(),
      "command -v apksigner >/dev/null 2>&1 && command -v zipalign >/dev/null 2>&1"
    ];
    const command = component === "all"
      ? [
          step(1), pkgPrelude(), step(2), pkgUpdate(),
          step(3), `${eachPkg(["apktool", "aapt", "aapt2", "jadx"])} && ${mark("decompile")}`,
          step(4), `${eachPkg(["openjdk-17", "d8", "ecj"])} && ${linkJavaShell()} && ${mark("build")}`,
          step(5), signTail[0], step(6), signTail[1], step(7), signTail[2],
          step(8), signTail[3], `${signTail[4]} && ${mark("sign")}`
        ].join("\n")
      : component === "decompile"
        ? [step(1), pkgPrelude(), step(2), pkgUpdate(), step(3), `${eachPkg(["apktool", "aapt", "aapt2", "jadx"])} && ${mark("decompile")}`, step(4), "command -v apktool >/dev/null && command -v jadx >/dev/null"].join("\n")
        : component === "build"
          ? [step(1), pkgPrelude(), step(2), pkgUpdate(), step(3), eachPkg(["openjdk-17", "d8", "ecj"]), step(4), linkJavaShell(), step(5), `command -v java >/dev/null && command -v d8 >/dev/null && command -v ecj >/dev/null && ${mark("build")}`].join("\n")
          : [step(1), pkgPrelude(), step(2), pkgUpdate(), step(3), signTail[0], step(4), signTail[1], step(5), signTail[2], step(6), signTail[3], `${signTail[4]} && ${mark("sign")}`].join("\n");
    button.disabled = true;
    button.textContent = RU() ? "Установка…" : "Installing…";
    setProgress(page, 1, steps.length, steps[0], undefined, button);
    showInstallLog(page, `> компонент ${component}`);
    const started = startDetached(command, logFile, statusFile);
    if (!started.includes("__AGY_STARTED__")) {
      setProgress(page, 1, steps.length, "Не удалось запустить установку", "failed", button);
      showInstallLog(page, `${RU() ? "Не удалось запустить установку." : "Could not start installation."}\n${started}\n${lastShellRaw}`);
      paintSdkButton(button, false);
      return;
    }
    let attempts = 0;
    let quiet = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (!page.isConnected) return window.clearInterval(timer);
      const state = readInstallState(stepFile, statusFile, logFile);
      const stepNo = Math.max(1, Math.min(steps.length, state.step));
      const waiting = state.status.includes("__AGY_WAIT__");
      if (waiting && state.alive) quiet = 0;
      else if (waiting) quiet += 1;
      const label = waiting && state.alive ? fetchLabel(state.log, steps[stepNo - 1]) : steps[stepNo - 1];
      setProgress(page, stepNo, steps.length, label, undefined, button);
      if (state.log.trim()) showInstallLog(page, state.log);
      if (waiting && attempts < INSTALL_POLLS && (state.alive || quiet < 5)) return;
      window.clearInterval(timer);
      if (!waiting) readSdkStatus(page);
      if (/\b0\b/.test(state.status)) {
        setProgress(page, steps.length, steps.length, "Готово", "done", button);
        button.classList.remove("agy-filling");
        return;
      }
      const message = waiting && state.alive
        ? "Скачивание ещё идёт. Процесс не остановлен — зайдите позже и нажмите снова."
        : waiting
          ? "Установка оборвалась без кода завершения"
          : (/unreachable|connect-timeout|нет сети/i.test(state.log) ? "Ошибка сети: не удалось обновить индекс" : "Установка завершилась с ошибкой");
      setProgress(page, stepNo, steps.length, message, "failed", button);
      showInstallLog(page, `${message}\n${state.log.trim()}`);
    }, 1200);
  }

  function showToolsPage(host) {
    closeToolsPage();
    const page = document.createElement("section");
    page.dataset.agyToolsPage = "true";
    page.dataset.agyNoTranslate = "true";
    page.className = "agy-tools-page";
    const sdkRows = [
      ["all", RU() ? "Полный набор" : "Complete set", RU() ? "Ставится один раз. Агент не должен скачивать эти пакеты в чате." : "Install once. The agent must not download these packages in chat.", true],
      ["decompile", RU() ? "Декомпиляция" : "Decompile", "apktool, aapt, aapt2, jadx", false],
      ["build", RU() ? "Сборка" : "Build", "openjdk-17, d8, ecj", false],
      ["sign", RU() ? "Подпись" : "Sign", "apksigner v1–v4, zipalign", false]
    ].map(([id, title, detail, primary]) => `<div class="agy-tool-entry${primary ? " agy-sdk-primary-row" : ""}"><div><strong>${title}</strong><small>${detail}</small></div><span class="agy-tool-actions"><button type="button" data-sdk-install="${id}">${RU() ? "Установить" : "Install"}</button></span></div>`).join("");
    const group = (title, count, body) => `<section class="agy-tool-group" data-tool-group data-agy-no-translate="true"><button type="button" class="agy-tool-group-toggle" data-group-toggle aria-expanded="false"><span>${title}</span><span class="agy-tool-count">${count}</span></button><div class="agy-tool-group-body" hidden>${body}</div></section>`;
    page.innerHTML = `<header><button type="button" data-tools-back aria-label="Назад"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><h1>Инструменты</h1></header>
      <div class="agy-tools-content">
      <section class="agy-install-output" data-tools-log data-tools-log-empty data-tools-progress data-agy-no-translate="true"><div class="agy-install-output-head"><strong data-tools-progress-label>Установка не запущена</strong><button type="button" data-tools-check-all>Проверить всё</button><button type="button" data-tools-log-copy>Копировать</button></div><div class="agy-install-output-track"><div data-tools-progress-bar></div></div><pre data-tools-log-body></pre></section>
      ${group(RU() ? "Компоненты Android" : "Android components", sdkRows.match(/agy-tool-entry/g).length, sdkRows)}
      ${toolGroups.map(([title, entries]) => group(title, entries.length, entries.map(tool => `<div class="agy-tool-entry" data-tool-id="${tool.id}" data-packages="${tool.packages.join(" ")}" ${tool.fetch ? `data-fetch="${tool.fetch}"` : ""}><div><strong>${tool.label}</strong><small data-tool-status>Не проверено</small></div><span class="agy-tool-actions"><button type="button" data-tool-check>Проверить</button><button type="button" data-tool-install ${tool.packages.length || tool.fetch ? "" : "hidden"}>Установить</button></span></div>`).join(""))).join("")}
      </div>`;
    page.querySelector(".agy-install-output-head")?.addEventListener("click", event => {
      if (event.target.closest("button")) return;
      page.querySelector("[data-tools-log]")?.classList.toggle("is-expanded");
    });
    page.querySelectorAll("[data-group-toggle]").forEach(toggle => toggle.addEventListener("click", () => {
      const group = toggle.closest("[data-tool-group]");
      const body = group.querySelector(".agy-tool-group-body");
      const open = body.hidden;
      body.hidden = !open;
      group.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }));
    const logCopy = page.querySelector("[data-tools-log-copy]");
    logCopy.addEventListener("click", async () => {
      const text = page.querySelector("[data-tools-log-body]").textContent.trim() || "Лог пуст";
      let copied = false;
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (_) {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        copied = document.execCommand("copy");
        area.remove();
      }
      const previous = logCopy.textContent;
      logCopy.textContent = copied ? "Скопировано" : "Не скопировалось";
      window.setTimeout(() => { logCopy.textContent = previous; }, 1400);
    });
    page.querySelector("[data-tools-check-all]").addEventListener("click", () => checkAllTools(page));
    page.querySelectorAll("[data-sdk-install]").forEach(button => button.addEventListener("click", () => installSdk(page, button.dataset.sdkInstall, button)));
    window.setTimeout(() => { if (page.isConnected) readSdkStatus(page); }, 40);
    page.querySelectorAll("[data-tool-check]").forEach(button => button.addEventListener("click", () => {
      const tool = allTools().find(item => item.id === button.closest("[data-tool-id]")?.dataset.toolId);
      if (tool) checkTool(page, tool);
    }));
    page.querySelectorAll("[data-tool-install]").forEach(button => button.addEventListener("click", () => {
      const tool = allTools().find(item => item.id === button.closest("[data-tool-id]")?.dataset.toolId);
      if (tool) installTool(page, tool);
    }));
    const style = getComputedStyle(host);
    if (style.position === "static") host.style.position = "relative";
    host.appendChild(page);
  }

  function findSettingsHost() {
    const heading = [...document.querySelectorAll("h1,h2,h3,[role='heading']")].find(element => visible(element) && /^(Настройки|Settings)$/.test(leafText(element)));
    return heading?.closest("[role='dialog']") || heading?.closest("[data-testid='bottom-sheet']") || heading?.parentElement?.parentElement;
  }

  function injectToolsRow() {
    if (document.querySelector("[data-agy-tools-row]")) return;
    const host = findSettingsHost();
    if (!host) return;
    const browserLabel = [...host.querySelectorAll("div,span,p,button")].find(element => visible(element) && /^(Браузер|Browser)$/.test(leafText(element)));
    if (!browserLabel) return;
    let browserRow = browserLabel.closest("button,[role='button']") || browserLabel;
    for (let depth = 0; browserRow?.parentElement && depth < 6; depth += 1) {
      if (!/^(Браузер|Browser)$/.test(leafText(browserRow.parentElement))) break;
      browserRow = browserRow.parentElement;
    }
    if (!browserRow?.parentElement) return;
    const row = browserRow.cloneNode(true);
    row.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
    row.removeAttribute("id");
    row.dataset.agyToolsRow = "true";
    row.dataset.agyNoTranslate = "true";
    row.classList.add("agy-tools-nav-row");
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (/^(Браузер|Browser)$/.test(textNode.nodeValue.trim())) textNode.nodeValue = textNode.nodeValue.replace(/Браузер|Browser/, "Инструменты");
    }
    row.addEventListener("click", () => showToolsPage(host));
    row.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showToolsPage(host);
      }
    });
    browserRow.parentElement.insertBefore(row, browserRow);
  }

  function mentionFromNode(node, editor) {
    let element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    if (!element || element === editor) return null;
    const mention = element.closest("[data-lexical-decorator='true'],[data-lexical-beautiful-mention='true'],[data-beautiful-mention]");
    if (!mention || !editor.contains(mention)) return null;
    return mention.closest("[data-lexical-decorator='true']") || mention;
  }

  function adjacentMention(editor, range, backwards) {
    const container = range.startContainer;
    const offset = range.startOffset;
    if (container === editor) {
      return mentionFromNode(editor.childNodes[offset + (backwards ? -1 : 0)], editor);
    }
    if (container.nodeType === Node.TEXT_NODE) {
      if (backwards && offset > 0) return null;
      if (!backwards && offset < container.nodeValue.length) return null;
    }
    let current = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
    while (current && current !== editor) {
      const sibling = backwards ? current.previousSibling : current.nextSibling;
      if (sibling) return mentionFromNode(sibling, editor);
      current = current.parentElement;
    }
    return null;
  }

  function installMentionDeletion() {
    if (document.documentElement.dataset.agyMentionDeletion === "true") return;
    document.documentElement.dataset.agyMentionDeletion = "true";
    document.addEventListener("keydown", event => {
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      const editor = event.target.closest?.("[contenteditable='true']");
      const selection = window.getSelection();
      if (!editor || !selection?.isCollapsed || selection.rangeCount !== 1) return;
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.startContainer)) return;
      const mention = adjacentMention(editor, range, event.key === "Backspace");
      if (!mention) return;
      event.preventDefault();
      event.stopPropagation();
      const deletion = document.createRange();
      deletion.selectNode(mention);
      selection.removeAllRanges();
      selection.addRange(deletion);
      document.execCommand("delete", false);
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: event.key === "Backspace" ? "deleteContentBackward" : "deleteContentForward" }));
    }, true);
  }

  function normalizePopovers() {
    document.querySelectorAll("[role='dialog'],[role='alertdialog'],[role='listbox'],[role='menu']").forEach(surface => {
      if (!visible(surface)) return;
      if (surface.closest(".settings-modal-container, .settings-modal-backdrop, [data-testid='agent-input-box']")) return;
      const rect = surface.getBoundingClientRect();
      if (rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.62) return;
      surface.classList.add("agy-themed-overlay-surface");
      const text = leafText(surface);
      if (/View Usage|Посмотреть использование|Weekly Limit Remaining|Остаток недельного лимита/.test(text)) surface.classList.add("agy-model-usage-popover");
    });
  }

  function enhance() {
    enhanceMicrophone();
    injectToolsRow();
    normalizePopovers();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      enhance();
    });
  }

  document.addEventListener("pointerdown", event => {
    if (!event.target.closest?.("[data-agy-confirmation-menu],[data-agy-confirmation-button]")) closeModeMenu();
  }, true);
  window.addEventListener("agy:speech-state", event => {
    speechState = event.detail?.state || "idle";
    speechMessage = event.detail?.message || "";
    speechKnown = true;
    if (speechState === "idle" || speechState === "error") document.querySelectorAll(".agy-transcribing-label").forEach(element => element.remove());
    enhanceMicrophone();
  });
  document.addEventListener("DOMContentLoaded", () => {
    installMentionDeletion();
    enhance();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "disabled", "data-state"] });
  }, { once: true });
  if (document.readyState !== "loading") {
    installMentionDeletion();
    enhance();
  }
})();
