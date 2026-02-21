/**
 * 당케(Danke) — script.js
 *
 * 책임 분리 원칙에 따라 각 관심사를 독립 모듈로 분리:
 *   - ThemeManager    : 다크/라이트 모드 전환 + localStorage 영속화
 *   - HeaderManager   : 헤더 스크롤 감지 + 네비게이션 활성 링크
 *   - MobileNav       : 모바일 햄버거 메뉴 드로어
 *   - RevealObserver  : Intersection Observer 기반 스크롤 reveal 애니메이션
 *   - BackToTop       : 상단으로 이동 버튼 가시성 제어
 *   - SmoothScroll    : 앵커 링크 부드러운 스크롤
 *   - App             : 초기화 진입점
 */

'use strict';

/* ─────────────────────────────────────────────
   ThemeManager
   역할: 다크/라이트 테마 전환 및 localStorage 동기화
───────────────────────────────────────────── */
const ThemeManager = (() => {
  const STORAGE_KEY  = 'dangke-theme';
  const ATTR         = 'data-theme';
  const LIGHT        = 'light';
  const DARK         = 'dark';

  const _root    = document.documentElement;
  const _toggle  = document.getElementById('theme-toggle');

  /**
   * 현재 테마를 반환
   * @returns {'light'|'dark'}
   */
  const _getCurrent = () => _root.getAttribute(ATTR) || LIGHT;

  /**
   * 테마를 적용하고 저장
   * @param {'light'|'dark'} theme
   */
  const _apply = (theme) => {
    _root.setAttribute(ATTR, theme);
    localStorage.setItem(STORAGE_KEY, theme);
    _updateToggleLabel(theme);
  };

  /**
   * 토글 버튼의 aria-label 업데이트
   * @param {'light'|'dark'} theme
   */
  const _updateToggleLabel = (theme) => {
    if (!_toggle) return;
    const next = theme === LIGHT ? DARK : LIGHT;
    _toggle.setAttribute(
      'aria-label',
      next === DARK ? '다크 모드로 전환' : '라이트 모드로 전환'
    );
  };

  /**
   * 저장된 테마 또는 시스템 선호도로 초기화
   */
  const init = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? DARK
      : LIGHT;
    _apply(saved || system);

    // 시스템 테마 변경 감지 (저장값 없을 때만)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        _apply(e.matches ? DARK : LIGHT);
      }
    });

    // 토글 버튼 클릭 이벤트
    if (_toggle) {
      _toggle.addEventListener('click', toggle);
    }
  };

  /**
   * 테마 토글
   */
  const toggle = () => {
    const next = _getCurrent() === LIGHT ? DARK : LIGHT;
    _apply(next);
  };

  return { init, toggle };
})();

