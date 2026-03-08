/* ============================================================
   BuseDex Kielce — challenges.js
   Wyzwanie dnia + wyzwania tygodniowe.
   ============================================================ */

var CHALLENGES_KEY = "bdk-challenges";

/* ── LISTA MOŻLIWYCH WYZWAŃ TYGODNIOWYCH ───────────────────── */
var WEEKLY_TEMPLATES = [
  { id:"w_hyb3",  icon:"⚡", type:"catch_type",  param:"hybrydowy",   count:3,  title:"Elektryzujące!",     desc:"Złap 3 autobusy hybrydowe" },
  { id:"w_hyb5",  icon:"⚡", type:"catch_type",  param:"hybrydowy",   count:5,  title:"Hybrydziarz",        desc:"Złap 5 autobusów hybrydowych" },
  { id:"w_el2",   icon:"🔋", type:"catch_type",  param:"elektryczny", count:2,  title:"Zero emisji",        desc:"Złap 2 autobusy elektryczne" },
  { id:"w_maz5",  icon:"🇧🇾", type:"catch_brand", param:"MAZ",         count:5,  title:"MAZ kolekcjoner",    desc:"Złap 5 autobusów MAZ" },
  { id:"w_sol3",  icon:"🇵🇱", type:"catch_brand", param:"Solaris",     count:3,  title:"Solarystek",         desc:"Złap 3 Solarisy" },
  { id:"w_any10", icon:"🚌", type:"catch_any",   param:null,          count:10, title:"Łowca tygodnia",     desc:"Złap 10 dowolnych autobusów" },
  { id:"w_any5",  icon:"🎯", type:"catch_any",   param:null,          count:5,  title:"Regularny",          desc:"Złap 5 autobusów w tym tygodniu" },
  { id:"w_new3",  icon:"✨", type:"catch_new",   param:null,          count:3,  title:"Odkrywca",           desc:"Złap 3 autobusy których nie miałeś" },
  { id:"w_new5",  icon:"🗺️", type:"catch_new",   param:null,          count:5,  title:"Ekspedycja",         desc:"Złap 5 nowych autobusów" },
  { id:"w_gps3",  icon:"📍", type:"catch_gps",   param:null,          count:3,  title:"Kartograf",          desc:"Zapisz lokalizację 3 złapań" },
  { id:"w_photo3",icon:"📸", type:"catch_photo", param:null,          count:3,  title:"Fotoreporter",       desc:"Zrób zdjęcia 3 autobusów" },
  { id:"w_photo5",icon:"📷", type:"catch_photo", param:null,          count:5,  title:"Kronikarz",          desc:"Zrób zdjęcia 5 autobusów" },
  { id:"w_days3", icon:"📅", type:"streak",      param:null,          count:3,  title:"Trzy dni z rzędu",   desc:"Łap autobusy 3 dni pod rząd" },
  { id:"w_man3",  icon:"🇩🇪", type:"catch_brand", param:"MAN",         count:3,  title:"MAN-iak",            desc:"Złap 3 MAN-y" },
  { id:"w_merc2", icon:"⭐", type:"catch_brand", param:"Mercedes",    count:2,  title:"Gwiazdkowy",         desc:"Złap 2 Mercedesy" },
];

/* ── WYZWANIE DNIA ──────────────────────────────────────────── */
function getDailyChallenge() {
  var today  = new Date().toLocaleDateString("pl-PL");
  var stored = _loadChallenges();

  /* jeśli dzisiejsze już istnieje — zwróć */
  if (stored.daily && stored.daily.date === today) return stored.daily;

  /* wybierz losowy bus na podstawie daty (deterministycznie) */
  var seed   = _dateSeed(today);
  var uncaught = CATALOG.filter(function(b) { return !caught[b.id]; });
  if (!uncaught.length) uncaught = CATALOG;
  var bus = uncaught[seed % uncaught.length];

  var challenge = {
    date:  today,
    busId: bus.id,
    done:  !!caught[bus.id],
    bonus: Math.floor(seed % 3) + 1  /* 1-3 punkty bonusowe */
  };

  stored.daily = challenge;
  _saveChallenges(stored);
  return challenge;
}

