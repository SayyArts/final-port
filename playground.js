(() => {
  // ─── CLOCK ───
  function updateTime() {
    const now = new Date();
    const el = document.getElementById('navTime');
    if (el) el.textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
  updateTime();
  setInterval(updateTime, 1000);

  // ─── DATA ───
  const projects = [
    { name: '2D Animation' },
    { name: '3D Typography' },
    { name: 'Brand System' },
    { name: 'Graphic Standarts' },
    { name: 'Color Theory' },
    { name: 'Poster Series' },
    { name: 'Generative Art' },
    { name: 'Type In Motion' },
    { name: 'Displates' },
    { name: 'Visual Essays' },
  ];

  // ─── REFS ───
  const pgNames  = document.getElementById('pgNames');
  const pgImages = document.getElementById('pgImages');
  const section  = document.getElementById('playground');
  const slots    = Array.from(pgImages.querySelectorAll('.pg-img-slot'));
  const TOTAL    = projects.length;
  const COPIES   = 3;

  // ─── BUILD DOM ───
  for (let c = 0; c < COPIES; c++) {
    projects.forEach((p, i) => {
      const div         = document.createElement('div');
      div.className     = 'pg-item';
      div.dataset.index = i;
      div.dataset.copy  = c;
      const inner       = document.createElement('span');
      inner.className   = 'pg-item-inner';
      inner.textContent = p.name;
      div.appendChild(inner);
      pgNames.appendChild(div);
    });
  }

  const allItems  = Array.from(pgNames.querySelectorAll('.pg-item'));
  const allInners = allItems.map(item => item.querySelector('.pg-item-inner'));

  // ─── STATE ───
  let targetY     = 0;
  let currentY    = 0;
  let activeIndex = 0;
  let isRevealing = true;

  const ITEM_H = () => allItems[0].offsetHeight;
  const LOOP_H = () => ITEM_H() * TOTAL;
  const CENTER = () => section.offsetHeight / 2;

  // ─── INDEX ───
  function getClosestIndex(fromY) {
    const itemH   = ITEM_H();
    const centerY = -fromY + CENTER();
    let idx = Math.round((centerY - itemH / 2) / itemH);
    idx = ((idx % TOTAL) + TOTAL) % TOTAL;
    return idx;
  }

  // ─── ACTIVE ───
  function updateActive(fromY) {
    const closest = getClosestIndex(fromY);
    if (closest === activeIndex) return;
    activeIndex = closest;

    allItems.forEach(item =>
      item.classList.toggle('active', parseInt(item.dataset.index) === activeIndex)
    );

    slots.forEach((s, i) => {
      if (i === activeIndex) {
        s.classList.add('active');
        gsap.killTweensOf(s.querySelector('.pg-img-curtain'));
        gsap.set(s.querySelector('.pg-img-curtain'), { y: '0%' });
      } else {
        s.classList.remove('active');
        gsap.set(s.querySelector('.pg-img-curtain'), { y: '100%' });
      }
    });
  }

  // ─── LOOP ───
  function loop() {
    if (!isRevealing) {
      currentY += (targetY - currentY) * 0.12;

      const loopH = LOOP_H();
      if (-currentY > loopH * (COPIES - 1)) { currentY += loopH; targetY += loopH; }
      if (-currentY < 0)                     { currentY -= loopH; targetY -= loopH; }

      pgNames.style.transform = `translateY(${currentY}px)`;
      updateActive(targetY);
    }
    requestAnimationFrame(loop);
  }

  // ─── INPUT ───
  section.addEventListener('wheel', e => {
    if (isRevealing) return;
    e.preventDefault();
    targetY -= e.deltaY * 0.8;
    updateActive(targetY);
  }, { passive: false });

  let lastTouchY = 0;
  section.addEventListener('touchstart', e => {
    lastTouchY = e.touches[0].clientY;
  }, { passive: true });

  section.addEventListener('touchmove', e => {
    if (isRevealing) return;
    const dy = e.touches[0].clientY - lastTouchY;
    lastTouchY = e.touches[0].clientY;
    targetY += dy;
    updateActive(targetY);
  }, { passive: true });

  // ─── INIT ───
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const anchor = allItems[TOTAL];
    currentY = CENTER() - (anchor.offsetTop + anchor.offsetHeight / 2);
    targetY  = currentY;

    pgNames.style.transform = `translateY(${currentY}px)`;

    activeIndex = getClosestIndex(currentY);

    allItems.forEach(item =>
      item.classList.toggle('active', parseInt(item.dataset.index) === activeIndex)
    );

    slots.forEach((s, i) => {
      s.classList.toggle('active', i === activeIndex);
      gsap.set(s.querySelector('.pg-img-curtain'), { y: '100%' });
    });

    gsap.set(allInners, { y: '110%' });

    const sectionRect   = section.getBoundingClientRect();
    const visibleInners = allItems
      .filter(item => {
        const rect = item.getBoundingClientRect();
        return rect.bottom > sectionRect.top && rect.top < sectionRect.bottom;
      })
      .map(item => item.querySelector('.pg-item-inner'));

    gsap.set(allInners.filter(el => !visibleInners.includes(el)), { y: '0%' });
    gsap.set('.pg-images', { opacity: 1 });

    loop();
    reveal(visibleInners);
  }));

  // ─── REVEAL ───
  function reveal(visibleInners) {
    const tl = gsap.timeline({
      delay: 0.3,
      onComplete: () => { isRevealing = false; }
    });

    // nav left
    tl.fromTo('.nav-left .nav-reveal-inner',
      { y: '110%' },
      { y: '0%', duration: 0.9, ease: 'power4.out' },
      0.0
    );

    // nav links
    tl.fromTo('.nav-links .nav-reveal-inner',
      { y: '110%' },
      { y: '0%', duration: 0.9, ease: 'power4.out', stagger: 0.07 },
      0.0
    );

    // CTA button shell slides up
    tl.fromTo('.nav-cta',
      { y: '110%' },
      { y: '0%', duration: 0.9, ease: 'power4.out' },
      0.1
    );

    // project names
    tl.fromTo(visibleInners,
      { y: '110%' },
      { y: '0%', duration: 1.0, ease: 'power4.out', stagger: 0.06 },
      0.15
    );

    // image curtain
    tl.fromTo('.pg-img-slot.active .pg-img-curtain',
      { y: '100%' },
      { y: '0%', duration: 1.1, ease: 'power4.out' },
      0.25
    );

    // scroll hint
    tl.fromTo('.pg-scroll-hint',
      { opacity: 0, y: 10 },
      { opacity: 0.55, y: 0, duration: 0.8, ease: 'power3.out' },
      0.7
    );
  }

})();
