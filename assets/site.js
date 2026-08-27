/* Hellparty — 사이트 동작
   외부 라이브러리를 쓰지 않는다. 하는 일은 두 가지뿐이다.
   1) 좁은 화면에서 헤더 내비를 여닫는다
   2) 현재 보고 있는 페이지의 내비 항목을 표시한다 */
(function () {
  'use strict';

  var nav = document.querySelector('.site-nav');
  var toggle = document.querySelector('.nav-toggle');

  /* ── 1. 모바일 내비 토글 ───────────────────────────────── */
  if (nav && toggle) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', function () {
      setOpen(nav.classList.contains('is-open') === false);
    });

    // 링크를 누르면 메뉴가 열린 채로 남지 않게 한다.
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // 넓은 화면으로 돌아가면 CSS 가 내비를 다시 보여주므로 상태를 초기화한다.
    var wide = window.matchMedia('(min-width: 761px)');
    var onWide = function (event) { if (event.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ── 2. 현재 페이지 표시 ───────────────────────────────── */
  // 프로젝트 페이지(/hellparty-web/) 하위라 경로 전체가 아니라 마지막 조각만 본다.
  // 루트로 접근하면 마지막 조각이 빈 문자열이므로 index.html 로 취급한다.
  var current = location.pathname.split('/').pop() || 'index.html';

  Array.prototype.forEach.call(document.querySelectorAll('.site-nav a'), function (link) {
    var href = link.getAttribute('href') || '';
    if (href.indexOf('#') !== -1) return; // 앵커 링크(#contact)는 페이지가 아니다
    if (href.split('/').pop() === current) link.setAttribute('aria-current', 'page');
  });
})();
