(() => {
  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const anim = (el, kf, opt) => el.animate(kf, { fill: 'forwards', easing: 'ease-in-out', ...opt }).finished;

  // Положення подарунків на кадрі gifts.webp (у % від кадру 1376×768)
  const GIFT_BOXES = [
    { l: 13.66, w: 12.94 }, // блакитний
    { l: 26.53, w: 11.48 }, // бордовий
    { l: 39.03, w: 10.39 }, // золотий
    { l: 51.53, w: 10.32 }, // шавлієвий
    { l: 63.08, w: 11.56 }, // кремовий
    { l: 74.42, w: 13.01 }  // лавандовий
  ];
  const GIFT_TOP = 45.9, GIFT_H = 22.5;

  const els = {
    start: $('#start'), enter: $('#enterBtn'), bg: $('#bgBlur'), flash: $('#flash'),
    vEntrance: $('#vEntrance'), vGreet: $('#vGreet'), vFinale: $('#vFinale'),
    greetText: $('#greetText'), greetNext: $('#greetNext'), toGifts: $('#toGifts'),
    gifts: $('#gifts'), giftsScene: $('#giftsScene'), toFinale: $('#toFinale'),
    finaleText: $('#finaleText'), replay: $('#replayBtn'),
    layer: $('#bibleLayer'), light: $('#light'), rays: $('#rays'), sparkles: $('#sparkles'),
    closed: $('#bookClosed'), open: $('#bookOpen'), pages: document.querySelectorAll('.page'),
    mood: $('.mood'), ref: $('.ref'), verse: $('.verse'), tapHint: $('#tapHint'),
    mute: $('#muteBtn'), rotate: $('#rotateHint')
  };

  let busy = false;
  let bibleState = 'none'; // none | opening | open | closing
  const opened = new Set();

  // ---------- відео ----------
  function playToEnd(v, maxMs = 9000) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      v.addEventListener('ended', finish, { once: true });
      v.currentTime = 0;
      const p = v.play();
      if (p && p.catch) p.catch(() => setTimeout(finish, 1500)); // якщо відео не грає — показуємо постер і йдемо далі
      setTimeout(finish, maxMs);
    });
  }
  function show(v) { [els.vEntrance, els.vGreet, els.vFinale].forEach((x) => x.classList.toggle('on', x === v)); }
  async function flash(fn) {
    await anim(els.flash, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    fn();
    await anim(els.flash, [{ opacity: 1 }, { opacity: 0 }], { duration: 420 });
  }
  function setBg(src) { els.bg.src = src; }

  // ---------- сцени ----------
  async function enter() {
    if (busy) return; busy = true;
    Sound.init();
    // у відео є власний звук (вигуки друзів) — вмикаємо після кліку користувача
    [els.vEntrance, els.vGreet, els.vFinale].forEach((v) => { v.muted = Sound.muted; v.volume = 0.7; });
    if (matchMedia('(orientation: portrait)').matches && matchMedia('(pointer: coarse)').matches) els.rotate.classList.remove('hidden');
    els.start.classList.add('out');
    show(els.vEntrance);
    await playToEnd(els.vEntrance);
    await flash(() => { show(els.vGreet); setBg('assets/img/greet-last.jpg'); });
    const greetDone = playToEnd(els.vGreet);
    await wait(350);
    els.greetText.classList.remove('hidden');
    Confetti.burst(180);
    Sound.song();
    await greetDone;
    await wait(1200);
    els.greetNext.classList.remove('hidden');
    busy = false;
  }

  async function toGifts() {
    if (busy) return; busy = true;
    els.greetNext.classList.add('hidden');
    await flash(() => {
      els.greetText.classList.add('hidden');
      show(null);
      els.giftsScene.classList.add('on');
      setBg('assets/img/gifts.webp');
    });
    busy = false;
  }

  async function toFinale() {
    if (busy) return; busy = true;
    await flash(() => { els.giftsScene.classList.remove('on'); show(els.vFinale); setBg('assets/img/finale-last.jpg'); });
    const done = playToEnd(els.vFinale);
    Confetti.burst(120);
    Sound.song(0.46, 0.18);
    await done;
    els.finaleText.classList.remove('hidden');
    busy = false;
  }

  // ---------- подарунки ----------
  function buildGifts() {
    VERSES.forEach((v, i) => {
      const b = GIFT_BOXES[i];
      const slot = document.createElement('div');
      slot.className = 'gift-slot';
      slot.style.cssText = `left:${b.l}cqw;top:${GIFT_TOP}cqh;width:${b.w}cqw;height:${GIFT_H}cqh;`;
      const g = document.createElement('button');
      g.className = 'gift';
      g.style.backgroundPosition = `-${b.l}cqw -${GIFT_TOP}cqh`;
      g.setAttribute('aria-label', `Подарунок: ${v.mood}`);
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = v.mood;
      slot.append(g, tag);
      g.addEventListener('click', () => openGift(i, slot));
      els.gifts.appendChild(slot);
    });
  }

  function makeSparkles() {
    els.sparkles.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.top = Math.random() * 100 + 'vh';
      s.style.animationDelay = (Math.random() * 2.4).toFixed(2) + 's';
      els.sparkles.appendChild(s);
    }
  }

  async function openGift(i, giftEl) {
    if (busy || bibleState !== 'none') return;
    busy = true; bibleState = 'opening';
    const v = VERSES[i];
    els.mood.textContent = v.mood;
    els.ref.textContent = v.ref;
    els.verse.textContent = `«${v.text}»`;
    els.verse.classList.toggle('long', v.text.length > 110);

    // 1. подарунок тремтить
    giftEl.classList.add('shake');
    await wait(550);
    giftEl.classList.remove('shake');

    // 2. сяйво з подарунка заливає весь екран
    const r = giftEl.getBoundingClientRect();
    const gx = r.left + r.width / 2, gy = r.top + r.height * 0.35;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    makeSparkles();
    els.layer.classList.remove('hidden');
    els.light.style.left = gx + 'px'; els.light.style.top = gy + 'px';
    els.closed.style.opacity = 0; els.open.style.opacity = 0;
    els.pages.forEach((p) => (p.style.opacity = 0));
    Sound.chime();
    const big = Math.hypot(innerWidth, innerHeight) * 2.6 + 'px';
    const lightP = anim(els.light, [
      { width: '20px', height: '20px', opacity: 0 },
      { width: '160px', height: '160px', opacity: 1, offset: 0.25 },
      { width: big, height: big, opacity: 1 }
    ], { duration: 1300, easing: 'cubic-bezier(.5,0,.3,1)' });
    anim(els.rays, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 1400, delay: 400 });

    // 3. Біблія вилітає з коробки
    Sound.whoosh(true);
    const dx = gx - cx, dy = gy - cy;
    await anim(els.closed, [
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.08) rotate(-30deg)`, opacity: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.4}px), calc(-50% + ${dy * 0.4 - 80}px)) scale(.6) rotate(10deg)`, opacity: 1, offset: 0.5 },
      { transform: 'translate(-50%, -54%) scale(1.06) rotate(-3deg)', opacity: 1, offset: 0.82 },
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }
    ], { duration: 1500, easing: 'cubic-bezier(.3,.7,.3,1)' });
    await lightP;
    await wait(250);

    // 4. Біблія розгортається
    await anim(els.closed, [
      { transform: 'translate(-50%, -50%) perspective(1400px) rotateY(0deg)', opacity: 1 },
      { transform: 'translate(-50%, -50%) perspective(1400px) rotateY(-88deg)', opacity: 0.6 }
    ], { duration: 420, easing: 'ease-in' });
    els.closed.style.opacity = 0;
    await anim(els.open, [
      { transform: 'translate(-50%, -50%) scaleX(.04) scaleY(.92)', opacity: 0.6 },
      { transform: 'translate(-50%, -50%) scaleX(1) scaleY(1)', opacity: 1 }
    ], { duration: 650, easing: 'cubic-bezier(.2,.8,.3,1.1)' });
    els.pages.forEach((p, k) => anim(p, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: k * 350 }));
    await wait(900);
    els.tapHint.classList.add('on');
    opened.add(i);
    giftEl.classList.add('opened');
    bibleState = 'open';
  }

  async function closeBible() {
    if (bibleState !== 'open') return;
    bibleState = 'closing';
    els.tapHint.classList.remove('on');
    await Promise.all([...els.pages].map((p) => anim(p, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 })));
    await anim(els.open, [
      { transform: 'translate(-50%, -50%) scaleX(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scaleX(.04) scaleY(.92)', opacity: 0.6 }
    ], { duration: 420, easing: 'ease-in' });
    els.open.style.opacity = 0;
    await anim(els.closed, [
      { transform: 'translate(-50%, -50%) perspective(1400px) rotateY(-88deg)', opacity: 0.6 },
      { transform: 'translate(-50%, -50%) perspective(1400px) rotateY(0deg)', opacity: 1 }
    ], { duration: 420, easing: 'ease-out' });
    Sound.whoosh(false);
    await Promise.all([
      anim(els.closed, [
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(-50%, -62%) scale(.95) rotate(-6deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%, calc(-50% - 120vh)) scale(.25) rotate(28deg)', opacity: 0 }
      ], { duration: 1100, easing: 'cubic-bezier(.6,0,.8,.5)' }),
      anim(els.light, [{ opacity: 1 }, { opacity: 0 }], { duration: 1100, delay: 250 }),
      anim(els.rays, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 800 })
    ]);
    els.layer.classList.add('hidden');
    els.closed.getAnimations().forEach((a) => a.cancel());
    els.open.getAnimations().forEach((a) => a.cancel());
    bibleState = 'none';
    busy = false;
    updateFinaleBtn();
  }

  function updateFinaleBtn() {
    if (!opened.size) return;
    els.toFinale.classList.remove('hidden');
    if (opened.size === VERSES.length) { els.toFinale.textContent = 'Далі ➜'; els.toFinale.classList.add('btn-big'); }
  }

  // ---------- події ----------
  buildGifts();
  els.enter.addEventListener('click', enter);
  els.toGifts.addEventListener('click', toGifts);
  els.toFinale.addEventListener('click', toFinale);
  els.layer.addEventListener('click', closeBible);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { if (bibleState === 'open') { e.preventDefault(); closeBible(); } } });
  els.replay.addEventListener('click', () => location.reload());
  els.mute.addEventListener('click', () => {
    Sound.setMuted(!Sound.muted);
    [els.vEntrance, els.vGreet, els.vFinale].forEach((v) => { v.muted = Sound.muted; });
    els.mute.textContent = Sound.muted ? '🔇' : '🔊';
    els.mute.setAttribute('aria-label', Sound.muted ? 'Увімкнути звук' : 'Вимкнути звук');
  });
  els.rotate.querySelector('button').addEventListener('click', () => els.rotate.classList.add('hidden'));
  addEventListener('orientationchange', () => setTimeout(() => { if (matchMedia('(orientation: landscape)').matches) els.rotate.classList.add('hidden'); }, 300));
})();
