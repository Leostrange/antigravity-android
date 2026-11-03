/* Antigravity RU — Dictation / speech-recognition settings tab.
 *
 * Decouples voice input from the Providers page into its own Settings tab.
 * Chooses the recognition engine and language used by the in-chat mic (in
 * provider mode, where the core's own transcription is unavailable). Settings
 * are stored in localStorage and read by agy_ru.js.
 *
 * Config (localStorage "agy_dictation"):
 *   { enabled: bool, engine: "auto"|"vosk"|"system", lang: "auto"|"ru"|"en" }
 */
(function () {
  if (window.__agyDictationMount) return;
  var KEY = "agy_dictation";

  function T(ru, en) {
    var l;
    try { l = (document.documentElement.getAttribute("data-agy-language") || "ru").toLowerCase(); } catch (e) { l = "ru"; }
    return l.indexOf("en") === 0 ? en : ru;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  function defaults() { return { enabled: true, engine: "auto", lang: "auto" }; }
  function load() {
    try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); var d = defaults(); if (o.engine == null && window.AgyProviders && window.AgyProviders.load) { try { var old = JSON.parse(window.AgyProviders.load() || "{}"); if (old.sttEngine === "system" || old.sttEngine === "vosk") d.engine = old.sttEngine; } catch (ignore) {} } for (var k in d) if (o[k] == null) o[k] = d[k]; return o; }
    catch (e) { return defaults(); }
  }
  function save(cfg) { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }
  // Exposed for agy_ru.js
  window.__agyDictationCfg = load;

  var voskPresent = !!(window.AgyVosk && window.AgyVosk.available);
  function voskReady() { try { return voskPresent && window.AgyVosk.available(); } catch (e) { return false; } }

  function radioRow(name, value, cur, label, hint) {
    return '<label class="agy-dc-opt' + (cur === value ? " on" : "") + '">' +
      '<input type="radio" name="' + name + '" data-set="' + name + '" value="' + value + '"' + (cur === value ? " checked" : "") + ">" +
      '<span class="agy-dc-optmain"><b>' + esc(label) + "</b>" + (hint ? '<span class="agy-dc-opthint">' + esc(hint) + "</span>" : "") + "</span></label>";
  }

  function render(host) {
    var c = load();
    var vok = voskReady();
    var h = '<div class="agy-dictation">' +
      '<div class="agy-dc-title">' + esc(T("Распознавание речи", "Speech recognition")) + "</div>" +
      '<div class="agy-dc-sub">' + esc(T(
        "Голосовой ввод в чате. Для провайдерских моделей распознаёт локально на устройстве, без ключа.",
        "In-chat voice input. For provider models it recognises locally on-device, no API key.")) + "</div>";

    // Enable
    h += '<label class="agy-dc-master"><span>' + esc(T("Включить голосовой ввод", "Enable voice input")) + "</span>" +
      '<input type="checkbox" data-set="enabled"' + (c.enabled ? " checked" : "") + "></label>";

    // Engine
    h += '<div class="agy-dc-group"><div class="agy-dc-gtitle">' + esc(T("Движок распознавания", "Recognition engine")) + "</div>";
    h += radioRow("engine", "auto", c.engine, T("Авто", "Auto"),
      vok ? T("Офлайн Vosk, если доступен, иначе системный", "Offline Vosk if available, else system") : T("Системный распознаватель", "System recogniser"));
    h += radioRow("engine", "vosk", c.engine, T("Офлайн (Vosk)", "Offline (Vosk)"),
      vok ? T("На устройстве, без интернета, непрерывно", "On-device, no internet, continuous") : T("Модель не встроена в этот билд", "Model not bundled in this build"));
    h += radioRow("engine", "system", c.engine, T("Системный", "System"),
      T("Android SpeechRecognizer (одна фраза за нажатие)", "Android SpeechRecognizer (one phrase per tap)"));
    h += "</div>";

    // Language
    h += '<div class="agy-dc-group"><div class="agy-dc-gtitle">' + esc(T("Язык", "Language")) + "</div>";
    h += radioRow("lang", "auto", c.lang, T("По языку интерфейса", "Follow interface language"), "");
    h += radioRow("lang", "ru", c.lang, T("Русский", "Russian"), "");
    h += radioRow("lang", "en", c.lang, T("Английский", "English"), "");
    h += "</div>";

    h += '<div class="agy-dc-note">' + esc(T(
      "В стандартном режиме (не провайдеры) диктовка идёт через ядро и этим настройкам не подчиняется.",
      "In standard mode (non-provider) dictation goes through the core and ignores these settings.")) + "</div>";
    h += "</div>";
    host.innerHTML = h;
  }

  function onChange(host, e) {
    var el = e.target;
    if (!el || !el.getAttribute) return;
    var k = el.getAttribute("data-set");
    if (!k) return;
    var c = load();
    if (k === "enabled") c.enabled = el.checked;
    else c[k] = el.value;               // engine | lang
    save(c);
    render(host);                        // reflect selection highlight
    try { window.dispatchEvent(new CustomEvent("agy-dictation-changed", { detail: c })); } catch (e2) {}
  }

  window.__agyDictationMount = function (host) {
    if (!host || host.__agyMounted) { if (host) render(host); return; }
    host.__agyMounted = true;
    render(host);
    host.addEventListener("change", function (e) { onChange(host, e); });
  };
})();
