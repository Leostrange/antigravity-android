/* Antigravity RU — Settings › Providers.
 * Lets the user add third-party model connections (Claude-, OpenAI- or
 * Gemini-compatible), paste a base URL + API key, and load the provider's
 * model list. Configs are stored by the native AgyProviders bridge (the core's
 * LLM-gateway launcher reads them). Model listing is done natively so provider
 * CORS never blocks it. Wiring selected models into the core runs as the next
 * step; this page configures and validates connections. */
(function () {
  "use strict";
  if (window.__agyProvidersReady) return;
  window.__agyProvidersReady = true;

  function ru() { try { return window.__agyI18n ? window.__agyI18n.getLanguage() === "ru" : true; } catch (e) { return true; } }
  function T(r, e) { return ru() ? r : e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // A capability toggle chip for a selected model (images / tools / reasoning).
  function capChip(kind, m, on, label, title) {
    return '<label class="agy-pv-cap' + (on ? " on" : "") + '" title="' + esc(title) + '">' +
      '<input type="checkbox" data-cap="' + kind + '" data-capm="' + esc(m) + '"' + (on ? " checked" : "") + "> " + esc(label) + "</label>";
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  var TYPES = [
    { id: "openai", ru: "OpenAI-совместимый", en: "OpenAI-compatible", base: "https://api.openai.com/v1", hint: T("OpenAI, DeepSeek, Groq, xAI, Mistral, OpenRouter, локальные серверы.", "OpenAI, DeepSeek, Groq, xAI, Mistral, OpenRouter, local servers.") },
    { id: "anthropic", ru: "Claude-совместимый (Anthropic)", en: "Claude-compatible (Anthropic)", base: "https://api.anthropic.com", hint: T("Anthropic и прокси с форматом Messages API.", "Anthropic and proxies speaking the Messages API.") },
    { id: "gemini", ru: "Gemini-совместимый", en: "Gemini-compatible", base: "https://generativelanguage.googleapis.com/v1beta", hint: T("Google AI Studio и прокси с generateContent.", "Google AI Studio and generateContent proxies.") }
  ];
  function typeOf(id) { return TYPES.filter(function (t) { return t.id === id; })[0] || TYPES[0]; }

  var bridge = window.AgyProviders && typeof window.AgyProviders.save === "function" ? window.AgyProviders : null;

  var state = { connections: [] };
  function load() {
    var raw = "";
    try { raw = bridge ? bridge.load() : (localStorage.getItem("agyProviders") || ""); } catch (e) {}
    if (raw) { try { state = JSON.parse(raw); } catch (e) { state = { connections: [] }; } }
    if (!state.connections) state.connections = [];
  }
  function save() {
    var json = JSON.stringify(state);
    try { if (bridge) bridge.save(json); else localStorage.setItem("agyProviders", json); } catch (e) {}
  }

  /* Restart the core so it re-reads the provider env (switch standard<->providers
     mode, or pick up a changed connection) — no manual Force Stop needed. */
  var restarting = false, restartTimer = 0;
  function applyRestart() {
    if (restarting) return;
    try { if (bridge && typeof bridge.restartCore === "function") bridge.restartCore(); } catch (e) {}
    restarting = true;
    clearTimeout(restartTimer);
    restartTimer = setTimeout(function () { restarting = false; if (root && root.isConnected) render(); }, 15000);
  }

  /* ---- global reader used by the model selector (main.js / cCb) ----
     Builds the provider-model map straight from storage, so it works no matter
     whether this settings page has been mounted yet. Each selected model turns
     into a BYOM custom-model entry {modelId, modelName}; cKa in main.js maps
     that into a selectable option, and the request resolves "gemini-api:/models/<id>"
     through the local gateway. Cached; the page calls __agyRefreshProviderModels
     on any change to invalidate the cache and re-render the selector. */
  function readPersisted() {
    var raw = "";
    try { raw = bridge ? bridge.load() : (localStorage.getItem("agyProviders") || ""); } catch (e) {}
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  // Specs for the selector: one per selected model, carrying the per-connection
  // capabilities and token budget set on the Providers page. main.js turns each
  // into a full BYOM ModelInfo. Capabilities live here, NOT in the selector.
  var __agySpecCache = null;
  function buildSpecs() {
    var cfg = readPersisted(), out = [], seen = {};
    if (!(cfg && cfg.useProviders && cfg.connections)) return out;
    cfg.connections.forEach(function (c) {
      var meta = c.modelMeta || {};
      (c.selected || []).forEach(function (m) {
        if (!m || seen[m]) return; seen[m] = 1;
        var md = effectiveInfo(c, m, meta[m]);
        out.push({
          // Bare id: in Providers mode the core routes the custom model through
          // the exclusive AGY_LLM_GATEWAY to the provider, which expects the raw
          // model id (e.g. "mimo-v2.6-pro").
          label: m, modelName: m,
          maxTokens: md.ctx && md.ctx > 0 ? md.ctx : 200000,
          images: md.images !== false, tools: md.tools !== false, thinking: md.thinking !== false,
          efforts: Array.isArray(md.efforts) && md.efforts.length ? md.efforts.slice() : null,
          effort: typeof md.effort === "string" && md.effort ? md.effort : null,
          ctxOut: Number(md.reportedMaxOutput) > 0 ? Number(md.reportedMaxOutput) : null
        });
      });
    });
    return out;
  }
  window.__agyProviderSpecs = function () {
    if (__agySpecCache !== null) return __agySpecCache;
    var s = buildSpecs();
    // Cache only a non-empty result, so the selector self-heals on its next
    // render once a provider is configured.
    if (s.length) __agySpecCache = s;
    return s;
  };
  // The core's gateway discovery returns the same provider models as native
  // options. Suppress exact duplicates only in this selector; keep all other
  // server-provided models and the original model/usage UI untouched.
  window.__agyFilterProviderDuplicates = function (status) {
    if (!status || !status.cascadeModelConfigData) return status;
    var specs = window.__agyProviderSpecs ? window.__agyProviderSpecs() : [];
    if (!specs.length) return status;
    var ids = new Set();
    specs.forEach(function (it) { ids.add(it.label); });
    var data = status.cascadeModelConfigData;
    return Object.assign({}, status, { cascadeModelConfigData: Object.assign({}, data, {
      clientModelConfigs: (data.clientModelConfigs || []).filter(function (m) { return !ids.has(m.label) && !ids.has(m.modelId); })
    }) });
  };
  window.__agySetCustomEffort = function (modelId, effort) {
    var cfg = readPersisted();
    if (!cfg || !cfg.connections) return;
    var changed = false;
    cfg.connections.forEach(function (c) {
      if ((c.selected || []).indexOf(modelId) < 0) return;
      c.modelMeta = c.modelMeta || {};
      c.modelMeta[modelId] = c.modelMeta[modelId] || {};
      if (effort) c.modelMeta[modelId].effort = effort;
      else delete c.modelMeta[modelId].effort;
      changed = true;
    });
    if (!changed) return;
    try { if (bridge) bridge.save(JSON.stringify(cfg)); else localStorage.setItem("agyProviders", JSON.stringify(cfg)); } catch (e) {}
    window.__agyRefreshProviderModels();
  };
  window.__agyRefreshProviderModels = function () {
    __agySpecCache = null;
    try { if (window.__agyBump) window.__agyBump(function (x) { return (x || 0) + 1; }); } catch (e) {}
  };

  var root = null, editing = null, fetchTimer = 0, fetchJob = null, fetchMsg = "", typeOpen = false;

  /* ---- sync selected provider models into the model selector (BYOM) ---- */
  function desiredModels() {
    var out = [], seen = {};
    if (!state.useProviders) return out;
    state.connections.forEach(function (c) {
      (c.selected || []).forEach(function (m) {
        if (!m || seen[m]) return;
        seen[m] = 1;
        out.push({ label: m, modelName: m });
      });
    });
    return out;
  }
  function syncModels() {
    if (window.__agyRefreshProviderModels) window.__agyRefreshProviderModels();
  }

  /* ---------------------------------------------------------- model listing
   * Returns {ids, meta}. meta[id] = {ctx, images, tools, thinking} inferred from
   * whatever the provider's /models endpoint reports (context window, modalities,
   * supported parameters). The user never types any of this; unknown fields fall
   * back to generous defaults so the model still works. */
  function arrHas(a, k) { return Array.isArray(a) && a.indexOf(k) >= 0; }
  // Documented capability snapshot: applies only to official Xiaomi endpoints
  // and exact model IDs. /v1/models currently does not return these fields.
  function officialModelInfo(base, id) {
    var host = "";
    try { host = new URL(base).hostname.toLowerCase(); } catch (e) { return null; }
    if (!(host === "xiaomimimo.com" || host.endsWith(".xiaomimimo.com"))) return null;
    if (["mimo-v2.6-pro", "mimo-v2.6-flash", "mimo-v2.6-pro-ultraspeed"].indexOf(id) < 0) return null;
    return { ctx: 1048576, maxOutput: 131072, inputModes: ["text", "image", "audio", "video"],
      reasoning: true, tools: true, source: "xiaomi-docs", verified: "2026-10-29" };
  }
  function effectiveInfo(connection, id, stored) {
    var md = Object.assign({}, stored || {});
    var official = officialModelInfo(connection.baseUrl || typeOf(connection.type).base, id);
    if (!official) return md;
    // Upgrade old saved entries in memory without overwriting the user's choices.
    if (!Array.isArray(md.inputModes)) md.inputModes = official.inputModes.slice();
    if (!(Number(md.reportedCtx) > 0)) md.reportedCtx = official.ctx;
    if (md.reasoningReported == null) md.reasoningReported = official.reasoning;
    if (md.toolsReported == null) md.toolsReported = official.tools;
    if (!(Number(md.ctx) > 0)) md.ctx = official.ctx;
    if (!md.factsSource) { md.factsSource = official.source; md.factsVerified = official.verified; }
    return md;
  }
  function parseModels(type, body, baseUrl) {
    try {
      var o = JSON.parse(body), ids = [], meta = {};
      function put(id, ctx, images, tools, thinking, inputModes, knownReasoning, knownTools) {
        id = id && String(id); if (!id) return;
        var official = officialModelInfo(baseUrl, id);
        var modes = Array.isArray(inputModes) && inputModes.length ? inputModes.slice() : null;
        var apiCtx = Number(ctx) > 0 ? Number(ctx) : 0;
        if (!modes && official) modes = official.inputModes.slice();
        var reportedCtx = apiCtx || (official ? official.ctx : 0);
        var reason = typeof knownReasoning === "boolean" ? knownReasoning : (official ? official.reasoning : null);
        var functions = typeof knownTools === "boolean" ? knownTools : (official ? official.tools : null);
        ids.push(id);
        meta[id] = { ctx: reportedCtx, images: modes ? modes.indexOf("image") >= 0 : images !== false,
          tools: functions === null ? tools !== false : functions, thinking: reason === null ? thinking !== false : reason,
          inputModes: modes, reportedCtx: reportedCtx || null, reasoningReported: reason, toolsReported: functions,
          reportedMaxOutput: official ? official.maxOutput : null,
          factsSource: official ? "xiaomi-docs" : (modes || apiCtx || reason !== null || functions !== null ? "provider-api" : null),
          factsVerified: official ? official.verified : null };
      }
      if (type === "gemini") {
        (o.models || []).forEach(function (m) {
          var id = String(m.name || "").replace(/^models\//, "");
          put(id, m.inputTokenLimit || 0, true, true, true);
        });
      } else if (type === "anthropic") {
        (o.data || o.models || []).forEach(function (m) {
          if (typeof m === "string") { put(m, 0, true, true, true); return; }
          put(m.id, m.context_window || 0, true, true, true);
        });
      } else {
        (o.data || o.models || []).forEach(function (m) {
          if (typeof m === "string") { put(m, 0, true, true, true); return; }
          var arch = m.architecture || {};
          var inMod = arch.input_modalities || arch.modality || [];
          var images = Array.isArray(inMod) ? inMod.indexOf("image") >= 0 : /image/.test(String(inMod));
          var sp = m.supported_parameters;
          var tools = Array.isArray(sp) ? arrHas(sp, "tools") : true;
          var thinking = Array.isArray(sp) ? (arrHas(sp, "reasoning") || arrHas(sp, "include_reasoning")) : true;
          var ctx = m.context_length || m.context_window || (m.top_provider && m.top_provider.context_length) || 0;
          // When the provider gives no modality/param hints, default permissive.
          put(m.id, ctx, Array.isArray(inMod) && inMod.length ? images : true, tools, thinking, Array.isArray(inMod) ? inMod : null, Array.isArray(sp) ? thinking : null, Array.isArray(sp) ? tools : null);
        });
      }
      return { ids: ids, meta: meta };
    } catch (e) { return null; }
  }
  function loadModels(conn) {
    fetchMsg = T("Загрузка списка моделей…", "Loading models…");
    render();
    if (bridge && typeof bridge.fetchModels === "function") {
      var id;
      try { id = bridge.fetchModels(conn.type, conn.baseUrl || "", conn.apiKey || "", JSON.stringify(conn.headers || {})); } catch (e) { fetchMsg = "ERR:" + e; render(); return; }
      fetchJob = id;
      pollFetch(conn);
    } else {
      // No native bridge: try a direct fetch (may be blocked by provider CORS).
      directFetch(conn);
    }
  }
  function pollFetch(conn) {
    clearTimeout(fetchTimer);
    if (!fetchJob) return;
    var r = {};
    try { r = JSON.parse(bridge.readFetch(fetchJob) || "{}"); } catch (e) {}
    if (!r.done) { fetchTimer = setTimeout(function () { pollFetch(conn); }, 500); return; }
    fetchJob = null;
    applyModels(conn, parseInt(r.status, 10) || 0, r.body || "");
  }
  function directFetch(conn) {
    var ty = conn.type, base = (conn.baseUrl || typeOf(ty).base).replace(/\/+$/, "");
    var url, headers = { "Accept": "application/json" };
    if (ty === "gemini") url = base + "/models?key=" + encodeURIComponent(conn.apiKey || "");
    else if (ty === "anthropic") { url = base + "/v1/models"; headers["x-api-key"] = conn.apiKey || ""; headers["anthropic-version"] = "2023-06-01"; headers["anthropic-dangerous-direct-browser-access"] = "true"; }
    else { url = base + "/models"; headers["Authorization"] = "Bearer " + (conn.apiKey || ""); }
    Object.keys(conn.headers || {}).forEach(function (k) { headers[k] = conn.headers[k]; });
    fetch(url, { headers: headers }).then(function (res) {
      return res.text().then(function (b) { applyModels(conn, res.status, b); });
    }).catch(function (e) { applyModels(conn, 0, "ERR:" + e + T(" (возможно, провайдер блокирует запрос из приложения — нужен нативный мост)", " (the provider may block in-app requests — native bridge needed)")); });
  }
  function applyModels(conn, status, body) {
    if (status < 200 || status >= 400) {
      fetchMsg = T("Ошибка ", "Error ") + (status || "") + ": " + (body || "").slice(0, 300);
      render(); return;
    }
    var parsed = parseModels(conn.type, body, conn.baseUrl || typeOf(conn.type).base);
    if (!parsed || !parsed.ids.length) { fetchMsg = T("Список моделей пуст или не распознан.", "No models returned or response not recognized."); render(); return; }
    conn.models = parsed.ids;
    // Keep explicit user overrides when the provider catalog is refreshed.
    Object.keys(parsed.meta).forEach(function (id) {
      var old = conn.modelMeta && conn.modelMeta[id];
      if (!old) return;
      // Older versions did not distinguish defaults from manual edits. Preserve
      // their existing toggles as-is instead of silently changing user settings.
      var overrides = old.overrides || {};
      ["images", "tools", "thinking"].forEach(function (k) {
        if (typeof overrides[k] === "boolean") parsed.meta[id][k] = overrides[k];
        else if (!old.overrides && typeof old[k] === "boolean") parsed.meta[id][k] = old[k];
      });
      if (old.overrides) parsed.meta[id].overrides = overrides;
      if (typeof old.effort === "string" && old.effort) parsed.meta[id].effort = old.effort;
      if (Array.isArray(old.efforts) && old.efforts.length) parsed.meta[id].efforts = old.efforts.slice();
    });
    conn.modelMeta = parsed.meta;
    if (!conn.selected) conn.selected = [];
    save();
    fetchMsg = T("Загружено моделей: ", "Loaded models: ") + parsed.ids.length;
    render();
  }

  /* ---------------------------------------------------------- render */
  function render() {
    if (!root || !root.isConnected) return;
    var h = '<div class="agy-pv-head"><div class="agy-pv-title">' + esc(T("Провайдеры", "Providers")) + "</div>" +
      '<div class="agy-pv-sub">' + esc(T("Подключение сторонних моделей по API: Claude-, OpenAI- и Gemini-совместимые. Работает как режим: включите — работают ваши провайдеры, выключите — стандартные модели Google (ограничение ядра: одновременно нельзя).", "Connect third-party models by API: Claude-, OpenAI- and Gemini-compatible. Works as a mode: on = your providers, off = the standard Google models (the core can't do both at once).")) + "</div></div>";
    if (!bridge) h += '<div class="agy-pv-warn">' + esc(T("Нативный мост недоступен — ключи хранятся только в этой сессии, загрузка моделей может блокироваться провайдером.", "Native bridge unavailable — keys are kept only in this session and model loading may be blocked by the provider.")) + "</div>";

    if (restarting) h += '<div class="agy-pv-status">' + esc(T("Ядро перезапускается, чтобы применить изменения… (несколько секунд)", "Restarting the core to apply changes… (a few seconds)")) + "</div>";

    if (editing) { h += form(editing); root.innerHTML = h; return; }

    var anySelected = state.connections.some(function (c) { return (c.selected || []).length; });
    h += '<label class="agy-pv-switch"><span>' + esc(T("Режим провайдеров", "Providers mode")) +
      '<small>' + esc(T("Вкл — работают ваши провайдеры (стандартные модели Google при этом скрываются). Выкл — стандартные модели. При переключении ядро перезапускается само.", "On — your providers work (standard Google models are hidden). Off — the standard models. The core restarts automatically on switch.")) + "</small></span>" +
      '<input type="checkbox" data-master="1"' + (state.useProviders ? " checked" : "") + (anySelected ? "" : " disabled") + "></label>";

    if (state.useProviders && anySelected) {
      h += '<div class="agy-pv-note">' + esc(T("Выбранные модели — в селекторе чата, раздел «Пользовательский» (вместе с режимом рассуждения). Если изменили провайдера или модели — нажмите «Применить», чтобы ядро перечитало настройки.", "The selected models are in the chat model selector, \"Custom\" section (with the reasoning mode). If you changed a provider or models, tap \"Apply\" so the core re-reads the settings.")) + "</div>";
      h += '<div class="agy-pv-row"><button type="button" class="agy-pv-btn sec" data-act="restart">' + esc(T("Применить (перезапустить ядро)", "Apply (restart core)")) + "</button></div>";
    }

    if (!state.connections.length) h += '<div class="agy-pv-empty">' + esc(T("Подключений пока нет.", "No connections yet.")) + "</div>";
    state.connections.forEach(function (c) {
      var ty = typeOf(c.type);
      var sel = (c.selected || []).length, tot = (c.models || []).length;
      h += '<div class="agy-pv-card"><div class="agy-pv-main">' +
        '<div class="agy-pv-name">' + esc(c.name || ty.ru) + ' <span class="agy-pv-tag">' + esc(T(ty.ru, ty.en)) + "</span></div>" +
        '<div class="agy-pv-meta">' + esc(c.baseUrl || ty.base) + "</div>" +
        '<div class="agy-pv-meta">' + esc(c.apiKey ? T("Ключ: ••••", "Key: ••••") + String(c.apiKey).slice(-4) : T("Ключ не задан", "No key")) +
        (tot ? " · " + esc(T("моделей: ", "models: ") + sel + "/" + tot) : "") + "</div></div>" +
        '<div class="agy-pv-btns"><button type="button" class="agy-pv-btn sec" data-edit="' + c.id + '">' + esc(T("Изменить", "Edit")) + "</button></div></div>";
      if (sel) {
        h += '<details class="agy-pv-model-info"><summary>' + esc(T("Добавленные модели", "Added models")) + ' (' + sel + ')</summary>';
        (c.selected || []).forEach(function (id) {
          var md = effectiveInfo(c, id, c.modelMeta && c.modelMeta[id]), modes = Array.isArray(md.inputModes) ? md.inputModes : null;
          function value(x) { return x === null || x === undefined ? T("неизвестно", "unknown") : x ? T("да", "yes") : T("нет", "no"); }
          function mode(x) { return value(modes ? modes.indexOf(x) >= 0 : null); }
          var context = Number(md.reportedCtx) > 0 ? Number(md.reportedCtx).toLocaleString() + ' ' + T("токенов", "tokens") : T("неизвестно", "unknown");
          var source = md.factsSource === "xiaomi-docs" ? T("официальная документация Xiaomi", "official Xiaomi documentation") : md.factsSource === "provider-api" ? T("ответ API провайдера", "provider API response") : T("нет данных", "not provided");
          h += '<div class="agy-pv-model-info-row"><div class="agy-pv-name">' + esc(id) + '</div>' +
            '<div class="agy-pv-meta">' + esc(T("Контекст: ", "Context: ") + context) + '</div>' +
            '<div class="agy-pv-meta">' + esc(T("Изображения: ", "Images: ") + mode("image") + ' · ' + T("Аудио: ", "Audio: ") + mode("audio") + ' · ' + T("Видео: ", "Video: ") + mode("video")) + '</div>' +
            '<div class="agy-pv-meta">' + esc(T("Reasoning: ", "Reasoning: ") + value(md.reasoningReported) + ' · ' + T("Инструменты: ", "Tools: ") + value(md.toolsReported)) + '</div>' +
            '<div class="agy-pv-meta">' + esc(T("В настройках: изображения ", "Configured: images ") + value(md.images !== false) + ' · ' + T("reasoning ", "reasoning ") + value(md.thinking !== false)) + '</div>' +
            '<div class="agy-pv-meta">' + esc(T("Источник: ", "Source: ") + source + (md.factsVerified ? ' · ' + md.factsVerified : '')) + '</div>' +
            '<div class="agy-pv-meta">' + esc(T("Режим мышления: ", "Effort: ") + (typeof md.effort === "string" && md.effort ? md.effort : T("не задан", "not set")) + (Array.isArray(md.efforts) && md.efforts.length ? ' · ' + T("уровни из документации: ", "documented levels: ") + md.efforts.join(", ") : '')) + '</div></div>';
        });
        h += '<div class="agy-pv-meta">' + esc(T("Это возможности модели. Поддержка каждого типа вложений приложением проверяется отдельно.", "These are model capabilities. App support for each attachment type is separate.")) + '</div></details>';
      }

    });
    h += '<div class="agy-pv-bar"><button type="button" class="agy-pv-btn" data-add="1">' + esc(T("Добавить подключение", "Add connection")) + "</button></div>";
    root.innerHTML = h;
  }

  function form(c) {
    var ty = typeOf(c.type);
    // Custom styled dropdown for the API type (the native <select> popup renders
    // as an unstyled black system menu on this WebView).
    var opts = TYPES.map(function (t) {
      return '<div class="agy-pv-opt' + (c.type === t.id ? " sel" : "") + '" data-typepick="' + t.id + '">' +
        esc(T(t.ru, t.en)) + (c.type === t.id ? '<span class="agy-pv-ok">✓</span>' : "") + "</div>";
    }).join("");
    var h = '<div class="agy-pv-form">' +
      '<label class="agy-pv-field"><span>' + esc(T("Тип API", "API type")) + "</span>" +
      '<div class="agy-pv-dd' + (typeOpen ? " open" : "") + '">' +
        '<button type="button" class="agy-pv-ddbtn" data-typetoggle="1">' +
          '<span>' + esc(T(ty.ru, ty.en)) + '</span><span class="agy-pv-ddcar">▾</span></button>' +
        (typeOpen ? '<div class="agy-pv-ddlist">' + opts + "</div>" : "") +
      "</div></label>" +
      '<div class="agy-pv-hint">' + esc(ty.hint) + "</div>" +
      '<label class="agy-pv-field"><span>' + esc(T("Название", "Name")) + '</span><input data-f="name" value="' + esc(c.name || "") + '" placeholder="' + esc(T("Например, Мой Claude", "e.g. My Claude")) + '"></label>' +
      '<label class="agy-pv-field"><span>Base URL</span><input data-f="baseUrl" value="' + esc(c.baseUrl || "") + '" placeholder="' + esc(ty.base) + '" autocapitalize="off" autocorrect="off" spellcheck="false"></label>' +
      '<label class="agy-pv-field"><span>' + esc(T("API-ключ", "API key")) + '</span><input data-f="apiKey" type="password" value="' + esc(c.apiKey || "") + '" placeholder="sk-…" autocapitalize="off" autocorrect="off" spellcheck="false"></label>' +
      '<div class="agy-pv-row"><button type="button" class="agy-pv-btn" data-act="loadmodels">' + esc(T("Загрузить модели", "Load models")) + "</button>" +
      '<button type="button" class="agy-pv-btn sec" data-act="save">' + esc(T("Сохранить", "Save")) + "</button>" +
      '<button type="button" class="agy-pv-btn sec" data-act="cancel">' + esc(T("Отмена", "Cancel")) + "</button></div>";
    if (fetchMsg) h += '<div class="agy-pv-status">' + esc(fetchMsg) + "</div>";
    if ((c.models || []).length) {
      h += '<div class="agy-pv-models">';
      c.models.forEach(function (m) {
        var on = (c.selected || []).indexOf(m) >= 0;
        var md = (c.modelMeta && c.modelMeta[m]) || {};
        var imgOn = md.images !== false, toolsOn = md.tools !== false, thinkOn = md.thinking !== false;
        var ctx = md.ctx && md.ctx > 0 ? md.ctx : 0;
        var ctxLbl = ctx ? (ctx >= 1000 ? Math.round(ctx / 1000) + "k" : "" + ctx) : "";
        // Context badge comes from the provider's /models response (official source).
        h += '<div class="agy-pv-model">' +
             '<label class="agy-pv-sel"><input type="checkbox" data-model="' + esc(m) + '"' + (on ? " checked" : "") + "> <span>" + esc(m) + "</span></label>" +
             (ctxLbl ? '<span class="agy-pv-badge" title="' + esc(T("Контекст (из /models провайдера)", "Context (from provider /models)")) + '">' + esc(ctxLbl) + "</span>" : "") +
             "</div>";
        // Per-model capability toggles (detected from /models, overridable by hand).
        if (on) {
          var effCur = typeof md.effort === "string" ? md.effort : "";
          var effList = Array.isArray(md.efforts) ? md.efforts.join(", ") : "";
          h += '<div class="agy-pv-caps">' +
            capChip("img", m, imgOn, T("картинки", "images"), T("Модель видит изображения", "Model sees images")) +
            capChip("tools", m, toolsOn, T("инструменты", "tools"), T("Вызовы инструментов / функций", "Tool / function calls")) +
            capChip("think", m, thinkOn, "reasoning", T("Режим рассуждений", "Reasoning mode")) +
            "</div>" +
            '<label class="agy-pv-field"><span>' + esc(T("Режим мышления (ручная настройка)", "Effort (manual setting)")) + '</span>' +
            '<select data-effort="' + esc(m) + '">' +
            '<option value=""' + (effCur === "" ? " selected" : "") + '>' + esc(T("не задан", "not set")) + '</option>' +
            ["low", "medium", "high", "xhigh", "max"].map(function (lv) { return '<option value="' + lv + '"' + (effCur === lv ? " selected" : "") + '>' + lv + '</option>'; }).join("") +
            '</select></label>' +
            '<label class="agy-pv-field"><span>' + esc(T("Уровни из документации провайдера (через запятую, если известны)", "Documented levels (comma-separated, if known)")) + '</span>' +
            '<input data-efforts="' + esc(m) + '" value="' + esc(effList) + '" placeholder="low, medium, high" autocapitalize="off" autocorrect="off" spellcheck="false"></label>' +
            '<div class="agy-pv-hint">' + esc(T("Уровни не выдумываются: если провайдер их не заявил, оставьте поле пустым. Выбранный режим подставляется шлюзом только для этой модели.", "Levels are not invented: leave empty if the provider did not document them. The chosen effort is injected by the gateway for this model only.")) + "</div>";
        }
      });
      h += "</div>";
    }
    if (!c.__new) h += '<div class="agy-pv-row"><button type="button" class="agy-pv-btn danger" data-act="delete">' + esc(T("Удалить подключение", "Delete connection")) + "</button></div>";
    return h + "</div>";
  }

  function readForm() {
    if (!editing) return;
    root.querySelectorAll("[data-f]").forEach(function (el) {
      var k = el.getAttribute("data-f");
      editing[k] = el.value;
    });
  }

  function onInput(e) {
    var el = e.target;
    if (el.matches && el.matches("select[data-f='type']")) { readForm(); render(); }
  }
  function onChange(e) {
    var el = e.target;
    if (el.matches && el.matches("input[data-master]")) {
      state.useProviders = el.checked;
      save(); syncModels(); applyRestart(); render(); return;
    }
    if (el.matches && el.matches("input[data-model]")) {
      if (!editing) return;
      var m = el.getAttribute("data-model");
      editing.selected = editing.selected || [];
      var i = editing.selected.indexOf(m);
      if (el.checked && i < 0) editing.selected.push(m);
      else if (!el.checked && i >= 0) editing.selected.splice(i, 1);
      if ((editing.selected || []).length) state.useProviders = true;
      // Mirror the live edit into the stored connection so the selector picks it
      // up immediately (the Save button also persists it for new connections).
      var j = state.connections.map(function (cc) { return cc.id; }).indexOf(editing.id);
      if (j >= 0) state.connections[j] = JSON.parse(JSON.stringify(editing));
      save(); syncModels();
    }
    if (el.matches && el.matches("select[data-effort]")) {
      if (!editing) return;
      var em = el.getAttribute("data-effort");
      editing.modelMeta = editing.modelMeta || {};
      editing.modelMeta[em] = editing.modelMeta[em] || {};
      if (el.value) editing.modelMeta[em].effort = el.value; else delete editing.modelMeta[em].effort;
      var ej = state.connections.map(function (cc) { return cc.id; }).indexOf(editing.id);
      if (ej >= 0) state.connections[ej] = JSON.parse(JSON.stringify(editing));
      save(); syncModels(); render(); return;
    }
    if (el.matches && el.matches("input[data-efforts]")) {
      if (!editing) return;
      var fm = el.getAttribute("data-efforts");
      editing.modelMeta = editing.modelMeta || {};
      editing.modelMeta[fm] = editing.modelMeta[fm] || {};
      var list = el.value.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return !!s; });
      if (list.length) editing.modelMeta[fm].efforts = list; else delete editing.modelMeta[fm].efforts;
      var fj = state.connections.map(function (cc) { return cc.id; }).indexOf(editing.id);
      if (fj >= 0) state.connections[fj] = JSON.parse(JSON.stringify(editing));
      save(); syncModels(); return;
    }
    if (el.matches && el.matches("input[data-cap]")) {
      if (!editing) return;
      var im = el.getAttribute("data-capm");
      var kind = el.getAttribute("data-cap");             // img | tools | think
      var field = kind === "img" ? "images" : kind === "tools" ? "tools" : "thinking";
      editing.modelMeta = editing.modelMeta || {};
      editing.modelMeta[im] = editing.modelMeta[im] || {};
      editing.modelMeta[im][field] = el.checked;
      editing.modelMeta[im].overrides = editing.modelMeta[im].overrides || {};
      editing.modelMeta[im].overrides[field] = el.checked;
      var jj = state.connections.map(function (cc) { return cc.id; }).indexOf(editing.id);
      if (jj >= 0) state.connections[jj] = JSON.parse(JSON.stringify(editing));
      save(); syncModels();
      render();                                           // reflect chip highlight
    }
  }
  function onClick(e) {
    // Custom API-type dropdown (option rows are <div>, not buttons).
    var tp = e.target.closest ? e.target.closest("[data-typepick]") : null;
    if (tp && editing) { readForm(); editing.type = tp.getAttribute("data-typepick"); typeOpen = false; render(); return; }
    var b = e.target.closest("button"); if (!b) return;
    if (b.getAttribute("data-typetoggle")) { readForm(); typeOpen = !typeOpen; render(); return; }
    if (b.getAttribute("data-add")) { editing = { id: uid(), type: "openai", __new: true, selected: [] }; fetchMsg = ""; typeOpen = false; render(); return; }
    var ed = b.getAttribute("data-edit");
    if (ed) { editing = JSON.parse(JSON.stringify(state.connections.filter(function (c) { return c.id === ed; })[0])); fetchMsg = ""; render(); return; }
    var act = b.getAttribute("data-act");
    if (!act) return;
    readForm();
    if (act === "cancel") { editing = null; fetchMsg = ""; render(); }
    else if (act === "loadmodels") { loadModels(editing); }
    else if (act === "save") {
      delete editing.__new;
      var i = state.connections.map(function (c) { return c.id; }).indexOf(editing.id);
      if (i >= 0) state.connections[i] = editing; else state.connections.push(editing);
      if ((editing.selected || []).length) state.useProviders = true;
      save(); syncModels(); editing = null; fetchMsg = "";
      if (state.useProviders) applyRestart();
      render();
    } else if (act === "delete") {
      state.connections = state.connections.filter(function (c) { return c.id !== editing.id; });
      save(); syncModels(); editing = null; fetchMsg = "";
      if (state.useProviders) applyRestart();
      render();
    } else if (act === "restart") {
      applyRestart(); render();
    }
  }

  window.__agyProvidersMount = function (el) {
    if (!el) return;
    if (root && root.parentElement === el) { render(); return; }
    root = document.createElement("div");
    root.className = "agy-providers";
    root.setAttribute("data-agy-no-translate", "");
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onChange);
    el.appendChild(root);
    load();
    editing = null; fetchMsg = "";
    syncModels();
    render();
  };
})();
