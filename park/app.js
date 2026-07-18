(() => {
  "use strict";

  const ROUNDS = 8;
  const MEMORY_PAIRS = 6;
  const STORAGE_KEY = "wakuwaku-stars-v2";

  const COLORS = [
    { id: "aka", name: "あか", hex: "#ff5a4a" },
    { id: "ao", name: "あお", hex: "#3d7dff" },
    { id: "kiiro", name: "きいろ", hex: "#ffd12a" },
    { id: "midori", name: "みどり", hex: "#3db85a" },
    { id: "momo", name: "ももいろ", hex: "#ff7eb3" },
    { id: "orenji", name: "オレンジ", hex: "#ff9a3c" },
    { id: "murasaki", name: "むらさき", hex: "#9b6bff" },
    { id: "chairo", name: "ちゃいろ", hex: "#a66a3a" },
    { id: "mizu", name: "みずいろ", hex: "#5ecfff" },
    { id: "kimidori", name: "きみどり", hex: "#8fd93a" },
  ];

  const COUNT_ITEMS = ["🍎", "🍌", "🍓", "⭐", "🐟", "🐥", "🌸", "🐸", "🚗", "🎈", "🍇", "🍊"];

  const MEMORY_EMOJIS = ["🐱", "🐶", "🐰", "🐻", "🐼", "🦊", "🐯", "🦁", "🐸", "🐵"];

  const SHAPES = [
    { id: "circle", name: "まる", fig: "fig-circle", color: "#ff5a4a" },
    { id: "square", name: "しかく", fig: "fig-square", color: "#4a8fff" },
    { id: "triangle", name: "さんかく", fig: "fig-triangle", color: "#ffd12a" },
    { id: "star", name: "ほし", fig: "fig-star", color: "#ff9a3c", emoji: "⭐" },
    { id: "heart", name: "ハート", fig: "fig-heart", color: "#ff7eb3", emoji: "❤️" },
    { id: "diamond", name: "ひしがた", fig: "fig-diamond", color: "#9b6bff" },
    { id: "oval", name: "たまごがた", fig: "fig-oval", color: "#3db85a" },
    { id: "rect", name: "ながしかく", fig: "fig-rect", color: "#ff9a3c" },
  ];

  const PATTERN_TOKENS = [
    { id: "r", emoji: "🔴" },
    { id: "b", emoji: "🔵" },
    { id: "y", emoji: "🟡" },
    { id: "g", emoji: "🟢" },
    { id: "star", emoji: "⭐" },
    { id: "heart", emoji: "❤️" },
    { id: "apple", emoji: "🍎" },
    { id: "grape", emoji: "🍇" },
  ];

  const SIZE_ITEMS = ["⚽", "🎈", "🐻", "🍎", "⭐", "🐸", "🚗", "🍩"];

  const ODD_SETS = [
    { same: "🐶", odd: "🐱" },
    { same: "🍎", odd: "🍌" },
    { same: "🚗", odd: "✈️" },
    { same: "🌸", odd: "🌳" },
    { same: "⭐", odd: "🌙" },
    { same: "🐸", odd: "🐟" },
    { same: "📘", odd: "📗" },
    { same: "👟", odd: "🧤" },
    { same: "🍕", odd: "🍦" },
    { same: "☀️", odd: "❄️" },
  ];

  const SHADOW_ITEMS = [
    { id: "cat", emoji: "🐱" },
    { id: "dog", emoji: "🐶" },
    { id: "bird", emoji: "🐦" },
    { id: "fish", emoji: "🐟" },
    { id: "tree", emoji: "🌳" },
    { id: "car", emoji: "🚗" },
    { id: "apple", emoji: "🍎" },
    { id: "butterfly", emoji: "🦋" },
    { id: "house", emoji: "🏠" },
    { id: "rocket", emoji: "🚀" },
  ];

  const KANA_WORDS = [
    { kana: "いぬ", emoji: "🐶" },
    { kana: "ねこ", emoji: "🐱" },
    { kana: "うさぎ", emoji: "🐰" },
    { kana: "りんご", emoji: "🍎" },
    { kana: "バナナ", emoji: "🍌" },
    { kana: "いちご", emoji: "🍓" },
    { kana: "くるま", emoji: "🚗" },
    { kana: "はな", emoji: "🌸" },
    { kana: "ほし", emoji: "⭐" },
    { kana: "つき", emoji: "🌙" },
    { kana: "さかな", emoji: "🐟" },
    { kana: "とり", emoji: "🐦" },
  ];

  const PRAISE = ["すごい！", "やったね！", "せいかい！", "かんぺき！", "すてき！", "えらい！"];

  const GAME_TITLES = {
    color: "いろあわせ",
    count: "かぞえよう",
    memory: "めくりカード",
    shape: "かたちさがし",
    pattern: "つぎはなに？",
    size: "おおきさくらべ",
    odd: "なかまはずれ",
    shadow: "かげあて",
    add: "たしざん",
    kana: "ひらがな",
  };

  const els = {
    home: document.getElementById("screen-home"),
    game: document.getElementById("screen-game"),
    clear: document.getElementById("screen-clear"),
    stage: document.getElementById("game-stage"),
    title: document.getElementById("game-title"),
    prompt: document.getElementById("game-prompt"),
    dots: document.getElementById("progress-dots"),
    starCount: document.getElementById("star-count"),
    btnHome: document.getElementById("btn-home"),
    btnReplay: document.getElementById("btn-replay"),
    btnToHome: document.getElementById("btn-to-home"),
    clearStars: document.getElementById("clear-stars"),
    burst: document.getElementById("star-burst"),
  };

  let stars = Number(localStorage.getItem(STORAGE_KEY) || localStorage.getItem("wakuwaku-stars") || 0);
  let currentGame = null;
  let round = 0;
  let roundStars = 0;
  let locked = false;
  let audioCtx = null;
  let memoryState = null;

  /* —— Audio —— */
  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx?.state === "suspended") audioCtx.resume();
  }

  function tone(freq, duration = 0.12, type = "sine", gain = 0.12) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  function sfxClick() {
    tone(520, 0.06, "triangle", 0.08);
  }

  function sfxCorrect() {
    tone(523, 0.1, "sine", 0.1);
    setTimeout(() => tone(659, 0.1, "sine", 0.1), 90);
    setTimeout(() => tone(784, 0.18, "sine", 0.12), 180);
  }

  function sfxWrong() {
    tone(220, 0.15, "square", 0.05);
  }

  function sfxClear() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => tone(f, 0.2, "sine", 0.1), i * 100);
    });
  }

  function sfxFlip() {
    tone(440, 0.08, "triangle", 0.07);
  }

  /* —— UI helpers —— */
  function updateStarDisplay() {
    els.starCount.textContent = String(stars);
  }

  function addStars(n) {
    stars += n;
    localStorage.setItem(STORAGE_KEY, String(stars));
    updateStarDisplay();
  }

  function showScreen(name) {
    [els.home, els.game, els.clear].forEach((s) => {
      s.classList.remove("active");
      s.hidden = true;
    });
    const map = { home: els.home, game: els.game, clear: els.clear };
    const screen = map[name];
    screen.hidden = false;
    screen.classList.add("active");
    els.btnHome.hidden = name === "home";
  }

  function setProgress(current, total) {
    els.dots.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const d = document.createElement("span");
      if (i < current) d.classList.add("done");
      if (i === current) d.classList.add("current");
      els.dots.appendChild(d);
    }
  }

  function showPraise() {
    const el = document.createElement("div");
    el.className = "feedback-ok";
    el.textContent = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  function burstStars(cx = innerWidth / 2, cy = innerHeight * 0.4) {
    const pieces = ["★", "✦", "☆", "●", "◆"];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("span");
      p.className = "burst-piece";
      p.textContent = pieces[i % pieces.length];
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
      const dist = 80 + Math.random() * 140;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.color = ["#f5b800", "#ff6b5b", "#2eb8a6", "#4a8fff", "#ff9a3c"][i % 5];
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
      p.style.setProperty("--rot", `${(Math.random() - 0.5) * 360}deg`);
      els.burst.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /* —— Navigation —— */
  function goHome() {
    currentGame = null;
    locked = false;
    memoryState = null;
    els.stage.innerHTML = "";
    showScreen("home");
  }

  function startGame(id) {
    ensureAudio();
    sfxClick();
    currentGame = id;
    round = 0;
    roundStars = 0;
    locked = false;
    memoryState = null;
    showScreen("game");
    els.title.textContent = GAME_TITLES[id] || id;

    if (id === "memory") {
      setProgress(0, 1);
      startMemory();
    } else {
      setProgress(0, ROUNDS);
      nextRound();
    }
  }

  function nextRound() {
    locked = false;
    if (round >= ROUNDS) {
      finishGame();
      return;
    }
    setProgress(round, ROUNDS);
    const starters = {
      color: startColorRound,
      count: startCountRound,
      shape: startShapeRound,
      pattern: startPatternRound,
      size: startSizeRound,
      odd: startOddRound,
      shadow: startShadowRound,
      add: startAddRound,
      kana: startKanaRound,
    };
    starters[currentGame]?.();
  }

  function roundSuccess(btn) {
    if (locked) return;
    locked = true;
    sfxCorrect();
    showPraise();
    if (btn) btn.classList.add("correct-flash");
    roundStars += 1;
    round += 1;
    setProgress(round, ROUNDS);
    burstStars();
    setTimeout(() => nextRound(), 750);
  }

  function roundFail(btn) {
    sfxWrong();
    if (btn) {
      btn.classList.add("wrong-shake");
      setTimeout(() => btn.classList.remove("wrong-shake"), 400);
    }
  }

  function finishGame() {
    let earned;
    if (currentGame === "memory") {
      earned = 3;
    } else {
      earned = Math.max(1, Math.min(3, Math.ceil(roundStars / 3)));
    }
    addStars(earned);
    showClear(earned);
  }

  function showClear(earned) {
    sfxClear();
    burstStars(innerWidth / 2, innerHeight * 0.35);
    els.clearStars.innerHTML = "";
    for (let i = 0; i < earned; i++) {
      const s = document.createElement("span");
      s.textContent = "★";
      els.clearStars.appendChild(s);
    }
    showScreen("clear");
  }

  /* —— いろあわせ（色名・類似色・6択） —— */
  function startColorRound() {
    const target = COLORS[Math.floor(Math.random() * COLORS.length)];
    const choiceCount = round < 3 ? 4 : 6;
    const others = pick(
      COLORS.filter((c) => c.id !== target.id),
      choiceCount - 1
    );
    const choices = shuffle([target, ...others]);
    const byName = round >= 4;

    if (byName) {
      els.prompt.innerHTML = `「<strong>${target.name}</strong>」をタッチ！`;
    } else {
      els.prompt.innerHTML = `このいろをタッチ！ <span class="prompt-swatch" style="background:${target.hex}"></span>`;
    }

    const wrap = document.createElement("div");
    wrap.className = choiceCount === 6 ? "color-choices color-choices-6" : "color-choices";
    choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-btn";
      btn.style.background = c.hex;
      btn.setAttribute("aria-label", c.name);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (c.id === target.id) roundSuccess(btn);
        else roundFail(btn);
      });
      wrap.appendChild(btn);
    });
    els.stage.innerHTML = "";
    els.stage.appendChild(wrap);
  }

  /* —— かぞえよう（1〜10・混在カウント） —— */
  function startCountRound() {
    const n = randInt(4, 10);
    const targetEmoji = COUNT_ITEMS[Math.floor(Math.random() * COUNT_ITEMS.length)];
    const mixed = round >= 3;
    let distractor = null;
    let distractorCount = 0;

    if (mixed) {
      distractor = pick(
        COUNT_ITEMS.filter((e) => e !== targetEmoji),
        1
      )[0];
      distractorCount = randInt(2, 5);
    }

    els.prompt.textContent = mixed ? `${targetEmoji} は いくつ？` : "いくつある？";

    const display = document.createElement("div");
    display.className = "count-display";
    const items = [];
    for (let i = 0; i < n; i++) items.push(targetEmoji);
    for (let i = 0; i < distractorCount; i++) items.push(distractor);
    shuffle(items).forEach((emoji, i) => {
      const item = document.createElement("span");
      item.className = "count-item";
      item.textContent = emoji;
      item.style.animationDelay = `${i * 0.05}s`;
      display.appendChild(item);
    });

    const opts = new Set([n]);
    while (opts.size < 4) {
      const guess = randInt(Math.max(1, n - 3), Math.min(10, n + 3));
      if (guess !== n) opts.add(guess);
    }
    const choices = shuffle([...opts]);

    const nums = document.createElement("div");
    nums.className = "number-choices";
    choices.forEach((num) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "num-btn";
      btn.textContent = String(num);
      btn.setAttribute("aria-label", `${num}`);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (num === n) roundSuccess(btn);
        else roundFail(btn);
      });
      nums.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(display);
    els.stage.appendChild(nums);
  }

  /* —— めくりカード（6ペア） —— */
  function startMemory() {
    els.prompt.textContent = "おなじ えを みつけよう（6ペア）";
    const pairs = pick(MEMORY_EMOJIS, MEMORY_PAIRS);
    const deck = shuffle([...pairs, ...pairs]).map((emoji, i) => ({
      id: i,
      emoji,
      matched: false,
    }));

    memoryState = {
      deck,
      flipped: [],
      matchedCount: 0,
      busy: false,
      total: MEMORY_PAIRS,
    };

    const grid = document.createElement("div");
    grid.className = "memory-grid memory-grid-6";

    deck.forEach((card, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mem-card";
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", "カード");
      btn.innerHTML = `
        <div class="mem-card-inner">
          <div class="mem-face mem-back">?</div>
          <div class="mem-face mem-front">${card.emoji}</div>
        </div>
      `;
      btn.addEventListener("click", () => onMemoryTap(index, btn));
      grid.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(grid);
  }

  function onMemoryTap(index) {
    const m = memoryState;
    if (!m || m.busy) return;
    const card = m.deck[index];
    if (card.matched || m.flipped.includes(index)) return;

    ensureAudio();
    sfxFlip();
    const btn = els.stage.querySelector(`[data-index="${index}"]`);
    btn?.classList.add("is-flipped");
    m.flipped.push(index);

    if (m.flipped.length < 2) return;

    m.busy = true;
    const [a, b] = m.flipped;
    const cardA = m.deck[a];
    const cardB = m.deck[b];

    if (cardA.emoji === cardB.emoji) {
      cardA.matched = true;
      cardB.matched = true;
      m.matchedCount += 1;
      const btnA = els.stage.querySelector(`[data-index="${a}"]`);
      const btnB = els.stage.querySelector(`[data-index="${b}"]`);
      setTimeout(() => {
        sfxCorrect();
        showPraise();
        btnA?.classList.add("is-matched");
        btnB?.classList.add("is-matched");
        if (btnA) btnA.disabled = true;
        if (btnB) btnB.disabled = true;
        burstStars();
        m.flipped = [];
        m.busy = false;
        if (m.matchedCount >= m.total) {
          setTimeout(() => finishGame(), 600);
        }
      }, 280);
    } else {
      setTimeout(() => {
        sfxWrong();
        const btnA = els.stage.querySelector(`[data-index="${a}"]`);
        const btnB = els.stage.querySelector(`[data-index="${b}"]`);
        btnA?.classList.remove("is-flipped");
        btnB?.classList.remove("is-flipped");
        m.flipped = [];
        m.busy = false;
      }, 700);
    }
  }

  /* —— かたちさがし（8種・同色ちがいかたち） —— */
  function shapeHtml(s, size) {
    if (s.emoji) {
      return `<div class="shape-fig ${s.fig}" style="width:${size}px;height:${size}px;font-size:${size * 0.85}px">${s.emoji}</div>`;
    }
    return `<div class="shape-fig ${s.fig}" style="color:${s.color};width:${size}px;height:${size}px"></div>`;
  }

  function startShapeRound() {
    const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const hard = round >= 3;
    let choices;

    if (hard) {
      const sameColorShapes = SHAPES.filter((s) => s.id !== target.id).map((s) => ({
        ...s,
        color: target.color,
        emoji: s.emoji ? s.emoji : undefined,
      }));
      const others = pick(sameColorShapes, 3);
      choices = shuffle([target, ...others]);
      els.prompt.textContent = `おなじいろのなかから「${target.name}」！`;
    } else {
      const others = pick(
        SHAPES.filter((s) => s.id !== target.id),
        3
      );
      choices = shuffle([target, ...others]);
      els.prompt.textContent = `「${target.name}」をタッチ！`;
    }

    const targetWrap = document.createElement("div");
    targetWrap.className = "shape-target-wrap";
    const targetEl = document.createElement("div");
    targetEl.className = "shape-target";
    targetEl.innerHTML = shapeHtml(target, 80);
    targetWrap.appendChild(targetEl);

    const wrap = document.createElement("div");
    wrap.className = "shape-choices";
    choices.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shape-btn";
      btn.setAttribute("aria-label", s.name);
      btn.innerHTML = shapeHtml(s, 52);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (s.id === target.id) roundSuccess(btn);
        else roundFail(btn);
      });
      wrap.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(targetWrap);
    els.stage.appendChild(wrap);
  }

  /* —— つぎはなに？（パターン） —— */
  function startPatternRound() {
    const tokens = pick(PATTERN_TOKENS, 3);
    const modeRoll = round % 3;
    let unit;
    if (modeRoll === 0) {
      unit = [tokens[0], tokens[1]];
    } else if (modeRoll === 1) {
      unit = [tokens[0], tokens[0], tokens[1], tokens[1]];
    } else {
      unit = [tokens[0], tokens[1], tokens[2]];
    }

    // Show one full cycle, ask for the first of the next cycle
    const displaySeq = [...unit];
    const correct = unit[0];

    const pool = shuffle([
      correct,
      ...pick(
        PATTERN_TOKENS.filter((t) => t.id !== correct.id),
        3
      ),
    ]);

    els.prompt.textContent = "つぎに くる のは？";

    const row = document.createElement("div");
    row.className = "pattern-row";
    displaySeq.forEach((t) => {
      const cell = document.createElement("span");
      cell.className = "pattern-cell";
      cell.textContent = t.emoji;
      row.appendChild(cell);
    });
    const q = document.createElement("span");
    q.className = "pattern-cell pattern-q";
    q.textContent = "❓";
    row.appendChild(q);

    const wrap = document.createElement("div");
    wrap.className = "pattern-choices";
    pool.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pattern-btn";
      btn.textContent = t.emoji;
      btn.setAttribute("aria-label", t.id);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (t.id === correct.id) roundSuccess(btn);
        else roundFail(btn);
      });
      wrap.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(row);
    els.stage.appendChild(wrap);
  }

  /* —— おおきさくらべ —— */
  function startSizeRound() {
    const emoji = SIZE_ITEMS[Math.floor(Math.random() * SIZE_ITEMS.length)];
    const findBiggest = Math.random() < 0.5;
    const sizes = shuffle([
      { id: "s", scale: 0.55, rank: 1 },
      { id: "m", scale: 0.8, rank: 2 },
      { id: "l", scale: 1.1, rank: 3 },
      { id: "xl", scale: 1.45, rank: 4 },
    ]);
    const targetRank = findBiggest ? 4 : 1;

    els.prompt.textContent = findBiggest ? "いちばん おおきい のは？" : "いちばん ちいさい のは？";

    const wrap = document.createElement("div");
    wrap.className = "size-choices";
    sizes.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-btn";
      btn.innerHTML = `<span style="font-size:${2.2 * s.scale}rem">${emoji}</span>`;
      btn.setAttribute("aria-label", s.id);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (s.rank === targetRank) roundSuccess(btn);
        else roundFail(btn);
      });
      wrap.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(wrap);
  }

  /* —— なかまはずれ —— */
  function startOddRound() {
    const set = ODD_SETS[Math.floor(Math.random() * ODD_SETS.length)];
    const sameCount = round >= 4 ? 5 : 3;
    const items = [];
    for (let i = 0; i < sameCount; i++) items.push({ emoji: set.same, odd: false });
    items.push({ emoji: set.odd, odd: true });
    const shuffled = shuffle(items);

    els.prompt.textContent = "なかまはずれ を タッチ！";

    const wrap = document.createElement("div");
    wrap.className = "odd-choices";
    shuffled.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "odd-btn";
      btn.textContent = item.emoji;
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (item.odd) roundSuccess(btn);
        else roundFail(btn);
      });
      wrap.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(wrap);
  }

  /* —— かげあて —— */
  function startShadowRound() {
    const target = SHADOW_ITEMS[Math.floor(Math.random() * SHADOW_ITEMS.length)];
    const others = pick(
      SHADOW_ITEMS.filter((s) => s.id !== target.id),
      3
    );
    const choices = shuffle([target, ...others]);

    els.prompt.textContent = "この かげ は なに？";

    const shadowEl = document.createElement("div");
    shadowEl.className = "shadow-target";
    shadowEl.innerHTML = `<span class="shadow-silhouette">${target.emoji}</span>`;

    const wrap = document.createElement("div");
    wrap.className = "shadow-choices";
    choices.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shadow-btn";
      btn.textContent = s.emoji;
      btn.setAttribute("aria-label", s.id);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (s.id === target.id) roundSuccess(btn);
        else roundFail(btn);
      });
      wrap.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(shadowEl);
    els.stage.appendChild(wrap);
  }

  /* —— たしざん（絵で足し算） —— */
  function startAddRound() {
    const a = randInt(1, round >= 4 ? 6 : 4);
    const b = randInt(1, Math.min(6, 10 - a));
    const sum = a + b;
    const emoji = COUNT_ITEMS[Math.floor(Math.random() * COUNT_ITEMS.length)];

    els.prompt.textContent = "あわせて いくつ？";

    const eq = document.createElement("div");
    eq.className = "add-equation";

    const left = document.createElement("div");
    left.className = "add-group";
    for (let i = 0; i < a; i++) {
      const s = document.createElement("span");
      s.textContent = emoji;
      left.appendChild(s);
    }

    const plus = document.createElement("span");
    plus.className = "add-op";
    plus.textContent = "+";

    const right = document.createElement("div");
    right.className = "add-group";
    for (let i = 0; i < b; i++) {
      const s = document.createElement("span");
      s.textContent = emoji;
      right.appendChild(s);
    }

    const eqSign = document.createElement("span");
    eqSign.className = "add-op";
    eqSign.textContent = "=";

    const q = document.createElement("span");
    q.className = "add-op add-q";
    q.textContent = "?";

    eq.append(left, plus, right, eqSign, q);

    const opts = new Set([sum]);
    while (opts.size < 4) {
      opts.add(randInt(Math.max(1, sum - 3), Math.min(12, sum + 3)));
    }

    const nums = document.createElement("div");
    nums.className = "number-choices";
    shuffle([...opts]).forEach((num) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "num-btn";
      btn.textContent = String(num);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (num === sum) roundSuccess(btn);
        else roundFail(btn);
      });
      nums.appendChild(btn);
    });

    els.stage.innerHTML = "";
    els.stage.appendChild(eq);
    els.stage.appendChild(nums);
  }

  /* —— ひらがな —— */
  function startKanaRound() {
    const target = KANA_WORDS[Math.floor(Math.random() * KANA_WORDS.length)];
    const others = pick(
      KANA_WORDS.filter((w) => w.kana !== target.kana),
      3
    );
    const mode = round % 2 === 0 ? "kanaToPic" : "picToKana";

    if (mode === "kanaToPic") {
      els.prompt.innerHTML = `「<strong>${target.kana}</strong>」は どれ？`;
      const wrap = document.createElement("div");
      wrap.className = "kana-choices";
      shuffle([target, ...others]).forEach((w) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kana-pic-btn";
        btn.textContent = w.emoji;
        btn.setAttribute("aria-label", w.kana);
        btn.addEventListener("click", () => {
          if (locked) return;
          ensureAudio();
          if (w.kana === target.kana) roundSuccess(btn);
          else roundFail(btn);
        });
        wrap.appendChild(btn);
      });
      els.stage.innerHTML = "";
      els.stage.appendChild(wrap);
    } else {
      els.prompt.innerHTML = `${target.emoji} の よみかたは？`;
      const wrap = document.createElement("div");
      wrap.className = "kana-choices kana-text-choices";
      shuffle([target, ...others]).forEach((w) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kana-text-btn";
        btn.textContent = w.kana;
        btn.addEventListener("click", () => {
          if (locked) return;
          ensureAudio();
          if (w.kana === target.kana) roundSuccess(btn);
          else roundFail(btn);
        });
        wrap.appendChild(btn);
      });
      els.stage.innerHTML = "";
      els.stage.appendChild(wrap);
    }
  }

  /* —— Events —— */
  document.querySelectorAll("[data-game]").forEach((btn) => {
    btn.addEventListener("click", () => startGame(btn.dataset.game));
  });

  els.btnHome.addEventListener("click", () => {
    ensureAudio();
    sfxClick();
    goHome();
  });

  els.btnToHome.addEventListener("click", () => {
    ensureAudio();
    sfxClick();
    goHome();
  });

  els.btnReplay.addEventListener("click", () => {
    if (currentGame) startGame(currentGame);
  });

  document.addEventListener(
    "pointerdown",
    () => {
      ensureAudio();
    },
    { once: true }
  );

  updateStarDisplay();
})();
