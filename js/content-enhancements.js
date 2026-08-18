;(function (window, document) {
  'use strict';

  var contentAreas = document.querySelectorAll('.post-content');
  if (!contentAreas.length) return;

  function announce(message, container) {
    var status = container.querySelector('.content-action-status');
    if (!status) {
      status = document.createElement('span');
      status.className = 'content-action-status visually-hidden';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      container.appendChild(status);
    }
    status.textContent = '';
    window.setTimeout(function () { status.textContent = message; }, 10);
  }

  function copyText(text) {
    if (window.navigator.clipboard && window.isSecureContext) {
      return window.navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'));
      } catch (error) {
        reject(error);
      }
      textarea.remove();
    });
  }

  function enhanceCodeBlocks(content) {
    content.querySelectorAll('figure.highlight, pre').forEach(function (block) {
      if (block.matches('figure.highlight pre') || block.closest('.code-block-wrapper')) return;

      var source = block.matches('figure.highlight') ? block.querySelector('.code pre') : block;
      if (!source) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      block.parentNode.insertBefore(wrapper, block);
      wrapper.appendChild(block);

      var button = document.createElement('button');
      button.className = 'code-copy-button';
      button.type = 'button';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制代码');
      wrapper.insertBefore(button, block);

      button.addEventListener('click', function () {
        copyText(source.innerText).then(function () {
          button.textContent = '已复制';
          announce('代码已复制到剪贴板', wrapper);
          window.setTimeout(function () { button.textContent = '复制'; }, 1600);
        }).catch(function () {
          button.textContent = '复制失败';
          announce('代码复制失败，请手动选择复制', wrapper);
          window.setTimeout(function () { button.textContent = '复制'; }, 1600);
        });
      });
    });
  }

  function updateTableScrollState(wrapper) {
    var maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
    wrapper.classList.toggle('can-scroll', maxScroll > 1);
    wrapper.classList.toggle('at-start', wrapper.scrollLeft <= 1);
    wrapper.classList.toggle('at-end', wrapper.scrollLeft >= maxScroll - 1);
  }

  function enhanceTables(content) {
    content.querySelectorAll('table').forEach(function (table, index) {
      if (table.closest('figure.highlight') || table.closest('.table-scroll')) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', '可横向滚动的表格 ' + (index + 1));
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);

      var update = function () { updateTableScrollState(wrapper); };
      wrapper.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      update();
    });
  }

  function enhanceExternalLinks(content) {
    content.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      link.setAttribute('rel', Array.from(rel).join(' '));

      var label = link.getAttribute('aria-label') || link.textContent.trim() || link.href;
      if (!/新窗口/.test(label)) link.setAttribute('aria-label', label + '（在新窗口打开）');
      if (!link.title) link.title = '在新窗口打开';
    });
  }

  contentAreas.forEach(function (content) {
    enhanceCodeBlocks(content);
    enhanceTables(content);
    enhanceExternalLinks(content);
  });
})(window, document);
