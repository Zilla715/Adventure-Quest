/*
PlayQuest demo build.

How the NFC tags work with this page:
Each physical tag is written with a URL like
  https://YOURDOMAIN/index.html?park=123&loc=LOC04
Leave the game out of the tag URL. That way the same 10 tags work for
every game below, and the game itself is chosen inside the app before
you start. If a tag URL does include &game=, that value wins for that
one tap, which is only useful if you want a tag locked to one game.

Progress is stored in the browser with localStorage, so this is a
proof of concept, not the final product.
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

const GAMES = {
  critters:{
    name:"Rescue the Playground Critters",
    badge:"Critter Rescuer",
    type:"explore",
    timed:false,
    steps:[
      {step:1,loc:"LOC01",audio:"Start the search. Climb up where the adventure begins.",success:"Nice. Trail found."},
      {step:2,loc:"LOC02",audio:"Benny likes wind and views. Go high.",success:"Benny is safe."},
      {step:3,loc:"LOC07",audio:"Molly hides where sunlight never goes.",success:"Molly found."},
      {step:4,loc:"LOC04",audio:"Tina took the long wobbly path.",success:"Tina rescued."},
      {step:5,loc:"LOC06",audio:"Wally likes echo rooms.",success:"Wally is happy."},
      {step:6,loc:"LOC05",audio:"Pip climbed everything. Find the tricky route.",success:"Pip is back."},
      {step:7,loc:"LOC03",audio:"Ziggy is watching from a corner.",success:"Ziggy spotted."},
      {step:8,loc:"LOC08",audio:"Brave feet line up here.",success:"Speed zone found."},
      {step:9,loc:"LOC10",audio:"Ziggy tried spinning and got dizzy.",success:"Spin complete."},
      {step:10,loc:"LOC09",audio:"Meet everyone at the bottom.",success:"All critters rescued."}
    ]
  },
  power:{
    name:"Power Outage",
    badge:"Power Restorer",
    type:"timed",
    timed:true,
    time_limit_sec:30,
    steps:[
      {step:1,loc:"LOC01",audio:"Power is down. Core unstable. You have thirty seconds.",success:"Boot started."},
      {step:2,loc:"LOC02",audio:"Sky circuit offline. Hurry.",success:"Sky online."},
      {step:3,loc:"LOC03",audio:"Vision node down. Find the lookout.",success:"Vision restored."},
      {step:4,loc:"LOC04",audio:"Balance core failing. Move.",success:"Balance locked."},
      {step:5,loc:"LOC05",audio:"Climber motor stalled. Go.",success:"Motor online."},
      {step:6,loc:"LOC06",audio:"Echo chamber dead. Enter now.",success:"Echo restored."},
      {step:7,loc:"LOC07",audio:"Ground power low. Crawl.",success:"Ground stable."},
      {step:8,loc:"LOC08",audio:"Speed circuit unstable. Get there.",success:"Speed online."},
      {step:9,loc:"LOC09",audio:"Exit sensor failing. Check in.",success:"Sensors live."},
      {step:10,loc:"LOC10",audio:"Final core unstable. Spin to stabilize.",success:"Power restored."}
    ]
  },
  highlow:{
    name:"High and Low Challenge",
    badge:"High and Low Master",
    type:"sequence",
    timed:false,
    steps:[
      {step:1,loc:"LOC01",audio:"Start at the climb. Do not skip ahead.",success:"Correct."},
      {step:2,loc:"LOC02",audio:"High first. Go up.",success:"High complete."},
      {step:3,loc:"LOC03",audio:"Lookout next. Stay in order.",success:"Good."},
      {step:4,loc:"LOC07",audio:"Now go low. Shadow zone.",success:"Low complete."},
      {step:5,loc:"LOC04",audio:"Cross next. No shortcuts.",success:"Crossed."},
      {step:6,loc:"LOC05",audio:"Climber next. Hands then feet.",success:"Strong."},
      {step:7,loc:"LOC06",audio:"Tunnel next. Stay in order.",success:"Clear."},
      {step:8,loc:"LOC08",audio:"Slide top next.",success:"Ready."},
      {step:9,loc:"LOC09",audio:"Slide exit next.",success:"Clean landing."},
      {step:10,loc:"LOC10",audio:"Finish with a spin.",success:"Sequence complete."}
    ]
  },
  loop:{
    name:"The Great Playground Loop",
    badge:"Loop Champion",
    type:"flow",
    timed:false,
    steps:[
      {step:1,loc:"LOC01",audio:"Loop start. Floor is lava. Keep moving.",success:"Moving."},
      {step:2,loc:"LOC02",audio:"Stay high. Keep going.",success:"Good pace."},
      {step:3,loc:"LOC03",audio:"Corner turn. Do not stop.",success:"Nice."},
      {step:4,loc:"LOC04",audio:"Cross smooth.",success:"Flowing."},
      {step:5,loc:"LOC05",audio:"Climb and go.",success:"Strong."},
      {step:6,loc:"LOC06",audio:"Through the tunnel.",success:"Clear."},
      {step:7,loc:"LOC07",audio:"Low pass. Keep moving.",success:"Nice."},
      {step:8,loc:"LOC08",audio:"Slide gate. Go.",success:"Whee."},
      {step:9,loc:"LOC09",audio:"Almost done.",success:"Nearly."},
      {step:10,loc:"LOC10",audio:"Spin to finish.",success:"Loop complete."}
    ]
  },
  memory:{
    name:"Memory Mode",
    badge:"Memory Master",
    type:"memory",
    timed:false,
    steps:[1,2,3,4,5,6,7,8,9,10].map(n => ({step:n, loc:"ANY", audio:`Find number ${n}.`, success:`Number ${n} found.`}))
  }
};

const qs = s => document.querySelector(s);
const el = {
  startCard:qs("#startCard"),
  gameCard:qs("#gameCard"),
  winCard:qs("#winCard"),
  parkId:qs("#parkId"),
  gameSelect:qs("#gameSelect"),
  startBtn:qs("#startBtn"),
  resetBtn:qs("#resetBtn"),
  gameName:qs("#gameName"),
  parkName:qs("#parkName"),
  statusPill:qs("#statusPill"),
  instruction:qs("#instruction"),
  detail:qs("#detail"),
  playAudioBtn:qs("#playAudioBtn"),
  pocketBtn:qs("#pocketBtn"),
  stepNum:qs("#stepNum"),
  timeVal:qs("#timeVal"),
  badges:qs("#badges"),
  simulateCorrect:qs("#simulateCorrect"),
  simulateWrong:qs("#simulateWrong"),
  endGame:qs("#endGame"),
  winTitle:qs("#winTitle"),
  winMsg:qs("#winMsg"),
  playAgain:qs("#playAgain"),
  backHome:qs("#backHome")
};

const getParams = () => {
  const u = new URL(window.location.href);
  return {park:u.searchParams.get("park"), game:u.searchParams.get("game"), loc:u.searchParams.get("loc")};
};

const storageKey = (park, game) => `pq_demo_${park}_${game}`;
const nowMs = () => Date.now();

const fmtTime = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

const speak = text => {
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 1.05;
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  }catch(e){}
};

let ctx = null;
const beep = hz => {
  try{
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = hz;
    g.gain.value = 0.025;
    o.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime;
    o.start(t);
    o.stop(t + 0.08);
  }catch(e){}
};
const chime = () => { beep(660); setTimeout(() => beep(880), 90); };
const buzz = () => { beep(180); };
const vibrate = ms => { if(navigator.vibrate) navigator.vibrate(ms); };

const initGameSelect = () => {
  el.gameSelect.innerHTML = "";
  Object.entries(GAMES).forEach(([id, g]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = g.name;
    el.gameSelect.appendChild(opt);
  });
};

const loadProgress = (park, game) => {
  const raw = localStorage.getItem(storageKey(park, game));
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
};
const saveProgress = (park, game, prog) => localStorage.setItem(storageKey(park, game), JSON.stringify(prog));
const resetProgress = (park, game) => localStorage.removeItem(storageKey(park, game));

const newProgress = (park, game) => {
  const started = nowMs();
  const prog = {park, game, started, step:1, won:false, bestMs:null, lastStepStartMs:started, memoryMap:null};
  if(GAMES[game].type === "memory"){
    const locs = Object.keys(LOC_NAMES);
    const nums = [1,2,3,4,5,6,7,8,9,10].sort(() => Math.random() - 0.5);
    prog.memoryMap = {};
    locs.forEach((loc, i) => prog.memoryMap[loc] = nums[i]);
  }
  return prog;
};

let ticker = null;
const stopTick = () => { if(ticker) clearInterval(ticker); ticker = null; };

const startTick = (park, game) => {
  stopTick();
  ticker = setInterval(() => {
    const prog = loadProgress(park, game);
    if(!prog || prog.won) return;
    el.timeVal.textContent = fmtTime(nowMs() - prog.started);
    const g = GAMES[game];
    if(g.timed){
      const stepElapsed = nowMs() - prog.lastStepStartMs;
      const remain = Math.max(0, g.time_limit_sec * 1000 - stepElapsed);
      const secLeft = Math.ceil(remain / 1000);
      if(secLeft <= 5) beep(880);
      else if(secLeft % 5 === 0) beep(560);
      if(remain <= 0){
        buzz(); vibrate(120);
        speak("Time. Try that step again.");
        prog.lastStepStartMs = nowMs();
        saveProgress(park, game, prog);
      }
    }
  }, 1000);
};

const show = card => {
  el.startCard.classList.add("hidden");
  el.gameCard.classList.add("hidden");
  el.winCard.classList.add("hidden");
  card.classList.remove("hidden");
};

const expectedLoc = (game, prog) => {
  if(GAMES[game].type === "memory") return "ANY";
  const s = GAMES[game].steps.find(x => x.step === prog.step);
  return s ? s.loc : null;
};

const currentAudio = (game, prog) => {
  if(GAMES[game].type === "memory") return `Find number ${prog.step}.`;
  const s = GAMES[game].steps.find(x => x.step === prog.step);
  return s ? s.audio : "";
};

const currentDetail = (game, prog) => {
  const exp = expectedLoc(game, prog);
  if(exp === "ANY") return "Tap any location tag until you find the right number.";
  return `Next target: ${exp}, ${LOC_NAMES[exp] || ""}`;
};

const renderBadges = park => {
  el.badges.innerHTML = "";
  Object.entries(GAMES).forEach(([gid, g]) => {
    const prog = loadProgress(park, gid);
    const earned = !!(prog && prog.won);
    const b = document.createElement("div");
    b.className = "badge" + (earned ? " earned" : "");
    b.textContent = (earned ? "Earned: " : "Not yet: ") + g.badge;
    el.badges.appendChild(b);
  });
};

const goToGame = (park, game) => {
  const prog = loadProgress(park, game) || newProgress(park, game);
  saveProgress(park, game, prog);

  el.gameName.textContent = GAMES[game].name;
  el.parkName.textContent = park;
  el.stepNum.textContent = prog.step;
  el.statusPill.textContent = prog.won ? "Complete" : "Active";
  el.detail.textContent = currentDetail(game, prog);
  renderBadges(park);

  show(el.gameCard);
  startTick(park, game);
  speak(currentAudio(game, prog));
};

const win = (park, game, prog) => {
  prog.won = true;
  const total = nowMs() - prog.started;
  prog.bestMs = prog.bestMs === null ? total : Math.min(prog.bestMs, total);
  saveProgress(park, game, prog);
  stopTick();
  el.winTitle.textContent = "Badge: " + GAMES[game].badge;
  el.winMsg.textContent = `Completed ${GAMES[game].name} in ${fmtTime(total)}. Best time so far, ${fmtTime(prog.bestMs)}.`;
  speak(`Badge earned. ${GAMES[game].badge}.`);
  show(el.winCard);
};

const handleTap = (park, game, loc) => {
  const g = GAMES[game];
  let prog = loadProgress(park, game) || newProgress(park, game);
  if(prog.won){ speak("This game is already complete. Pick another game."); return; }

  if(g.type === "memory"){
    const num = prog.memoryMap && prog.memoryMap[loc];
    if(!num){ buzz(); speak("That tag is not part of this playground."); return; }
    if(num === prog.step){
      chime(); vibrate(60);
      speak(`Correct. Number ${num}.`);
      prog.step += 1;
      prog.lastStepStartMs = nowMs();
      if(prog.step > 10){ win(park, game, prog); return; }
      saveProgress(park, game, prog);
      el.stepNum.textContent = prog.step;
      el.detail.textContent = currentDetail(game, prog);
      speak(currentAudio(game, prog));
      return;
    }
    buzz(); vibrate(120);
    speak(`Not that one. That was ${num}. Remember it for later.`);
    return;
  }

  const exp = expectedLoc(game, prog);
  if(loc === exp){
    chime(); vibrate(60);
    const stepObj = g.steps.find(x => x.step === prog.step);
    speak(stepObj ? stepObj.success : "Good.");
    prog.step += 1;
    prog.lastStepStartMs = nowMs();
    if(prog.step > 10){ win(park, game, prog); return; }
    saveProgress(park, game, prog);
    el.stepNum.textContent = prog.step;
    el.detail.textContent = currentDetail(game, prog);
    speak(currentAudio(game, prog));
    return;
  }

  buzz(); vibrate(120);
  speak(g.type === "sequence" ? "Not yet. Stay in order." : "Wrong spot. Try the next clue.");
};

el.startBtn.addEventListener("click", () => {
  const park = (el.parkId.value || "123").trim();
  const game = el.gameSelect.value;
  localStorage.setItem("pq_last_park", park);
  localStorage.setItem("pq_last_game", game);
  if(!loadProgress(park, game)) saveProgress(park, game, newProgress(park, game));
  goToGame(park, game);
});

el.resetBtn.addEventListener("click", () => {
  const park = (el.parkId.value || "123").trim();
  Object.keys(GAMES).forEach(g => resetProgress(park, g));
  speak("Progress reset.");
  alert("Progress reset for playground " + park);
});

el.playAudioBtn.addEventListener("click", () => {
  const park = localStorage.getItem("pq_last_park") || "123";
  const game = localStorage.getItem("pq_last_game") || "power";
  const prog = loadProgress(park, game);
  if(prog) speak(currentAudio(game, prog));
});

el.pocketBtn.addEventListener("click", () => {
  document.body.classList.toggle("pocket");
  speak(document.body.classList.contains("pocket") ? "Pocket mode on." : "Pocket mode off.");
});

el.simulateCorrect.addEventListener("click", () => {
  const park = localStorage.getItem("pq_last_park") || "123";
  const game = localStorage.getItem("pq_last_game") || "power";
  const prog = loadProgress(park, game) || newProgress(park, game);
  const exp = expectedLoc(game, prog);
  handleTap(park, game, exp === "ANY" ? "LOC01" : exp);
});

el.simulateWrong.addEventListener("click", () => {
  const park = localStorage.getItem("pq_last_park") || "123";
  const game = localStorage.getItem("pq_last_game") || "power";
  const prog = loadProgress(park, game) || newProgress(park, game);
  const exp = expectedLoc(game, prog);
  handleTap(park, game, exp === "LOC01" ? "LOC02" : "LOC01");
});

el.endGame.addEventListener("click", () => {
  const park = localStorage.getItem("pq_last_park") || "123";
  const game = localStorage.getItem("pq_last_game") || "power";
  const prog = loadProgress(park, game) || newProgress(park, game);
  win(park, game, prog);
});

el.playAgain.addEventListener("click", () => {
  const park = localStorage.getItem("pq_last_park") || "123";
  const game = localStorage.getItem("pq_last_game") || "power";
  resetProgress(park, game);
  goToGame(park, game);
});

el.backHome.addEventListener("click", () => show(el.startCard));

(() => {
  initGameSelect();
  const lp = localStorage.getItem("pq_last_park");
  const lg = localStorage.getItem("pq_last_game");
  if(lp) el.parkId.value = lp;
  if(lg && GAMES[lg]) el.gameSelect.value = lg;

  const p = getParams();
  if(p.park) localStorage.setItem("pq_last_park", p.park);
  if(p.game && GAMES[p.game]) localStorage.setItem("pq_last_game", p.game);

  const tappedFromTag = !!(p.loc || p.game || p.park);

  if(tappedFromTag){
    const park = (p.park || localStorage.getItem("pq_last_park") || "123").trim();
    const game = (p.game || localStorage.getItem("pq_last_game") || "power").trim();
    if(!GAMES[game]){ show(el.startCard); return; }
    if(!loadProgress(park, game)) saveProgress(park, game, newProgress(park, game));
    goToGame(park, game);
    if(p.loc) handleTap(park, game, (p.loc || "").trim().toUpperCase());
  } else {
    show(el.startCard);
  }
})();
