// Легке конфеті на canvas.
window.Confetti = (() => {
  const cv = document.getElementById('confetti');
  const cx = cv.getContext('2d');
  const COLORS = ['#f7d77c', '#e9c36b', '#fff3cf', '#ffffff', '#d9a441', '#f4b6c2'];
  let parts = [], raf = 0;

  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = r.width * dpr; cv.height = r.height * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', size);

  function burst(n = 160) {
    size();
    const w = cv.clientWidth;
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * w, y: -20 - Math.random() * cv.clientHeight * 0.6,
        vx: (Math.random() - .5) * 1.2, vy: 1.2 + Math.random() * 2.2,
        r: 4 + Math.random() * 6, a: Math.random() * 6.28, va: (Math.random() - .5) * .2,
        c: COLORS[(Math.random() * COLORS.length) | 0], sway: Math.random() * 6.28
      });
    }
    if (!raf) loop();
  }

  function loop() {
    const w = cv.clientWidth, h = cv.clientHeight;
    cx.clearRect(0, 0, w, h);
    parts = parts.filter(p => p.y < h + 30);
    for (const p of parts) {
      p.sway += 0.04; p.x += p.vx + Math.sin(p.sway) * 0.8; p.y += p.vy; p.a += p.va;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c;
      cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2 * (0.4 + Math.abs(Math.sin(p.sway)))); cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) cx.clearRect(0, 0, w, h);
  }
  return { burst };
})();
