(() => {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const track = document.getElementById('worksTrack');
  const nameEl = document.getElementById('currentName');
  const progressEl = document.getElementById('worksProgressNum');
  const bar = document.getElementById('worksProgressBar');
  if (!track || !nameEl || !progressEl || !bar) return;

  const SLIDE_W = 594;
  const GAP = 20;
  const STEP = SLIDE_W + GAP;
  const realSlides = Array.from(track.querySelectorAll('.work-slide:not(.clone)'));
  const TOTAL = realSlides.length;
  const LOOP_WIDTH = STEP * TOTAL;
  const names = realSlides.map(s => s.dataset.name);

  let current = 0;
  let targetX = 0;
  let currentX = 0;
  let isDragging = false;
  let lastX = 0;
  let velocity = 0;

  function getIndex() {
    const raw = Math.round(-currentX / STEP);
    return ((raw % TOTAL) + TOTAL) % TOTAL;
  }

  function updateBar() {
    const scrolled = ((-currentX) % LOOP_WIDTH + LOOP_WIDTH) % LOOP_WIDTH;
    const pct = Math.max(1, Math.min(99, (scrolled / LOOP_WIDTH) * 100));
    progressEl.innerHTML = `<span class="paren">(</span><span class="progress-inner">${String(Math.round(pct)).padStart(2, '0')}%</span><span class="paren">)</span>`;
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

  function loop() {
    const diff = targetX - currentX;
    if (Math.abs(diff) > 0.1) {
      currentX += diff * 0.12;
    } else {
      currentX = targetX;
    }

    if (currentX < -LOOP_WIDTH) { currentX += LOOP_WIDTH; targetX += LOOP_WIDTH; }
    if (currentX > 0) { currentX -= LOOP_WIDTH; targetX -= LOOP_WIDTH; }

    track.style.transform = `translateX(${currentX}px)`;
    updateName(getIndex());
    updateBar();
    requestAnimationFrame(loop);
  }

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    targetX -= e.deltaY * 1.2;
  }, { passive: false, capture: true });

  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    velocity = 0;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    velocity = dx;
    lastX = e.clientX;
    targetX += dx;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    targetX += velocity * 5;
  });

  track.addEventListener('touchstart', (e) => {
    lastX = e.touches[0].clientX;
    velocity = 0;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - lastX;
    velocity = dx;
    lastX = e.touches[0].clientX;
    targetX += dx;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    targetX += velocity * 5;
  });

  nameEl.textContent = names[0];
  progressEl.innerHTML = `<span class="paren">(</span><span class="progress-inner">01%</span><span class="paren">)</span>`;
  bar.style.width = '1%';

  // ─── REVEAL ANIMATION ───
  const thumbs = track.querySelectorAll('.work-thumb');
  gsap.fromTo(thumbs,
    { y: '100%' },
    {
      y: '0%',
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.1,
      delay: 0.3,
    }
  );

  const allSlideNames = track.querySelectorAll('.work-slide .work-slide-name');
  gsap.fromTo(allSlideNames,
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.1,
      delay: 0.6,
    }
  );
  

gsap.fromTo('.works-big-title',
  { y: '100%' },
  { y: '0%', duration: 0.9, ease: 'power4.out', delay: 0.2 }
);

gsap.fromTo('.works-bottom-center',
  { y: '100%' },
  { y: '0%', duration: 0.9, ease: 'power4.out', delay: 0.55 }
);

gsap.fromTo('.works-bottom-right',
  { y: '100%' },
  { y: '0%', duration: 0.9, ease: 'power4.out', delay: 0.750 }
);


  requestAnimationFrame(loop);
})();
