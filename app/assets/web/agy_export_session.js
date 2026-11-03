/* Antigravity RU — Save session -> ZIP (Drive 31.10.26 plan, Task 1, v1).
 * Loaded BEFORE main.js (see index.html). Exposes window.__agyExportSession(cascadeId).
 *
 * Sources (best effort, in this order):
 *  1. brain/<cascadeId>/.system_generated/logs/transcript_full.jsonl
 *     (via /static/artifacts/<cascadeId>/.system_generated/logs/transcript_full.jsonl?csrf=)
 *  2. transcript.jsonl (same folder) if the full log is missing.
 *  3. If neither is reachable, the ZIP still contains MANIFEST.txt with the
 *     error — never a silent or invented transcript.
 * Attachments: media URIs under brain/<cascadeId>/.user_uploaded/ are fetched
 * the same way. Project/workspace files are NOT included: a page script has
 * no lsClient access to the workspace; MANIFEST.txt says so and lists file
 * paths mentioned in the transcript, so nothing is invented.
 * Save: anchor download of a Blob. That goes through the WebView download
 * path, which has a 64 MiB blob limit (FileDownloader.MAX_BLOB_BYTES).
 * Above 64 MiB the export aborts with an on-screen message instead of a
 * truncated file; the >64 MiB http-path save is NOT implemented in v1.
 * ZIP: STORE (no compression) with a real CRC32, so no JSZip is needed. */
