// Звук, синтезований прямо в браузері (без файлів): музична скринька, дзвіночки, «вжух».
window.Sound = (() => {
  let ctx, master, muted = false;
  const NOTE = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  // «Happy Birthday» (мелодія — суспільне надбання)
  const SONG = [
    ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
    ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3]
  ];

  function init() {
    if (ctx) { ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    // проста «кімнатна» луна
    const delay = ctx.createDelay(); delay.delayTime.value = 0.23;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    master.connect(ctx.destination);
    master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
  }

  function bell(freq, t, dur = 1.6, vol = 0.25) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o1.type = 'sine'; o2.type = 'sine';
    o1.frequency.value = freq; o2.frequency.value = freq * 2.01;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.start(t); o2.start(t); o1.stop(t + dur); o2.stop(t + dur);
  }

  function song(tempo = 0.42, vol = 0.22) {
    if (!ctx) return 0;
    let t = ctx.currentTime + 0.05;
    for (const [n, beats] of SONG) { bell(NOTE[n], t, Math.max(1.2, beats * tempo * 2), vol); t += beats * tempo; }
    return t - ctx.currentTime;
  }

  function chime() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [1046.5, 1318.5, 1568, 2093, 2637].forEach((f, i) => bell(f, t + i * 0.09, 2.2, 0.12));
  }

  function whoosh(up = true) {
    if (!ctx) return;
    const t = ctx.currentTime, len = 0.9;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(up ? 300 : 2500, t);
    f.frequency.exponentialRampToValueAtTime(up ? 2500 : 300, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }

  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.55; }
  return { init, song, chime, whoosh, setMuted, get muted() { return muted; } };
})();
