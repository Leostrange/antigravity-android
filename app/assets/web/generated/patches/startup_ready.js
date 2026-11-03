(function(){
/**
 * patches/startup_ready/signal.js - shared scope, guard and ready signal.
 *
 * First fragment: if the patch already installed, exit the whole IIFE.
 */
'use strict';

if (window.__agStartupReady && window.__agStartupReady.__installed) {
  return;
}

var global = window;
var state = { signalled: false, inputSeenAt: 0 };

function signal(reason) {
  if (state.signalled) return;
  state.signalled = true;
  try {
    console.log('[AGY Startup] UI Ready triggered via: ' + (reason || 'unknown'));
    if (global.Android && typeof global.Android.onUiReady === 'function') {
      global.Android.onUiReady(global.__AG_NATIVE_BRIDGE_TOKEN__);
    }
  } catch (e) {
    console.warn('[AGY Startup] Android.onUiReady error:', e);
  }
}

/**
 * patches/startup_ready/error-capture.js - surface startup errors to native.
 */
var startupErrors = [];
try {
  global.addEventListener('error', function (ev) {
    var msg = ev && (ev.message || (ev.error && ev.error.message)) ? (ev.message || ev.error.message) : String(ev);
    var src = ev && ev.filename ? (ev.filename + ':' + ev.lineno + ':' + ev.colno) : '';
    var full = '[JS Error ' + src + '] ' + msg;
    startupErrors.push(full);
    console.error(full);
    if (!state.signalled && global.Android && typeof global.Android.onUiError === 'function') {
      global.Android.onUiError(global.__AG_NATIVE_BRIDGE_TOKEN__, full);
    }
  });
  global.addEventListener('unhandledrejection', function (ev) {
    var reason = ev && ev.reason ? (ev.reason.stack || ev.reason.message || String(ev.reason)) : 'unknown rejection';
    var full = '[Unhandled Rejection] ' + reason;
    startupErrors.push(full);
    console.error(full);
    if (!state.signalled && global.Android && typeof global.Android.onUiError === 'function') {
      global.Android.onUiError(global.__AG_NATIVE_BRIDGE_TOKEN__, full);
    }
  });
} catch (e) {}

/**
 * patches/startup_ready/console-hook.js - signal on ConversationLoad completion.
 */
try {
  var origInfo = console.info ? console.info.bind(console) : null;
  if (origInfo) {
    console.info = function () {
      var msg = arguments[0];
      if (typeof msg === 'string' && msg.indexOf('[ConversationLoad]') !== -1) {
        /* ignored: fires before the auth status is known (chat flash before login) */
      }
      return origInfo.apply(console, arguments);
    };
  }
} catch (e) {}

/**
 * patches/startup_ready/detect-ui.js - has React mounted real UI content?
 */
function isUiRendered() {
  try {
    var root = global.document && global.document.getElementById('root');
    if (!root) return false;

    // 0. Login / auth panel is final for a signed-out user: ready at once.
    if (root.querySelector('.entrance-auth-panel')) {
      signal('auth-panel-rendered');
      return true;
    }

    // 1. Has real chat message turns or conversation content rendered?
    var hasMessages = !!root.querySelector('[data-role="user"], [data-role="assistant"], [data-turn-id], .message-row, .prose, [data-message-id]');
    if (hasMessages) {
      signal('messages-rendered');
      return true;
    }

    // 2. Has the input area appeared?
    var hasInput = !!root.querySelector('textarea, [contenteditable="true"], [role="textbox"], button[type="submit"]');
    var hasContentNow = hasInput || !!root.firstElementChild;
    if (!hasContentNow) { state.inputSeenAt = 0; return false; }
    if (!state.inputSeenAt) state.inputSeenAt = Date.now();
    if (Date.now() - state.inputSeenAt < 1500) return false;
    if (hasInput) {
      signal('chat-input-ready');
      return true;
    }

    // 3. Has any auth, landing, onboarding or welcome content rendered?
    var hasContent = !!(root.firstElementChild || (root.children && root.children.length > 0));
    if (hasContent) {
      signal('root-has-content');
      return true;
    }
  } catch (e) {}
  return false;
}

/**
 * patches/startup_ready/arm.js - watch for the first real UI paint.
 */
function arm() {
  if (!global.document) {
    signal('no-document');
    return;
  }

  if (isUiRendered()) return;

  try {
    if (global.MutationObserver) {
      var observer = new MutationObserver(function () {
        if (isUiRendered()) {
          try { observer.disconnect(); } catch (e) {}
        }
      });
      var target = global.document.getElementById('root') || global.document.body || global.document.documentElement;
      if (target) {
        observer.observe(target, { childList: true, subtree: true });
      }
    }
  } catch (e) {}

  var poller = global.setInterval(function () {
    if (isUiRendered() || state.signalled) {
      global.clearInterval(poller);
    }
  }, 40);

  // Fallback: 5.5 seconds maximum waiting time
  global.setTimeout(function () {
    global.clearInterval(poller);
    if (isUiRendered()) {
      return;
    }
    signal('fallback-timeout');
  }, 8000);
}

/**
 * patches/startup_ready/public-api.js - expose and arm on boot.
 */
if (global.document && global.document.readyState === 'loading') {
  global.document.addEventListener('DOMContentLoaded', arm, { once: true });
} else {
  arm();
}

global.__agStartupReady = {
  __installed: true,
  signal: signal
};


})();
