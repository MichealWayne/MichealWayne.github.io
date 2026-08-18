;(function (window, document) {
  'use strict';

  var input = document.querySelector('#local-search-input');
  var form = document.querySelector('#search-form');
  var resultArea = document.querySelector('#local-search-result');
  var resetButton = form && form.querySelector('.fa-times');
  var statusArea = document.querySelector('.no-result');

  if (!input || !form || !resultArea || !resetButton || !statusArea) return;

  var searchIndexPromise = null;
  var debounceTimer = null;
  var activeIndex = -1;
  var currentLinks = [];
  var maxResults = 20;

  function debounce(callback, delay) {
    return function () {
      var args = arguments;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(function () {
        callback.apply(null, args);
      }, delay);
    };
  }

  function normalize(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function loadSearchIndex() {
    if (searchIndexPromise) return searchIndexPromise;

    showStatus('正在加载搜索索引…', 'loading');
    searchIndexPromise = window.fetch('/search.xml', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Search index request failed');
        return response.text();
      })
      .then(function (source) {
        var xml = new window.DOMParser().parseFromString(source, 'application/xml');
        if (xml.querySelector('parsererror')) throw new Error('Search index parse failed');

        return Array.prototype.map.call(xml.querySelectorAll('entry'), function (entry) {
          var tags = Array.prototype.map.call(entry.querySelectorAll('tag'), function (tag) {
            return normalize(tag.textContent);
          });
          var categories = Array.prototype.map.call(entry.querySelectorAll('category'), function (category) {
            return normalize(category.textContent);
          });

          return {
            title: normalize((entry.querySelector('title') || {}).textContent),
            url: normalize((entry.querySelector('url') || {}).textContent),
            content: normalize((entry.querySelector('content') || {}).textContent),
            metadata: tags.concat(categories).join(' ')
          };
        }).filter(function (item) {
          return item.title && item.url;
        });
      })
      .catch(function (error) {
        searchIndexPromise = null;
        showStatus('搜索索引加载失败，请稍后重试', 'error');
        throw error;
      });

    return searchIndexPromise;
  }

  function getKeywords(query) {
    return normalize(query).toLocaleLowerCase().split(/[\s-]+/).filter(Boolean);
  }

  function search(items, keywords) {
    return items.map(function (item) {
      var title = item.title.toLocaleLowerCase();
      var metadata = item.metadata.toLocaleLowerCase();
      var content = item.content.toLocaleLowerCase();
      var matches = keywords.every(function (keyword) {
        return title.indexOf(keyword) >= 0 || metadata.indexOf(keyword) >= 0 || content.indexOf(keyword) >= 0;
      });

      if (!matches) return null;

      var score = keywords.reduce(function (total, keyword) {
        if (title === keyword) return total + 12;
        if (title.indexOf(keyword) >= 0) return total + 6;
        if (metadata.indexOf(keyword) >= 0) return total + 3;
        return total + 1;
      }, 0);

      return { item: item, score: score };
    }).filter(Boolean).sort(function (left, right) {
      return right.score - left.score;
    }).slice(0, maxResults);
  }

  function appendHighlightedText(container, text, keywords) {
    if (!text) return;
    var escaped = keywords.map(function (keyword) {
      return keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).filter(Boolean);
    var normalizedKeywords = keywords.map(function (keyword) {
      return keyword.toLocaleLowerCase();
    });

    if (!escaped.length) {
      container.appendChild(document.createTextNode(text));
      return;
    }

    var expression = new RegExp('(' + escaped.join('|') + ')', 'gi');
    text.split(expression).forEach(function (part) {
      if (!part) return;
      if (normalizedKeywords.indexOf(part.toLocaleLowerCase()) >= 0) {
        var emphasis = document.createElement('em');
        emphasis.className = 'search-keyword';
        emphasis.textContent = part;
        container.appendChild(emphasis);
      } else {
        container.appendChild(document.createTextNode(part));
      }
    });
  }

  function getSnippet(content, keywords) {
    if (!content) return '';
    var lowerContent = content.toLocaleLowerCase();
    var positions = keywords.map(function (keyword) {
      return lowerContent.indexOf(keyword);
    }).filter(function (position) {
      return position >= 0;
    });
    var matchPosition = positions.length ? Math.min.apply(Math, positions) : 0;
    var start = Math.max(0, matchPosition - 36);
    var end = Math.min(content.length, start + 120);
    return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
  }

  function renderResults(matches, keywords) {
    resultArea.replaceChildren();
    currentLinks = [];
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');

    if (!matches.length) {
      input.setAttribute('aria-expanded', 'false');
      showStatus('没有找到结果', 'empty');
      return;
    }

    hideStatus();
    var list = document.createElement('ul');
    list.className = 'search-result-list';

    matches.forEach(function (match, index) {
      var item = document.createElement('li');
      item.id = 'search-result-' + index;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');

      var link = document.createElement('a');
      link.className = 'search-result-title';
      link.href = match.item.url;
      appendHighlightedText(link, match.item.title, keywords);
      item.appendChild(link);

      var snippet = getSnippet(match.item.content || match.item.metadata, keywords);
      if (snippet) {
        var description = document.createElement('p');
        description.className = 'search-result';
        appendHighlightedText(description, snippet, keywords);
        item.appendChild(description);
      }

      list.appendChild(item);
      currentLinks.push(link);
    });

    resultArea.appendChild(list);
    input.setAttribute('aria-expanded', 'true');
  }

  function setActiveResult(index) {
    if (!currentLinks.length) return;
    activeIndex = (index + currentLinks.length) % currentLinks.length;
    currentLinks.forEach(function (link, linkIndex) {
      var option = link.parentElement;
      var isActive = linkIndex === activeIndex;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-selected', String(isActive));
    });
    var activeOption = currentLinks[activeIndex].parentElement;
    input.setAttribute('aria-activedescendant', activeOption.id);
    activeOption.scrollIntoView({ block: 'nearest' });
  }

  function showStatus(message, state) {
    resultArea.replaceChildren();
    currentLinks = [];
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-expanded', 'false');
    statusArea.textContent = message;
    statusArea.dataset.state = state;
    statusArea.style.display = 'block';
  }

  function hideStatus() {
    statusArea.style.display = 'none';
    statusArea.removeAttribute('data-state');
  }

  function clearSearch(options) {
    var shouldFocus = !options || options.focus !== false;
    form.reset();
    resultArea.replaceChildren();
    resetButton.style.display = 'none';
    currentLinks = [];
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-expanded', 'false');
    hideStatus();
    if (shouldFocus) input.focus();
  }

  var runSearch = debounce(function () {
    var keywords = getKeywords(input.value);
    if (!keywords.length) {
      clearSearch({ focus: false });
      return;
    }

    loadSearchIndex().then(function (items) {
      if (!input.value.trim()) return;
      renderResults(search(items, keywords), keywords);
    }).catch(function () {});
  }, 160);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (activeIndex >= 0 && currentLinks[activeIndex]) {
      window.location.href = currentLinks[activeIndex].href;
    } else if (currentLinks[0]) {
      window.location.href = currentLinks[0].href;
    }
  });

  input.addEventListener('focus', function () {
    loadSearchIndex().then(function () {
      if (!input.value.trim() && statusArea.dataset.state === 'loading') {
        hideStatus();
      }
    }).catch(function () {
      // Loading errors are already surfaced by loadSearchIndex().
    });
  });
  input.addEventListener('input', function () {
    resetButton.style.display = input.value ? 'inline-block' : 'none';
    runSearch();
  });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveResult(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResult(activeIndex - 1);
    } else if (event.key === 'Home' && currentLinks.length) {
      event.preventDefault();
      setActiveResult(0);
    } else if (event.key === 'End' && currentLinks.length) {
      event.preventDefault();
      setActiveResult(currentLinks.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      clearSearch();
    }
  });
  resetButton.addEventListener('click', function () {
    clearSearch();
  });
  resultArea.addEventListener('mousemove', function (event) {
    var option = event.target.closest('[role="option"]');
    if (!option) return;
    var index = Array.prototype.indexOf.call(resultArea.querySelectorAll('[role="option"]'), option);
    if (index !== activeIndex) setActiveResult(index);
  });
})(window, document);