function _dateSeed(dateStr) {
  var h = 0;
  for (var i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h) + dateStr.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/* ── WYZWANIA TYGODNIOWE ────────────────────────────────────── */
function getWeekKey() {
  var d = new Date();
  var day = d.getDay() || 7;
  var mon = new Date(d);
  mon.setDate(d.getDate() - day + 1);
  return mon.toLocaleDateString("pl-PL");
}

function getWeeklyChallenges() {
  var week   = getWeekKey();
  var stored = _loadChallenges();

  if (stored.weekly && stored.weekly.week === week) {
    /* zaktualizuj postęp */
    return _refreshWeeklyProgress(stored.weekly.items, week, stored);
  }

  /* nowy tydzień — wybierz 3 losowe szablony */
  var seed  = _dateSeed(week);
  var pool  = WEEKLY_TEMPLATES.slice();
  var picks = [];
  for (var i = 0; i < 3 && pool.length; i++) {
    var idx = (seed * (i + 1) * 7919) % pool.length;
    idx = Math.abs(idx | 0);
    picks.push(Object.assign({}, pool.splice(idx, 1)[0], {
      progress: 0,
      done:     false,
      startCaught: Object.keys(catches).length
    }));
  }

  stored.weekly = { week: week, items: picks };
  _saveChallenges(stored);
  return picks;
}

function _refreshWeeklyProgress(items, week, stored) {
  var weekStart = _parseWeekStart(week);
  var updated   = false;

  items.forEach(function(ch) {
    if (ch.done) return;
    var prog = _calcWeeklyProgress(ch, weekStart);
    if (prog !== ch.progress) { ch.progress = prog; updated = true; }
    if (prog >= ch.count)     { ch.done = true; updated = true; }
  });

  if (updated) { stored.weekly.items = items; _saveChallenges(stored); }
  return items;
}

function _parseWeekStart(weekStr) {
  var p = weekStr.split(".");
  return new Date(+p[2], +p[1]-1, +p[0]);
}

function _calcWeeklyProgress(ch, weekStart) {
  var count = 0;
  for (var busId in catches) {
    var list = catches[busId];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e.date) continue;
      var p = e.date.split(".");
      var d = new Date(+p[2], +p[1]-1, +p[0]);
      if (d < weekStart) continue;

      var bus = null;
      for (var j = 0; j < CATALOG.length; j++) {
        if (CATALOG[j].id === busId) { bus = CATALOG[j]; break; }
      }
      if (!bus) continue;

      if      (ch.type === "catch_any")   count++;
      else if (ch.type === "catch_type"  && bus.type  === ch.param) count++;
      else if (ch.type === "catch_brand" && bus.brand === ch.param) count++;
      else if (ch.type === "catch_new"   && list.length === 1 && i === 0) count++;
      else if (ch.type === "catch_gps"   && e.lat) count++;
      else if (ch.type === "catch_photo" && e.hp) count++;
    }
  }
  if (ch.type === "streak") count = _getCurrentStreak();
  return Math.min(count, ch.count);
}

function _getCurrentStreak() {
  var dates = {};
  for (var k in catches) {
    catches[k].forEach(function(e) { if (e.date) dates[e.date] = true; });
  }
  var list = Object.keys(dates).map(function(d) {
    var p = d.split("."); return new Date(+p[2], +p[1]-1, +p[0]);
  }).sort(function(a,b) { return b-a; });
  if (!list.length) return 0;
  var streak = 1;
  for (var i = 1; i < list.length; i++) {
    if (Math.round((list[i-1]-list[i])/864e5) === 1) streak++;
    else break;
  }
  return streak;
}

