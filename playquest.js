"use strict";

/*
PlayQuest demo, fun edition.

How the NFC tags work with this page:
Each physical tag holds a URL like
  https://YOURDOMAIN/index.html?park=123&loc=LOC04
The game is NOT stored on the tag. The player picks the game in the app first,
so the same ten tags work for every game. If a tag URL does include &game=,
that game is used for that tap.

Progress, scores and badges are saved in the phone browser with localStorage.
This is a proof of concept, not the final product.
*/

const LOC_NAMES = {
  LOC01:"Entry Climb",
  LOC02:"Upper Deck",
  LOC03:"Lookout Corner",
  LOC04:"Bridge or Net",
  LOC05:"Climber Feature",
  LOC06:"Tunnel or Pass Through",
  LOC07:"Under Deck or Low Crawl",
  LOC08:"Slide Entrance",
  LOC09:"Slide Exit",
  LOC10:"Spinner or Motion Feature"
};

const TOTAL = 10;
const CIRC = 2 * Math.PI * 52;
const REMIND_MS = 25000;

const mk = (icon, rows) => rows.map((r, i) => ({
  step:i + 1, loc:r[0], audio:r[1], success:r[2], icon:r[3] || icon
}));

const GAMES = {
  critters:{
    name:"Rescue the Playground Critters", tag:"Find every hiding critter",
    icon:"🐾", rgb:"61,220,151", badge:"Critter Rescuer", type:"explore", mode:"think", limit:0,
    intro:"Six critters are hiding around the playground. Follow the clues and rescue them all!",
    steps:mk("🐾", [
      ["LOC01","Start the search. Climb up where the adventure begins.","Nice. Trail found.","🥾"],
      ["LOC02","Benny the bird loves wind and views. Go high.","Benny is safe.","🐦"],
      ["LOC07","Molly the mouse hides where sunlight never goes.","Molly found.","🐭"],
      ["LOC04","Tina the turtle took the long wobbly path.","Tina rescued.","🐢"],
      ["LOC06","Wally the bat likes echo rooms.","Wally is happy.","🦇"],
      ["LOC05","Pip the monkey climbed everything. Find the tricky route.","Pip is back.","🐒"],
      ["LOC03","Ziggy the lizard is watching from a corner.","Ziggy spotted.","🦎"],
      ["LOC08","Brave feet line up here. Get ready to go fast.","Speed zone found.","🏃"],
      ["LOC10","Ziggy tried spinning and got dizzy. Find the spinner.","Spin complete.","🌀"],
      ["LOC09","Meet everyone at the bottom.","All critters rescued.","🎉"]
    ])
  },
  power:{
    name:"Power Outage", tag:"30 seconds a step. Beat the clock",
    icon:"⚡", rgb:"255,210,63", badge:"Power Restorer", type:"timed", mode:"run", limit:30,
    intro:"Warning! The playground lost power. You have thirty seconds on every step. Go go go!",
    steps:mk("⚡", [
      ["LOC01","Power is down. Core unstable. You have thirty seconds.","Boot started."],
      ["LOC02","Sky circuit offline. Hurry.","Sky online."],
      ["LOC03","Vision node down. Find the lookout.","Vision restored."],
      ["LOC04","Balance core failing. Move.","Balance locked."],
      ["LOC05","Climber motor stalled. Go.","Motor online."],
      ["LOC06","Echo chamber dead. Enter now.","Echo restored."],
      ["LOC07","Ground power low. Crawl.","Ground stable."],
      ["LOC08","Speed circuit unstable. Get there.","Speed online."],
      ["LOC09","Exit sensor failing. Check in.","Sensors live."],
      ["LOC10","Final core unstable. Spin to stabilize.","Power restored."]
    ])
  },
  highlow:{
    name:"High and Low Challenge", tag:"Exact order. No skipping",
    icon:"🧗", rgb:"76,201,240", badge:"High and Low Master", type:"sequence", mode:"think", limit:0,
    intro:"Follow the clues in the exact order. No skipping ahead!",
    steps:mk("🧗", [
      ["LOC01","Start at the climb. Do not skip ahead.","Correct.","🧗"],
      ["LOC02","High first. Go up.","High complete.","⬆️"],
      ["LOC03","Lookout next. Stay in order.","Good.","🔭"],
      ["LOC07","Now go low. Shadow zone.","Low complete.","⬇️"],
      ["LOC04","Cross next. No shortcuts.","Crossed.","🌉"],
      ["LOC05","Climber next. Hands then feet.","Strong.","💪"],
      ["LOC06","Tunnel next. Stay in order.","Clear.","🕳️"],
      ["LOC08","Slide top next.","Ready.","🛝"],
      ["LOC09","Slide exit next.","Clean landing.","🤸"],
      ["LOC10","Finish with a spin.","Sequence complete.","🌀"]
    ])
  },
  loop:{
    name:"The Great Playground Loop", tag:"The floor is lava. Keep moving",
    icon:"🌋", rgb:"255,107,53", badge:"Loop Champion", type:"flow", mode:"run", limit:0,
    intro:"The floor is lava! Keep moving all the way around the loop.",
    steps:mk("🌋", [
      ["LOC01","Loop start. The floor is lava. Keep moving.","Moving."],
      ["LOC02","Stay high. Keep going.","Good pace."],
      ["LOC03","Corner turn. Do not stop.","Nice."],
      ["LOC04","Cross smooth.","Flowing."],
      ["LOC05","Climb and go.","Strong."],
      ["LOC06","Through the tunnel.","Clear."],
      ["LOC07","Low pass. Keep moving.","Nice."],
      ["LOC08","Slide gate. Go.","Whee."],
      ["LOC09","Almost done.","Nearly."],
      ["LOC10","Spin to finish.","Loop complete."]
    ])
  },
  memory:{
    name:"Memory Mode", tag:"Ten secret numbers. Remember them",
    icon:"🧠", rgb:"179,136,255", badge:"Memory Master", type:"memory", mode:"think", limit:0,
    intro:"Ten tags hide ten secret numbers. Find them in order, one to ten. A wrong tag shows its number, so remember it!",
    steps:mk("🧠", [1,2,3,4,5,6,7,8,9,10].map(n => ["ANY", `Find number ${n}.`, `Number ${n} found.`]))
  }
};