/* ─────────────────────────────────────────────
   HeaderManager
   역할: 스크롤에 따른 헤더 배경 전환 + 현재 섹션 링크 활성화
───────────────────────────────────────────── */
const HeaderManager = (() => {
  const _header    = document.getElementById('site-header');
  const _navLinks  = document.querySelectorAll('.nav-link');
  const SCROLLED_CLASS = 'scrolled';
  const ACTIVE_CLASS   = 'active';
  const SCROLL_THRESHOLD = 60;

  // 섹션 id 목록 (nav-link href 기반)
  const _sectionIds = Array.from(_navLinks).map((link) => {
    const href = link.getAttribute('href');
    return href ? href.replace('#', '') : null;
  }).filter(Boolean);

  let _ticking = false;

  /**
   * 스크롤 위치에 따라 헤더 클래스 토글
   */
  const _onScroll = () => {
    if (_ticking) return;
    _ticking = true;

    window.requestAnimationFrame(() => {
      if (!_header) { _ticking = false; return; }

      if (window.scrollY > SCROLL_THRESHOLD) {
        _header.classList.add(SCROLLED_CLASS);
      } else {
        _header.classList.remove(SCROLLED_CLASS);
      }

      _updateActiveNavLink();
      _ticking = false;
    });
  };

  /**
   * 현재 뷰포트에 보이는 섹션을 기준으로 활성 nav-link 갱신
   */
  const _updateActiveNavLink = () => {
    let currentId = '';
    const viewportMid = window.scrollY + window.innerHeight / 3;

    _sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.offsetTop <= viewportMid) {
        currentId = id;
      }
    });

    _navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${currentId}`) {
        link.classList.add(ACTIVE_CLASS);
      } else {
        link.classList.remove(ACTIVE_CLASS);
      }
    });
  };

  const init = () => {
    window.addEventListener('scroll', _onScroll, { passive: true });
    _onScroll(); // 초기 실행
  };

  return { init };
})();

/* ─────────────────────────────────────────────
   MobileNav
   역할: 모바일 햄버거 메뉴 드로어 열기/닫기
───────────────────────────────────────────── */
const MobileNav = (() => {
  const _hamburger = document.getElementById('hamburger');
  const _drawer    = document.getElementById('nav-mobile');
  const _mobileLinks = document.querySelectorAll('.nav-mobile-link');
  const OPEN_CLASS = 'open';

  let _isOpen = false;

  const _open = () => {
    _isOpen = true;
    _drawer.classList.add(OPEN_CLASS);
    _drawer.setAttribute('aria-hidden', 'false');
    _hamburger.setAttribute('aria-expanded', 'true');
    _hamburger.setAttribute('aria-label', '모바일 메뉴 닫기');
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
  };

  const _close = () => {
    _isOpen = false;
    _drawer.classList.remove(OPEN_CLASS);
    _drawer.setAttribute('aria-hidden', 'true');
    _hamburger.setAttribute('aria-expanded', 'false');
    _hamburger.setAttribute('aria-label', '모바일 메뉴 열기');
    document.body.style.overflow = '';
  };

  const toggle = () => {
    _isOpen ? _close() : _open();
  };

  const init = () => {
    if (!_hamburger || !_drawer) return;

    _hamburger.addEventListener('click', toggle);

    // 링크 클릭 시 드로어 닫기
    _mobileLinks.forEach((link) => {
      link.addEventListener('click', _close);
    });

    // 드로어 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!_isOpen) return;
      const isInsideNav    = _drawer.contains(e.target);
      const isHamburger    = _hamburger.contains(e.target);
      if (!isInsideNav && !isHamburger) _close();
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _isOpen) {
        _close();
        _hamburger.focus();
      }
    });
  };

  return { init };
})();

/* ─────────────────────────────────────────────
   RevealObserver
   역할: Intersection Observer로 .reveal 요소 등장 애니메이션
───────────────────────────────────────────── */
const RevealObserver = (() => {
  const REVEAL_CLASS   = 'reveal';
  const REVEALED_CLASS = 'revealed';

  /**
   * prefers-reduced-motion 설정 확인
   * @returns {boolean}
   */
  const _prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const init = () => {
    const elements = document.querySelectorAll(`.${REVEAL_CLASS}`);

    // 애니메이션 감소 설정 시 즉시 표시
    if (_prefersReducedMotion()) {
      elements.forEach((el) => el.classList.add(REVEALED_CLASS));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      // 미지원 브라우저 폴백: 모두 표시
      elements.forEach((el) => el.classList.add(REVEALED_CLASS));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const delay = el.dataset.delay ? parseInt(el.dataset.delay, 10) : 0;

          setTimeout(() => {
            el.classList.add(REVEALED_CLASS);
          }, delay);

          // 한 번 등장하면 더 이상 관찰하지 않음
          observer.unobserve(el);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  };

  return { init };
})();

/* ─────────────────────────────────────────────
   BackToTop
   역할: 스크롤 300px 이상 시 상단으로 이동 버튼 표시
───────────────────────────────────────────── */
const BackToTop = (() => {
  const _btn = document.getElementById('back-to-top');
  const VISIBLE_CLASS = 'visible';
  const SHOW_THRESHOLD = 300;

  let _ticking = false;

  const _onScroll = () => {
    if (_ticking) return;
    _ticking = true;

    window.requestAnimationFrame(() => {
      if (!_btn) { _ticking = false; return; }
      if (window.scrollY > SHOW_THRESHOLD) {
        _btn.classList.add(VISIBLE_CLASS);
      } else {
        _btn.classList.remove(VISIBLE_CLASS);
      }
      _ticking = false;
    });
  };

  const _scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const init = () => {
    if (!_btn) return;
    window.addEventListener('scroll', _onScroll, { passive: true });
    _btn.addEventListener('click', _scrollToTop);
    _onScroll(); // 초기 실행
  };

  return { init };
})();

/* ─────────────────────────────────────────────
   SmoothScroll
   역할: 앵커 링크 클릭 시 헤더 높이를 고려한 부드러운 스크롤
───────────────────────────────────────────── */
const SmoothScroll = (() => {
  const HEADER_OFFSET = 80; // 헤더 높이 + 여유

  const _onAnchorClick = (e) => {
    const link = e.currentTarget;
    const href = link.getAttribute('href');

    if (!href || !href.startsWith('#')) return;

    const targetId = href.slice(1);
    if (!targetId) return; // #만 있는 경우 (최상단 링크)

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const targetTop = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const init = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', _onAnchorClick);
    });
  };

  return { init };
})();

/* ─────────────────────────────────────────────
   MenuCardHover
   역할: 메뉴 카드 마우스 엔터/리브 parallax 효과
         (성능 고려: requestAnimationFrame 사용)
───────────────────────────────────────────── */
const MenuCardHover = (() => {
  const CARDS = document.querySelectorAll('.menu-card');
  const INTENSITY = 8; // 기울기 강도 (degree)

  const _onMouseMove = (e, card) => {
    window.requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      card.style.transform =
        `translateY(-6px) rotateX(${-dy * INTENSITY}deg) rotateY(${dx * INTENSITY}deg)`;
    });
  };

  const _onMouseLeave = (card) => {
    card.style.transform = '';
    card.style.transition = '';
  };

  const init = () => {
    // 애니메이션 감소 설정이면 적용 안 함
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    CARDS.forEach((card) => {
      card.style.willChange = 'transform';
      card.style.transition =
        'transform 0.15s ease, box-shadow 0.3s ease, border-color 0.3s ease';

      card.addEventListener('mousemove', (e) => _onMouseMove(e, card));
      card.addEventListener('mouseleave', () => _onMouseLeave(card));
    });
  };

  return { init };
})();

/* ─────────────────────────────────────────────
   HeroParallax
   역할: 히어로 배경 패턴에 부드러운 패럴랙스 효과
───────────────────────────────────────────── */
const HeroParallax = (() => {
  const _pattern = document.querySelector('.hero-bg-pattern');
  let _ticking = false;

  const _onScroll = () => {
    if (!_pattern) return;
    if (_ticking) return;
    _ticking = true;

    window.requestAnimationFrame(() => {
      const scrolled = window.scrollY;
      _pattern.style.transform = `translateY(${scrolled * 0.3}px)`;
      _ticking = false;
    });
  };

  const init = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    window.addEventListener('scroll', _onScroll, { passive: true });
  };

  return { init };
})();

/* ─────────────────────────────────────────────
   App — 진입점
   역할: 모든 모듈을 DOM 준비 완료 후 초기화
───────────────────────────────────────────── */
const App = {
  init() {
    ThemeManager.init();
    HeaderManager.init();
    MobileNav.init();
    RevealObserver.init();
    BackToTop.init();
    SmoothScroll.init();
    MenuCardHover.init();
    HeroParallax.init();
  },
};

/* DOMContentLoaded 이후 실행 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  // 이미 파싱 완료된 경우 (script defer/async 없이 body 끝에 위치)
  App.init();
}
