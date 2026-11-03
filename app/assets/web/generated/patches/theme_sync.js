(function(){
/**
 * patches/theme_sync/config.js - host theme, state and guard.
 *
 * First fragment: if the patch already installed, exit the whole IIFE.
 */
'use strict';

if (window.__agThemeSync && window.__agThemeSync.__installed) {
  return;
}

var doc = window.document;
var hostTheme = 'system';
try {
  var params = new URLSearchParams(window.location.search);
  hostTheme = params.get('hostTheme') || window.__AG_HOST_THEME__ || 'system';
} catch (e) {
  hostTheme = window.__AG_HOST_THEME__ || 'system';
}
if (hostTheme !== 'light' && hostTheme !== 'dark') {
  hostTheme = 'system';
}

var state = {
  installed: false,
  last: null,
  notifications: 0,
  observer: null,
  storageBound: false,
  hasAndroid: false
};

/**
 * patches/theme_sync/resolve.js - theme resolution (classList > storage > host).
 */
function fromClassList() {
  try {
    var body = doc && doc.body;
    if (body && body.classList) {
      if (body.classList.contains('theme-light')) return 'light';
      if (body.classList.contains('theme-dark')) return 'dark';
    }
  } catch (e) { /* ignore */ }
  return null;
}

function resolveTheme() {
  var cl = fromClassList();
  if (cl) return cl;
  if (hostTheme === 'light') return 'light';
  if (hostTheme === 'dark') return 'dark';
  if (typeof window !== 'undefined' && window.Android && typeof window.Android.getTheme === 'function') {
    try {
      var t = window.Android.getTheme();
      if (t === 'dark' || t === 'light') return t;
    } catch (e) {}
  }
  if (typeof window !== 'undefined' && window.__AG_RESOLVED_THEME__) {
    return window.__AG_RESOLVED_THEME__;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * patches/theme_sync/notify.js - push the resolved theme to native Android.
 */
function notify() {
  var theme = resolveTheme();
  if (theme === state.last) return theme;
  state.last = theme;
  state.notifications++;
  try {
    var isDark = (theme === 'dark');
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.style.colorScheme = theme;
  } catch (e) { /* ignore */ }
  try {
    if (window.Android) {
      state.hasAndroid = true;
      if (typeof window.Android.setThemeByUser === 'function') {
        window.Android.setThemeByUser(theme);
      } else if (typeof window.Android.setTheme === 'function') {
        window.Android.setTheme(theme);
      }
      if (typeof window.Android.onVisualThemeChanged === 'function') {
        window.Android.onVisualThemeChanged(theme);
      }
    }
  } catch (e) { /* never throw into JS */ }
  return theme;
}

/**
 * patches/theme_sync/install.js - observe class/storage changes.
 */
function install() {
  if (state.installed) return;
  state.installed = true;

  if (window.MutationObserver && doc.documentElement) {
    try {
      state.observer = new MutationObserver(function () { notify(); });
      state.observer.observe(doc.documentElement, {
        attributes: true, attributeFilter: ['class']
      });
      if (doc.body) {
        state.observer.observe(doc.body, {
          attributes: true, attributeFilter: ['class']
        });
      } else if (doc.addEventListener) {
        doc.addEventListener('DOMContentLoaded', function () {
          if (doc.body && state.observer) {
            try {
              state.observer.observe(doc.body, {
                attributes: true, attributeFilter: ['class']
              });
            } catch (e) { /* ignore */ }
            notify();
          }
        });
      }
    } catch (e) { /* ignore */ }
  }

  try {
    if (!state.storageBound) {
      window.addEventListener('storage', function () { notify(); }, false);
      state.storageBound = true;
    }
    if (window.matchMedia) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      if (mql.addEventListener) {
        mql.addEventListener('change', function () { notify(); });
      }
    }
  } catch (e) { /* ignore */ }

  notify();
}

/**
 * patches/theme_sync/public-api.js - expose probe and start.
 */
window.__agThemeSync = {
  __installed: true,
  getTheme: resolveTheme,
  sync: notify,
  probe: function () {
    return {
      installed: state.installed,
      theme: resolveTheme(),
      last: state.last,
      notifications: state.notifications,
      hostTheme: hostTheme,
      hasAndroid: state.hasAndroid,
      observers: state.observer ? 1 : 0
    };
  }
};

if (doc && doc.readyState === 'loading') {
  doc.addEventListener('DOMContentLoaded', install);
} else {
  install();
}


})();