const HYPE = ["Yes!", "Awesome!", "Nailed it!", "Boom!", "You rock!", "Great job!", "Super!", "Nice move!", "Way to go!"];
const STREAK_LINES = {3:"Three in a row!", 5:"You are on fire!", 7:"Unstoppable!", 9:"Almost perfect!"};
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* Spoken after every clue so the phone goes back in the pocket before anyone moves. */
const POCKET_CUES = {
  think:[
    "Phone in your pocket. Now go find it!",
    "Pocket it and think. Where could it be?",
    "Phone away. Walk and look around!"
  ],
  run:[
    "Phone in your pocket first. Then go, and watch your step!",
    "Pocket the phone. Then move, and stay safe!"
  ]
};
const AUTO_POCKET_MS = 6000;
const cueFor = () => pick(POCKET_CUES[GAMES[S.game].mode] || POCKET_CUES.think);

/* ---------- elements ---------- */
const IDS = ["confetti","flash","floats","countdown","cdLabel","cdNum","pocketLock","plStep","plHint","tapHear",
  "muteBtn","autoBtn","startCard","gameTiles","parkId","startBtn","resumeBtn","resetBtn","gameCard","gameName","parkName",
  "scoreVal","streakPill","mascot","clue","hint","ringWrap","ringFg","ringNum","stepNum","timeVal","path",
  "playAudioBtn","hintBtn","pocketBtn","badges","demoTarget","simulateCorrect","simulateWrong","endGame",
  "winCard","winIcon","winTitle","winStars","winScore","winMsg","playAgain","backHome"];
const el = {};
IDS.forEach(id => { el[id] = document.getElementById(id); });

/* ---------- storage ---------- */
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const loadJSON = k => {
  const raw = store.get(k);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
};
const pKey = (park, game) => `pq2_${park}_${game}`;
const bKey = (park, game) => `pq2_best_${park}_${game}`;

/* ---------- state ---------- */
const S = {park:"123", game:"power", running:false};
let cur = null;
let busy = false;
let muted = store.get("pq_muted") === "1";
let autoPocket = store.get("pq_autopocket") !== "0";
let autoTimer = null;
let pocket = false;
let lastSayAt = 0;
let ticker = null;
let lastSecLeft = null;
let wake = null;

