;(function (window, document) {
  'use strict';

  var body = document.body;
  var menuButton = document.querySelector('.button-toggle');
  var siteNav = document.querySelector('.site-nav');
  var scrollButton = document.querySelector('.scroll-up');

  if (body.offsetWidth < 50 || body.offsetHeight < 50) {
    body.textContent = 'Error! 浏览器窗口环境异常';
    return;
  }

  function closeMenu() {
    if (!menuButton) return;
    body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '打开导航菜单');
  }

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      var isOpen = !body.classList.contains('menu-open');
      body.classList.toggle('menu-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? '关闭导航菜单' : '打开导航菜单');
      window.scrollTo(0, 0);
    });

    var previousWindowWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      if (previousWindowWidth !== window.innerWidth) {
        previousWindowWidth = window.innerWidth;
        closeMenu();
      }
    }, { passive: true });
  }

  if (siteNav) {
    var navPlaceholder = document.createElement('div');
    navPlaceholder.className = 'site-nav-placeholder';
    siteNav.parentNode.insertBefore(navPlaceholder, siteNav);

    function updateStickyNav() {
      var shouldFix = navPlaceholder.getBoundingClientRect().top <= 0;
      siteNav.classList.toggle('is-fixed', shouldFix);
      navPlaceholder.style.height = shouldFix ? siteNav.offsetHeight + 'px' : '0';
    }

    window.addEventListener('scroll', updateStickyNav, { passive: true });
    window.addEventListener('resize', updateStickyNav, { passive: true });
    updateStickyNav();
  }

  if (scrollButton) {
    function updateScrollButton() {
      scrollButton.classList.toggle('is-visible', window.scrollY > 600);
    }

    window.addEventListener('scroll', updateScrollButton, { passive: true });
    scrollButton.addEventListener('click', function () {
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    updateScrollButton();
  }
})(window, document);
