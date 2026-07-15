// finally.help — front-end SPA. No framework, no build step.
// All state lives on the server (Cloudflare D1). This file renders views and
// calls the /api/* endpoints; the session cookie handles auth automatically.

(() => {
  "use strict";

  /* ---------- client-side display catalog (server is source of truth) ---------- */
  const LEVELS = [
    { min: 0, name: "Curious" }, { min: 50, name: "Question-Asker" }, { min: 150, name: "Connector" },
    { min: 300, name: "Sense-Maker" }, { min: 500, name: "Explainer" }, { min: 800, name: "Big Brain" }, { min: 1200, name: "Finally Fluent" },
  ];
  function levelInfo(xp) {
    let i = 0; for (let j = 0; j < LEVELS.length; j++) if (xp >= LEVELS[j].min) i = j;
    const cur = LEVELS[i], next = LEVELS[i + 1] || null;
    return { level: i + 1, name: cur.name, into: xp - cur.min, span: next ? next.min - cur.min : 1 };
  }
  const GAMES = [
    { id: "nutshell", name: "Nutshell Quiz", icon: "\u{1F95C}", desc: "Read the one-line summary, name the topic.", level: 1 },
    { id: "analogy", name: "Analogy Match", icon: "\u{1F517}", desc: "Match each topic to its everyday picture.", level: 2 },
    { id: "speed", name: "Speed Round", icon: "⚡", desc: "How many can you nail against the clock?", level: 3, soon: true },
    { id: "detective", name: "Word Detective", icon: "\u{1F575}️", desc: "Spot the jargon and swap in plain words.", level: 4, soon: true },
    { id: "builder", name: "Analogy Builder", icon: "\u{1F3D7}️", desc: "Craft your own explanation for bonus Bulbs.", level: 5, soon: true },
  ];
  const STARTER_AVATARS = ["\u{1F642}", "\u{1F63A}", "\u{1F436}", "\u{1F422}", "\u{1F31F}", "\u{1F34E}"];
  const SHOP = [
    { id: "av_owl", cat: "Avatars", icon: "\u{1F989}", name: "Owl", price: 40, type: "avatar", value: "\u{1F989}", desc: "Show this next to your name and comments." },
    { id: "av_fox", cat: "Avatars", icon: "\u{1F98A}", name: "Fox", price: 40, type: "avatar", value: "\u{1F98A}", desc: "Show this next to your name and comments." },
    { id: "av_octo", cat: "Avatars", icon: "\u{1F419}", name: "Octopus", price: 60, type: "avatar", value: "\u{1F419}", desc: "Show this next to your name and comments." },
    { id: "av_robot", cat: "Avatars", icon: "\u{1F916}", name: "Robot", price: 90, type: "avatar", value: "\u{1F916}", level: 2, desc: "Show this next to your name and comments." },
    { id: "av_brain", cat: "Avatars", icon: "\u{1F9E0}", name: "Big Brain", price: 150, type: "avatar", value: "\u{1F9E0}", level: 3, desc: "Show this next to your name and comments." },
    { id: "av_crown", cat: "Avatars", icon: "\u{1F451}", name: "Crown", price: 250, type: "avatar", value: "\u{1F451}", level: 4, desc: "Show this next to your name and comments." },
    { id: "th_dark", cat: "Themes", icon: "\u{1F319}", name: "Night Owl (dark)", price: 120, type: "theme", value: "theme-dark", desc: "Reskin the whole site. Equip anytime." },
    { id: "th_blue", cat: "Themes", icon: "\u{1F4D0}", name: "Blueprint", price: 140, type: "theme", value: "theme-blueprint", level: 2, desc: "Reskin the whole site. Equip anytime." },
    { id: "fl_gold", cat: "Flair", icon: "✨", name: "Gold name", price: 180, type: "flair", value: "gold", level: 2, desc: "Make your name shine gold in comments." },
    { id: "bo_double", cat: "Boosts", icon: "×2", name: "Double Bulbs x5", price: 60, type: "boost", value: "double", desc: "Your next 5 reads pay double Bulbs." },
    { id: "bo_freeze", cat: "Boosts", icon: "\u{1F9CA}", name: "Streak Freeze", price: 50, type: "boost", value: "freeze", desc: "Miss a day without losing your streak." },
    { id: "bo_hint", cat: "Boosts", icon: "\u{1F4A1}", name: "Hint Tokens x3", price: 30, type: "boost", value: "hint", desc: "Spend a token to reveal a hint in games." },
    { id: "fun_sparky", cat: "Fun", icon: "\u{1F526}", name: "Sparky the pet", price: 300, type: "pet", value: "sparky", level: 3, desc: "A little buddy that lives on your profile." },
  ];
  const SHOP_CATS = ["Avatars", "Themes", "Flair", "Boosts", "Fun"];
  const SUGGESTIONS = ["How does a recession happen?", "What is compound interest?", "What is a black hole?", "How does WiFi work?", "What is a 401(k)?", "Why does the moon change shape?"];
  const BULB = "\u{1F4A1}";

  /* ---------- state ---------- */
  let ME = null;      // public user object or null
  let LIB = [];       // library from /api/library
  let MINE = [];      // this user's saved explainers
  let currentView = "browse";
  let activeCat = "all";
  let query = "";
  let gScore = 0;

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: opts.body ? { "content-type": "application/json" } : {},
      ...opts,
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || `Something went wrong (${res.status}).`);
    return data;
  }

  function renderBody(md) {
    return String(md).trim().split(/\n\s*\n/).map((b) => {
      let e = esc(b.trim()); const q = e.startsWith("&gt;"); if (q) e = e.replace(/^&gt;\s?/, "");
      e = e.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return q ? "<blockquote>" + e + "</blockquote>" : "<p>" + e + "</p>";
    }).join("");
  }
  const badgeClass = { Money: "b-money", Tech: "b-tech", Health: "b-health", Yours: "b-yours" };

  function toast(msg, kind) {
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : ""); t.textContent = msg;
    $("toasts").appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .4s"; t.style.opacity = "0"; setTimeout(() => t.remove(), 400); }, 2600);
  }

  function applyTheme() {
    const th = ME && ME.inventory && ME.inventory.theme;
    document.body.className = th && th !== "paper" ? th : "";
  }

  // Update ME from an API response, toast any reward delta + level-ups.
  function setMe(user, reason) {
    const before = ME ? levelInfo(ME.xp).level : 1;
    if (ME && user && reason) {
      const dxp = user.xp - ME.xp, db = user.bulbs - ME.bulbs;
      if (dxp > 0 || db > 0) toast(`+${dxp} XP · +${db} ${BULB} — ${reason}`);
    }
    ME = user; applyTheme(); renderAccount();
    if (user) {
      const after = levelInfo(user.xp).level;
      if (after > before) setTimeout(() => toast(`\u{1F389} Level ${after} — ${LEVELS[after - 1].name}!`, "level"), 350);
    }
  }

  function allItems() {
    const mine = (ME ? MINE : []).map((x) => ({ ...x, cat: "Yours", _yours: true }));
    return mine.concat(LIB);
  }
  const itemById = (id) => allItems().find((x) => x.id === id);

  /* ---------- account bar ---------- */
  function renderAccount() {
    const bar = $("accountBar");
    if (!ME) {
      bar.innerHTML = `<span style="color:var(--ink-soft);font-size:13.5px">Track points, streaks &amp; unlock games —</span>
        <button class="btn-login" id="loginBtn">Log in / Register</button>`;
      $("loginBtn").onclick = () => openAuth("login");
      return;
    }
    const li = levelInfo(ME.xp); const pct = Math.min(100, Math.round((li.into / li.span) * 100));
    const nameCls = ME.inventory && ME.inventory.flairGold ? "name-gold" : "";
    bar.innerHTML = `<div class="acct">
        <span class="who"><span class="av">${ME.avatar}</span><span class="${nameCls}">${esc(ME.display)}</span></span>
        <span class="pill pill-lvl">Lv ${li.level} · ${li.name}</span>
        <span class="xpbar" title="${ME.xp} XP"><i style="width:${pct}%"></i></span>
        <span class="pill pill-bulbs">${BULB} ${ME.bulbs}</span>
        ${ME.streak && ME.streak.count > 0 ? `<span class="pill pill-streak">\u{1F525} ${ME.streak.count}</span>` : ""}
      </div><button class="link-btn" id="logoutBtn">Log out</button>`;
    $("logoutBtn").onclick = logout;
  }

  /* ---------- auth ---------- */
  let authMode = "login", pickedAvatar = STARTER_AVATARS[0];
  function openAuth(mode) {
    authMode = mode || "login"; setAuthMode();
    $("mErr").textContent = ""; $("mUser").value = ""; $("mPass").value = "";
    $("modal").classList.add("show"); $("mUser").focus();
  }
  const closeAuth = () => $("modal").classList.remove("show");
  function setAuthMode() {
    document.querySelectorAll(".mtab").forEach((t) => t.classList.toggle("active", t.dataset.mode === authMode));
    $("mTitle").textContent = authMode === "login" ? "Welcome back" : "Create your account";
    $("mSubmit").textContent = authMode === "login" ? "Log in" : "Create account";
    $("mAvatarWrap").hidden = authMode !== "register";
  }
  async function doAuth() {
    const username = $("mUser").value.trim(); const password = $("mPass").value; const err = $("mErr");
    if (!username || !password) { err.textContent = "Enter a username and password."; return; }
    $("mSubmit").disabled = true;
    try {
      const path = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = authMode === "register" ? { username, password, avatar: pickedAvatar } : { username, password };
      const r = await api(path, { method: "POST", body: JSON.stringify(payload) });
      closeAuth();
      setMe(r.user);
      await loadMine();
      await refreshMe();
      showView(currentView);
      toast(authMode === "register" ? `Welcome to finally. — you start with 20 ${BULB}` : `Welcome back, ${r.user.display}!`);
    } catch (e) {
      err.textContent = e.message;
    } finally {
      $("mSubmit").disabled = false;
    }
  }
  async function refreshMe() {
    try { const r = await api("/api/auth/me"); if (r.user) { ME = r.user; applyTheme(); renderAccount(); } } catch (e) {}
  }
  async function loadMine() {
    if (!ME) { MINE = []; return; }
    try { const r = await api("/api/explainers"); MINE = r.explainers || []; } catch (e) { MINE = []; }
  }
  async function logout() {
    try { await api("/api/auth/logout", { method: "POST" }); } catch (e) {}
    ME = null; MINE = []; applyTheme(); renderAccount(); showView("browse");
  }

  /* ---------- view switching ---------- */
  function showView(v) {
    currentView = v;
    ["browse", "reader", "create", "play", "shop"].forEach((id) => { $(id).hidden = id !== v; });
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === v));
    if (v === "browse") renderBrowse();
    if (v === "create") renderCreate();
    if (v === "play") renderPlay();
    if (v === "shop") renderShop();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- browse ---------- */
  function renderBrowse() {
    const el = $("browse");
    el.innerHTML = `<div class="controls">
        <input class="search" id="search" placeholder="Search what you want to finally understand…" value="${esc(query)}">
        <div class="filters" id="filters">
          ${["all", "Money", "Tech", "Health", "Yours"].map((c) => `<button class="chip${activeCat === c ? " active" : ""}" data-cat="${c}">${c === "all" ? "All" : c}</button>`).join("")}
        </div>
      </div><div class="grid" id="grid"></div><div class="empty" id="empty" hidden></div>`;
    const grid = el.querySelector("#grid"), empty = el.querySelector("#empty");
    const q = query.trim().toLowerCase();
    const items = allItems().filter((it) => {
      const catOk = activeCat === "all" || it.cat === activeCat || (activeCat === "Yours" && it._yours);
      const qOk = !q || it.title.toLowerCase().includes(q) || (it.teaser || "").toLowerCase().includes(q);
      return catOk && qOk;
    });
    empty.hidden = items.length > 0;
    if (!items.length) empty.textContent = activeCat === "Yours" && !ME
      ? "Log in to create and save your own explainers."
      : "Nothing here yet — try a different search, or head to “Explain something to me.”";
    items.forEach((it) => {
      const cat = it._yours ? "Yours" : it.cat;
      const read = ME && ME.readIds && ME.readIds.includes(it.id);
      const card = document.createElement("button"); card.className = "card";
      card.innerHTML = `<span class="badge ${badgeClass[cat]}">${cat}</span>
        ${read ? '<span class="done">✓ read</span>' : ""}
        <h3>${esc(it.title)}</h3><p>${esc(it.teaser || "")}</p>`;
      card.onclick = () => openReader(it.id);
      grid.appendChild(card);
    });
    el.querySelector("#search").addEventListener("input", (e) => {
      query = e.target.value; renderBrowse();
      const s = $("search"); s.focus(); s.setSelectionRange(s.value.length, s.value.length);
    });
    el.querySelector("#filters").addEventListener("click", (e) => {
      if (!e.target.dataset.cat) return; activeCat = e.target.dataset.cat; renderBrowse();
    });
  }

  /* ---------- reader ---------- */
  function openReader(id) {
    const it = itemById(id); if (!it) return;
    const cat = it._yours ? "Yours" : it.cat;
    const read = ME && ME.readIds && ME.readIds.includes(it.id);
    const el = $("reader");
    el.innerHTML = `<button class="back" id="back">← Back to browse</button>
      <div class="reader-card">
        <span class="badge ${badgeClass[cat]}">${cat}</span>
        <h2>${esc(it.title)}</h2>
        <div>${renderBody(it.body)}</div>
        <div class="claim-row" id="claimRow"></div>
        <div class="comments" id="comments"></div>
      </div>`;
    el.querySelector("#back").onclick = () => showView("browse");
    const cr = el.querySelector("#claimRow");
    if (it._yours) cr.innerHTML = `<span class="saved-note">This is your explainer.</span>`;
    else if (read) cr.innerHTML = `<span class="saved-note">✓ You've got this one. Nice.</span>`;
    else { cr.innerHTML = `<button class="btn" id="claim">✅ I get it now &nbsp;(+10 XP · +5 ${BULB})</button>`; cr.querySelector("#claim").onclick = () => claimRead(it.id); }
    ["browse", "create", "play", "shop"].forEach((x) => ($(x).hidden = true));
    $("reader").hidden = false;
    currentView = "reader";
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadComments(it.id);
  }
  async function claimRead(id) {
    if (!ME) return openAuth("register");
    try { const r = await api("/api/state/claim-read", { method: "POST", body: JSON.stringify({ id }) }); setMe(r.user, "You get it!"); openReader(id); }
    catch (e) { toast(e.message); }
  }

  /* ---------- comments ---------- */
  async function loadComments(subject) {
    const box = $("comments"); if (!box) return;
    box.innerHTML = `<h4>Comments</h4><p style="color:var(--ink-soft);font-size:14px">Loading…</p>`;
    let list = [];
    try { const r = await api(`/api/comments?subject=${encodeURIComponent(subject)}`); list = r.comments || []; } catch (e) {}
    renderComments(subject, list);
  }
  function renderComments(subject, list) {
    const box = $("comments"); if (!box) return;
    let html = `<h4>Comments (${list.length})</h4>`;
    if (!list.length) html += `<p style="color:var(--ink-soft);font-size:14px">Be the first to react.</p>`;
    list.forEach((c) => {
      const reacts = ["\u{1F44D}", "\u{1F4A1}", "\u{1F92F}"].map((em) => {
        const arr = (c.reacts && c.reacts[em]) || []; const on = ME && arr.includes(ME.username);
        return `<button class="react${on ? " on" : ""}" data-cid="${esc(c.id)}" data-em="${em}">${em} ${arr.length || ""}</button>`;
      }).join("");
      html += `<div class="comment"><span class="av">${esc(c.avatar || "\u{1F642}")}</span><div class="body">
        <div class="meta"><span class="${c.flair === "gold" ? "name-gold" : ""}">${esc(c.user)}</span><span class="time">${timeAgo(c.ts)}</span></div>
        <div class="text">${esc(c.text)}</div><div class="reacts">${reacts}</div></div></div>`;
    });
    if (ME) html += `<div class="comment-form"><input id="cInput" placeholder="Add a comment…" maxlength="240"><button class="btn" id="cPost">Post</button></div>`;
    else html += `<div class="gate" style="padding:20px 0"><button class="btn-login" id="cLogin">Log in to comment</button></div>`;
    box.innerHTML = html;
    if (ME) {
      box.querySelector("#cPost").onclick = () => postComment(subject);
      box.querySelector("#cInput").addEventListener("keydown", (e) => { if (e.key === "Enter") postComment(subject); });
    } else box.querySelector("#cLogin").onclick = () => openAuth("login");
    box.querySelectorAll(".react").forEach((b) => (b.onclick = () => reactComment(subject, b.dataset.cid, b.dataset.em)));
  }
  async function postComment(subject) {
    const inp = $("cInput"); const text = inp.value.trim(); if (!text) return;
    try {
      const r = await api("/api/comments", { method: "POST", body: JSON.stringify({ subject, text }) });
      if (r.user) setMe(r.user, "Thanks for chiming in!");
      await loadComments(subject);
    } catch (e) { toast(e.message); }
  }
  async function reactComment(subject, id, emoji) {
    if (!ME) return openAuth("login");
    try { await api("/api/comments/react", { method: "POST", body: JSON.stringify({ id, emoji }) }); await loadComments(subject); }
    catch (e) { toast(e.message); }
  }
  function timeAgo(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago"; return Math.floor(s / 86400) + "d ago";
  }

  /* ---------- create ---------- */
  let lastGen = null;
  function renderCreate() {
    const el = $("create");
    el.innerHTML = `<p class="create-intro">Type anything you’ve always nodded along to but never really got. You’ll get it back explained like you’re ten — in under a minute.</p>
      <div class="create-box"><input id="topic" placeholder="e.g. How does a recession happen?"><button class="btn" id="go">Explain it</button></div>
      <div class="suggests" id="suggests"><span>Try:</span></div><div class="result" id="result"></div>`;
    const sw = el.querySelector("#suggests");
    SUGGESTIONS.forEach((s) => { const b = document.createElement("button"); b.className = "sug"; b.textContent = s; b.onclick = () => { $("topic").value = s; generate(); }; sw.appendChild(b); });
    el.querySelector("#go").onclick = generate;
    el.querySelector("#topic").addEventListener("keydown", (e) => { if (e.key === "Enter") generate(); });
  }
  async function generate() {
    const topic = $("topic").value.trim(); if (!topic) return;
    const btn = $("go"), res = $("result"); btn.disabled = true;
    res.innerHTML = `<div class="loading"><div class="spinner"></div>Breaking “${esc(topic)}” down into something simple…</div>`;
    try {
      const r = await api("/api/explain", { method: "POST", body: JSON.stringify({ subject: topic }) });
      const title = topic.charAt(0).toUpperCase() + topic.slice(1);
      lastGen = { title, teaser: firstSentence(r.body), body: r.body };
      res.innerHTML = `<div class="reader-card"><span class="badge b-yours">Fresh</span><h2>${esc(title)}</h2><div>${renderBody(r.body)}</div></div>
        <div class="save-row"><button class="btn-ghost" id="save">＋ Save to my library (+25 XP · +20 ${BULB})</button></div>`;
      res.querySelector("#save").onclick = saveCurrent;
    } catch (e) {
      res.innerHTML = `<div class="loading">Couldn't generate that one just now. ${esc(e.message)}</div>`;
    } finally { btn.disabled = false; }
  }
  function firstSentence(t) { const c = String(t).replace(/\*\*/g, "").replace(/^>.*$/gm, "").trim(); const m = c.match(/^[^.!?]*[.!?]/); return (m ? m[0] : c.slice(0, 90)).trim(); }
  async function saveCurrent() {
    if (!ME) return openAuth("register");
    if (!lastGen) return;
    try {
      const r = await api("/api/explainers", { method: "POST", body: JSON.stringify(lastGen) });
      if (r.explainer) MINE.unshift(r.explainer);
      if (r.user) setMe(r.user, "New explainer saved!");
      const row = document.querySelector(".save-row");
      if (row) row.innerHTML = `<span class="saved-note">✓ Saved — find it under “Yours” in Browse.</span>`;
      lastGen = null;
    } catch (e) { toast(e.message); }
  }

  /* ---------- play ---------- */
  function gate(msg) { return `<div class="gate">${esc(msg)}<br><button class="btn-login" id="gateBtn">Log in / Register</button></div>`; }
  function wireGate(el) { const b = el.querySelector("#gateBtn"); if (b) b.onclick = () => openAuth("register"); }

  function renderPlay() {
    const el = $("play");
    if (!ME) { el.innerHTML = gate("Log in to play games, earn Bulbs, and unlock new ones as you level up."); wireGate(el); return; }
    const lvl = levelInfo(ME.xp).level;
    el.innerHTML = `<div class="sec-head"><h2>Play &amp; earn</h2><p>Games unlock as you level up. You're Level ${lvl}.</p></div><div class="tiles" id="tiles"></div>`;
    const tiles = el.querySelector("#tiles");
    GAMES.forEach((g) => {
      const unlocked = lvl >= g.level && !g.soon;
      const t = document.createElement("div"); t.className = "tile" + (!unlocked ? " locked" : "");
      t.innerHTML = `<div class="ico">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p>
        ${g.soon ? `<span class="lvl-need">Coming soon · Level ${g.level}</span>`
          : unlocked ? `<button class="btn" data-game="${g.id}">Play</button>`
          : `<span class="lvl-need">\u{1F512} Unlocks at Level ${g.level}</span>`}`;
      tiles.appendChild(t);
    });
    tiles.querySelectorAll("[data-game]").forEach((b) => (b.onclick = () => { gScore = 0; playRound(b.dataset.game); }));
  }
  async function playRound(type) {
    const el = $("play");
    el.innerHTML = `<div class="loading"><div class="spinner"></div>Loading a question…</div>`;
    let q;
    try { q = await api(`/api/game?type=${type}`); } catch (e) { el.innerHTML = gate(e.message); wireGate(el); return; }
    const icon = type === "analogy" ? "\u{1F517}" : "\u{1F95C}";
    const prompt = type === "analogy" ? `Which everyday picture explains <em>${esc(q.prompt)}</em>?` : `Which topic does this summarize?<br><em>${esc(q.prompt)}</em>`;
    el.innerHTML = `<button class="back" id="back">← All games</button>
      <div class="game-panel"><div class="ico" style="font-size:34px">${icon}</div>
        <div class="q-prompt">${prompt}</div><div class="opts" id="opts"></div>
        <div class="score">Score this run: ${gScore}</div></div>`;
    el.querySelector("#back").onclick = () => renderPlay();
    const box = el.querySelector("#opts");
    q.options.forEach((o) => {
      const b = document.createElement("button"); b.className = "opt"; b.textContent = o.label;
      b.onclick = async () => {
        box.querySelectorAll(".opt").forEach((x) => (x.disabled = true));
        try {
          const r = await api("/api/game", { method: "POST", body: JSON.stringify({ token: q.token, choice: o.id }) });
          const children = [...box.children];
          const correctBtn = children.find((c) => q.options[children.indexOf(c)].id === r.correctId);
          if (r.correct) { b.classList.add("right"); gScore++; if (r.user) setMe(r.user, "Correct!"); }
          else { b.classList.add("wrong"); if (correctBtn) correctBtn.classList.add("right"); toast("Not quite — the answer's highlighted."); }
        } catch (e) { toast(e.message); }
        setTimeout(() => playRound(type), 1300);
      };
      box.appendChild(b);
    });
  }

  /* ---------- shop ---------- */
  function renderShop() {
    const el = $("shop");
    if (!ME) { el.innerHTML = gate("Log in to spend your Bulbs on avatars, themes, boosts, and more."); wireGate(el); return; }
    const lvl = levelInfo(ME.xp).level; const inv = ME.inventory || {};
    let html = `<div class="sec-head"><h2>Shop</h2><p>You have <b>${BULB} ${ME.bulbs}</b> Bulbs. Earn more by reading, playing, and keeping your streak.</p></div>`;
    SHOP_CATS.forEach((cat) => {
      const items = SHOP.filter((s) => s.cat === cat); if (!items.length) return;
      html += `<div class="shop-cat">${cat}</div><div class="tiles">`;
      items.forEach((s) => {
        const need = s.level || 1; const levelOk = lvl >= need;
        const owned = (s.type === "avatar" && (inv.avatars || []).includes(s.value)) ||
          (s.type === "theme" && (inv.themes || []).includes(s.value)) ||
          (s.type === "flair" && inv.flairGold) || (s.type === "pet" && inv.pet);
        const equipped = (s.type === "avatar" && inv.avatar === s.value) || (s.type === "theme" && inv.theme === s.value);
        let btn;
        if (!levelOk) btn = `<span class="lvl-need">\u{1F512} Reach Level ${need}</span>`;
        else if (s.type === "boost") { const have = (inv.boosts && inv.boosts[s.value]) || 0; btn = `<button class="btn" data-buy="${s.id}">Buy · ${BULB}${s.price}</button>${have ? `<span class="lvl-need">You have ${have}</span>` : ""}`; }
        else if (equipped) btn = `<button class="btn-ghost" disabled>✓ Equipped</button>`;
        else if (owned) btn = `<button class="btn-ghost" data-equip="${s.id}">Equip</button>`;
        else btn = `<button class="btn" data-buy="${s.id}">Buy · ${BULB}${s.price}</button>`;
        html += `<div class="tile${!levelOk ? " locked" : ""}"><div class="ico">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>${btn}</div>`;
      });
      html += `</div>`;
    });
    el.innerHTML = html;
    el.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buy(b.dataset.buy, false)));
    el.querySelectorAll("[data-equip]").forEach((b) => (b.onclick = () => buy(b.dataset.equip, true)));
  }
  async function buy(id, equip) {
    const item = SHOP.find((s) => s.id === id);
    try {
      const r = await api("/api/shop/buy", { method: "POST", body: JSON.stringify(equip ? { id, equip: 1 } : { id }) });
      setMe(r.user);
      toast(equip ? `Equipped ${item.name}` : `Bought ${item.name}! -${BULB}${item.price}`);
      renderShop();
    } catch (e) { toast(e.message); }
  }

  /* ---------- modal wiring ---------- */
  $("mClose").onclick = closeAuth;
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeAuth(); });
  document.querySelectorAll(".mtab").forEach((t) => (t.onclick = () => { authMode = t.dataset.mode; setAuthMode(); }));
  $("mSubmit").onclick = doAuth;
  $("mPass").addEventListener("keydown", (e) => { if (e.key === "Enter") doAuth(); });
  (() => {
    const wrap = $("mAvatars");
    STARTER_AVATARS.forEach((a, i) => {
      const b = document.createElement("button"); b.textContent = a; if (i === 0) b.classList.add("sel");
      b.onclick = () => { pickedAvatar = a; wrap.querySelectorAll("button").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); };
      wrap.appendChild(b);
    });
  })();
  document.querySelectorAll(".tab").forEach((t) => (t.onclick = () => showView(t.dataset.view)));

  /* ---------- init ---------- */
  async function init() {
    renderAccount();
    try { const r = await api("/api/library"); LIB = r.library || []; } catch (e) { LIB = []; }
    try { const r = await api("/api/auth/me"); ME = r.user; } catch (e) { ME = null; }
    applyTheme(); renderAccount();
    if (ME) await loadMine();
    showView("browse");
  }
  init();
})();