const save = () => { if(cur) store.set(pKey(S.park, S.game), JSON.stringify(cur)); };
const fmtTime = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const parkValue = () => ((el.parkId.value || "123").trim() || "123");

function setTheme(game){
  document.documentElement.style.setProperty("--acc", GAMES[game].rgb);
}

/* ---------- sound ---------- */
let actx = null;
function audio(){
  if(!actx){
    try{ actx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ actx = null; }
  }
  if(actx && actx.state === "suspended"){ try{ actx.resume(); }catch(e){} }
  return actx;
}
function tone(freq, dur, type, vol, delay){
  if(muted) return;
  const a = audio();
  if(!a) return;
  try{
    const t = a.currentTime + (delay || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }catch(e){}
}
const sfx = {
  pop(){ tone(600, 0.08, "triangle", 0.05); },
  good(streak){
    const lift = 1 + Math.min(streak || 0, 6) * 0.04;
    [523, 659, 784, 1047].forEach((f, i) => tone(f * lift, 0.14, "triangle", 0.08, i * 0.07));
  },
  bad(){ tone(200, 0.18, "sawtooth", 0.06, 0); tone(140, 0.28, "sawtooth", 0.06, 0.16); },
  tick(urgent){ tone(urgent ? 1000 : 700, 0.05, "square", 0.04); },
  count(){ tone(440, 0.16, "square", 0.07); },
  go(){ tone(880, 0.4, "square", 0.08); tone(1320, 0.4, "triangle", 0.06, 0.02); },
  hint(){ tone(700, 0.1, "triangle", 0.06); tone(520, 0.14, "triangle", 0.06, 0.1); },
  lock(){ tone(520, 0.1, "triangle", 0.05); tone(390, 0.16, "triangle", 0.05, 0.1); },
  win(){ [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, "triangle", 0.09, i * 0.12)); }
};
const vib = pattern => { try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){} };

/* ---------- speech ---------- */
let pending = [];
let needTap = false;
function setNeedTap(v){
  needTap = v;
  el.tapHear.classList.toggle("hidden", !v);
  /* The pocket lock covers the banner, so say it on the lock screen too. */
  el.plHint.textContent = v ? "Tap the screen once to hear the clue." : "Touch is locked. Press and hold anywhere for 2 seconds to unlock.";
  el.plHint.classList.toggle("alert", v);
}
function speakNow(lines){
  if(muted || !("speechSynthesis" in window)) return;
  try{
    const s = window.speechSynthesis;
    s.cancel();
    let started = false;
    lines.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t);
      u.rate = 1.08;
      u.pitch = 1.1;
      if(i === 0){
        u.onstart = () => { started = true; setNeedTap(false); };
        u.onerror = ev => { if(ev && ev.error === "not-allowed") setNeedTap(true); };
      }
      s.speak(u);
    });
    setTimeout(() => {
      const ua = navigator.userActivation;
      if(!started && !muted && ua && !ua.hasBeenActive) setNeedTap(true);
    }, 1200);
  }catch(e){}
}
function say(...lines){
  pending = lines.filter(Boolean);
  lastSayAt = Date.now();
  speakNow(pending);
}
const unlockAudio = () => {
  audio();
  if(needTap){ setNeedTap(false); speakNow(pending); }
};
document.addEventListener("pointerup", unlockAudio, {passive:true});
document.addEventListener("click", unlockAudio, {passive:true});

function updateMuteBtn(){ el.muteBtn.textContent = muted ? "🔇" : "🔊"; }
el.muteBtn.addEventListener("click", () => {
  muted = !muted;
  store.set("pq_muted", muted ? "1" : "0");
  if(muted){ try{ window.speechSynthesis.cancel(); }catch(e){} }
  updateMuteBtn();
  if(!muted) sfx.pop();
});

/* ---------- effects ---------- */
function flash(kind){
  el.flash.className = "";
  void el.flash.offsetWidth;
  el.flash.className = kind;
  /* In pocket mode the black lock screen flashes green or red so a tap shows even with the screen locked. */
  if(pocket){
    el.pocketLock.classList.remove("flash-good", "flash-bad");
    el.pocketLock.classList.add("flash-" + kind);
    setTimeout(() => el.pocketLock.classList.remove("flash-" + kind), 700);
  }
}
function shake(){
  el.gameCard.classList.remove("shake");
  void el.gameCard.offsetWidth;
  el.gameCard.classList.add("shake");
}
function floatText(text, cls){
  const d = document.createElement("div");
  d.className = "float " + (cls || "");
  d.textContent = text;
  el.floats.appendChild(d);
  setTimeout(() => d.remove(), 1100);
}

