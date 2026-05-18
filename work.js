(() => {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // ─── ELEMENTS ───
  const track      = document.getElementById('worksTrack');
  const nameEl     = document.getElementById('currentName');
  const progressEl = document.getElementById('worksProgressNum');
  const bar        = document.getElementById('worksProgressBar');
  if (!track || !nameEl || !progressEl || !bar) return;

  // ─── NAVBAR HEIGHT ───
  const navbar    = document.querySelector('.navbar');
  const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
  const worksPage = document.querySelector('.works-page');
  if (worksPage) worksPage.style.height = `calc(100dvh - ${navHeight}px)`;

  // ─── TRACK OFFSET ───
  const trackWrapper = document.querySelector('.works-track-wrapper');
  const titleEl      = document.querySelector('.works-big-title');
  if (trackWrapper && titleEl) {
    const titleH = titleEl.getBoundingClientRect().height;
    trackWrapper.style.transform = `translateY(-${titleH * 0.0}px)`;
  }

  // ─── CONSTANTS ───
  const SLIDE_W    = 594;
  const GAP        = 20;
  const STEP       = SLIDE_W + GAP;
  const realSlides = Array.from(track.querySelectorAll('.work-slide:not(.clone)'));
  const TOTAL      = realSlides.length;
  const LOOP_WIDTH = STEP * TOTAL;
  const names      = realSlides.map(s => s.dataset.name);

  // ─── STATE ───
  let current    = 0;
  let targetX    = 0;
  let currentX   = 0;
  let isDragging = false;
  let lastX      = 0;
  let velocity   = 0;

  // ─── HELPERS ───
  function getIndex() {
    const raw = Math.round(-currentX / STEP);
    return ((raw % TOTAL) + TOTAL) % TOTAL;
  }

  function updateBar() {
    const scrolled = ((-currentX) % LOOP_WIDTH + LOOP_WIDTH) % LOOP_WIDTH;
    const pct      = Math.max(1, Math.min(99, (scrolled / LOOP_WIDTH) * 100));
    const padded   = String(Math.round(pct)).padStart(2, '0');
    progressEl.innerHTML = `<span class="paren">(</span><span class="progress-inner">${padded}%</span><span class="paren">)</span>`;
    bar.style.width = pct + '%';
  }

  function updateName(index) {
    if (index === current) return;
    current = index;
    nameEl.style.opacity = '0';
    setTimeout(() => {
      nameEl.textContent = names[current];
      nameEl.style.opacity = '1';
    }, 120);
  }

  // ─── LOOP ───
  function loop() {
    const diff = targetX - currentX;
    currentX = Math.abs(diff) > 0.1 ? currentX + diff * 0.12 : targetX;

    if (currentX < -LOOP_WIDTH) { currentX += LOOP_WIDTH; targetX += LOOP_WIDTH; }
    if (currentX > 0)           { currentX -= LOOP_WIDTH; targetX -= LOOP_WIDTH; }

    track.style.transform = `translateX(${currentX}px)`;
    updateName(getIndex());
    updateBar();
    requestAnimationFrame(loop);
  }

  // ─── WHEEL ───
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    targetX -= e.deltaY * 1.2;
  }, { passive: false, capture: true });

  // ─── MOUSE DRAG ───
  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX      = e.clientX;
    velocity   = 0;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    velocity = dx;
    lastX    = e.clientX;
    targetX += dx;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    targetX   += velocity * 5;
  });

  // ─── TOUCH ───
  track.addEventListener('touchstart', (e) => {
    lastX    = e.touches[0].clientX;
    velocity = 0;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - lastX;
    velocity = dx;
    lastX    = e.touches[0].clientX;
    targetX += dx;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    targetX += velocity * 5;
  });

  // ─── INITIAL STATE ───
  nameEl.textContent   = names[0];
  progressEl.innerHTML = `<span class="paren">(</span><span class="progress-inner">01%</span><span class="paren">)</span>`;
  bar.style.width      = '1%';

  // ─── REVEAL ANIMATIONS ───
  gsap.fromTo(track.querySelectorAll('.work-thumb'),
    { y: '100%' },
    { y: '0%', duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: 0.3 }
  );

  gsap.fromTo(track.querySelectorAll('.work-slide .work-slide-name'),
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.6 }
  );

  [
    { sel: '.works-big-title',     delay: 0.20 },
    { sel: '.works-bottom-center', delay: 0.55 },
    { sel: '.works-bottom-right',  delay: 0.75 },
  ].forEach(({ sel, delay }) => {
    gsap.fromTo(sel,
      { y: '100%' },
      { y: '0%', duration: 0.9, ease: 'power4.out', delay }
    );
  });

  requestAnimationFrame(loop);
})();


