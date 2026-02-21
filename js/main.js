/* ============================================================
   당케 (Danke) - Main JavaScript
   네비게이션, 탭 전환, 스크롤 애니메이션, 예약 폼 처리
   ============================================================ */

'use strict';

/* ============================================================
   NAVIGATION: 스크롤 시 배경 전환 + 모바일 햄버거 메뉴
   ============================================================ */
(function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  // 스크롤 시 nav에 .scrolled 클래스 추가
  const SCROLL_THRESHOLD = 50;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > SCROLL_THRESHOLD) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // 햄버거 메뉴 토글
  function toggleMenu(isOpen) {
    hamburger.classList.toggle('active', isOpen);
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    // 메뉴 열렸을 때 스크롤 막기
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = !navLinks.classList.contains('open');
    toggleMenu(isOpen);
  });

  // 메뉴 링크 클릭 시 닫기
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // 외부 영역 클릭 시 메뉴 닫기
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') &&
        !nav.contains(e.target)) {
      toggleMenu(false);
    }
  });
})();


/* ============================================================
   HERO PARALLAX: 스크롤 시 배경 이미지 패럴랙스 효과
   ============================================================ */
(function initParallax() {
  const heroBg = document.getElementById('heroBg');
  if (!heroBg) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    const heroHeight = document.getElementById('hero')?.offsetHeight || window.innerHeight;

    // Hero 섹션 내에서만 적용
    if (scrollY <= heroHeight) {
      const translateY = scrollY * 0.4;
      heroBg.style.transform = `scale(1.05) translateY(${translateY}px)`;
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
})();


/* ============================================================
   SMOOTH SCROLL: 앵커 링크 부드러운 스크롤
   (nav 높이만큼 오프셋 보정)
   ============================================================ */
(function initSmoothScroll() {
  const nav = document.getElementById('nav');

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = nav ? nav.offsetHeight : 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   SCROLL REVEAL: Intersection Observer로 요소 등장 애니메이션
   ============================================================ */
(function initScrollReveal() {
  // 접근성: 모션 줄이기 설정 시 바로 표시
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  revealEls.forEach(el => observer.observe(el));
})();


/* ============================================================
   MENU TABS: 카테고리 탭 전환
   ============================================================ */
(function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu__tab');
  const categories = document.querySelectorAll('.menu__category');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // 탭 활성화 전환
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // 카테고리 패널 전환
      categories.forEach(cat => {
        const isTarget = cat.id === `tab-${targetTab}`;
        cat.classList.toggle('active', isTarget);
      });
    });
  });
})();


/* ============================================================
   RESERVATION FORM: 예약 폼 유효성 검사 + 제출 처리
   ============================================================ */
(function initReservationForm() {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  // 오늘 날짜 이전 선택 막기
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // 전화번호 자동 포맷 (010-0000-0000)
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length <= 3) {
        e.target.value = val;
      } else if (val.length <= 7) {
        e.target.value = `${val.slice(0, 3)}-${val.slice(3)}`;
      } else {
        e.target.value = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
      }
    });
  }

  // 폼 제출 처리
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // 기본 유효성 검사
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      field.classList.remove('form__input--error');
      if (!field.value.trim()) {
        field.classList.add('form__input--error');
        isValid = false;
      }
    });

    if (!isValid) {
      showToast('필수 항목을 모두 입력해 주세요.', 'error');
      return;
    }

    // 제출 버튼 로딩 상태
    const submitBtn = form.querySelector('.form__submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '처리 중...';
    submitBtn.disabled = true;

    // 실제 서버 연동 전 시뮬레이션 (1.2초 딜레이)
    setTimeout(() => {
      showToast('예약 요청이 완료되었습니다. 확인 후 연락드리겠습니다.', 'success');
      form.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1200);
  });
})();


/* ============================================================
   TOAST NOTIFICATION: 상단 알림 표시
   ============================================================ */
function showToast(message, type = 'info') {
  // 기존 토스트 제거
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.textContent = message;

  // 토스트 스타일 인라인 (외부 CSS 의존 없이)
  Object.assign(toast.style, {
    position: 'fixed',
    top: '100px',
    left: '50%',
    transform: 'translateX(-50%) translateY(-20px)',
    zIndex: '500',
    padding: '14px 28px',
    background: type === 'success' ? '#4A9E6D' : type === 'error' ? '#C75050' : '#5B8DB8',
    color: '#fff',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    opacity: '0',
    transition: 'opacity 300ms ease, transform 300ms ease',
    maxWidth: '90vw',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  });

  document.body.appendChild(toast);

  // 등장 애니메이션
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  // 3초 후 사라짐
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


/* ============================================================
   ACTIVE NAV LINK: 스크롤 위치에 따라 현재 섹션 하이라이트
   ============================================================ */
(function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const nav = document.getElementById('nav');

  function updateActiveLink() {
    const navHeight = nav ? nav.offsetHeight : 0;
    const scrollMid = window.scrollY + navHeight + 80;

    let currentId = '';
    sections.forEach(section => {
      if (section.offsetTop <= scrollMid) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === `#${currentId}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
})();


/* ============================================================
   GALLERY LIGHTBOX: 갤러리 이미지 클릭 시 전체 화면 표시
   (현재는 placeholder이므로 간단한 오버레이만 구현)
   ============================================================ */
(function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery__item');

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      const placeholder = item.querySelector('.gallery__item-placeholder');
      const label = placeholder ? placeholder.textContent.trim() : `사진 ${index + 1}`;
      showToast(`"${label}" 이미지를 준비 중입니다.`, 'info');
    });
  });
})();


/* ============================================================
   COURSE TIMELINE: 수평 스크롤 드래그 지원 (데스크톱)
   ============================================================ */
(function initTimelineDrag() {
  const timeline = document.querySelector('.course__timeline');
  if (!timeline) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  timeline.addEventListener('mousedown', (e) => {
    isDown = true;
    timeline.style.cursor = 'grabbing';
    startX = e.pageX - timeline.offsetLeft;
    scrollLeft = timeline.scrollLeft;
  });

  document.addEventListener('mouseup', () => {
    isDown = false;
    timeline.style.cursor = 'grab';
  });

  timeline.addEventListener('mouseleave', () => {
    isDown = false;
    timeline.style.cursor = 'grab';
  });

  timeline.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - timeline.offsetLeft;
    const walk = (x - startX) * 1.5;
    timeline.scrollLeft = scrollLeft - walk;
  });

  timeline.style.cursor = 'grab';
})();


/* ============================================================
   INIT: 페이지 로드 완료 후 초기화 확인
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // form__input--error 스타일 동적 추가
  const style = document.createElement('style');
  style.textContent = `
    .form__input--error {
      border-color: #C75050 !important;
      box-shadow: 0 0 0 2px rgba(199, 80, 80, 0.15) !important;
    }
    .nav__link.active {
      color: var(--color-accent-gold) !important;
    }
    .nav__link.active::after {
      width: 100% !important;
    }
  `;
  document.head.appendChild(style);
});