/* ── STORAGE ────────────────────────────────────────────────── */
function _loadChallenges() {
  try { return JSON.parse(localStorage.getItem(CHALLENGES_KEY) || "{}"); }
  catch(e) { return {}; }
}
function _saveChallenges(d) {
  try { localStorage.setItem(CHALLENGES_KEY, JSON.stringify(d)); } catch(e) {}
}

/* ── RENDEROWANIE EKRANU WYZWAŃ ─────────────────────────────── */
function showChallengesScreen() {
  showScreen("screen-challenges");
  setNav("nav-challenges");
  renderChallenges();
}

function renderChallenges() {
  var body = document.getElementById("challenges-body");
  if (!body) return;

  var daily   = getDailyChallenge();
  var weekly  = getWeeklyChallenges();
  var bus     = null;
  for (var i = 0; i < CATALOG.length; i++) {
    if (CATALOG[i].id === daily.busId) { bus = CATALOG[i]; break; }
  }

  var html = "";

  /* ── wyzwanie dnia ── */
  html += '<div class="ch-section">&#x1F4C5; Wyzwanie dnia</div>';
  if (bus) {
    var bm2 = BM[bus.brand], tm2 = TM[bus.type];
    var lbl = bus.num ? "#"+bus.num : bus.model;
    var col = bm2.retro ? "#c9a84c" : (bus.rare ? "#a855f7" : tm2.color);
    var done = caught[bus.id];
    html +=
      '<div class="ch-daily' + (done?" ch-done":"") + '" onclick="showDetail(' + JSON.stringify({id:bus.id}) + ')" style="border-color:' + col + '">' +
        '<div class="ch-d-icon">' + (done?"✅":"🎯") + '</div>' +
        '<div class="ch-d-body">' +
          '<div class="ch-d-title" style="color:' + col + '">' + bm2.icon + ' ' + bus.brand + (bus.num?" #"+bus.num:"") + '</div>' +
          '<div class="ch-d-model">' + bus.model + '</div>' +
          '<div class="ch-d-bonus">+' + daily.bonus + ' pkt bonusowe &middot; ' + tm2.icon + ' ' + tm2.label + '</div>' +
          (done ? '<div style="color:#4caf50;font-size:11px;margin-top:4px">&#x2705; Złapany dziś!</div>' : "") +
        '</div>' +
      '</div>';
  }

  /* ── wyzwania tygodniowe ── */
  var wk = getWeekKey();
  html += '<div class="ch-section">&#x1F4CB; Tydzień od ' + wk + '</div>';

  weekly.forEach(function(ch) {
    var pct = ch.count ? Math.min(100, Math.round(ch.progress / ch.count * 100)) : 0;
    html +=
      '<div class="ch-card' + (ch.done ? " ch-done" : "") + '">' +
        '<div class="ch-row1">' +
          '<span class="ch-icon">' + ch.icon + '</span>' +
          '<div class="ch-info">' +
            '<div class="ch-title">' + ch.title + (ch.done ? ' ✅' : '') + '</div>' +
            '<div class="ch-desc">' + ch.desc + '</div>' +
          '</div>' +
          '<div class="ch-frac">' + ch.progress + '/' + ch.count + '</div>' +
        '</div>' +
        '<div class="ch-bar-wrap">' +
          '<div class="ch-bar" style="width:' + pct + '%;background:' + (ch.done?"#4caf50":"var(--yel)") + '"></div>' +
        '</div>' +
      '</div>';
  });

  body.innerHTML = html;
}

/* po złapaniu — odśwież progress wyzwań */
function refreshChallengesAfterCatch() {
  var stored = _loadChallenges();
  if (stored.weekly) {
    var week = getWeekKey();
    if (stored.weekly.week === week) {
      _refreshWeeklyProgress(stored.weekly.items, week, stored);
    }
  }
  /* sprawdź daily */
  if (stored.daily) {
    stored.daily.done = !!caught[stored.daily.busId];
    _saveChallenges(stored);
  }
}
