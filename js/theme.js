;(function (window, document) {
  'use strict';

  var storageKey = 'blog-theme';
  var systemTheme = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  function getStoredTheme() {
    try {
      var storedTheme = window.localStorage.getItem(storageKey);
      return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;
    } catch (error) {
      return null;
    }
  }

  function getPreferredTheme() {
    return getStoredTheme() || (systemTheme && systemTheme.matches ? 'dark' : 'light');
  }

  function updateControls(theme) {
    var isDark = theme === 'dark';
    var label = isDark ? '切换到浅色模式' : '切换到深色模式';
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', String(isDark));
      var textLabel = button.querySelector('.theme-toggle-label');
      if (textLabel) textLabel.textContent = isDark ? '深色' : '浅色';
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateControls(theme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getPreferredTheme());

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        var nextTheme = document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'light'
          : 'dark';
        try { window.localStorage.setItem(storageKey, nextTheme); } catch (error) {}
        applyTheme(nextTheme);
      });
    });
  });

  if (systemTheme) {
    var handleSystemTheme = function (event) {
      if (!getStoredTheme()) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };
    if (systemTheme.addEventListener) {
      systemTheme.addEventListener('change', handleSystemTheme);
    } else if (systemTheme.addListener) {
      systemTheme.addListener(handleSystemTheme);
    }
  }
})(window, document);