const cctx = (el.confetti.getContext && el.confetti.getContext("2d")) || null;
const COLORS = ["#3ddc97", "#ffd23f", "#4cc9f0", "#ff6b35", "#b388ff", "#ff5d8f"];
let parts = [];
let raf = null;
function sizeCanvas(){
  el.confetti.width = window.innerWidth;
  el.confetti.height = window.innerHeight;
}
function loop(){
  if(!cctx) return;
  cctx.clearRect(0, 0, el.confetti.width, el.confetti.height);
  parts = parts.filter(p => p.life > 0 && p.y < el.confetti.height + 20);
  parts.forEach(p => {
    p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life -= 0.006;
    cctx.save();
    cctx.globalAlpha = Math.max(0, p.life);
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.fillStyle = p.c;
    cctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
    cctx.restore();
  });
  raf = parts.length ? requestAnimationFrame(loop) : null;
}
function burst(n, x, y, power){
  if(!cctx || typeof requestAnimationFrame !== "function") return;
  sizeCanvas();
  for(let i = 0; i < n; i++){
    parts.push({
      x, y,
      vx:(Math.random() - 0.5) * power,
      vy:-(Math.random() * power * 0.9) - 2,
      s:4 + Math.random() * 6,
      rot:Math.random() * 6,
      vr:(Math.random() - 0.5) * 0.4,
      c:COLORS[i % COLORS.length],
      life:1
    });
  }
  if(!raf) raf = requestAnimationFrame(loop);
}
function bigConfetti(){
  const w = window.innerWidth, h = window.innerHeight;
  burst(80, w * 0.2, h * 0.6, 14);
  burst(80, w * 0.8, h * 0.6, 14);
  setTimeout(() => burst(100, w * 0.5, h * 0.45, 16), 350);
  setTimeout(() => { burst(60, w * 0.3, h * 0.5, 12); burst(60, w * 0.7, h * 0.5, 12); }, 800);
}

/* ---------- wake lock ---------- */
async function keepAwake(){
  try{
    if("wakeLock" in navigator){ wake = await navigator.wakeLock.request("screen"); }
  }catch(e){}
}
function releaseAwake(){
  try{ if(wake){ wake.release(); wake = null; } }catch(e){}
}

