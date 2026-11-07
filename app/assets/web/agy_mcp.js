/* Antigravity RU — Settings › MCP Servers.
 * Complete MCP management: full server catalog, marketplace categories,
 * search filter, custom server modal, components installer, and integration
 * with custom providers (OpenAI / Claude / DeepSeek).
 */
(function () {
  "use strict";
  if (window.__agyMcpReady) return;
  window.__agyMcpReady = true;

  function ru() {
    try { return window.__agyI18n ? window.__agyI18n.getLanguage() === "ru" : true; }
    catch (e) { return true; }
  }
  function T(r, e) { return ru() ? r : e; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var host = null, root = null;
  var activeTab = "servers"; // "servers" | "utcp" | "components"
  var activeCategory = "all";
  var searchQuery = "";
  var showAddModal = false;
  var showAddUtcpModal = false;
  var job = null;
  var logText = "";
  var pollTimer = 0;

  // UTCP State
  var utcpManuals = {};
  var utcpTestResults = {};

  // Components status
  var comps = {
    node: { label: "Node.js LTS & npm", desc: T("Среда JavaScript/TypeScript", "JavaScript/TypeScript runtime"), ok: false, val: "" },
    sequential: { label: "Sequential Thinking", desc: "@modelcontextprotocol/server-sequential-thinking", ok: false, val: "" },
    memory: { label: "Memory Graph", desc: "@modelcontextprotocol/server-memory", ok: false, val: "" },
    filesystem: { label: "Filesystem Access", desc: "@modelcontextprotocol/server-filesystem", ok: false, val: "" },
    everything: { label: "Everything Reference", desc: "@modelcontextprotocol/server-everything", ok: false, val: "" },
    exa: { label: "Exa AI Search", desc: "exa-mcp-server", ok: false, val: "" },
    context7: { label: "Context7 Docs", desc: "@upstash/context7-mcp", ok: false, val: "" },
    brave: { label: "Brave Search", desc: "@modelcontextprotocol/server-brave-search", ok: false, val: "" },
    remote: { label: "MCP Remote Proxy (Stitch)", desc: "mcp-remote (для HTTP/SSE серверов)", ok: false, val: "" },
    github: { label: "GitHub MCP Server", desc: "@modelcontextprotocol/server-github", ok: false, val: "" },
    utcp_bridge: { label: "UTCP-MCP Bridge", desc: "@utcp/mcp-bridge (мост трансляции UTCP в MCP)", ok: false, val: "" },
    utcp_sdk: { label: "UTCP Core SDK", desc: "@utcp/sdk (Universal Tool Calling Protocol)", ok: false, val: "" },
    utcp_http: { label: "UTCP HTTP & OpenAPI", desc: "@utcp/http (HTTP клиент и парсер OpenAPI 3.0)", ok: false, val: "" },
    utcp_file: { label: "UTCP Local Files", desc: "@utcp/file (драйвер локальных JSON/YAML мануалов)", ok: false, val: "" },
    gopls: { label: "Go Language Server", desc: "gopls mcp", ok: false, val: "" },
    python: { label: "Python 3 & pip", desc: T("Среда Python", "Python runtime"), ok: false, val: "" },
    git: { label: "Git", desc: T("Контроль версий", "Version control"), ok: false, val: "" }
  };

  // Ready-to-use UTCP Presets
  var utcpPresets = [
    {
      name: "open-meteo",
      title: "Open-Meteo Weather API",
      desc: T("Точный прогноз погоды и текущая температура по координатам по всему миру без API ключа.",
              "Accurate weather forecast and current temperature by coordinates worldwide without API key."),
      source: "/data/user/0/com.agyru.bp/files/.gemini/config/utcp_manuals/open-meteo.json",
      tools: ["get_weather"]
    },
    {
      name: "ip-lookup",
      title: "IP Geolocation API",
      desc: T("Определение страны, города, координат и интернет-провайдера по любому IP адресу.",
              "Detect country, city, coordinates and ISP for any IP address."),
      source: "/data/user/0/com.agyru.bp/files/.gemini/config/utcp_manuals/ip-lookup.json",
      tools: ["lookup_ip"]
    },
    {
      name: "rest-countries",
      title: "REST Countries Global API",
      desc: T("Энциклопедические данные по странам мира (столицы, валюты, население, границы, языки).",
              "Comprehensive data on world countries (capitals, currencies, population, languages)."),
      source: "/data/user/0/com.agyru.bp/files/.gemini/config/utcp_manuals/rest-countries.json",
      tools: ["get_country"]
    },
    {
      name: "coingecko",
      title: "CoinGecko Crypto API",
      desc: T("Актуальные курсы криптовалют (BTC, ETH, TON, SOL) в USD, EUR, RUB и динамика за 24 часа.",
              "Live cryptocurrency prices (BTC, ETH, TON, SOL) in USD/EUR/RUB and 24h change."),
      source: "/data/user/0/com.agyru.bp/files/.gemini/config/utcp_manuals/coingecko.json",
      tools: ["get_crypto_price"]
    }
  ];

  // Helper links for obtaining API keys & tokens
  var KEY_LINKS = {
    "EXA_API_KEY": { url: "https://dashboard.exa.ai/api-keys", label: "dashboard.exa.ai" },
    "GITHUB_PERSONAL_ACCESS_TOKEN": { url: "https://github.com/settings/tokens", label: "github.com/settings/tokens" },
    "X-Goog-Api-Key": { url: "https://stitch.withgoogle.com/", label: "stitch.withgoogle.com" },
    "BRAVE_API_KEY": { url: "https://api.search.brave.com/app/keys", label: "api.search.brave.com" },
    "OPENAI_API_KEY": { url: "https://platform.openai.com/api-keys", label: "platform.openai.com" },
    "ANTHROPIC_API_KEY": { url: "https://console.anthropic.com/settings/keys", label: "console.anthropic.com" },
    "DEEPSEEK_API_KEY": { url: "https://platform.deepseek.com/api_keys", label: "platform.deepseek.com" },
    "GROQ_API_KEY": { url: "https://console.groq.com/keys", label: "console.groq.com" }
  };

  // Full Catalog of MCP Servers
  var catalog = [
    {
      name: "sequential-thinking",
      title: "Sequential Thinking",
      category: "reasoning",
      tags: ["мышление", "планирование", "логика", "reasoning", "local"],
      desc: T("Локальный сервер глубокого пошагового логического рассуждения, декомпозиции и планирования сложных задач.",
              "Deep sequential reasoning, decomposition and planning server."),
      isBuiltin: true,
      comp: "sequential",
      keys: {}
    },
    {
      name: "memory",
      title: "Memory Graph",
      category: "reasoning",
      tags: ["память", "граф знаний", "контекст", "memory", "graph"],
      desc: T("Граф знаний для долговременного сохранения фактов, сущностей и связей между сессиями.",
              "Knowledge graph for long-term memory, entities and relations across sessions."),
      isBuiltin: true,
      comp: "memory",
      keys: {}
    },
    {
      name: "filesystem",
      title: "Filesystem Access",
      category: "files",
      tags: ["файлы", "хранилище", "диск", "filesystem", "storage"],
      desc: T("Безопасный доступ к чтению, анализу и модификации файлов на устройстве (/storage/emulated/0).",
              "Safe filesystem access to read, inspect and modify files in storage (/storage/emulated/0)."),
      isBuiltin: true,
      comp: "filesystem",
      keys: {}
    },
    {
      name: "everything",
      title: "Everything Reference",
      category: "dev",
      tags: ["тестирование", "промпты", "инструменты", "everything", "tools"],
      desc: T("Эталонный тестовый MCP-сервер со всеми типами ресурсов, промптов и инструментов протокола.",
              "Reference MCP server showcasing tools, prompts, resources and roots."),
      isBuiltin: true,
      comp: "everything",
      keys: {}
    },
    {
      name: "exa",
      title: "Exa AI Search",
      category: "search",
      tags: ["поиск", "веб", "ai", "нейропоиск", "search"],
      desc: T("Интеллектуальный веб-поиск и сбор актуальной информации из интернета в реальном времени.",
              "Neural web search and real-time information gathering from the web."),
      isBuiltin: true,
      comp: "exa",
      keys: { EXA_API_KEY: "" }
    },
    {
      name: "brave-search",
      title: "Brave Search",
      category: "search",
      tags: ["brave", "поиск", "веб", "search"],
      desc: T("Глобальный веб-поиск и локальные запросы через официальный Brave Search API.",
              "Global web search and local queries via the official Brave Search API."),
      isBuiltin: true,
      comp: "brave",
      keys: { BRAVE_API_KEY: "" }
    },
    {
      name: "context7",
      title: "Context7 Docs",
      category: "dev",
      tags: ["документация", "библиотеки", "фреймворки", "docs", "upstash"],
      desc: T("Мгновенный поиск актуальной официальной документации библиотек, фреймворков и API.",
              "Instant lookup of up-to-date documentation for libraries, frameworks and APIs."),
      isBuiltin: true,
      comp: "context7",
      keys: {}
    },
    {
      name: "github-mcp-server",
      title: "GitHub MCP",
      category: "dev",
      tags: ["github", "git", "репозитории", "pr", "коммиты"],
      desc: T("Полная интеграция с GitHub: поиск кода, управление репозиториями, PR, ветками и issue.",
              "Full GitHub integration: code search, repo management, PRs, branches and issues."),
      isBuiltin: true,
      comp: "github",
      keys: { GITHUB_PERSONAL_ACCESS_TOKEN: "" }
    },
    {
      name: "gopls-mcp-server",
      title: "Go Language Server (gopls)",
      category: "dev",
      tags: ["golang", "go", "lsp", "анализ кода", "типы"],
      desc: T("Статический анализ, переход к определениям, поиск символов и диагностика кода на Go.",
              "Code analysis, go-to-definition, symbol references and diagnostics for Go."),
      isBuiltin: true,
      comp: "gopls",
      keys: {}
    },
    {
      name: "StitchMCP",
      title: "Google Stitch MCP",
      category: "cloud",
      tags: ["google", "stitch", "cloud", "облако"],
      desc: T("Удаленный доступ к облачным инструментам Stitch API через Google Cloud Proxy.",
              "Remote access to Stitch API tools via Google Cloud Proxy."),
      isBuiltin: true,
      comp: "remote",
      keys: { "X-Goog-Api-Key": "" }
    },
  ];

  // Active state dictionary populated from config
  var activeServers = {};

  // Initialize activeServers with catalog defaults
  catalog.forEach(function (c) {
    activeServers[c.name] = {
      name: c.name,
      title: c.title,
      category: c.category,
      tags: c.tags,
      desc: c.desc,
      comp: c.comp,
      isBuiltin: c.isBuiltin,
      enabled: false,
      keys: Object.assign({}, c.keys)
    };
  });

  // Provider tools integration
  function isProviderToolsEnabled() {
    try {
      var raw = window.localStorage.getItem("agyProviders") || "";
      if (!raw && window.AgyProviders && typeof window.AgyProviders.load === "function") {
        raw = window.AgyProviders.load();
      }
      if (!raw) return true;
      var data = JSON.parse(raw);
      var conns = data.connections || [];
      for (var i = 0; i < conns.length; i++) {
        var meta = conns[i].modelMeta || {};
        for (var m in meta) {
          if (meta[m] && meta[m].tools === false) return false;
        }
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  function toggleProviderTools(enable) {
    try {
      var raw = window.localStorage.getItem("agyProviders") || "";
      if (!raw && window.AgyProviders && typeof window.AgyProviders.load === "function") {
        raw = window.AgyProviders.load();
      }
      if (!raw) return;
      var data = JSON.parse(raw);
      var conns = data.connections || [];
      conns.forEach(function (c) {
        c.modelMeta = c.modelMeta || {};
        (c.selected || []).forEach(function (m) {
          c.modelMeta[m] = c.modelMeta[m] || {};
          c.modelMeta[m].tools = enable;
        });
      });
      var s = JSON.stringify(data);
      window.localStorage.setItem("agyProviders", s);
      if (window.AgyProviders && typeof window.AgyProviders.save === "function") {
        window.AgyProviders.save(s);
      }
    } catch (e) {}
  }

  function syncAllProviderTools() {
    toggleProviderTools(true);
    alert(T("Инструменты MCP успешно включены для всех моделей кастомных провайдеров!",
            "MCP tools enabled for all custom provider models!"));
  }

  /* ------------------------------------------------------------ Native bridge */
  function runOp(cmd, arg, done) {
    var b = window.AgyTools;
    if (!b || typeof b.start !== "function") {
      logText += "\n[Error] Native AgyTools bridge not available.";
      renderLog();
      if (done) done(null);
      return;
    }
    var fullArg = arg ? (cmd + " " + arg) : cmd;
    var id;
    try {
      id = b.start("mcp", fullArg);
    } catch (e) {
      logText += "\n[Error] Failed to start job: " + e;
      renderLog();
      if (done) done(null);
      return;
    }
    if (!id || /^ERR/.test(String(id))) {
      logText += "\n[Error] Bridge error: " + id;
      renderLog();
      if (done) done(null);
      return;
    }
    job = { id: id, cmd: cmd, arg: arg };
    render();

    clearTimeout(pollTimer);
    (function poll() {
      var r = {};
      try { r = JSON.parse(b.read(id) || "{}"); } catch (e) {}
      if (r.log) {
        logText = r.log;
        renderLog();
      }
      if (r.rc !== undefined && r.rc !== "") {
        job = null;
        parseLog(logText);
        if (done) done(r);
        render();
        return;
      }
      pollTimer = setTimeout(poll, 500);
    })();
  }

  function parseLog(txt) {
    if (!txt) return;
    txt.split("\n").forEach(function (line) {
      var m;
      if ((m = /^@@mcp_comp (\S+) (ok|-) ?(.*)$/.exec(line))) {
        if (comps[m[1]]) {
          comps[m[1]].ok = (m[2] === "ok");
          comps[m[1]].val = m[3] || "";
        }
      } else if ((m = /^@@mcp_srv (\S+) (0|1) ?(.*)$/.exec(line))) {
        var sName = m[1];
        if (!activeServers[sName]) {
          activeServers[sName] = {
            name: sName,
            title: sName,
            category: "dev",
            tags: ["custom", "mcp"],
            desc: T("Пользовательский сервер MCP", "Custom MCP Server"),
            isBuiltin: false,
            enabled: false,
            keys: {}
          };
        }
        activeServers[sName].enabled = (m[2] !== "1"); // 1 = disabled
        if (m[3]) {
          m[3].split(",").forEach(function (pair) {
            var eq = pair.indexOf("=");
            if (eq > 0) {
              var k = pair.slice(0, eq), v = pair.slice(eq + 1);
              activeServers[sName].keys[k] = v;
            }
          });
        }
      } else if ((m = /^@@utcp_srv (\S+) (\S+) (\S+) (0|1) ?(.*)$/.exec(line))) {
        var uName = m[1];
        utcpManuals[uName] = {
          name: uName,
          type: m[2],
          source: m[3],
          disabled: (m[4] === "1"),
          tools: m[5] || ""
        };
      } else if ((m = /^@@utcp_test_ok (\S+) (.*)$/.exec(line))) {
        utcpTestResults[m[1]] = { ok: true, text: m[2] };
      } else if ((m = /^@@utcp_test_fail (\S+) (.*)$/.exec(line))) {
        utcpTestResults[m[1]] = { ok: false, text: m[2] };
      }
    });
  }

  function refreshStatus(done) {
    runOp("status", "", done);
  }

  /* ------------------------------------------------------------ Render */
  function renderLog() {
    if (!root) return;
    var el = root.querySelector(".agy-mcp-log");
    if (el) {
      el.textContent = logText || T("Лог выполнения пуст.", "Execution log is empty.");
      el.scrollTop = el.scrollHeight;
    }
  }

  function getFilteredServers() {
    var list = [];
    var q = searchQuery.toLowerCase().trim();

    for (var sName in activeServers) {
      var s = activeServers[sName];
      if (activeCategory !== "all" && s.category !== activeCategory) {
        continue;
      }
      if (q) {
        var match = s.title.toLowerCase().indexOf(q) >= 0 ||
                    s.name.toLowerCase().indexOf(q) >= 0 ||
                    s.desc.toLowerCase().indexOf(q) >= 0;
        if (!match && s.tags) {
          match = s.tags.some(function (t) { return t.toLowerCase().indexOf(q) >= 0; });
        }
        if (!match) continue;
      }
      list.push(s);
    }
    return list;
  }

  function render() {
    if (!root) return;
    var provTools = isProviderToolsEnabled();
    var isBusy = !!job;

    var html = '';

    // Header
    html += '<div class="agy-mcp-header">';
    html += '  <div class="agy-mcp-title">' + esc(T("Каталог и серверы MCP", "MCP Catalog & Servers")) + '</div>';
    html += '  <div class="agy-mcp-sub">' + esc(T("Управление экосистемой Model Context Protocol: каталог серверов, установка окружения и сквозная передача инструментов в кастомные провайдеры.", "Model Context Protocol marketplace: server catalog, runtime components installer, and seamless tool forwarding to custom providers.")) + '</div>';
    html += '</div>';

    // Provider integration callout
    html += '<div class="agy-mcp-banner">';
    html += '  <div class="agy-mcp-banner-info">';
    html += '    <div class="agy-mcp-banner-title">' + esc(T("Интеграция с кастомными провайдерами", "Custom Providers Integration")) + '</div>';
    html += '    <div class="agy-mcp-banner-desc">' + esc(T("Передавать все активные инструменты MCP в сторонние нейросети (OpenAI, Claude, DeepSeek).", "Forward active MCP tools to external LLM providers (OpenAI, Claude, DeepSeek).")) + '</div>';
    html += '  </div>';
    html += '  <div style="display: flex; align-items: center; gap: 8px;">';
    html += '    <button class="agy-mcp-btn sm secondary" data-act="sync-prov-tools" title="' + esc(T("Включить инструменты во всех моделях", "Enable tools in all models")) + '">' + esc(T("Синхронизировать", "Sync All")) + '</button>';
    html += '    <label class="agy-mcp-switch">';
    html += '      <input type="checkbox" data-act="toggle-prov" ' + (provTools ? 'checked' : '') + '>';
    html += '      <span class="agy-mcp-slider"></span>';
    html += '    </label>';
    html += '  </div>';
    html += '</div>';

    // Segmented Navigation Tabs
    html += '<div class="agy-mcp-tabs">';
    html += '  <button class="agy-mcp-tab ' + (activeTab === "servers" ? "active" : "") + '" data-tab="servers">';
    html += '    ' + esc(T("MCP Серверы", "MCP Servers"));
    html += '  </button>';
    html += '  <button class="agy-mcp-tab ' + (activeTab === "utcp" ? "active" : "") + '" data-tab="utcp">';
    html += '    ' + esc(T("UTCP и OpenAPI", "UTCP & OpenAPI"));
    html += '  </button>';
    html += '  <button class="agy-mcp-tab ' + (activeTab === "components" ? "active" : "") + '" data-tab="components">';
    html += '    ' + esc(T("Компоненты", "Components"));
    html += '  </button>';
    html += '</div>';

    // TAB 1: Servers Catalog
    if (activeTab === "servers") {
      html += '<div class="agy-mcp-section">';

      // Toolbar: Search + Category Pills
      html += '<div class="agy-mcp-toolbar">';
      html += '  <div class="agy-mcp-search-wrap">';
      html += '    <span class="agy-mcp-search-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>';
      html += '    <input type="text" class="agy-mcp-search-input" data-act="search-input" value="' + esc(searchQuery) + '" placeholder="' + esc(T("Поиск серверов MCP (имя, теги, описание)...", "Search MCP servers (name, tags, description)...")) + '">';
      html += '  </div>';

      // Categories
      var cats = [
        { id: "all", label: T("Все", "All") },
        { id: "reasoning", label: T("Рассуждения", "Reasoning") },
        { id: "search", label: T("Поиск и веб", "Search & Web") },
        { id: "dev", label: T("Разработка", "Dev & Code") },
        { id: "files", label: T("Файлы", "Files") },
        { id: "cloud", label: T("Облако", "Cloud") }
      ];

      html += '  <div class="agy-mcp-filter-bar">';
      cats.forEach(function (c) {
        var isAct = (activeCategory === c.id);
        html += '<button class="agy-mcp-filter-pill ' + (isAct ? "active" : "") + '" data-cat="' + esc(c.id) + '">' + esc(c.label) + '</button>';
      });
      html += '  </div>';
      html += '</div>';

      // Button to add custom MCP
      html += '<div class="agy-mcp-add-card" data-act="open-add-modal">';
      html += '  <div>';
      html += '    <div class="agy-mcp-add-title">+ ' + esc(T("Добавить свой MCP-сервер", "Add Custom MCP Server")) + '</div>';
      html += '    <div class="agy-mcp-add-desc">' + esc(T("Подключите любой локальный скрипт (Node.js / Python / Go) или удаленный SSE-сервер.", "Connect any local script (Node.js / Python / Go) or remote SSE server.")) + '</div>';
      html += '  </div>';
      html += '</div>';

      // Server rows in Antigravity Group
      var filtered = getFilteredServers();
      if (filtered.length === 0) {
        html += '<div style="text-align:center; padding: 24px 12px; color: var(--muted-foreground, #888); font-size: 12px;">';
        html += esc(T("Серверы не найдены. Попробуйте изменить поисковый запрос.", "No servers found matching query."));
        html += '</div>';
      } else {
        html += '<div class="agy-mcp-group">';
        filtered.forEach(function (s) {
          html += '<div class="agy-mcp-row">';
          html += '  <div class="agy-mcp-card-main">';
          html += '    <div class="agy-mcp-card-title">';
          html += '      <span>' + esc(s.title || s.name) + '</span>';
          html += '      <span class="agy-mcp-badge ' + (s.enabled ? "on" : "off") + '">' + (s.enabled ? esc(T("Включен", "Active")) : esc(T("Отключен", "Disabled"))) + '</span>';
          if (!s.isBuiltin) {
            html += '    <span class="agy-mcp-tag">' + esc(T("Кастомный", "Custom")) + '</span>';
          }
          html += '    </div>';
          html += '    <div class="agy-mcp-card-desc">' + esc(s.desc || "") + '</div>';

          // Tags
          if (s.tags && s.tags.length > 0) {
            html += '  <div class="agy-mcp-tags">';
            s.tags.forEach(function (t) {
              html += '  <span class="agy-mcp-tag-pill">' + esc(t) + '</span>';
            });
            html += '  </div>';
          }

          // Keys inputs if needed
          var kList = Object.keys(s.keys || {});
          if (kList.length > 0) {
            html += '<div class="agy-mcp-card-fields">';
            kList.forEach(function (k) {
              var val = s.keys[k] || "";
              var isSec = /key|token|secret|auth|password/i.test(k);
              var linkInfo = KEY_LINKS[k] || null;
              if (s.name === "StitchMCP") linkInfo = { url: "https://stitch.withgoogle.com/", label: "stitch.withgoogle.com" };
              else if (!linkInfo && s.name === "exa") linkInfo = KEY_LINKS["EXA_API_KEY"];
              else if (!linkInfo && s.name === "github-mcp-server") linkInfo = KEY_LINKS["GITHUB_PERSONAL_ACCESS_TOKEN"];
              else if (!linkInfo && s.name === "brave-search") linkInfo = KEY_LINKS["BRAVE_API_KEY"];

              html += '<div class="agy-mcp-field">';
              html += '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">';
              html += '    <label style="margin:0;">' + esc(k) + '</label>';
              if (linkInfo) {
                html += '    <a href="' + esc(linkInfo.url) + '" target="_blank" rel="noopener noreferrer" class="agy-mcp-key-link" data-open-url="' + esc(linkInfo.url) + '" style="font-size:11px; color:var(--primary, #0b84ff); text-decoration:none; display:inline-flex; align-items:center; gap:3px; opacity:.9;">';
                html += '      <span>' + esc(linkInfo.label) + '</span>';
                html += '      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
                html += '    </a>';
              }
              html += '  </div>';
              html += '  <div class="agy-mcp-input-wrap">';
              html += '    <input type="' + (isSec ? "password" : "text") + '" data-srv="' + esc(s.name) + '" data-key="' + esc(k) + '" value="' + esc(val) + '" placeholder="' + esc(T("Введите значение...", "Enter value...")) + '">';
              html += '    <button class="agy-mcp-btn-save" data-act="save-key" data-srv="' + esc(s.name) + '" data-key="' + esc(k) + '">' + esc(T("Сохранить", "Save")) + '</button>';
              html += '  </div>';
              html += '</div>';
            });
            html += '</div>';
          }

          // Footer for custom servers
          if (!s.isBuiltin) {
            html += '<div class="agy-mcp-card-footer">';
            html += '  <span style="font-size:11px; color:var(--muted-foreground,#888); font-family:monospace;">' + esc(s.name) + '</span>';
            html += '  <button class="agy-mcp-btn-del" data-act="delete-srv" data-srv="' + esc(s.name) + '">' + esc(T("Удалить сервер", "Delete Server")) + '</button>';
            html += '</div>';
          }

          html += '  </div>';

          html += '  <label class="agy-mcp-switch">';
          html += '    <input type="checkbox" data-srv-toggle="' + esc(s.name) + '" ' + (s.enabled ? "checked" : "") + ' ' + (isBusy ? "disabled" : "") + '>';
          html += '    <span class="agy-mcp-slider"></span>';
          html += '  </label>';
          html += '</div>';
        });
        html += '</div>';
      }

      // Action buttons
      html += '<div class="agy-mcp-actions-bar">';
      html += '  <button class="agy-mcp-btn primary" data-act="restart-core" ' + (isBusy ? "disabled" : "") + '>';
      html += '    ' + esc(T("Применить и перезапустить ядро", "Apply and Restart Core"));
      html += '  </button>';
      html += '  <button class="agy-mcp-btn secondary" data-act="reset-cfg" ' + (isBusy ? "disabled" : "") + '>';
      html += '    ' + esc(T("Восстановить эталонный конфиг", "Restore Clean Config"));
      html += '  </button>';
      html += '</div>';

      html += '</div>';
    }

    // TAB 2: UTCP & OpenAPI
    if (activeTab === "utcp") {
      html += '<div class="agy-mcp-section">';

      // Hero Callout
      var isUtcpActive = activeServers["utcp"] && activeServers["utcp"].enabled;
      html += '<div class="agy-mcp-utcp-hero">';
      html += '  <div class="agy-mcp-utcp-hero-title">';
      html += '    <span>' + esc(T("Universal Tool Calling Protocol (UTCP)", "Universal Tool Calling Protocol (UTCP)")) + '</span>';
      html += '    <span class="agy-mcp-badge on">v1.0 Standard</span>';
      html += '  </div>';
      html += '  <div class="agy-mcp-utcp-hero-desc">' + esc(T(
        "Универсальный протокол прямого вызова API и внешних сервисов без создания промежуточных серверов. Поддерживает спецификации OpenAPI/Swagger 3.0 и нативные JSON-мануалы. Мост @utcp/mcp-bridge транслирует все доступные функции в инструменты MCP для Antigravity и кастомных моделей (OpenAI, Claude, DeepSeek).",
        "Universal protocol for direct tool and API calling without intermediate proxy servers. Connects OpenAPI/Swagger 3.0 specs and native JSON manuals. The @utcp/mcp-bridge exports tools to Antigravity and custom models (OpenAI, Claude, DeepSeek)."
      )) + '</div>';
      html += '  <div class="agy-mcp-utcp-hero-meta">';
      html += '    <span class="agy-mcp-utcp-meta-item">' + esc(T("Мост UTCP ↔ MCP: ", "UTCP ↔ MCP Bridge: ")) + (isUtcpActive ? '<b style="color:#10b981;">' + esc(T("Активен", "Active")) + '</b>' : '<b style="color:#f59e0b;">' + esc(T("Готов", "Ready")) + '</b>') + '</span>';
      html += '    <span class="agy-mcp-utcp-meta-item">Конфиг: ~/.gemini/config/utcp_config.json</span>';
      html += '    <span class="agy-mcp-utcp-meta-item">' + esc(T("Мануалов: ", "Manuals: ")) + Object.keys(utcpManuals).length + '</span>';
      html += '  </div>';
      html += '</div>';

      // Action buttons
      html += '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;">';
      html += '  <button class="agy-mcp-btn primary" data-act="open-add-utcp-modal">+ ' + esc(T("Добавить UTCP мануал / OpenAPI", "Add UTCP Manual / OpenAPI")) + '</button>';
      html += '  <button class="agy-mcp-btn secondary" data-act="refresh-status" ' + (isBusy ? "disabled" : "") + '>' + esc(T("Обновить статус", "Refresh Status")) + '</button>';
      html += '  <button class="agy-mcp-btn secondary" data-act="install-utcp-all" ' + (isBusy ? "disabled" : "") + '>' + esc(T("Установить UTCP стек", "Install UTCP Stack")) + '</button>';
      html += '</div>';

      // Active UTCP Manuals
      html += '<div style="font-weight:600; font-size:13px; margin-bottom:8px; color:var(--foreground);">' + esc(T("Подключенные UTCP мануалы", "Connected UTCP Manuals")) + '</div>';
      var uKeys = Object.keys(utcpManuals);
      if (uKeys.length === 0) {
        html += '<div style="text-align:center; padding:20px; border:1px dashed var(--border, rgba(127,127,127,.25)); border-radius:12px; color:var(--muted-foreground,#888); font-size:12px; margin-bottom:16px;">';
        html += esc(T("Нет добавленных UTCP мануалов. Подключите один из готовых пресетов ниже или добавьте собственный OpenAPI URL.", "No UTCP manuals configured. Connect a preset below or add your own OpenAPI URL."));
        html += '</div>';
      } else {
        html += '<div class="agy-mcp-group">';
        uKeys.forEach(function (uName) {
          var u = utcpManuals[uName];
          html += '<div class="agy-mcp-row">';
          html += '  <div class="agy-mcp-card-main">';
          html += '    <div class="agy-mcp-card-title">';
          html += '      <span>' + esc(u.name) + '</span>';
          html += '      <span class="agy-mcp-badge ' + (u.disabled ? "off" : "on") + '">' + (u.disabled ? esc(T("Отключен", "Disabled")) : esc(T("Активен", "Active"))) + '</span>';
          html += '      <span class="agy-mcp-tag">' + esc(u.type ? u.type.toUpperCase() : "UTCP") + '</span>';
          html += '    </div>';
          html += '    <div class="agy-mcp-card-desc" style="font-family:monospace; word-break:break-all; font-size:11px; margin-top:3px;">' + esc(u.source) + '</div>';
          if (u.tools) {
            html += '  <div class="agy-mcp-tags" style="margin-top:6px;">';
            html += '    <span class="agy-mcp-tag-pill">' + esc(u.tools) + '</span>';
            html += '  </div>';
          }

          // Test Result Output
          if (utcpTestResults[u.name]) {
            var tr = utcpTestResults[u.name];
            html += '<div class="agy-mcp-utcp-test-res ' + (tr.ok ? "ok" : "fail") + '">' + esc(tr.text) + '</div>';
          }

          html += '    <div class="agy-mcp-card-footer">';
          html += '      <button class="agy-mcp-btn sm secondary" data-act="test-utcp" data-uname="' + esc(u.name) + '" ' + (isBusy ? "disabled" : "") + '>' + esc(T("Проверить инструменты", "Test Tools")) + '</button>';
          html += '      <button class="agy-mcp-btn-del" data-act="delete-utcp" data-uname="' + esc(u.name) + '" ' + (isBusy ? "disabled" : "") + '>' + esc(T("Удалить", "Delete")) + '</button>';
          html += '    </div>';
          html += '  </div>';

          html += '  <label class="agy-mcp-switch">';
          html += '    <input type="checkbox" data-utcp-toggle="' + esc(u.name) + '" ' + (u.disabled ? "" : "checked") + ' ' + (isBusy ? "disabled" : "") + '>';
          html += '    <span class="agy-mcp-slider"></span>';
          html += '  </label>';
          html += '</div>';
        });
        html += '</div>';
      }

      // Presets Marketplace
      html += '<div style="margin-top:20px; margin-bottom:8px;">';
      html += '  <div style="font-weight:600; font-size:13px; color:var(--foreground);">' + esc(T("Каталог готовых UTCP API (1-клик)", "Ready-to-use UTCP API Catalog")) + '</div>';
      html += '  <div style="font-size:11.5px; color:var(--muted-foreground,#888); margin-top:2px;">' + esc(T("Популярные бесплатные API без ключей авторизации, оптимизированные для работы с агентами.", "Popular free APIs without authentication keys, optimized for AI agents.")) + '</div>';
      html += '</div>';

      html += '<div class="agy-mcp-utcp-preset-grid">';
      utcpPresets.forEach(function (p) {
        var isConn = !!utcpManuals[p.name];
        html += '<div class="agy-mcp-utcp-preset-card">';
        html += '  <div>';
        html += '    <div class="agy-mcp-utcp-preset-title">' + esc(p.title) + '</div>';
        html += '    <div class="agy-mcp-utcp-preset-desc">' + esc(p.desc) + '</div>';
        html += '    <div class="agy-mcp-tags" style="margin-top:6px;">';
        p.tools.forEach(function (t) {
          html += '    <span class="agy-mcp-tag-pill">' + esc(t) + '</span>';
        });
        html += '    </div>';
        html += '  </div>';
        html += '  <div style="margin-top:4px;">';
        if (isConn) {
          html += '    <button class="agy-mcp-btn sm secondary full" disabled>' + esc(T("Подключен", "Connected")) + '</button>';
        } else {
          html += '    <button class="agy-mcp-btn sm primary full" data-act="add-preset-utcp" data-pname="' + esc(p.name) + '" ' + (isBusy ? "disabled" : "") + '>+ ' + esc(T("Подключить", "Connect")) + '</button>';
        }
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';

      // Action buttons
      html += '<div class="agy-mcp-actions-bar" style="margin-top:16px;">';
      html += '  <button class="agy-mcp-btn primary" data-act="restart-core" ' + (isBusy ? "disabled" : "") + '>';
      html += '    ' + esc(T("Применить и перезапустить ядро", "Apply and Restart Core"));
      html += '  </button>';
      html += '</div>';

      html += '</div>';
    }

    // TAB 3: Components
    if (activeTab === "components") {
      html += '<div class="agy-mcp-section">';

      html += '<div class="agy-mcp-comp-top">';
      html += '  <button class="agy-mcp-btn primary full" data-act="install-all" ' + (isBusy ? "disabled" : "") + '>';
      html += '    ' + esc(T("Установить весь стек MCP в 1 клик", "Install Complete MCP Stack (1-Click)"));
      html += '  </button>';
      html += '  <button class="agy-mcp-btn secondary" data-act="refresh-status" ' + (isBusy ? "disabled" : "") + '>';
      html += '    ' + esc(T("Обновить статус", "Refresh Status"));
      html += '  </button>';
      html += '</div>';

      html += '<div class="agy-mcp-group">';
      for (var cId in comps) {
        var c = comps[cId];
        html += '<div class="agy-mcp-comp-item">';
        html += '  <div class="agy-mcp-comp-main">';
        html += '    <div class="agy-mcp-comp-title">' + esc(c.label);
        html += '      <span class="agy-mcp-badge ' + (c.ok ? "on" : "off") + '">' + (c.ok ? esc(T("Установлен", "Installed")) : esc(T("Отсутствует", "Missing"))) + '</span>';
        html += '    </div>';
        html += '    <div class="agy-mcp-comp-desc">' + esc(c.desc) + (c.val ? ' <span class="agy-mcp-tag">' + esc(c.val) + '</span>' : '') + '</div>';
        html += '  </div>';
        html += '  <button class="agy-mcp-btn sm ' + (c.ok ? "secondary" : "primary") + '" data-act="install-one" data-comp="' + esc(cId) + '" ' + (isBusy ? "disabled" : "") + '>';
        html += '    ' + (c.ok ? esc(T("Переустановить", "Reinstall")) : esc(T("Установить", "Install")));
        html += '  </button>';
        html += '</div>';
      }
      html += '</div>';

      // Log section
      html += '<div class="agy-mcp-log-wrap">';
      html += '  <div class="agy-mcp-log-title">' + esc(T("Терминал установки", "Installation Terminal")) + '</div>';
      html += '  <pre class="agy-mcp-log">' + esc(logText || T("Нажмите «Установить», чтобы запустить установку.", "Click Install to run setup.")) + '</pre>';
      html += '</div>';

      html += '</div>';
    }

    // Modal dialog for custom MCP
    if (showAddModal) {
      html += '<div class="agy-mcp-modal-overlay">';
      html += '  <div class="agy-mcp-modal">';
      html += '    <div class="agy-mcp-modal-title">' + esc(T("Добавить пользовательский MCP-сервер", "Add Custom MCP Server")) + '</div>';
      html += '    <div class="agy-mcp-modal-desc">' + esc(T("Укажите идентификатор сервера, исполняемый файл или команду, аргументы и переменные окружения.", "Specify server identifier, executable command, arguments and environment variables.")) + '</div>';
      html += '    <div class="agy-mcp-modal-form">';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("Имя / ID сервера (без пробелов)", "Server ID")) + '</label><input type="text" id="mcp-modal-name" placeholder="my-custom-mcp"></div>';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("Команда (node, python3 или путь)", "Command")) + '</label><input type="text" id="mcp-modal-cmd" placeholder="/data/user/0/com.agyru.bp/files/runtime/bin/node"></div>';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("Аргументы (через запятую)", "Arguments (comma-separated)")) + '</label><input type="text" id="mcp-modal-args" placeholder="/path/to/server.js,arg1"></div>';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("Переменные среды (KEY1=VAL1,KEY2=VAL2)", "Env Variables (comma-separated)")) + '</label><input type="text" id="mcp-modal-env" placeholder="API_KEY=xyz,DEBUG=1"></div>';
      html += '    </div>';
      html += '    <div class="agy-mcp-modal-actions">';
      html += '      <button class="agy-mcp-btn secondary" data-act="close-add-modal">' + esc(T("Отмена", "Cancel")) + '</button>';
      html += '      <button class="agy-mcp-btn primary" data-act="submit-add-modal">' + esc(T("Добавить сервер", "Add Server")) + '</button>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    }

    // Modal dialog for UTCP / OpenAPI
    if (showAddUtcpModal) {
      html += '<div class="agy-mcp-modal-overlay">';
      html += '  <div class="agy-mcp-modal">';
      html += '    <div class="agy-mcp-modal-title">' + esc(T("Новый UTCP мануал / OpenAPI сервис", "New UTCP Manual / OpenAPI Service")) + '</div>';
      html += '    <div class="agy-mcp-modal-desc">' + esc(T("Подключите любую спецификацию OpenAPI 3.0 (URL) или локальный JSON-мануал UTCP. Инструменты станут доступны ядру Antigravity и всем сторонним нейросетям.", "Connect any OpenAPI 3.0 specification (URL) or local JSON UTCP manual. Tools become immediately available to Antigravity core and all LLMs.")) + '</div>';
      html += '    <div class="agy-mcp-modal-form">';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("Имя мануала / сервиса (ID)", "Manual / Service ID")) + '</label><input type="text" id="utcp-modal-name" placeholder="weather-service"></div>';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("Тип источника", "Source Type")) + '</label>';
      html += '        <select id="utcp-modal-type">';
      html += '          <option value="openapi">' + esc(T("HTTP OpenAPI 3.0 / Swagger JSON (URL)", "HTTP OpenAPI 3.0 / Swagger JSON (URL)")) + '</option>';
      html += '          <option value="http">' + esc(T("HTTP REST Endpoint (URL)", "HTTP REST Endpoint (URL)")) + '</option>';
      html += '          <option value="file">' + esc(T("Локальный JSON-мануал UTCP (.json путь)", "Local UTCP JSON Manual (.json path)")) + '</option>';
      html += '        </select>';
      html += '      </div>';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("URL спецификации или путь к файлу", "Specification URL or file path")) + '</label><input type="text" id="utcp-modal-src" placeholder="https://api.example.com/openapi.json"></div>';
      html += '      <div class="agy-mcp-field"><label>' + esc(T("Заголовок авторизации (опционально)", "Authorization Header (optional)")) + '</label><input type="text" id="utcp-modal-auth" placeholder="Bearer eyJhbGciOi..."></div>';
      html += '    </div>';
      html += '    <div class="agy-mcp-modal-actions">';
      html += '      <button class="agy-mcp-btn secondary" data-act="close-add-utcp-modal">' + esc(T("Отмена", "Cancel")) + '</button>';
      html += '      <button class="agy-mcp-btn primary" data-act="submit-add-utcp-modal">' + esc(T("Сохранить и активировать", "Save & Activate")) + '</button>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    }

    root.innerHTML = html;
  }

  /* ------------------------------------------------------------ Events */
  function onClick(e) {
    var tb = e.target.closest("[data-tab]");
    if (tb) {
      activeTab = tb.getAttribute("data-tab");
      render();
      return;
    }

    var cp = e.target.closest("[data-cat]");
    if (cp) {
      activeCategory = cp.getAttribute("data-cat");
      render();
      return;
    }

    var link = e.target.closest(".agy-mcp-key-link, [data-open-url]");
    if (link) {
      var extUrl = link.getAttribute("data-open-url") || link.getAttribute("href");
      if (extUrl && /^https?:\/\//.test(extUrl)) {
        try {
          window.open(extUrl, "_blank");
        } catch (err) {
          window.location.href = extUrl;
        }
      }
      return;
    }

    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");

    if (act === "toggle-prov") {
      toggleProviderTools(btn.checked);
      return;
    }

    if (act === "sync-prov-tools") {
      syncAllProviderTools();
      return;
    }

    if (act === "open-add-modal") {
      showAddModal = true;
      render();
      return;
    }

    if (act === "close-add-modal") {
      showAddModal = false;
      render();
      return;
    }

    if (act === "submit-add-modal") {
      var nInp = root.querySelector("#mcp-modal-name");
      var cInp = root.querySelector("#mcp-modal-cmd");
      var aInp = root.querySelector("#mcp-modal-args");
      var eInp = root.querySelector("#mcp-modal-env");
      var sName = nInp ? nInp.value.trim() : "";
      var sCmd = cInp ? cInp.value.trim() : "";
      var sArgs = aInp ? aInp.value.trim() : "";
      var sEnv = eInp ? eInp.value.trim() : "";

      if (!sName || !sCmd) {
        alert(T("Укажите имя и команду сервера!", "Please enter server name and command!"));
        return;
      }
      showAddModal = false;
      runOp("add-custom", sName + " " + sCmd + "|" + sArgs + "|" + sEnv, function () {
        refreshStatus();
      });
      return;
    }

    if (act === "open-add-utcp-modal") {
      showAddUtcpModal = true;
      render();
      return;
    }

    if (act === "close-add-utcp-modal") {
      showAddUtcpModal = false;
      render();
      return;
    }

    if (act === "submit-add-utcp-modal") {
      var unInp = root.querySelector("#utcp-modal-name");
      var utInp = root.querySelector("#utcp-modal-type");
      var usInp = root.querySelector("#utcp-modal-src");
      var uaInp = root.querySelector("#utcp-modal-auth");
      var unVal = unInp ? unInp.value.trim() : "";
      var utVal = utInp ? utInp.value.trim() : "openapi";
      var usVal = usInp ? usInp.value.trim() : "";
      var uaVal = uaInp ? uaInp.value.trim() : "";

      if (!unVal || !usVal) {
        alert(T("Укажите имя и источник UTCP сервиса!", "Please enter manual ID and source URL/path!"));
        return;
      }
      showAddUtcpModal = false;
      runOp("add-utcp", unVal + "|" + utVal + "|" + usVal + "|" + uaVal, function () {
        refreshStatus();
      });
      return;
    }

    if (act === "add-preset-utcp") {
      var pName = btn.getAttribute("data-pname");
      var pObj = utcpPresets.find(function (p) { return p.name === pName; });
      if (pObj) {
        runOp("add-utcp", pObj.name + "|file|" + pObj.source + "|", function () {
          refreshStatus();
        });
      }
      return;
    }

    if (act === "delete-utcp") {
      var uDel = btn.getAttribute("data-uname");
      if (uDel && confirm(T("Удалить UTCP мануал " + uDel + "?", "Delete UTCP manual " + uDel + "?"))) {
        runOp("delete-utcp", uDel, function () {
          delete utcpManuals[uDel];
          delete utcpTestResults[uDel];
          render();
        });
      }
      return;
    }

    if (act === "test-utcp") {
      var uTest = btn.getAttribute("data-uname");
      if (uTest) {
        utcpTestResults[uTest] = { ok: true, text: T("Запуск тестирования инструментов через Node.js...", "Running tools discovery via Node.js...") };
        render();
        runOp("test-utcp", uTest, function () {
          render();
        });
      }
      return;
    }

    if (act === "install-utcp-all") {
      logText = T("Установка полного стека UTCP (@utcp/mcp-bridge, @utcp/sdk, @utcp/http, @utcp/file, @utcp/cli)...\n", "Installing full UTCP stack...\n");
      renderLog();
      runOp("install", "utcp-all", function () {
        refreshStatus();
      });
      return;
    }

    if (act === "delete-srv") {
      var sDel = btn.getAttribute("data-srv");
      if (sDel && confirm(T("Удалить сервер " + sDel + "?", "Delete server " + sDel + "?"))) {
        runOp("delete", sDel, function () {
          delete activeServers[sDel];
          refreshStatus();
        });
      }
      return;
    }

    if (act === "install-all") {
      logText = T("Запуск полной установки всех пакетов MCP...\n", "Starting full installation of MCP packages...\n");
      renderLog();
      runOp("install-all", "", function () {
        refreshStatus();
      });
      return;
    }

    if (act === "refresh-status") {
      refreshStatus();
      return;
    }

    if (act === "install-one") {
      var cId = btn.getAttribute("data-comp");
      if (cId) {
        logText = T("Установка компонента: ", "Installing component: ") + cId + "\n";
        renderLog();
        runOp("install", cId, function () {
          refreshStatus();
        });
      }
      return;
    }

    if (act === "save-key") {
      var srv = btn.getAttribute("data-srv");
      var key = btn.getAttribute("data-key");
      var inp = root.querySelector('input[data-srv="' + srv + '"][data-key="' + key + '"]');
      if (inp) {
        var val = inp.value.trim();
        runOp("set-key", srv + " " + key + "=" + val, function () {
          if (activeServers[srv]) activeServers[srv].keys[key] = val;
          render();
        });
      }
      return;
    }

    if (act === "reset-cfg") {
      if (confirm(T("Восстановить эталонный файл mcp_config.json без npx/docker?", "Restore clean mcp_config.json without npx/docker?"))) {
        runOp("reset-config", "", function () {
          refreshStatus();
        });
      }
      return;
    }

    if (act === "restart-core") {
      if (window.AgyProviders && typeof window.AgyProviders.restartCore === "function") {
        window.AgyProviders.restartCore();
        alert(T("Ядро перезапущено. Изменения MCP применены.", "Core restarted. MCP changes applied."));
      } else {
        alert(T("Перезапустите приложение для применения настроек.", "Restart application to apply settings."));
      }
      return;
    }
  }

  function onInput(e) {
    if (e.target.matches("[data-act='search-input']")) {
      searchQuery = e.target.value;
      // Re-render only cards without destroying search focus if needed
      var section = root.querySelector(".agy-mcp-section");
      if (section) {
        // Keep focus
        var pos = e.target.selectionStart;
        render();
        var reInp = root.querySelector("[data-act='search-input']");
        if (reInp) {
          reInp.focus();
          reInp.setSelectionRange(pos, pos);
        }
      }
    }
  }

  function onChange(e) {
    if (e.target.matches("[data-act='toggle-prov']")) {
      toggleProviderTools(e.target.checked);
      return;
    }

    var st = e.target.closest("[data-srv-toggle]");
    if (st) {
      var sName = st.getAttribute("data-srv-toggle");
      var enabled = st.checked;
      runOp("toggle", sName + " " + (enabled ? "1" : "0"), function () {
        if (activeServers[sName]) activeServers[sName].enabled = enabled;
        render();
      });
      return;
    }

    var ut = e.target.closest("[data-utcp-toggle]");
    if (ut) {
      var uName = ut.getAttribute("data-utcp-toggle");
      var uEnabled = ut.checked;
      runOp("toggle-utcp", uName + " " + (uEnabled ? "1" : "0"), function () {
        if (utcpManuals[uName]) utcpManuals[uName].disabled = !uEnabled;
        render();
      });
      return;
    }
  }

  /* ------------------------------------------------------------ Mount */
  window.__agyMcpMount = function (el) {
    if (!el) return;
    if (root && root.parentElement === el) {
      render();
      return;
    }
    host = el;
    root = document.createElement("div");
    root.className = "agy-mcp";
    root.setAttribute("data-agy-no-translate", "");
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onChange);
    host.appendChild(root);

    refreshStatus();
    render();
  };
})();
