(function () {
  "use strict";

  let recognition = null;
  let active = false;
  let stopRequested = false;
  let restartTimer = 0;
  let finalSegments = [];
  let latestInterim = "";

  function state(value, message) {
    window.dispatchEvent(new CustomEvent("agy:speech-state", { detail: { state: value, message: message || "" } }));
  }

  function editor() {
    return document.querySelector("#antigravity\\.agentSidePanelInputBox [contenteditable='true']")
      || document.querySelector("[contenteditable='true'][data-placeholder]")
      || document.querySelector("[contenteditable='true']");
  }

  function insertTranscript(text) {
    const input = editor();
    const transcript = text.replace(/\s+/g, " ").trim();
    if (!input || !transcript) return;
    input.focus();
    document.execCommand("insertText", false, `${transcript} `);
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: `${transcript} ` }));
  }

  function comparable(text) {
    return text
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function wordsOf(text) {
    return comparable(text).split(" ").filter(Boolean);
  }

  function overlapCount(previous, incoming) {
    const have = wordsOf(previous);
    const next = wordsOf(incoming);
    let count = Math.min(have.length, next.length);
    while (count > 0) {
      const same = have.slice(-count).every((word, index) => word === next[index]);
      if (same) return count;
      count -= 1;
    }
    return 0;
  }

  function rawTail(text, skipWords) {
    if (skipWords <= 0) return text.replace(/\s+/g, " ").trim();
    const parts = text.replace(/\s+/g, " ").trim().split(" ");
    return parts.slice(skipWords).join(" ").trim();
  }

  function withoutInternalRepeat(raw) {
    const compact = raw.replace(/\s+/g, " ").trim();
    const tokens = compact.split(" ").filter(Boolean);
    const keys = tokens.map(token => comparable(token));
    if (keys.some(key => !key) || keys.length < 4 || keys.length % 2 !== 0) return compact;
    const half = keys.length / 2;
    if (half >= 2 && keys.slice(0, half).every((word, index) => word === keys[half + index])) {
      return tokens.slice(0, half).join(" ");
    }
    return compact;
  }

  function appendFinal(text) {
    const raw = withoutInternalRepeat(text.replace(/\s+/g, " ").trim());
    const key = comparable(raw);
    if (!raw || !key) return;
    const current = finalSegments.join(" ").replace(/\s+/g, " ").trim();
    const currentKey = comparable(current);
    if (!currentKey) {
      finalSegments = [raw];
      return;
    }
    if (currentKey === key || currentKey.endsWith(` ${key}`) || currentKey.endsWith(key)) return;
    if (key.startsWith(currentKey)) {
      finalSegments = [raw];
      return;
    }
    const overlap = overlapCount(current, raw);
    if (overlap >= wordsOf(raw).length) return;
    const tail = rawTail(raw, overlap);
    if (tail) finalSegments.push(tail);
  }

  function transcriptNow() {
    const base = finalSegments.join(" ").replace(/\s+/g, " ").trim();
    const interim = latestInterim.replace(/\s+/g, " ").trim();
    if (!interim) return base;
    const interimKey = comparable(interim);
    const baseKey = comparable(base);
    if (!interimKey || baseKey === interimKey || baseKey.endsWith(interimKey)) return base;
    if (interimKey.startsWith(baseKey) && baseKey) return interim;
    const overlap = overlapCount(base, interim);
    const tail = rawTail(interim, overlap);
    return tail ? `${base} ${tail}`.trim() : base;
  }

  function recognitionLang() {
    const htmlLang = document.documentElement.lang || navigator.language || "en-US";
    const langMap = {
      ru: "ru-RU", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES", pt: "pt-BR",
      it: "it-IT", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ar: "ar-SA", tr: "tr-TR",
      pl: "pl-PL", nl: "nl-NL", sv: "sv-SE", uk: "uk-UA"
    };
    const base = String(htmlLang).split("-")[0].toLowerCase();
    return langMap[base] || htmlLang;
  }

  function finish() {
    clearTimeout(restartTimer);
    const transcript = transcriptNow();
    recognition = null;
    active = false;
    stopRequested = false;
    finalSegments = [];
    latestInterim = "";
    if (transcript) {
      state("finishing");
      insertTranscript(transcript);
      window.setTimeout(() => state("idle"), 600);
      return;
    }
    state("idle");
  }

  function createRecognition(SpeechRecognition) {
    const instance = new SpeechRecognition();
    instance.continuous = true;
    instance.interimResults = true;
    instance.maxAlternatives = 1;
    instance.lang = recognitionLang();
    instance.onstart = function () {
      active = true;
      window.__agySpeechConfirmed = true;
      state("recording");
    };
    instance.onresult = function (event) {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript.replace(/\s+/g, " ").trim();
        if (!text) continue;
        if (event.results[index].isFinal) appendFinal(text);
        else interim = `${interim} ${text}`.trim();
      }
      latestInterim = interim;
    };
    instance.onerror = function (event) {
      if (stopRequested || event.error === "aborted" || event.error === "no-speech") return;
      const msg = event.error === "language-not-supported"
        ? `Язык ${instance.lang} не поддерживается этим WebView`
        : event.error === "not-allowed"
          ? "Нет доступа к микрофону"
          : event.error;
      if (!window.__agySpeechConfirmed) {
        active = false;
        recognition = null;
      }
      state("error", msg);
    };
    instance.onend = function () {
      recognition = null;
      if (active && !stopRequested) {
        restartTimer = window.setTimeout(() => {
          if (!active || stopRequested) return;
          try {
            recognition = createRecognition(SpeechRecognition);
            recognition.start();
          } catch (_) {
            finish();
          }
        }, 160);
        return;
      }
      finish();
    };
    return instance;
  }

  window.__agySpeechConfirmed = false;
  window.__agyToggleSpeech = function (SpeechRecognitionClass) {
    const SR = SpeechRecognitionClass || window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    if (active) {
      stopRequested = true;
      state("finishing");
      if (recognition) {
        try { recognition.stop(); } catch (_) { finish(); }
      } else finish();
      return true;
    }
    finalSegments = [];
    latestInterim = "";
    stopRequested = false;
    try {
      recognition = createRecognition(SR);
      recognition.start();
    } catch (err) {
      recognition = null;
      state("error", err && err.message ? err.message : String(err));
      return false;
    }
    return true;
  };
})();
