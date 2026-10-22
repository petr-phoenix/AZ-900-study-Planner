/* ==========================================================
   AZ-900 Study Planner — application logic (vanilla JS)
   Sections: state · helpers · gamification · planner · views · quiz · events
   ========================================================== */
(() => {
  "use strict";

  /* ---------------------------------------------------------
     State (persisted in localStorage)
     --------------------------------------------------------- */
  const KEY = "az900.planner.v1";
  const base = () => ({
    xp: 0,
    streak: { count: 0, last: null },
    modules: {},                                   // moduleId -> true
    stats: { cloud: { c: 0, t: 0 }, arch: { c: 0, t: 0 }, mgmt: { c: 0, t: 0 } },
    missed: {},                                    // questionId -> true
    badges: {},
    plan: { target: null, done: {}, snap: {} },    // snap: target -> ordered module ids
    theme: "light",
    bestCombo: 0, perfect: 0, mockBest: 0, quizzes: 0,
  });
  let S = (() => {
    try { const x = JSON.parse(localStorage.getItem(KEY) || "null"); return x ? Object.assign(base(), x) : base(); }
    catch (e) { return base(); }
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  const $ = (s) => document.querySelector(s);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const todayD = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const diffDays = (a, b) => Math.round((b - a) / 864e5);
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const D = DOMAINS;
  const domList = Object.values(D);
  const fmtDate = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const totalAnswered = () => domList.reduce((n, d) => n + S.stats[d.id].t, 0);
  const totalCorrect = () => domList.reduce((n, d) => n + S.stats[d.id].c, 0);

  /* ---------------------------------------------------------
     Mastery, weak areas & readiness
     --------------------------------------------------------- */
  function moduleFrac(id) {
    const m = MODULES.filter((x) => x.d === id);
    return m.length ? m.filter((x) => S.modules[x.id]).length / m.length : 0;
  }
  function accuracy(id) { const s = S.stats[id]; return s.t ? s.c / s.t : null; }
  function mastery(id) {
    const a = accuracy(id), mf = moduleFrac(id);
    return a == null ? mf * 0.4 : 0.6 * a + 0.4 * mf;
  }
  const need = (id) => D[id].weight * (1 - mastery(id));        // bigger = study this first
  function readiness() {
    const w = domList.reduce((n, d) => n + d.weight, 0);
    return Math.round((domList.reduce((n, d) => n + d.weight * mastery(d.id), 0) / w) * 100);
  }
  function status(id) {
    const s = S.stats[id];
    if (s.t < 3) return ["new", "Not assessed"];
    const a = accuracy(id);
    return a < 0.6 ? ["weak", "Weak area"] : a < 0.8 ? ["mid", "Improving"] : ["strong", "Strong"];
  }
  const weakestDomain = () => domList.slice().sort((a, b) => need(b.id) - need(a.id))[0];

  /* ---------------------------------------------------------
     Gamification: XP, levels, streaks, badges, confetti, toasts
     --------------------------------------------------------- */
  function levelInfo(xp) {
    let i = 0; LEVELS.forEach((l, k) => { if (xp >= l[0]) i = k; });
    const cur = LEVELS[i], nxt = LEVELS[i + 1];
    return { n: i + 1, title: cur[1], pct: nxt ? Math.round(((xp - cur[0]) / (nxt[0] - cur[0])) * 100) : 100, toNext: nxt ? nxt[0] - xp : 0 };
  }
  function addXP(n) {
    const before = levelInfo(S.xp).n;
    S.xp += n;
    const after = levelInfo(S.xp);
    if (after.n > before) { toast(`🎉 Level up! You are now <b>${after.title}</b>`); confetti(160); }
  }
  function touchStreak() {
    const t = iso(todayD());
    if (S.streak.last === t) return;
    S.streak.count = S.streak.last === iso(addDays(todayD(), -1)) ? S.streak.count + 1 : 1;
    S.streak.last = t;
  }
  const BADGES = [
    { id: "first", icon: "🚀", name: "First steps", desc: "Answer your first question", test: () => totalAnswered() >= 1 },
    { id: "combo5", icon: "🔥", name: "On fire", desc: "5 correct answers in a row", test: () => S.bestCombo >= 5 },
    { id: "perfect", icon: "💯", name: "Flawless", desc: "Perfect score in a 5+ question quiz", test: () => S.perfect >= 1 },
    { id: "book", icon: "📘", name: "Bookworm", desc: "Complete a learning module", test: () => Object.keys(S.modules).length >= 1 },
    { id: "grad", icon: "🎓", name: "Graduate", desc: "Complete every module", test: () => MODULES.every((m) => S.modules[m.id]) },
    { id: "triple", icon: "🛡️", name: "Triple threat", desc: "80%+ accuracy in all 3 domains", test: () => domList.every((d) => S.stats[d.id].t >= 8 && accuracy(d.id) >= 0.8) },
    { id: "streak3", icon: "📅", name: "Habit builder", desc: "3-day study streak", test: () => S.streak.count >= 3 },
    { id: "mock", icon: "🏆", name: "Exam ready", desc: `Score ${MOCK_PASS_PCT}%+ on a mock exam`, test: () => S.mockBest >= MOCK_PASS_PCT },
  ];
  function checkBadges() {
    BADGES.forEach((b) => {
      if (!S.badges[b.id] && b.test()) { S.badges[b.id] = true; toast(`${b.icon} Badge unlocked: <b>${b.name}</b>`); confetti(90); }
    });
  }
  function toast(html) {
    const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html;
    $("#toasts").appendChild(t);
    setTimeout(() => t.classList.add("out"), 3400); setTimeout(() => t.remove(), 3900);
  }

  const cv = $("#confetti"), cx = cv.getContext("2d");
  let parts = [], raf = null;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sizeCv = () => { cv.width = innerWidth; cv.height = innerHeight; };
  addEventListener("resize", sizeCv); sizeCv();
  function confetti(n = 120, ox = innerWidth / 2, oy = innerHeight / 3) {
    if (reduce) return;
    const cols = ["#2563eb", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
    for (let i = 0; i < n; i++) parts.push({ x: ox, y: oy, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -12 - 2, g: 0.28, s: 5 + Math.random() * 6, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 140 + Math.random() * 60 });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life > 0 && p.y < cv.height + 20);
    parts.forEach((p) => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); cx.restore();
    });
    raf = parts.length ? requestAnimationFrame(tick) : null;
    if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
  }

  /* ---------------------------------------------------------
     Revision planner
     Builds a day-by-day plan from today to the chosen exam date,
     prioritising weak areas (domain weight × how un-mastered it is).
     --------------------------------------------------------- */
  const upcomingExams = () => EXAMS.filter((e) => parse(e.date) >= todayD());
  const nextExam = () => upcomingExams()[0] || null;

  function ensureTarget() {
    const up = upcomingExams();
    if (!up.length) { S.plan.target = null; return null; }
    if (!S.plan.target || !up.find((e) => e.date === S.plan.target)) S.plan.target = up[0].date;
    return S.plan.target;
  }
  function ensureSnapshot(target) {
    if (S.plan.snap[target]) return S.plan.snap[target];
    const order = domList.slice().sort((a, b) => need(b.id) - need(a.id)).map((d) => d.id);
    S.plan.snap[target] = MODULES.filter((m) => !S.modules[m.id])
      .sort((a, b) => order.indexOf(a.d) - order.indexOf(b.d)).map((m) => m.id);
    save();
    return S.plan.snap[target];
  }
  function domainSequence() {
    const sorted = domList.slice().sort((a, b) => need(b.id) - need(a.id));
    const total = sorted.reduce((n, d) => n + need(d.id), 0) || 1;
    const left = {}; sorted.forEach((d) => (left[d.id] = Math.max(1, Math.round((need(d.id) / total) * 6))));
    const seq = [];
    while (Object.values(left).some((v) => v > 0)) sorted.forEach((d) => { if (left[d.id] > 0) { seq.push(d.id); left[d.id]--; } });
    return seq;
  }
  function buildPlan(target) {
    const start = todayD(), n = diffDays(start, parse(target));
    if (n < 0) return { days: [], unscheduled: 0 };
    const seq = domainSequence(), snap = ensureSnapshot(target);
    const studyDays = Math.max(0, n - 1);
    const per = studyDays ? Math.ceil(snap.length / studyDays) : Math.min(2, snap.length);
    let scheduled = 0;
    const days = [];
    for (let i = 0; i <= n; i++) {
      const date = addDays(start, i), tasks = [];
      const add = (t) => tasks.push({ ...t, key: `${target}|${iso(date)}|${t.type}|${t.mid || t.n || ""}` });
      let kind = "study";
      if (i === n) {
        kind = "exam";
        add({ type: "recap", n: 1, title: "15-minute skim of your weak-area notes", mins: 15 });
        add({ type: "check", n: 2, title: "Check ID, exam time and test environment", mins: 10 });
        add({ type: "check", n: 3, title: `Breathe — the pass mark is 700/1000. You've got this!`, mins: 0 });
      } else if (i === n - 1) {
        kind = "mock";
        if (!studyDays) snap.slice(0, per).forEach((id) => { const m = MODULES.find((x) => x.id === id); scheduled++; add({ type: "learn", mid: id, d: m.d, title: `Cram: ${m.title}`, mins: m.mins }); });
        add({ type: "mock", title: "Full mock exam (30 questions, 30 min)", mins: 30 });
        add({ type: "review", n: 1, title: "Review every question you missed", mins: 25 });
        add({ type: "check", n: 2, title: "Light revision, then an early night 😴", mins: 0 });
      } else {
        snap.slice(i * per, (i + 1) * per).forEach((id) => { const m = MODULES.find((x) => x.id === id); scheduled++; add({ type: "learn", mid: id, d: m.d, title: `Study: ${m.title}`, mins: m.mins }); });
        const pd = seq[(i + 1) % seq.length];
        add({ type: "practice", d: pd, title: `10 practice questions — ${D[pd].name}`, mins: 15 });
        if (Object.keys(S.missed).length) add({ type: "review", n: 1, title: "Retry your missed questions", mins: 10 });
      }
      days.push({ date, i, kind, tasks });
    }
    return { days, unscheduled: Math.max(0, snap.length - scheduled) };
  }
  const taskDone = (t) => (t.type === "learn" ? !!S.modules[t.mid] : !!S.plan.done[t.key]);
  const dayMins = (day) => day.tasks.reduce((n, t) => n + t.mins, 0);

  /* ---------------------------------------------------------
     View helpers
     --------------------------------------------------------- */
  function ring(p, size, sw, color, inner) {
    const r = (size - sw) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.min(100, p) / 100);
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg" stroke-width="${sw}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-width="${sw}" stroke="${color}" style="--c:${c};--off:${off};stroke-dasharray:${c}"/>
      </svg><div class="ring-in">${inner}</div></div>`;
  }
  const bar = (p, color) => `<div class="bar"><i style="width:${p}%;${color ? `background:${color}` : ""}"></i></div>`;
  const checkBtn = (on, act, extra) => `<button class="check ${on ? "on" : ""}" data-act="${act}" ${extra} aria-label="Toggle done">✓</button>`;
  function countUp() {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const end = +el.dataset.count, t0 = performance.now(), dur = 900;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      if (reduce) el.textContent = end; else requestAnimationFrame(step);
    });
  }
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

  /* ---------------------------------------------------------
     Views
     --------------------------------------------------------- */
  let route = "dashboard", Q = null;

  function dashboardView() {
    const next = nextExam(), r = readiness(), lv = levelInfo(S.xp);
    const days = next ? diffDays(todayD(), parse(next.date)) : null;
    const ans = totalAnswered(), acc = pct(totalCorrect(), ans);
    const target = ensureTarget();
    const today = target ? buildPlan(target).days[0] : null;
    const w = weakestDomain();

    const hero = `
    <section class="card hero">
      <div>
        <h1>${greeting()} 👋</h1>
        ${next ? `<p>${days === 0 ? "Your exam is <b>today</b> — stay calm and trust your prep." : `You have <b>${days} day${days === 1 ? "" : "s"}</b> until your AZ-900 exam on <b>${next.label}</b>.`}</p>`
               : `<p>All of your listed exam dates have passed. Edit <code>EXAMS</code> in <code>data.js</code> to add a new one, and keep practising!</p>`}
        ${next ? `<div class="count-big"><span data-count="${days}">${days}</span><span style="font-size:1.1rem;font-weight:600;opacity:.85"> days to go</span></div><p></p>` : ""}
        <div class="actions" style="margin-top:0">
          <button class="btn btn-primary" data-act="start" data-mode="smart">⚡ Smart practice on weak areas</button>
          <button class="btn btn-ghost" data-act="nav" data-to="plan">View my plan</button>
        </div>
      </div>
      ${ring(r, 170, 14, "#fff", `<span><span data-count="${r}">${r}</span>%<small>exam readiness</small></span>`)}
    </section>`;

    const tiles = `
    <div class="grid g4" style="margin-top:18px">
      <div class="card tile"><div class="ico">🏅</div><div><b>Lv ${lv.n}</b><span>${lv.title}</span></div></div>
      <div class="card tile"><div class="ico">⚡</div><div><b>${S.xp} XP</b><span>${lv.toNext ? `${lv.toNext} to next level` : "Max level!"}</span></div></div>
      <div class="card tile"><div class="ico">🔥</div><div><b>${S.streak.count} day${S.streak.count === 1 ? "" : "s"}</b><span>study streak</span></div></div>
      <div class="card tile"><div class="ico">🎯</div><div><b>${ans ? acc + "%" : "—"}</b><span>${ans} answered</span></div></div>
    </div>`;

    const domains = domList.map((d) => {
      const [cls, label] = status(d.id), a = accuracy(d.id), mf = pct(MODULES.filter((m) => m.d === d.id && S.modules[m.id]).length, MODULES.filter((m) => m.d === d.id).length);
      return `<div class="card domain">
        <h3><span>${d.emoji}</span>${d.name}</h3>
        <div style="margin-top:8px"><span class="tag ${cls}">${label}${d.id === w.id && S.stats[d.id].t >= 3 ? " · focus here" : ""}</span> <span class="muted" style="font-size:.78rem">${d.weight}% of exam</span></div>
        <div class="row"><span>Practice accuracy</span><b>${a == null ? "—" : Math.round(a * 100) + "%"}</b></div>${bar(a == null ? 0 : Math.round(a * 100), d.color)}
        <div class="row"><span>Modules done</span><b>${mf}%</b></div>${bar(mf, d.color)}
        <div class="actions">
          <button class="btn btn-primary btn-sm" data-act="start" data-mode="domain" data-d="${d.id}">Practice</button>
          <a class="btn btn-ghost btn-sm" href="${d.url}" target="_blank" rel="noopener" style="text-decoration:none">Study ↗</a>
        </div></div>`;
    }).join("");

    const todayCard = today ? `
    <div class="section-title"><h2>Today's plan</h2><button class="link-btn" data-act="nav" data-to="plan">Full plan →</button></div>
    <div class="card day ${today.kind === "exam" ? "exam" : ""}" style="padding-bottom:6px">${today.tasks.map(taskRow).join("")}</div>` : "";

    const badges = `
    <div class="section-title"><h2>Badges</h2><span class="muted">${Object.keys(S.badges).length}/${BADGES.length} unlocked</span></div>
    <div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? "on" : ""}" title="${b.desc}"><div class="e">${b.icon}</div><b>${b.name}</b><span>${b.desc}</span></div>`).join("")}</div>`;

    return `${hero}${tiles}
      <div class="section-title"><h2>Your three exam domains</h2><span class="muted">Weak areas are re-prioritised in your plan automatically</span></div>
      <div class="grid g3">${domains}</div>${todayCard}${badges}
      <p style="margin-top:30px"><button class="link-btn" data-act="reset">Reset all progress</button></p>`;
  }

  function taskIcon(t) { return { learn: "📘", practice: "✍️", review: "🔁", mock: "🏁", recap: "🗒️", check: "✅" }[t.type]; }
  function taskRow(t) {
    const done = taskDone(t);
    let action = "";
    if (t.type === "learn") action = `<a class="btn btn-ghost btn-sm" href="${D[t.d].url}" target="_blank" rel="noopener" style="text-decoration:none">Open ↗</a>`;
    if (t.type === "practice") action = `<button class="btn btn-primary btn-sm" data-act="start" data-mode="domain" data-d="${t.d}">Start</button>`;
    if (t.type === "review") action = `<button class="btn btn-primary btn-sm" data-act="start" data-mode="review">Start</button>`;
    if (t.type === "mock") action = `<button class="btn btn-primary btn-sm" data-act="start" data-mode="mock">Start</button>`;
    return `<div class="task ${done ? "done" : ""}">
      ${t.type === "learn" ? checkBtn(done, "mod", `data-id="${t.mid}"`) : checkBtn(done, "task", `data-key="${t.key}"`)}
      <div class="t"><b>${taskIcon(t)} ${t.title}</b><small>${t.mins ? t.mins + " min" : "Mindset"}${t.d ? " · " + D[t.d].short : ""}</small></div>${action}</div>`;
  }

  function planView() {
    const target = ensureTarget();
    save();
    const chips = EXAMS.map((e) => {
      const past = parse(e.date) < todayD(), act = e.date === target;
      return `<button class="exam-chip ${act ? "active" : ""} ${past ? "past" : ""}" ${past ? "disabled" : `data-act="target" data-date="${e.date}"`}>
        <b>${e.label}</b><small>${past ? "Passed" : `${diffDays(todayD(), parse(e.date))} day(s) away`}</small></button>`;
    }).join("");
    const head = `<h1 class="page-title">Your revision plan</h1>
      <p class="muted" style="margin:0">Choose the exam you are aiming for. The plan puts your weakest, most heavily weighted topics first and finishes with a mock exam the day before.</p>
      <div class="exam-chips">${chips}</div>`;
    if (!target) return `${head}<div class="card" style="margin-top:18px">All exam dates have passed. Add a new date to <code>EXAMS</code> in <code>data.js</code>.</div>`;

    const { days, unscheduled } = buildPlan(target);
    const all = days.flatMap((d) => d.tasks), doneN = all.filter(taskDone).length;
    const mins = days.slice(0, -1).map(dayMins), peak = Math.max(...mins, 0);
    const weak = domList.slice().sort((a, b) => need(b.id) - need(a.id));

    const summary = `<div class="grid g2" style="margin:18px 0">
      <div class="card"><h3>Plan progress</h3><p class="muted" style="margin:6px 0 12px">${doneN} of ${all.length} tasks complete</p>${bar(pct(doneN, all.length))}</div>
      <div class="card"><h3>Focus order</h3><p class="muted" style="margin:6px 0 10px">Based on exam weight and your current mastery</p>
        ${weak.map((d, i) => `<div style="display:flex;justify-content:space-between;font-size:.92rem"><span>${i + 1}. ${d.emoji} ${d.name}</span><b>${Math.round(mastery(d.id) * 100)}%</b></div>`).join("")}</div></div>`;
    const warn = peak > 240 ? `<div class="notice">⚠️ Tight schedule: your busiest day is about <b>${Math.round(peak / 60 * 10) / 10} hours</b>. Prioritise the first topics in the "Focus order" and use practice questions to find gaps quickly.</div>` : "";
    const left = unscheduled ? `<div class="notice">There isn't time to cover every module before this exam — ${unscheduled} lower-priority module(s) were left out. The mock exam will show where to focus.</div>` : "";

    const list = days.map((d) => {
      const rel = d.i === 0 ? "Today" : d.i === 1 ? "Tomorrow" : "";
      const title = d.kind === "exam" ? "🎓 Exam day" : d.kind === "mock" ? "🏁 Mock exam & final review" : "📚 Study day";
      return `<div class="card day ${d.i === 0 ? "today" : ""} ${d.kind === "exam" ? "exam" : ""}">
        <div class="day-head"><div class="day-date"><b>${d.date.getDate()}</b><span>${d.date.toLocaleDateString("en-GB", { month: "short" })}</span></div>
        <div><b>${title}</b><div style="font-size:.82rem;opacity:.8">${fmtDate(d.date)}${rel ? " · " + rel : ""}${dayMins(d) ? " · ~" + dayMins(d) + " min" : ""}</div></div></div>
        ${d.tasks.map(taskRow).join("")}</div>`;
    }).join("");

    return `${head}${summary}${warn}${left}<div class="grid" style="margin-top:18px">${list}</div>
      <p style="margin-top:20px"><button class="link-btn" data-act="replan">Re-generate plan from my current progress</button></p>`;
  }

  function learnView() {
    const total = MODULES.length, done = MODULES.filter((m) => S.modules[m.id]).length;
    const sections = domList.map((d) => {
      const mods = MODULES.filter((m) => m.d === d.id), dn = mods.filter((m) => S.modules[m.id]).length;
      return `<div class="card" style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
          <h3>${d.emoji} ${d.name}</h3>
          <a class="btn btn-ghost btn-sm" href="${d.url}" target="_blank" rel="noopener" style="text-decoration:none">Open learning path ↗</a></div>
        <p class="muted" style="margin:6px 0 10px;font-size:.88rem">${dn}/${mods.length} modules · ${d.weight}% of the exam</p>${bar(pct(dn, mods.length), d.color)}
        <div style="margin-top:10px">${mods.map((m) => `<div class="module ${S.modules[m.id] ? "done" : ""}">
          ${checkBtn(!!S.modules[m.id], "mod", `data-id="${m.id}"`)}
          <div style="flex:1"><h4>${m.title}</h4><small class="muted">≈ ${m.mins} min</small>
          <div class="topics">${m.topics.map((t) => `<span>${t}</span>`).join("")}</div></div></div>`).join("")}</div></div>`;
    }).join("");
    return `<h1 class="page-title">Learning materials</h1>
      <p class="muted" style="margin:0 0 18px">Work through the three Microsoft Learn paths, then tick each module off to earn XP. ${done}/${total} complete.</p>${sections}`;
  }

  function practiceView() {
    const missed = Object.keys(S.missed).length;
    const modes = [
      ["⚡", "Smart practice", "10 questions picked from your weakest topics and missed questions.", `data-act="start" data-mode="smart"`],
      ["🎲", "Quick quiz", "10 random questions across all three domains.", `data-act="start" data-mode="quick"`],
      ["🔁", "Missed questions", missed ? `Retry the ${missed} question(s) you got wrong.` : "Nothing to review yet — nice!", `data-act="start" data-mode="review" ${missed ? "" : "disabled"}`],
      ["🏁", "Mock exam", "30 questions, 30 minutes, no hints. Pass mark 70%.", `data-act="start" data-mode="mock"`],
    ].map(([e, t, p, a]) => `<button class="card mode" ${a}><div class="big">${e}</div><h3>${t}</h3><p>${p}</p></button>`).join("");
    const byDomain = domList.map((d) => `<button class="card mode" data-act="start" data-mode="domain" data-d="${d.id}">
      <div class="big">${d.emoji}</div><h3>${d.short}</h3><p>${QUESTIONS.filter((q) => q.d === d.id).length} questions · ${d.weight}% of exam</p></button>`).join("");
    return `<h1 class="page-title">Practice</h1>
      <p class="muted" style="margin:0 0 18px">Original questions aligned to the AZ-900 skills outline. Want the official ones? Try Microsoft's
      <a href="https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/practice/assessment?assessment-type=practice&assessmentId=23&practice-assessment-type=certification" target="_blank" rel="noopener">free practice assessment</a>.</p>
      <div class="grid g4">${modes}</div>
      <div class="section-title"><h2>Focus on one domain</h2></div><div class="grid g3">${byDomain}</div>`;
  }

  /* ---------------------------------------------------------
     Quiz engine
     --------------------------------------------------------- */
  function makeQ(q) {
    const opts = shuffle([q.right, ...q.wrong]);
    return { ...q, opts, correct: opts.indexOf(q.right), picked: null, ok: null };
  }
  function startQuiz(mode, dom) {
    let pool;
    if (mode === "quick") pool = shuffle(QUESTIONS).slice(0, 10);
    else if (mode === "domain") pool = shuffle(QUESTIONS.filter((q) => q.d === dom)).slice(0, 10);
    else if (mode === "review") {
      pool = shuffle(QUESTIONS.filter((q) => S.missed[q.id])).slice(0, 10);
      if (!pool.length) { toast("🎉 No missed questions — you're clear!"); return; }
    } else if (mode === "mock") {
      const counts = { cloud: 8, arch: 12, mgmt: 10 };
      pool = shuffle(domList.flatMap((d) => shuffle(QUESTIONS.filter((q) => q.d === d.id)).slice(0, counts[d.id])));
    } else {
      const mx = Math.max(...domList.map((d) => need(d.id))) || 1;
      pool = QUESTIONS.map((q) => ({ q, s: (S.missed[q.id] ? 3 : 0) + (need(q.d) / mx) * 2 + Math.random() * 1.5 }))
        .sort((a, b) => b.s - a.s).slice(0, 10).map((x) => x.q);
      pool = shuffle(pool);
    }
    stopTimer();
    Q = { mode, dom, list: pool.map(makeQ), i: 0, score: 0, combo: 0, maxCombo: 0, reveal: mode !== "mock", done: false, timer: null, end: null };
    if (mode === "mock") {
      Q.end = Date.now() + 30 * 60 * 1000;
      Q.timer = setInterval(() => {
        const left = Math.max(0, Q.end - Date.now()), el = $("#timer");
        if (el) el.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, "0")}`;
        if (left <= 0) finishQuiz();
      }, 500);
    }
    route = "quiz"; render();
  }
  function stopTimer() { if (Q && Q.timer) { clearInterval(Q.timer); Q.timer = null; } }

  function answer(idx) {
    if (!Q || Q.done) return;
    const q = Q.list[Q.i];
    if (q.picked != null) return;
    q.picked = idx; q.ok = idx === q.correct;
    const st = S.stats[q.d]; st.t++;
    if (q.ok) {
      st.c++; delete S.missed[q.id]; Q.score++; Q.combo++;
      Q.maxCombo = Math.max(Q.maxCombo, Q.combo); S.bestCombo = Math.max(S.bestCombo, Q.combo);
      addXP(10 + (Q.combo >= 3 ? Q.combo * 2 : 0));
      if (Q.reveal && Q.combo >= 3) confetti(30 + Q.combo * 8, innerWidth / 2, innerHeight / 2);
    } else { S.missed[q.id] = true; Q.combo = 0; }
    touchStreak(); checkBadges(); save(); render();
  }
  function nextQ() {
    if (!Q || Q.list[Q.i].picked == null) return;
    if (Q.i + 1 >= Q.list.length) finishQuiz(); else { Q.i++; render(); }
  }
  function finishQuiz() {
    if (!Q || Q.done) return;
    stopTimer(); Q.done = true;
    const p = pct(Q.score, Q.list.length);
    S.quizzes++;
    if (p === 100 && Q.list.length >= 5) { S.perfect++; addXP(50); }
    if (p >= MOCK_PASS_PCT) addXP(25);
    if (Q.mode === "mock") { S.mockBest = Math.max(S.mockBest, p); if (p >= MOCK_PASS_PCT) addXP(100); }
    // auto-tick the matching task in today's plan
    const t = ensureTarget();
    if (t) {
      const today = buildPlan(t).days[0];
      const match = today && today.tasks.find((x) => !taskDone(x) && ((Q.mode === "domain" && x.type === "practice" && x.d === Q.dom) || (Q.mode === "mock" && x.type === "mock") || (Q.mode === "review" && x.type === "review")));
      if (match) S.plan.done[match.key] = true;
    }
    if (p >= MOCK_PASS_PCT) confetti(220);
    checkBadges(); save(); render();
  }

  function quizView() {
    if (Q.done) return resultView();
    const q = Q.list[Q.i], total = Q.list.length;
    const opts = q.opts.map((o, i) => {
      let cls = "";
      if (q.picked != null) {
        if (Q.reveal) cls = i === q.correct ? "right" : i === q.picked ? "wrong" : "";
        else cls = i === q.picked ? "sel" : "";
      }
      return `<button class="opt ${cls}" data-act="answer" data-i="${i}" ${q.picked != null ? "disabled" : ""}><span class="k">${"ABCD"[i]}</span><span>${o}</span></button>`;
    }).join("");
    const exp = q.picked != null && Q.reveal
      ? `<div class="explain ${q.ok ? "ok" : "no"}"><b>${q.ok ? "✅ Correct!" : "❌ Not quite."}</b> ${q.exp}</div>` : "";
    const next = q.picked != null
      ? `<div style="margin-top:16px;text-align:right"><button class="btn btn-primary" data-act="next">${Q.i + 1 >= total ? "Finish" : "Next"} →</button></div>` : "";
    return `<div class="card" style="max-width:760px;margin:0 auto">
      <div class="quiz-top"><span class="muted" style="font-weight:600">${Q.i + 1}/${total}</span>${bar(pct(Q.i + (q.picked != null ? 1 : 0), total))}
        ${Q.mode === "mock" ? `<span class="timer" id="timer">30:00</span>` : `<span class="combo">${Q.combo >= 2 ? "🔥 x" + Q.combo : ""}</span>`}</div>
      <span class="tag new">${D[q.d].emoji} ${D[q.d].short}</span>
      <div class="q-text">${q.q}</div>${opts}${exp}${next}
      <div class="kbd">Tip: press A–D to answer and Enter for next.</div></div>`;
  }

  function resultView() {
    const total = Q.list.length, p = pct(Q.score, total), pass = p >= MOCK_PASS_PCT;
    const byD = domList.map((d) => {
      const qs = Q.list.filter((q) => q.d === d.id); if (!qs.length) return "";
      const ok = qs.filter((q) => q.ok).length;
      return `<div style="text-align:left;margin:10px 0"><div style="display:flex;justify-content:space-between"><span>${d.emoji} ${d.short}</span><b>${ok}/${qs.length}</b></div>${bar(pct(ok, qs.length), d.color)}</div>`;
    }).join("");
    const wrong = Q.list.filter((q) => !q.ok);
    const review = wrong.length ? `<div style="margin-top:20px"><h3 style="text-align:left">Review (${wrong.length})</h3>${wrong.map((q) => `
      <div class="review-item"><b>${q.q}</b><small>Your answer: ${q.picked != null ? q.opts[q.picked] : "no answer"}</small>
      <small style="color:var(--ok)">Correct: ${q.right}</small><small>${q.exp}</small></div>`).join("")}</div>` : "";
    return `<div class="card result" style="max-width:760px;margin:0 auto">
      <h1>${pass ? (p === 100 ? "Flawless! 💯" : "You passed! 🎉") : "Good effort — keep going 💪"}</h1>
      <p class="muted">${Q.mode === "mock" ? "Mock exam" : "Quiz"} complete · best streak x${Q.maxCombo}</p>
      ${ring(p, 150, 13, pass ? "#10b981" : "#f59e0b", `<span>${p}%<small>${Q.score}/${total} correct</small></span>`)}
      ${byD}
      <div class="actions" style="justify-content:center">
        <button class="btn btn-primary" data-act="start" data-mode="${Q.mode}" ${Q.dom ? `data-d="${Q.dom}"` : ""}>Try again</button>
        <button class="btn btn-ghost" data-act="nav" data-to="dashboard">Dashboard</button>
        <button class="btn btn-ghost" data-act="nav" data-to="plan">Study plan</button></div>${review}</div>`;
  }

  /* ---------------------------------------------------------
     Render + router
     --------------------------------------------------------- */
  function render() {
    document.documentElement.dataset.theme = S.theme;
    const lv = levelInfo(S.xp);
    $("#chip-level").innerHTML = `Lv ${lv.n} · ${lv.title} · ${S.xp} XP`;
    $("#chip-streak").innerHTML = `🔥 ${S.streak.count}`;
    const navRoute = route === "quiz" ? "practice" : route;
    document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("active", b.dataset.to === navRoute));
    const views = { dashboard: dashboardView, plan: planView, learn: learnView, practice: practiceView, quiz: quizView };
    $("#view").innerHTML = views[route]();
    countUp();
  }
  function go(r) {
    if (route === "quiz" && r !== "quiz") { stopTimer(); }
    route = r; render(); window.scrollTo({ top: 0 });
  }

  /* ---------------------------------------------------------
     Events (delegated)
     --------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const a = el.dataset.act;
    if (a === "nav") go(el.dataset.to);
    else if (a === "theme") { S.theme = S.theme === "dark" ? "light" : "dark"; save(); render(); }
    else if (a === "start") { startQuiz(el.dataset.mode, el.dataset.d); window.scrollTo({ top: 0 }); }
    else if (a === "answer") answer(+el.dataset.i);
    else if (a === "next") nextQ();
    else if (a === "target") { S.plan.target = el.dataset.date; save(); render(); }
    else if (a === "replan") { delete S.plan.snap[S.plan.target]; save(); render(); toast("🗓️ Plan refreshed from your latest progress"); }
    else if (a === "task") {
      const k = el.dataset.key; S.plan.done[k] = !S.plan.done[k];
      if (S.plan.done[k]) { addXP(5); touchStreak(); confetti(25, e.clientX, e.clientY); }
      save(); render();
    } else if (a === "mod") {
      const id = el.dataset.id;
      if (S.modules[id]) delete S.modules[id];
      else { S.modules[id] = true; addXP(30); touchStreak(); confetti(60, e.clientX, e.clientY); toast("📘 Module complete! +30 XP"); }
      checkBadges(); save(); render();
    } else if (a === "reset") {
      if (confirm("Reset all progress, XP and plan data? This cannot be undone.")) { S = base(); save(); go("dashboard"); }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (route !== "quiz" || !Q || Q.done) return;
    const k = e.key.toLowerCase();
    if ("abcd".includes(k) && k.length === 1) { const i = "abcd".indexOf(k); if (i < Q.list[Q.i].opts.length) answer(i); }
    else if (e.key === "Enter") nextQ();
  });

  render();
})();