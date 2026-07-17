(() => {
  "use strict";

  const STORAGE_KEY = "challenge-lab-score";
  const MATH_TIME = 60;
  const SEQ_ROUNDS = 8;
  const WORD_ROUNDS = 8;

  const WORD_BANK = [
    { type: "はんたいご", q: "大きい", a: "小さい", wrong: ["高い", "太い", "長い"] },
    { type: "はんたいご", q: "速い", a: "遅い", wrong: ["強い", "軽い", "若い"] },
    { type: "はんたいご", q: "暑い", a: "寒い", wrong: ["熱い", "暖かい", "涼しい"] },
    { type: "はんたいご", q: "始める", a: "終わる", wrong: ["続ける", "増える", "進む"] },
    { type: "はんたいご", q: "成功", a: "失敗", wrong: ["努力", "結果", "挑戦"] },
    { type: "はんたいご", q: "増える", a: "減る", wrong: ["変わる", "進む", "広がる"] },
    { type: "はんたいご", q: "明るい", a: "暗い", wrong: ["白い", "きれい", "楽しい"] },
    { type: "はんたいご", q: "安い", a: "高い", wrong: ["多い", "長い", "広い"] },
    { type: "なかま", q: "りんごとバナナの仲間", a: "みかん", wrong: ["いす", "くるま", "えんぴつ"] },
    { type: "なかま", q: "犬と猫の仲間", a: "うさぎ", wrong: ["机", "空", "道"] },
    { type: "なかま", q: "赤と青の仲間", a: "黄色", wrong: ["四角", "音", "重さ"] },
    { type: "なかま", q: "春と夏の仲間", a: "秋", wrong: ["朝", "月", "風"] },
    { type: "なかま", q: "鉛筆と消しゴムの仲間", a: "定規", wrong: ["りんご", "靴", "窓"] },
    { type: "なかま", q: "東京と大阪の仲間", a: "名古屋", wrong: ["富士山", "太平洋", "新幹線"] },
    { type: "いみ", q: "「ありがとう」に近い意味", a: "感謝", wrong: ["謝罪", "命令", "質問"] },
    { type: "いみ", q: "「がんばる」に近い意味", a: "努力する", wrong: ["あきらめる", "休む", "忘れる"] },
  ];

  const MEMORY_SYMBOLS = ["⚡", "🔥", "❄️", "🌊", "🌙", "☀️", "🎯", "💎"];

  const els = {
    home: document.getElementById("screen-home"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result"),
    stage: document.getElementById("game-stage"),
    title: document.getElementById("game-title"),
    prompt: document.getElementById("game-prompt"),
    totalScore: document.getElementById("total-score"),
    runScore: document.getElementById("run-score"),
    combo: document.getElementById("combo"),
    timer: document.getElementById("timer"),
    btnHome: document.getElementById("btn-home"),
    btnReplay: document.getElementById("btn-replay"),
    btnToHome: document.getElementById("btn-to-home"),
    resultTitle: document.getElementById("result-title"),
    resultScore: document.getElementById("result-score"),
    resultMeta: document.getElementById("result-meta"),
    fx: document.getElementById("fx-layer"),
  };

  let totalScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let currentGame = null;
  let runScore = 0;
  let combo = 0;
  let locked = false;
  let timerId = null;
  let timeLeft = 0;
  let audioCtx = null;
  let round = 0;
  let correctCount = 0;
  let memoryState = null;

  /* —— utils —— */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx?.state === "suspended") audioCtx.resume();
  }

  function tone(freq, duration = 0.1, type = "sine", gain = 0.09) {
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

  function sfxOk() {
    tone(660, 0.08);
    setTimeout(() => tone(880, 0.12), 70);
  }

  function sfxBad() {
    tone(180, 0.16, "square", 0.04);
  }

  function sfxClick() {
    tone(480, 0.05, "triangle", 0.05);
  }

  function sfxClear() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.15), i * 80));
  }

  function updateScores() {
    els.totalScore.textContent = String(totalScore);
    els.runScore.textContent = String(runScore);
    els.combo.textContent = String(combo);
  }

  function addRunPoints(base) {
    const bonus = Math.min(combo, 8) * 2;
    const gained = base + bonus;
    runScore += gained;
    totalScore += gained;
    localStorage.setItem(STORAGE_KEY, String(totalScore));
    updateScores();
    return gained;
  }

  function showScreen(name) {
    [els.home, els.game, els.result].forEach((s) => {
      s.classList.remove("active");
      s.hidden = true;
    });
    const map = { home: els.home, game: els.game, result: els.result };
    const screen = map[name];
    screen.hidden = false;
    screen.classList.add("active");
    els.btnHome.hidden = name === "home";
  }

  function floatText(text, bad = false) {
    const el = document.createElement("div");
    el.className = `feedback-float${bad ? " bad" : ""}`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  function sparks(ok = true) {
    const colors = ok
      ? ["#2de2c2", "#ffc14a", "#b6f25c", "#4db6ff"]
      : ["#ff6b5c", "#ff8a7a"];
    const cx = innerWidth / 2;
    const cy = innerHeight * 0.42;
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("span");
      p.className = "spark";
      const ang = (Math.PI * 2 * i) / 14;
      const dist = 50 + Math.random() * 90;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
      els.fx.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer(seconds, onEnd) {
    stopTimer();
    timeLeft = seconds;
    els.timer.textContent = String(timeLeft);
    timerId = setInterval(() => {
      timeLeft -= 1;
      els.timer.textContent = String(Math.max(0, timeLeft));
      if (timeLeft <= 0) {
        stopTimer();
        onEnd();
      }
    }, 1000);
  }

  /* —— navigation —— */
  function goHome() {
    stopTimer();
    currentGame = null;
    locked = false;
    els.stage.innerHTML = "";
    showScreen("home");
  }

  function startGame(id) {
    ensureAudio();
    sfxClick();
    currentGame = id;
    runScore = 0;
    combo = 0;
    round = 0;
    correctCount = 0;
    locked = false;
    memoryState = null;
    updateScores();
    showScreen("game");

    const titles = {
      math: "けいさんバトル",
      seq: "すうじパズル",
      word: "いみマッチ",
      memory: "メモリープラス",
    };
    els.title.textContent = titles[id];

    if (id === "math") startMath();
    else if (id === "seq") startSeq();
    else if (id === "word") startWord();
    else if (id === "memory") startMemory();
  }

  function finishGame(meta = "") {
    stopTimer();
    sfxClear();
    sparks(true);
    const titles = ["ナイスチャレンジ！", "よくできた！", "頭脳クリア！", "おつかれ！"];
    els.resultTitle.textContent = titles[Math.floor(Math.random() * titles.length)];
    els.resultScore.textContent = String(runScore);
    els.resultMeta.textContent = meta;
    showScreen("result");
  }

  function onCorrect(btn, points = 10) {
    if (locked) return;
    locked = true;
    combo += 1;
    correctCount += 1;
    const gained = addRunPoints(points);
    sfxOk();
    floatText(`+${gained}`);
    sparks(true);
    if (btn) btn.classList.add("correct");
    setTimeout(() => {
      locked = false;
      advance();
    }, 420);
  }

  function onWrong(btn) {
    combo = 0;
    updateScores();
    sfxBad();
    floatText("ミス", true);
    if (btn) {
      btn.classList.add("wrong");
      setTimeout(() => btn.classList.remove("wrong"), 350);
    }
  }

  function advance() {
    if (currentGame === "math") nextMath();
    else if (currentGame === "seq") {
      round += 1;
      if (round >= SEQ_ROUNDS) finishGame(`正解 ${correctCount} / ${SEQ_ROUNDS}`);
      else nextSeq();
    } else if (currentGame === "word") {
      round += 1;
      if (round >= WORD_ROUNDS) finishGame(`正解 ${correctCount} / ${WORD_ROUNDS}`);
      else nextWord();
    }
  }

  /* —— Math battle —— */
  function makeMathProblem() {
    const kinds = ["+", "-", "×", "÷"];
    const kind = kinds[randInt(0, 3)];
    let a;
    let b;
    let answer;

    if (kind === "+") {
      a = randInt(12, 99);
      b = randInt(8, 80);
      answer = a + b;
    } else if (kind === "-") {
      a = randInt(30, 120);
      b = randInt(5, Math.min(60, a - 1));
      answer = a - b;
    } else if (kind === "×") {
      a = randInt(3, 12);
      b = randInt(3, 12);
      answer = a * b;
    } else {
      b = randInt(2, 12);
      answer = randInt(2, 12);
      a = b * answer;
    }

    const wrongs = new Set();
    while (wrongs.size < 3) {
      const delta = randInt(1, 12) * (Math.random() < 0.5 ? -1 : 1);
      const w = answer + delta;
      if (w !== answer && w >= 0) wrongs.add(w);
    }

    return {
      text: `${a} ${kind} ${b} = ?`,
      answer,
      choices: shuffle([answer, ...wrongs]),
    };
  }

  function startMath() {
    els.prompt.textContent = "すばやく正解をえらべ！";
    startTimer(MATH_TIME, () => finishGame(`正解 ${correctCount} 問`));
    nextMath();
  }

  function nextMath() {
    locked = false;
    const p = makeMathProblem();
    renderChoices(p.text, p.choices, p.answer, 10, true);
  }

  function renderChoices(questionHtml, choices, answer, points, isMath) {
    els.stage.innerHTML = "";
    if (isMath) {
      const q = document.createElement("div");
      q.className = "math-question";
      q.textContent = questionHtml;
      els.stage.appendChild(q);
    }

    const grid = document.createElement("div");
    grid.className = "choice-grid";
    choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = String(c);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (c === answer) onCorrect(btn, points);
        else onWrong(btn);
      });
      grid.appendChild(btn);
    });
    els.stage.appendChild(grid);
  }

  /* —— Sequence puzzle —— */
  function makeSequence() {
    const type = randInt(0, 4);
    let seq;
    let answer;
    let hint;

    if (type === 0) {
      // arithmetic
      const start = randInt(2, 20);
      const step = randInt(2, 9);
      seq = [0, 1, 2, 3, 4].map((i) => start + i * step);
      hint = `差は ${step}`;
      answer = seq[4];
      seq[4] = null;
    } else if (type === 1) {
      // geometric *2 or *3
      const start = randInt(2, 6);
      const mul = Math.random() < 0.5 ? 2 : 3;
      seq = [0, 1, 2, 3].map((i) => start * mul ** i);
      hint = `×${mul} の列`;
      answer = seq[3];
      seq[3] = null;
    } else if (type === 2) {
      // squares
      const start = randInt(2, 6);
      seq = [0, 1, 2, 3].map((i) => (start + i) ** 2);
      hint = "平方数";
      answer = seq[3];
      seq[3] = null;
    } else if (type === 3) {
      // fib-like add previous
      const a = randInt(1, 5);
      const b = randInt(2, 7);
      seq = [a, b];
      for (let i = 0; i < 3; i++) seq.push(seq[i] + seq[i + 1]);
      hint = "前の2つを足す";
      answer = seq[4];
      seq[4] = null;
    } else {
      // odd / even growing
      const start = randInt(1, 9) * 2 + 1;
      seq = [0, 1, 2, 3, 4].map((i) => start + i * 2);
      hint = "奇数（または偶数）が続く";
      answer = seq[4];
      seq[4] = null;
    }

    const wrongs = new Set();
    while (wrongs.size < 3) {
      const w = answer + randInt(1, 10) * (Math.random() < 0.5 ? -1 : 1);
      if (w !== answer && w > 0) wrongs.add(w);
    }

    return { seq, answer, hint, choices: shuffle([answer, ...wrongs]) };
  }

  function startSeq() {
    round = 0;
    els.timer.textContent = "—";
    nextSeq();
  }

  function nextSeq() {
    locked = false;
    const p = makeSequence();
    els.prompt.textContent = `きそくを見つけて ? をうめよう（${round + 1}/${SEQ_ROUNDS}）`;

    els.stage.innerHTML = "";
    const board = document.createElement("div");
    board.className = "seq-board";
    p.seq.forEach((n) => {
      const cell = document.createElement("div");
      cell.className = `seq-cell${n === null ? " blank" : ""}`;
      cell.textContent = n === null ? "?" : String(n);
      board.appendChild(cell);
    });
    els.stage.appendChild(board);

    const hint = document.createElement("p");
    hint.className = "word-hint";
    hint.textContent = `ヒント: ${p.hint}`;
    els.stage.appendChild(hint);

    const grid = document.createElement("div");
    grid.className = "choice-grid";
    p.choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = String(c);
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (c === p.answer) onCorrect(btn, 15);
        else onWrong(btn);
      });
      grid.appendChild(btn);
    });
    els.stage.appendChild(grid);
  }

  /* —— Word match —— */
  let wordQueue = [];

  function startWord() {
    round = 0;
    wordQueue = shuffle(WORD_BANK);
    els.timer.textContent = "—";
    nextWord();
  }

  function nextWord() {
    locked = false;
    const item = wordQueue[round % wordQueue.length];
    els.prompt.textContent = `${item.type}（${round + 1}/${WORD_ROUNDS}）`;

    els.stage.innerHTML = "";
    const card = document.createElement("div");
    card.className = "word-prompt-card";
    card.textContent = item.q;
    els.stage.appendChild(card);

    const hint = document.createElement("p");
    hint.className = "word-hint";
    hint.textContent =
      item.type === "はんたいご"
        ? "反対の意味のことばはどれ？"
        : item.type === "なかま"
          ? "仲間に入るものはどれ？"
          : "いちばん近い意味はどれ？";
    els.stage.appendChild(hint);

    const choices = shuffle([item.a, ...item.wrong.slice(0, 3)]);
    const grid = document.createElement("div");
    grid.className = "choice-grid";
    choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.style.fontSize = c.length > 4 ? "1.1rem" : "1.35rem";
      btn.textContent = c;
      btn.addEventListener("click", () => {
        if (locked) return;
        ensureAudio();
        if (c === item.a) onCorrect(btn, 12);
        else onWrong(btn);
      });
      grid.appendChild(btn);
    });
    els.stage.appendChild(grid);
  }

  /* —— Memory plus —— */
  function startMemory() {
    els.prompt.textContent = "同じ記号のペアを見つけよう";
    els.timer.textContent = "—";
    startTimer(90, () => finishGame(`そろえたペア ${memoryState?.matched || 0} / 8`));

    const pairs = shuffle(MEMORY_SYMBOLS).slice(0, 8);
    const deck = shuffle([...pairs, ...pairs]).map((symbol, i) => ({
      id: i,
      symbol,
      matched: false,
    }));

    memoryState = {
      deck,
      flipped: [],
      matched: 0,
      busy: false,
    };

    const grid = document.createElement("div");
    grid.className = "memory-grid";
    deck.forEach((card, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mem-card";
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", "カード");
      btn.innerHTML = `
        <div class="mem-inner">
          <div class="mem-face mem-back">?</div>
          <div class="mem-face mem-front">${card.symbol}</div>
        </div>
      `;
      btn.addEventListener("click", () => onMemTap(index));
      grid.appendChild(btn);
    });
    els.stage.innerHTML = "";
    els.stage.appendChild(grid);
  }

  function onMemTap(index) {
    const m = memoryState;
    if (!m || m.busy || locked) return;
    const card = m.deck[index];
    if (card.matched || m.flipped.includes(index)) return;

    ensureAudio();
    tone(520, 0.06, "triangle", 0.05);
    const btn = els.stage.querySelector(`[data-index="${index}"]`);
    btn?.classList.add("is-flipped");
    m.flipped.push(index);

    if (m.flipped.length < 2) return;

    m.busy = true;
    const [a, b] = m.flipped;
    const ca = m.deck[a];
    const cb = m.deck[b];

    if (ca.symbol === cb.symbol) {
      ca.matched = true;
      cb.matched = true;
      m.matched += 1;
      combo += 1;
      const gained = addRunPoints(20);
      setTimeout(() => {
        sfxOk();
        floatText(`+${gained}`);
        sparks(true);
        const ba = els.stage.querySelector(`[data-index="${a}"]`);
        const bb = els.stage.querySelector(`[data-index="${b}"]`);
        ba?.classList.add("is-matched");
        bb?.classList.add("is-matched");
        if (ba) ba.disabled = true;
        if (bb) bb.disabled = true;
        m.flipped = [];
        m.busy = false;
        if (m.matched >= 8) {
          stopTimer();
          setTimeout(() => finishGame("全ペアクリア！"), 500);
        }
      }, 250);
    } else {
      combo = 0;
      updateScores();
      setTimeout(() => {
        sfxBad();
        els.stage.querySelector(`[data-index="${a}"]`)?.classList.remove("is-flipped");
        els.stage.querySelector(`[data-index="${b}"]`)?.classList.remove("is-flipped");
        m.flipped = [];
        m.busy = false;
      }, 650);
    }
  }

  /* —— events —— */
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

  document.addEventListener("pointerdown", () => ensureAudio(), { once: true });

  updateScores();
})();