/* ---------- progress ---------- */
function newProgress(){
  const now = Date.now();
  const p = {
    park:S.park, game:S.game, started:now, stepStart:now, step:1, score:0, streak:0,
    bestStreak:0, mistakes:0, won:false, hintShown:false, revealed:{}, memoryMap:null,
    lastLoc:null, lastLocAt:0
  };
  if(GAMES[S.game].type === "memory"){
    const nums = [1,2,3,4,5,6,7,8,9,10];
    for(let i = nums.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    p.memoryMap = {};
    Object.keys(LOC_NAMES).forEach((loc, i) => { p.memoryMap[loc] = nums[i]; });
  }
  return p;
}
function currentClue(){
  const g = GAMES[S.game];
  const s = g.steps[Math.min(cur.step, TOTAL) - 1];
  return s ? s.audio : "";
}
function expectedLoc(){
  const g = GAMES[S.game];
  if(g.type === "memory"){
    return Object.keys(cur.memoryMap).find(l => cur.memoryMap[l] === cur.step) || "LOC01";
  }
  return g.steps[cur.step - 1].loc;
}
function hintText(){
  const g = GAMES[S.game];
  if(g.type === "memory"){
    const seen = Object.entries(cur.revealed || {})
      .filter(([loc, n]) => n >= cur.step)
      .map(([loc, n]) => `${LOC_NAMES[loc]} is ${n}`);
    return seen.length ? "You have seen: " + seen.join(", ") : "";
  }
  if(cur.hintShown) return "Hint: look near the " + LOC_NAMES[g.steps[cur.step - 1].loc];
  return "";
}

/* ---------- rendering ---------- */
function show(card){
  [el.startCard, el.gameCard, el.winCard].forEach(c => c.classList.add("hidden"));
  card.classList.remove("hidden");
}
function renderBadges(){
  el.badges.innerHTML = "";
  Object.entries(GAMES).forEach(([gid, g]) => {
    const b = document.createElement("div");
    const earned = !!loadJSON(bKey(S.park, gid));
    b.className = "badge" + (earned ? " earned" : "");
    b.textContent = (earned ? "🏅 " : "⬜ ") + g.badge;
    el.badges.appendChild(b);
  });
}
function render(){
  if(!cur) return;
  const g = GAMES[S.game];
  const stepIdx = Math.min(cur.step, TOTAL) - 1;
  const stepObj = g.steps[stepIdx];
  setTheme(S.game);
  el.gameName.textContent = g.name;
  el.parkName.textContent = S.park;
  el.scoreVal.textContent = cur.score;
  el.streakPill.textContent = "🔥 " + cur.streak;
  el.streakPill.classList.toggle("hidden", cur.streak < 2);
  el.mascot.textContent = g.type === "memory" ? String(cur.step) : stepObj.icon;
  el.clue.textContent = currentClue();
  el.hint.textContent = hintText();
  el.stepNum.textContent = cur.step;
  el.ringWrap.classList.toggle("hidden", !g.limit);
  el.path.innerHTML = "";
  for(let i = 1; i <= TOTAL; i++){
    const d = document.createElement("div");
    d.className = "dot" + (i < cur.step ? " done" : (i === cur.step ? " current" : ""));
    d.textContent = i < cur.step ? "✓" : String(i);
    el.path.appendChild(d);
  }
  if(g.type === "memory"){
    el.demoTarget.textContent = "Secret map: " + Object.entries(cur.memoryMap).map(([l, n]) => `${l}=${n}`).join(", ");
  }else{
    el.demoTarget.textContent = `Next tag: ${stepObj.loc}, ${LOC_NAMES[stepObj.loc]}`;
  }
  el.plStep.textContent = `Step ${Math.min(cur.step, TOTAL)} of ${TOTAL}. Score ${cur.score}.`;
  renderBadges();
}

/* ---------- timer ---------- */
function stopTick(){
  if(ticker) clearInterval(ticker);
  ticker = null;
  lastSecLeft = null;
  document.body.classList.remove("alarm");
  el.ringWrap.classList.remove("danger");
}
function startTick(){
  stopTick();
  ticker = setInterval(tick, 200);
}
function tick(){
  if(busy || document.hidden || !S.running) return;
  const fresh = loadJSON(pKey(S.park, S.game));
  if(!fresh || fresh.won) return;
  cur = fresh;
  const g = GAMES[S.game];
  const now = Date.now();
  el.timeVal.textContent = fmtTime(now - cur.started);
  if(g.limit){
    const remain = Math.max(0, g.limit * 1000 - (now - cur.stepStart));
    const secLeft = Math.ceil(remain / 1000);
    el.ringFg.style.strokeDashoffset = String(CIRC * (1 - remain / (g.limit * 1000)));
    el.ringNum.textContent = String(secLeft);
    const danger = secLeft <= 10;
    el.ringWrap.classList.toggle("danger", danger);
    document.body.classList.toggle("alarm", danger);
    if(secLeft !== lastSecLeft){
      lastSecLeft = secLeft;
      if(secLeft > 0 && (danger || secLeft % 5 === 0)) sfx.tick(danger);
    }
    if(remain <= 0){ onTimeout(); return; }
  }
  if(pocket && !muted && now - lastSayAt > REMIND_MS){
    say("Reminder.", currentClue());
  }
}
function onTimeout(){
  cur.mistakes++;
  cur.streak = 0;
  cur.stepStart = Date.now();
  save();
  sfx.bad(); vib([150, 60, 150]); shake(); flash("bad");
  say("Time is up. Try that step again.", currentClue());
  render();
}

/* ---------- game events ---------- */
function onCorrect(stepObj){
  const g = GAMES[S.game];
  cur.streak++;
  cur.bestStreak = Math.max(cur.bestStreak, cur.streak);
  let pts = 100 + Math.min(cur.streak - 1, 5) * 25;
  if(g.limit){
    const left = Math.max(0, Math.ceil((g.limit * 1000 - (Date.now() - cur.stepStart)) / 1000));
    pts += left * 3;
  }
  cur.score += pts;
  cur.step++;
  cur.stepStart = Date.now();
  cur.hintShown = false;
  sfx.good(cur.streak);
  vib([40, 30, 40]);
  flash("good");
  floatText("+" + pts);
  burst(26, window.innerWidth / 2, window.innerHeight * 0.38, 9);
  if(cur.step > TOTAL){
    onWin(stepObj);
    return;
  }
  save();
  render();
  const praise = STREAK_LINES[cur.streak] || pick(HYPE);
  say(praise, stepObj.success, currentClue(), cueFor());
  scheduleAutoPocket();
}
function onWrong(line){
  cur.streak = 0;
  cur.mistakes++;
  save();
  sfx.bad(); vib([150]); shake(); flash("bad");
  say(line);
  render();
}
function onWin(){
  const g = GAMES[S.game];
  cur.score += 250;
  if(cur.mistakes === 0) cur.score += 250;
  cur.won = true;
  const total = Date.now() - cur.started;
  cur.totalMs = total;
  save();
  const stars = cur.mistakes === 0 ? 3 : (cur.mistakes <= 2 ? 2 : 1);
  const prev = loadJSON(bKey(S.park, S.game));
  const best = {
    ms:prev ? Math.min(prev.ms, total) : total,
    score:prev ? Math.max(prev.score, cur.score) : cur.score,
    stars:prev ? Math.max(prev.stars, stars) : stars
  };
  store.set(bKey(S.park, S.game), JSON.stringify(best));
  stopTick();
  S.running = false;
  if(pocket) setPocket(false, true);
  el.winIcon.textContent = g.icon;
  el.winTitle.textContent = "Badge earned: " + g.badge;
  el.winStars.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  el.winScore.textContent = cur.score + " points";
  el.winMsg.textContent =
    `Finished in ${fmtTime(total)} with ${cur.mistakes} mistakes. Best streak ${cur.bestStreak}. ` +
    `Your best time is ${fmtTime(best.ms)} and your best score is ${best.score}.`;
  show(el.winCard);
  sfx.win(); vib([100, 60, 100, 60, 300]); bigConfetti();
  say("Badge earned!", g.badge + ".", `${stars} ${stars === 1 ? "star" : "stars"}. ${cur.score} points.`);
}
function showFinishedCard(){
  const g = GAMES[S.game];
  const best = loadJSON(bKey(S.park, S.game));
  el.winIcon.textContent = g.icon;
  el.winTitle.textContent = "Badge earned: " + g.badge;
  const stars = best ? best.stars : 1;
  el.winStars.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  el.winScore.textContent = (cur.score || 0) + " points";
  el.winMsg.textContent = "You already finished this game. Play again to beat your score.";
  show(el.winCard);
}

function handleTap(loc, opts){
  opts = opts || {};
  if(busy) return;
  const fresh = loadJSON(pKey(S.park, S.game));
  cur = fresh || newProgress();
  if(!fresh) save();
  const g = GAMES[S.game];
  if(cur.won){
    say("This game is already complete. Pick another game or play again.");
    return;
  }
  const now = Date.now();
  if(!opts.sim && loc === cur.lastLoc && now - cur.lastLocAt < 3000) return;
  cur.lastLoc = loc;
  cur.lastLocAt = now;
  if(g.type === "memory"){
    const num = cur.memoryMap[loc];
    if(!num){ onWrong("That tag is not part of this playground."); return; }
    if(num === cur.step){ onCorrect(g.steps[cur.step - 1]); return; }
    cur.revealed[loc] = num;
    onWrong(`Not that one. That was number ${num}. Remember it!`);
    return;
  }
  const stepObj = g.steps[cur.step - 1];
  if(loc === stepObj.loc) onCorrect(stepObj);
  else onWrong(g.type === "sequence" ? "Not yet. Stay in order." : "Wrong spot. Try again.");
}

/* ---------- pocket mode ---------- */
const PL_DEFAULT = "Touch is locked. Press and hold anywhere for 2 seconds to unlock.";
const PL_TAP = "Tap the screen once to hear the clue.";
function scheduleAutoPocket(){
  if(autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
  if(!autoPocket || pocket) return;
  autoTimer = setTimeout(() => {
    autoTimer = null;
    /* Never lock while sound is off or blocked, because then the screen is the only clue. */
    if(S.running && !pocket && !needTap && !muted && cur && !cur.won){
      setPocket(true, true);
      sfx.lock();
    }
  }, AUTO_POCKET_MS);
}
function updateAutoBtn(){
  el.autoBtn.textContent = autoPocket ? "🔒 Auto pocket: On" : "🔓 Auto pocket: Off";
}
function setPocket(on, quiet){
  pocket = on;
  if(autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
  store.set("pq_pocket", on ? "1" : "0");
  el.pocketLock.classList.toggle("hidden", !on);
  document.body.classList.toggle("pocket", on);
  el.plHint.textContent = needTap ? PL_TAP : PL_DEFAULT;
  if(on){
    keepAwake();
    if(cur) el.plStep.textContent = `Step ${Math.min(cur.step, TOTAL)} of ${TOTAL}. Score ${cur.score}.`;
    if(!quiet) say("Pocket mode on. Touch is locked. Press and hold for two seconds to unlock.");
  }else if(!quiet){
    say("Pocket mode off.");
  }
}
let holdTimer = null;
el.pocketLock.addEventListener("pointerdown", ev => {
  ev.preventDefault();
  el.plHint.textContent = "Keep holding to unlock...";
  if(holdTimer) clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { holdTimer = null; setPocket(false); }, 2000);
});
["pointerup", "pointercancel", "pointerleave"].forEach(evt => {
  el.pocketLock.addEventListener(evt, () => {
    if(holdTimer){
      clearTimeout(holdTimer);
      holdTimer = null;
      el.plHint.textContent = needTap ? PL_TAP : PL_DEFAULT;
    }
  });
});
el.pocketLock.addEventListener("contextmenu", ev => ev.preventDefault());

/* ---------- flow ---------- */
function enterGame(){
  S.running = true;
  setTheme(S.game);
  show(el.gameCard);
  render();
  startTick();
  keepAwake();
}
function runCountdown(game){
  return new Promise(resolve => {
    el.countdown.classList.remove("hidden");
    const seq = ["3", "2", "1", "GO!"];
    let i = 0;
    const next = () => {
      if(i >= seq.length){
        el.countdown.classList.add("hidden");
        resolve();
        return;
      }
      const n = seq[i];
      el.cdLabel.textContent = i === 0 ? "Get ready" : GAMES[game].name;
      el.cdNum.textContent = n;
      el.cdNum.style.animation = "none";
      void el.cdNum.offsetWidth;
      el.cdNum.style.animation = "";
      if(n === "GO!"){ sfx.go(); vib([80, 40, 200]); } else { sfx.count(); }
      i++;
      setTimeout(next, n === "GO!" ? 700 : 850);
    };
    next();
  });
}
async function beginRun(){
  if(busy) return;
  S.park = parkValue();
  store.set("pq_last_park", S.park);
  store.set("pq_last_game", S.game);
  busy = true;
  audio();
  await runCountdown(S.game);
  cur = newProgress();
  save();
  busy = false;
  enterGame();
  say(GAMES[S.game].intro, currentClue(), cueFor());
  scheduleAutoPocket();
}
function resumeRun(){
  S.park = parkValue();
  const p = loadJSON(pKey(S.park, S.game));
  if(!p || p.won) return;
  cur = p;
  cur.stepStart = Date.now();
  save();
  enterGame();
  say("Welcome back.", currentClue(), cueFor());
  scheduleAutoPocket();
}
function goHome(){
  stopTick();
  S.running = false;
  releaseAwake();
  if(pocket) setPocket(false, true);
  show(el.startCard);
  refreshResume();
}
function refreshResume(){
  const p = loadJSON(pKey(parkValue(), S.game));
  el.resumeBtn.classList.toggle("hidden", !(p && !p.won && p.step > 1));
}
function selectGame(id){
  S.game = id;
  store.set("pq_last_game", id);
  setTheme(id);
  document.querySelectorAll(".tile").forEach(t => t.classList.toggle("selected", t.dataset.game === id));
  refreshResume();
  sfx.pop();
}
function buildTiles(){
  el.gameTiles.innerHTML = "";
  Object.entries(GAMES).forEach(([id, g]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    b.dataset.game = id;
    b.style.setProperty("--t", g.rgb);
    const chip = g.mode === "run" ? "Run" : "Think";
    b.innerHTML = `<span class="tile-top"><span class="tile-icon">${g.icon}</span><span class="chip ${g.mode}">${chip}</span></span>` +
      `<span class="tile-name">${g.name}</span><span class="tile-tag">${g.tag}</span>`;
    b.addEventListener("click", () => selectGame(id));
    el.gameTiles.appendChild(b);
  });
}

/* ---------- buttons ---------- */
el.startBtn.addEventListener("click", beginRun);
el.resumeBtn.addEventListener("click", resumeRun);
el.parkId.addEventListener("input", refreshResume);
el.resetBtn.addEventListener("click", () => {
  const park = parkValue();
  Object.keys(GAMES).forEach(g => { store.del(pKey(park, g)); store.del(bKey(park, g)); });
  say("Progress reset.");
  refreshResume();
  alert("Progress reset for playground " + park);
});
el.playAudioBtn.addEventListener("click", () => {
  if(!cur) return;
  const h = hintText();
  say(currentClue(), GAMES[S.game].type === "memory" ? h : "");
});
el.hintBtn.addEventListener("click", () => {
  if(!cur || cur.won) return;
  const g = GAMES[S.game];
  if(g.type === "memory"){
    say("Tap any tag. A wrong tag tells you its number, so listen and remember.");
    return;
  }
  if(!cur.hintShown){
    cur.hintShown = true;
    cur.score = Math.max(0, cur.score - 50);
    save();
    floatText("-50", "bad");
  }
  sfx.hint();
  say("Hint. Look near the " + LOC_NAMES[g.steps[cur.step - 1].loc] + ".");
  render();
});
el.pocketBtn.addEventListener("click", () => { if(cur && !cur.won) setPocket(true); });
el.autoBtn.addEventListener("click", () => {
  autoPocket = !autoPocket;
  store.set("pq_autopocket", autoPocket ? "1" : "0");
  updateAutoBtn();
  if(autoPocket) scheduleAutoPocket();
  else if(autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
});
el.simulateCorrect.addEventListener("click", () => {
  if(!cur) return;
  handleTap(expectedLoc(), {sim:true});
});
el.simulateWrong.addEventListener("click", () => {
  if(!cur) return;
  const exp = expectedLoc();
  const options = Object.keys(LOC_NAMES).filter(l => l !== exp);
  handleTap(pick(options), {sim:true});
});
el.endGame.addEventListener("click", () => {
  if(!cur || cur.won) return;
  cur.step = TOTAL;
  handleTap(expectedLoc(), {sim:true});
});
el.playAgain.addEventListener("click", () => { beginRun(); });
el.backHome.addEventListener("click", goHome);
el.tapHear.addEventListener("click", unlockAudio);

document.addEventListener("visibilitychange", () => {
  if(document.hidden) return;
  if(S.running){
    keepAwake();
    const g = GAMES[S.game];
    const fresh = loadJSON(pKey(S.park, S.game));
    if(fresh && !fresh.won && g.limit){
      cur = fresh;
      cur.stepStart = Date.now();
      save();
    }
  }
});

/* ---------- start up ---------- */
(function init(){
  updateMuteBtn();
  updateAutoBtn();
  buildTiles();
  const lp = store.get("pq_last_park");
  const lg = store.get("pq_last_game");
  if(lp){ S.park = lp; el.parkId.value = lp; }
  if(lg && GAMES[lg]) S.game = lg;

  const u = new URL(window.location.href);
  const pParam = u.searchParams.get("park");
  const gParam = u.searchParams.get("game");
  const locParam = u.searchParams.get("loc");

  if(pParam){ S.park = pParam.trim() || S.park; el.parkId.value = S.park; store.set("pq_last_park", S.park); }
  if(gParam && GAMES[gParam]){ S.game = gParam; store.set("pq_last_game", S.game); }
  selectGame(S.game);

  if(locParam || pParam || gParam){
    const existing = loadJSON(pKey(S.park, S.game));
    cur = existing || newProgress();
    if(!existing) save();
    if(cur.won){
      showFinishedCard();
      say("This game is already complete. Pick another game or play again.");
    }else{
      enterGame();
      if(store.get("pq_pocket") === "1") setPocket(true, true);
      if(locParam){
        handleTap(locParam.trim().toUpperCase());
        try{ history.replaceState(null, "", window.location.pathname); }catch(e){}
      }
    }
  }else{
    show(el.startCard);
    setPocket(false, true);
  }
})();
