// ============================================
// SCROLL RESTORATION
// ============================================
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const forceTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};
forceTop();

// ============================================
// VIEWPORT HEIGHT UTILITY
// ============================================
function getViewH() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}

function setVH() {
  const vh = getViewH() * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVH();
window.addEventListener('resize', setVH);
window.visualViewport?.addEventListener('resize', setVH);

// ============================================
// GSAP + LENIS
// ============================================
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.0,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
});

lenis.scrollTo(0, { immediate: true, force: true });

let lenisScrollY = 0;
lenis.on('scroll', ({ scroll }) => {
  lenisScrollY = scroll;
  ScrollTrigger.update();
});

gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ============================================
// LIVE TIME
// ============================================
function updateTime() {
  const el = document.getElementById('live-time');
  if (!el) return;
  el.textContent = `${new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Toronto',
  }).format(new Date())} · Currently in Montreal`;
}

// ============================================
// LINE SPLITTER
// ============================================
function splitTextToLines(el, firstLineIndent = 0, widthOffset = 0) {
  if (!el) return;

  const rawText = el.innerText.trim();
  const cs = getComputedStyle(el);

  const testSpan = document.createElement('span');
  testSpan.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: nowrap;
    font-size: ${cs.fontSize};
    font-weight: ${cs.fontWeight};
    font-family: ${cs.fontFamily};
    letter-spacing: ${cs.letterSpacing};
  `;
  document.body.appendChild(testSpan);

  const containerWidth = el.getBoundingClientRect().width - widthOffset;
  const words = rawText.split(' ');
  const lines = [];
  let current = '';
  let lineIndex = 0;

  words.forEach((word, i) => {
    const test = current ? current + ' ' + word : word;
    testSpan.innerText = test;
    const availableWidth = containerWidth - (lineIndex === 0 ? firstLineIndent : 0);
    if (testSpan.offsetWidth > availableWidth && current) {
      lines.push(current);
      lineIndex++;
      current = word;
    } else {
      current = test;
    }
    if (i === words.length - 1) lines.push(current);
  });

  document.body.removeChild(testSpan);

  el.innerHTML = lines
    .map(
      (line, i) =>
        `<span class="approach-line-wrapper"><span class="approach-line"${
          i === 0 && firstLineIndent ? ` style="padding-left:${firstLineIndent}px"` : ''
        }>${line}</span></span>`
    )
    .join('');
}

// ============================================
// REVEAL UTILITIES
// ============================================
function revealLines(container, stagger = 100) {
  container.querySelectorAll('.approach-line').forEach((line, i) => {
    setTimeout(() => line.classList.add('visible'), i * stagger);
  });
}

function observeAndReveal(el, threshold = 0.25, stagger = 100) {
  if (!el) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealLines(entry.target, stagger);
        obs.unobserve(entry.target);
      });
    },
    { threshold }
  );
  obs.observe(el);
}

// ============================================
// HERO CARD
// ============================================
function initHeroCard() {
  const heroCard = document.querySelector('.hero-card');
  const spacer   = document.querySelector('.scroll-spacer');
  const navbar   = document.querySelector('.navbar');
  const heroName = document.querySelector('.hero-name');
  if (!heroCard) return;

  const MAX_SCALE_DELTA  = 2.64;
  const MAX_DRIFT_Y      = -30;
  const GAP_BIAS         = -5;

  let START_Y          = 0;
  let SCROLL_DISTANCE  = 0;
  let lockedAbsoluteTop = null;
  let mouseX           = window.innerWidth / 2;
  let currentOffsetX   = 0;
  let revealProgress   = 0;
  let revealStart      = null;
  const REVEAL_DELAY   = 100;
  const REVEAL_DURATION = 700;

  document.body.appendChild(heroCard);

  function computeStartY() {
    const navBottom  = navbar   ? navbar.getBoundingClientRect().bottom : 0;
    const nameTop    = heroName ? heroName.getBoundingClientRect().top  : window.innerHeight * 0.5;
    const cardHeight = heroCard.offsetHeight;
    START_Y = (navBottom + nameTop - cardHeight) / 2 + GAP_BIAS;
  }

  function computeScrollDistance() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ratio = vw / vh;

    // 16:9 or wider = 1.2 pages, 16:10 = 1.0 pages, interpolate between
    // ratio >= 1.78 (16:9) → 1.2vh, ratio <= 1.6 (16:10) → 1.0vh
    const pageMult = ratio >= 1.78
      ? 1.2
      : ratio <= 1.6
      ? 1.0
      : 1.0 + ((ratio - 1.6) / (1.78 - 1.6)) * 0.2;

    SCROLL_DISTANCE = vh * pageMult;
  }

  function setSpacerHeight() {
    if (!spacer) return;
    spacer.style.height = `${SCROLL_DISTANCE}px`;
  }

  function recalcAll() {
    computeStartY();
    computeScrollDistance();
    setSpacerHeight();
    heroCard.style.top = `${START_Y}px`;
  }

  heroCard.style.cssText += `
    position: fixed;
    left: 50%;
    top: 0px;
    z-index: 5;
    transform-origin: center top;
    transform: translateX(-50%) scale(1);
    opacity: 1;
    clip-path: inset(100% 0% 0% 0%);
    -webkit-clip-path: inset(100% 0% 0% 0%);
  `;

  recalcAll();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      lockedAbsoluteTop = null;
      heroCard.style.position = 'fixed';
      recalcAll();
    }, 100);
  });

  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; });

  function animate(now) {
    requestAnimationFrame(animate);

    // Reveal clip
    if (revealStart === null) revealStart = now;
    const elapsed = now - revealStart - REVEAL_DELAY;
    if (elapsed > 0) revealProgress = Math.min(elapsed / REVEAL_DURATION, 1);
    const easedReveal = 1 - Math.pow(1 - revealProgress, 4);
    const maskTop = (1 - easedReveal) * 100;
    const clip = `inset(${maskTop}% 0% 0% 0%)`;
    heroCard.style.clipPath = clip;
    heroCard.style.webkitClipPath = clip;

    // Scroll progress 0→1
    const progress = SCROLL_DISTANCE > 0
      ? Math.min(lenisScrollY / SCROLL_DISTANCE, 1)
      : 0;

    const scale = 1 + progress * MAX_SCALE_DELTA;
    const topY  = START_Y + progress * MAX_DRIFT_Y;

    // Mouse drift fades out as scroll progresses
    const pull = Math.pow(progress, 3);
    const centerX = window.innerWidth / 2;
    const targetX = (mouseX - centerX) * 0.7 * (1 - pull);
    currentOffsetX += (targetX - currentOffsetX) * 0.05;

    // NO fade — card stays fully visible, next section scrolls over it
    heroCard.style.opacity = '1';
    heroCard.style.pointerEvents = '';

    // Lock to absolute when scroll finishes
    if (progress >= 1) {
      if (lockedAbsoluteTop === null) {
        lockedAbsoluteTop = heroCard.getBoundingClientRect().top + lenisScrollY;
      }
      heroCard.style.position = 'absolute';
      heroCard.style.top = `${lockedAbsoluteTop}px`;
    } else {
      lockedAbsoluteTop = null;
      heroCard.style.position = 'fixed';
      heroCard.style.top = `${topY}px`;
    }

    heroCard.style.transform = `translateX(calc(-50% + ${currentOffsetX}px)) scale(${scale})`;
  }

  requestAnimationFrame(animate);
}


// ============================================
// TEXT REVEALS
// ============================================
function initTextReveals() {
  document.querySelectorAll('.approach-text').forEach((el) => {
    splitTextToLines(el, 0, 0);
    observeAndReveal(el, 0.25, 100);
  });

  document.querySelectorAll('.approach-list li').forEach((li) => {
    const text = li.innerText.trim();
    li.innerHTML = `<span class="approach-line">${text}</span>`;
  });
  const listEl = document.querySelector('.approach-list');
  if (listEl) observeAndReveal(listEl, 0.25, 100);

  document.querySelectorAll('.works-title').forEach((el) => {
    el.innerHTML = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map((s) => s.trim())
      .map(
        (line) =>
          `<span class="approach-line-wrapper"><span class="approach-line">${line}</span></span>`
      )
      .join('');
  });

  document.querySelectorAll('.works-count').forEach((el) => {
    const text = el.innerText.trim();
    el.innerHTML = `<span class="approach-line-wrapper"><span class="approach-line">${text}</span></span>`;
  });

  const worksHeader = document.querySelector('.works-header');
  if (worksHeader) observeAndReveal(worksHeader, 0.8, 100);

  const worksGrid = document.querySelector('.works-grid');
  if (worksGrid) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll('.work-item').forEach((item, i) => {
            setTimeout(() => item.classList.add('revealed'), i * 80);
          });
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    ).observe(worksGrid);
  }
}

// ============================================
// FOCUS SECTION
// ============================================
function initFocusSection() {
  const focusCards = gsap.utils.toArray('.focus-card');
  if (!focusCards.length) return;

  focusCards.forEach((card, i) => {
    const darken = card.querySelector('.focus-darken');
    if (darken) gsap.set(darken, { opacity: 0 });
    if (i === focusCards.length - 1 || !darken) return;

    gsap.fromTo(darken, { opacity: 0 }, {
      opacity: 0.4,
      ease: 'none',
      scrollTrigger: {
        trigger: focusCards[i + 1],
        start: 'top 80%',
        end: 'top 20%',
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
  });

  gsap.to('.focus-hero-image', {
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.focus-hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

// ============================================
// CLIENTS
// ============================================
function initClientsSection() {
  const title = document.querySelector('.clients-title');
  if (!title) return;
  observeAndReveal(title, 0.4, 100);
}

// ============================================
// ABOUT GALLERY SCROLL
// ============================================
function initAboutGallery() {
  const track   = document.querySelector('.about-gallery-track');
  const section = document.querySelector('.about-gallery-section');
  if (!track || !section) return;

  gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth + 100),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top 100%',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
}

// ============================================
// ABOUT PARA
// ============================================
function initAboutPara() {
  const para = document.querySelector('.about-para-text');
  if (!para || para.dataset.split === 'true') return;
  para.dataset.split = 'true';
  splitTextToLines(para, 0, 0);
  observeAndReveal(para, 0.3, 100);
}

// ============================================
// GALLERY PARA
// ============================================
function initGalleryPara() {
  const para = document.querySelector('.gallery-para-text');
  if (!para || para.dataset.split === 'true') return;
  para.dataset.split = 'true';

  requestAnimationFrame(() => {
    splitTextToLines(para, 210, 170);
    observeAndReveal(para, 0.2, 100);
  });
}

// ============================================
// ENTRY SEQUENCE
// ============================================
function initEntrySequence() {
  const navTime       = document.getElementById('live-time');
  const navItems      = document.querySelectorAll('.nav-item');
  const navCta        = document.querySelector('.nav-cta');
  const heroName      = document.querySelector('.hero-name .approach-line');
  const heroBioLines  = document.querySelectorAll('.hero-bio .approach-line');
  const heroScroll    = document.querySelector('.hero-scroll');
  const aboutMyself   = document.querySelector('.about-bottom-bar .approach-line-wrapper:first-child .approach-line');
  const keepScrolling = document.querySelector('.about-bottom-bar .approach-line-wrapper:last-child .approach-line');

  [
    { el: heroName,      delay: 50  },
    { el: navTime,       delay: 200 },
    { el: navItems[0],   delay: 250 },
    { el: navItems[1],   delay: 350 },
    { el: navItems[2],   delay: 450 },
    { el: navItems[3],   delay: 550 },
    { el: navCta,        delay: 650 },
    { el: heroScroll,    delay: 850 },
    { el: aboutMyself,   delay: 200 },
    { el: keepScrolling, delay: 850 },
  ].forEach(({ el, delay }) => {
    if (!el) return;
    setTimeout(() => el.classList.add('visible'), delay);
  });

  heroBioLines.forEach((line, i) => {
    setTimeout(() => line.classList.add('visible'), 200 + i * 100);
  });

  const letters = document.querySelectorAll('.about-letter span');
  const img     = document.querySelector('.about-placeholder');

  letters.forEach((letter, i) => {
    setTimeout(() => letter.classList.add('visible'), i * 100);
  });

  if (img) {
    setTimeout(() => img.classList.add('visible'), letters.length * 100 + 100);
  }
}

// ============================================
// HOBBIES HOVER
// ============================================
function initHobbies() {
  const hobbyItems   = document.querySelectorAll('.hobby-item');
  const hobbyCards   = document.querySelectorAll('.hobby-card');
  const captionSlots = document.querySelectorAll('.caption-slot');
  if (!hobbyItems.length) return;

  function activateCaption(slot) {
    if (!slot) return;
    slot.classList.add('active');
    const lines = slot.querySelectorAll('.approach-line');
    lines.forEach(l => l.classList.remove('visible'));
    lines.forEach((line, i) => {
      setTimeout(() => line.classList.add('visible'), i * 60);
    });
  }

  function resetCaption(slot) {
    slot.classList.remove('active');
    slot.querySelectorAll('.approach-line').forEach(l => l.classList.remove('visible'));
  }

  const defaultSlot = document.querySelector('.caption-slot[data-index="0"]');
  if (defaultSlot) activateCaption(defaultSlot);

  hobbyItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      const i = item.dataset.index;
      hobbyItems.forEach(el => el.classList.remove('active'));
      hobbyCards.forEach(el => el.classList.remove('active'));
      captionSlots.forEach(el => resetCaption(el));
      item.classList.add('active');
      const card = document.querySelector(`.hobby-card[data-index="${i}"]`);
      const slot = document.querySelector(`.caption-slot[data-index="${i}"]`);
      if (card) card.classList.add('active');
      activateCaption(slot);
    });
  });
}

// ============================================
// STACK SECTION
// ============================================
function initStack() {
  const stackLabel = document.querySelector('.stack-label');
  const stackTitle = document.querySelector('.stack-title');
  if (!stackLabel || !stackTitle) return;

  stackLabel.innerHTML = `<span class="stack-label-inner">${stackLabel.textContent}</span>`;
  stackTitle.innerHTML = stackTitle.innerHTML
    .split('<br>')
    .map(line => `<div style="overflow:hidden"><span class="stack-title-inner">${line}</span></div>`)
    .join('');

  gsap.to(document.querySelectorAll('.stack-label-inner, .stack-title-inner'), {
    scrollTrigger: {
      trigger: '.stack-header',
      start: 'top 80%',
    },
    y: '0%',
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.12,
  });
}

// ============================================
// WORKS PAGE HEIGHT
// ============================================
function setWorksPageHeight() {
  const worksPage = document.querySelector('.works-page');
  const navbar    = document.querySelector('.navbar');
  if (!worksPage) return;
  const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
  const viewH     = getViewH();
  worksPage.style.height = `${viewH - navHeight}px`;
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  setWorksPageHeight();
  window.addEventListener('resize', setWorksPageHeight);
  window.visualViewport?.addEventListener('resize', setWorksPageHeight);

  updateTime();
  setInterval(updateTime, 1000);

  initHeroCard();
  initTextReveals();
  initFocusSection();
  initClientsSection();
  initAboutGallery();
  initAboutPara();
  initGalleryPara();
  initHobbies();
  initStack();

  const backToTopBtn = document.querySelector('.back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      lenis.scrollTo(0, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
  }
});

window.addEventListener('load', () => {
  forceTop();
  lenis.scrollTo(0, { immediate: true, force: true });
  setWorksPageHeight();

  requestAnimationFrame(() => {
    forceTop();
    lenis.scrollTo(0, { immediate: true, force: true });
    initAboutPara();
    initGalleryPara();
    initEntrySequence();
    ScrollTrigger.refresh();
  });
});