(function () {
  "use strict";
  if (window.__agyExportSession) return;

  var MAX_BLOB = 64 * 1024 * 1024;

  function toast(msg) {
    try {
      var d = document.createElement("div");
      d.textContent = msg;
      d.style.cssText = "position:fixed;left:12px;right:12px;bottom:24px;z-index:999999;background:#222;color:#fff;padding:12px 14px;border-radius:10px;font-size:14px;line-height:1.4;";
      document.body.appendChild(d);
      setTimeout(function () { try { d.remove(); } catch (e) {} }, 7000);
    } catch (e) { try { alert(msg); } catch (e2) {} }
  }

  function csrfToken() {
    try { if (window.__APP_CONFIG__ && window.__APP_CONFIG__.csrfToken) return window.__APP_CONFIG__.csrfToken; } catch (e) {}
    try {
      var m = document.cookie.match(/(?:^|; )csrfToken=([^;]+)/);
      if (m) return decodeURIComponent(m[1]);
    } catch (e) {}
    return "";
  }

  function artifactUrl(cascadeId, rel) {
    var csrf = csrfToken();
    return "/static/artifacts/" + encodeURIComponent(cascadeId) + "/" + rel + (csrf ? "?csrf=" + encodeURIComponent(csrf) : "");
  }

  /* ---- CRC32 (table) ---- */
  var CRC_TABLE = (function () {
    var t = [], c;
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* Minimal STORE ZIP writer. files: [{name, data: Uint8Array}] */
  function buildZip(files) {
    var parts = [], central = [], offset = 0;
    function u16(v) { return new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF]); }
    function u32(v) { return new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]); }
    function push(b) { parts.push(b); offset += b.length; }
    files.forEach(function (f) {
      var name = new TextEncoder().encode(f.name);
      var data = f.data;
      var crc = crc32(data);
      var localOffset = offset;
      push(u32(0x04034b50)); push(u16(20)); push(u16(0x0800)); push(u16(0)); push(u16(0)); push(u16(0));
      push(u32(crc)); push(u32(data.length)); push(u32(data.length)); push(u16(name.length)); push(u16(0));
      push(name); push(data);
      central.push({ name: name, crc: crc, size: data.length, offset: localOffset });
    });
    var centralStart = offset;
    central.forEach(function (c) {
      push(u32(0x02014b50)); push(u16(20)); push(u16(20)); push(u16(0x0800)); push(u16(0)); push(u16(0)); push(u16(0));
      push(u32(c.crc)); push(u32(c.size)); push(u32(c.size)); push(u16(c.name.length)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0)); push(u32(0));
      push(u32(c.offset)); push(c.name);
    });
    var centralSize = offset - centralStart;
    push(u32(0x06054b50)); push(u16(0)); push(u16(0)); push(u16(central.length)); push(u16(central.length));
    push(u32(centralSize)); push(u32(centralStart)); push(u16(0));
    var total = 0; parts.forEach(function (p) { total += p.length; });
    var out = new Uint8Array(total), pos = 0;
    parts.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  function textToBytes(s) { return new TextEncoder().encode(s); }

  /* Best-effort transcript.md from transcript_full.jsonl lines. */
  function transcriptMd(lines, sourceName) {
    var md = ["# Сессия Antigravity", "", "Источник: " + sourceName, ""];
    var filePaths = [], mediaUris = [];
    lines.forEach(function (line, idx) {
      if (!line.trim()) return;
      var rec;
      try { rec = JSON.parse(line); } catch (e) { md.push("## Запись " + (idx + 1), "", "```", line, "```", ""); return; }
      var s = JSON.stringify(rec);
      // File paths mentioned in tool calls (for MANIFEST, not invented content).
      var pathMatch = s.match(/"[^"]*\.(?:py|js|ts|tsx|java|kt|go|rs|md|txt|json|xml|html|css|png|jpg)[^"]*"/g);
      if (pathMatch) pathMatch.forEach(function (p) { var v = p.slice(1, -1); if (filePaths.indexOf(v) < 0) filePaths.push(v); });
      var mediaMatch = s.match(/\.user_uploaded\/[^"'\s]+/g);
      if (mediaMatch) mediaMatch.forEach(function (u) { if (mediaUris.indexOf(u) < 0) mediaUris.push(u); });
      var role = rec.role || rec.type || rec.kind || "запись";
      var text = rec.text || rec.content || rec.message || rec.delta || "";
      if (typeof text !== "string") text = JSON.stringify(text);
      var title = "## " + (idx + 1) + ". " + role;
      if (rec.timestamp || rec.time) title += " (" + (rec.timestamp || rec.time) + ")";
      md.push(title, "");
      if (text) md.push(text, "");
      if (rec.tool_calls || rec.toolCalls) md.push("Инструменты: ```json", JSON.stringify(rec.tool_calls || rec.toolCalls, null, 2), "```", "");
      if (rec.thinking) md.push("Размышления: ```", String(rec.thinking).slice(0, 4000), "```", "");
      if (!text && !rec.tool_calls && !rec.toolCalls && !rec.thinking) md.push("```json", s.slice(0, 4000), "```", "");
    });
    return { md: md.join("\n"), filePaths: filePaths, mediaUris: mediaUris };
  }

  window.__agyExportTest = { buildZip: buildZip, crc32: crc32, transcriptMd: transcriptMd };
  window.__agyExportSession = function (cascadeId) {
    if (!cascadeId) { toast("Нет открытой сессии для сохранения."); return Promise.resolve(); }
    return (async function () {
      var errors = [];
      var transcriptText = "", sourceName = "", parsed = null;
      var candidates = [
        ".system_generated/logs/transcript_full.jsonl",
        ".system_generated/logs/transcript.jsonl"
      ];
      for (var i = 0; i < candidates.length; i++) {
        try {
          var res = await fetch(artifactUrl(cascadeId, candidates[i]));
          if (res.ok) { transcriptText = await res.text(); sourceName = candidates[i]; break; }
          errors.push(candidates[i] + ": HTTP " + res.status);
        } catch (e) { errors.push(candidates[i] + ": " + e); }
      }
      var files = [];
      var filePaths = [], mediaUris = [];
      if (transcriptText) {
        parsed = transcriptMd(transcriptText.split("\n"), sourceName);
        filePaths = parsed.filePaths; mediaUris = parsed.mediaUris;
        files.push({ name: "transcript.md", data: textToBytes(parsed.md) });
        files.push({ name: "transcript_full.jsonl", data: textToBytes(transcriptText) });
      } else {
        errors.push("Транскрипт не получен: проверьте, что сессия сохранена на устройстве.");
      }
      // Attachments (best effort, failures recorded, never fatal).
      for (var j = 0; j < mediaUris.length; j++) {
        var uri = mediaUris[j];
        var fname = uri.split("/").pop() || ("media_" + j);
        try {
          var r = await fetch(artifactUrl(cascadeId, ".user_uploaded/" + encodeURIComponent(fname)));
          if (r.ok) {
            var buf = new Uint8Array(await r.arrayBuffer());
            files.push({ name: "attachments/" + fname, data: buf });
          } else errors.push("Вложение " + fname + ": HTTP " + r.status);
        } catch (e) { errors.push("Вложение " + fname + ": " + e); }
      }
      var manifest = [
        "Antigravity session export (Drive 31.10.26, Task 1 v1)",
        "cascadeId: " + cascadeId,
        "exported: " + new Date().toISOString(),
        "transcript source: " + (sourceName || "none (see errors)"),
        "",
        "Файлы проекта НЕ включены: из скрипта страницы нет доступа к рабочей папке (нужен lsClient).",
        "Пути файлов, упомянутые в транскрипте (для ручной проверки, не содержимое):",
        filePaths.length ? filePaths.join("\n") : "(не найдено)",
        "",
        "Ошибки (если есть):",
        errors.length ? errors.join("\n") : "(нет)",
        "",
        "ZIP: STORE (без сжатия), сохранён через загрузку blob. Лимит WebView: 64 МиБ."
      ].join("\n");
      files.push({ name: "MANIFEST.txt", data: textToBytes(manifest) });
      // Meta: model / title are not available to a page script; do not invent them.
      files.push({ name: "meta.json", data: textToBytes(JSON.stringify({ cascadeId: cascadeId, exportedAt: new Date().toISOString(), transcriptSource: sourceName || null, errors: errors }, null, 2)) });

      var total = 0; files.forEach(function (f) { total += f.data.length + f.name.length + 100; });
      if (total > MAX_BLOB) {
        toast("Сессия слишком большая (>" + Math.round(total / 1048576) + " МиБ): экспорт через blob ограничен 64 МиБ. Сохранение >64 МиБ в этой версии не реализовано.");
        return;
      }
      var zip = buildZip(files);
      var blob = new Blob([zip], { type: "application/zip" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "session-" + String(cascadeId).slice(0, 8) + "-" + new Date().toISOString().slice(0, 10) + ".zip";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      toast(transcriptText ? "Сессия сохранена в ZIP." : "ZIP сохранён, но транскрипт получить не удалось — см. MANIFEST.txt.");
    })().catch(function (e) { console.error("[agyExportSession]", e); toast("Не удалось сохранить сессию: " + e); });
  };
})();
