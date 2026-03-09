/* ============================================================
   BuseDex Kielce — app.js
   Logika aplikacji: storage, ekrany, złapania, animacja CRT
   ============================================================ */

/* ── STAN APLIKACJI ─────────────────────────────────────────── */
var catches      = {};   // { busId: [{id,date,note,hp,photoKey,lat,lng}, ...] }
var caught       = {};   // computed skrót: { busId: ostatnie złapanie }
var brandF       = "Wszystkie";
var typeF        = "Wszystkie";
var onlyUncaught = false;
var sortMode     = "caught-last";  /* "az" | "caught-last" */
var curBus       = null;
var capPh        = null;

/* ── STORAGE ────────────────────────────────────────────────── */
var STORAGE_KEY  = "bdk3";   // bdk3 = nowy model wielokrotnych złapań

function _rebuildCaught() {
  caught = {};
  for (var k in catches) {
    if (catches[k].length) caught[k] = catches[k][catches[k].length - 1];
  }
}

function loadData() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      catches = JSON.parse(raw);
      _rebuildCaught();
    }
    /* migracja ze starego formatu bdk2 */
    var old2 = localStorage.getItem("bdk2");
    if (old2 && !raw) {
      var oldData = JSON.parse(old2);
      for (var k in oldData) {
        var e = oldData[k];
        catches[k] = [{ id: Date.now(), date: e.date, note: e.note || "", hp: !!e.hp }];
      }
      _rebuildCaught();
      saveData();
    }
  } catch(e) { catches = {}; caught = {}; }
}

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(catches)); } catch(e) {}
}

function savePh(id, b64) {
  try { localStorage.setItem("bdp-" + id, b64); return true; } catch(e) { return false; }
}
function loadPh(id) {
  try { return localStorage.getItem("bdp-" + id); } catch(e) { return null; }
}
function delPh(id) {
  try { localStorage.removeItem("bdp-" + id); } catch(e) {}
}

/* ── POMOCNICZE ─────────────────────────────────────────────── */
function compress(file, cb) {
  var r = new FileReader();
  r.onerror = function() { cb("err"); };
  r.onload  = function(e) {
    var img = new Image();
    img.onerror = function() { cb("err"); };
    img.onload  = function() {
      var maxW = 1200, w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      var cv = document.getElementById("cvs");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(null, cv.toDataURL("image/jpeg", 0.75));
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
}

var toastT;
function toast(msg) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(function() { el.classList.remove("show"); }, 2500);
}

function openMod()  { document.getElementById("ov").classList.add("open"); }
function closeMod() { document.getElementById("ov").classList.remove("open"); }

/* ── NAWIGACJA EKRANÓW ──────────────────────────────────────── */
function showScreen(id) {
  var all = document.querySelectorAll(".screen");
  for (var i = 0; i < all.length; i++) all[i].classList.remove("active");
  var sc = document.getElementById(id);
  if (sc) sc.classList.add("active");
  window.scrollTo(0, 0);
  /* FAB visibility */
  var fab = document.getElementById("fab");
  if (fab) {
    var hideFab = ["screen-capture","screen-detail"].indexOf(id) >= 0;
    fab.style.display = hideFab ? "none" : "";
  }
}

function showList() {
  showScreen("screen-list");
  setNav("nav-list");
  renderList();
}
function showMap() {
  showScreen("screen-map");
  setNav("nav-map");
  renderMap();
}
function showBadges() {
  showScreen("screen-badges");
  setNav("nav-more");
  renderBadges();
}
function showHistory() {
  showScreen("screen-history");
  setNav("nav-history");
  renderHistory();
}
function showChallengesScreen() {
  showScreen("screen-challenges");
  setNav("nav-challenges");
  renderChallenges();
}
function showRoutesScreen() {
  showScreen("screen-routes");
  setNav("nav-more");
  renderRoutes();
}
function showResultsScreen() {
  showScreen("screen-results");
  setNav("nav-more");
  renderResultsScreen();
}
function showProfileScreen() {
  showScreen("screen-profile");
  setNav("nav-more");
  renderProfileScreen();
}
function showMore() {
  showScreen("screen-more");
  setNav("nav-more");
  renderMoreScreen();
}
/* legacy aliases */
function showStatsScreen()   { showResultsScreen(); }
function showSharingScreen() { showResultsScreen(); }
function showAccountScreen() { showProfileScreen(); }
function showSettingsScreen(){ showProfileScreen(); }

function setNav(activeId) {
  var btns = document.querySelectorAll(".nav-btn");
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
  var el = document.getElementById(activeId);
  if (el) el.classList.add("active");
}

/* ── EKRAN WIĘCEJ ─────────────────────────────────────────────── */
function renderMoreScreen() {
  var body = document.getElementById("more-body");
  if (!body) return;
  var got    = Object.keys(caught).length;
  var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
  var items = [
    { icon:"🏆", label:"Odznaki",    sub: earned + " zdobytych",       fn:"showBadges()" },
    { icon:"🚌", label:"Linie",      sub:"Statystyki tras",             fn:"showRoutesScreen()" },
    { icon:"📊", label:"Wyniki",     sub:"Statystyki i udostępnij",     fn:"showResultsScreen()" },
    { icon:"👤", label:"Profil",     sub:"Konto i ustawienia",          fn:"showProfileScreen()" },
  ];
  var html = '<div class="more-list">';
  items.forEach(function(it) {
    html +=
      '<div class="more-row" onclick="' + it.fn + '">' +
        '<div class="more-icon">' + it.icon + '</div>' +
        '<div class="more-info">' +
          '<div class="more-label">' + it.label + '</div>' +
          '<div class="more-sub">' + it.sub + '</div>' +
        '</div>' +
        '<div class="more-arrow">›</div>' +
      '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

/* ── EKRAN WYNIKI + UDOSTĘPNIJ ────────────────────────────────── */
function renderResultsScreen() {
  var body = document.getElementById("results-body");
  if (!body) return;
  var html = '<div class="res-tabs">' +
    '<button class="res-tab active" id="rt-stats" onclick="switchResultTab(\'stats\')">📊 Statystyki</button>' +
    '<button class="res-tab" id="rt-share" onclick="switchResultTab(\'share\')">📤 Udostępnij</button>' +
  '</div>' +
  '<div id="rt-stats-body" class="rt-body"></div>' +
  '<div id="rt-share-body" class="rt-body" style="display:none"></div>';
  body.innerHTML = html;
  /* render stats into first tab */
  if (typeof renderStats2 === "function") {
    var fakeBody = document.getElementById("rt-stats-body");
    fakeBody.innerHTML = "";
    renderStatsInto(fakeBody);
  }
  renderSharingInto(document.getElementById("rt-share-body"));
}

function switchResultTab(tab) {
  document.getElementById("rt-stats").classList.toggle("active", tab==="stats");
  document.getElementById("rt-share").classList.toggle("active", tab==="share");
  document.getElementById("rt-stats-body").style.display = tab==="stats" ? "" : "none";
  document.getElementById("rt-share-body").style.display = tab==="share" ? "" : "none";
}

/* ── EKRAN PROFIL + USTAWIENIA ────────────────────────────────── */
function renderProfileScreen() {
  var body = document.getElementById("profile-body");
  if (!body) return;
  var html = '<div class="res-tabs">' +
    '<button class="res-tab active" id="pt-profile" onclick="switchProfileTab(\'profile\')">👤 Profil</button>' +
    '<button class="res-tab" id="pt-settings" onclick="switchProfileTab(\'settings\')">⚙️ Ustawienia</button>' +
  '</div>' +
  '<div id="pt-profile-body" class="rt-body"></div>' +
  '<div id="pt-settings-body" class="rt-body" style="display:none"></div>';
  body.innerHTML = html;
  /* render account into profile tab */
  var accBody = document.getElementById("pt-profile-body");
  accBody.id = "account-body";
  if (typeof renderAccountScreen === "function") renderAccountScreen();
  /* settings */
  var settBody = document.getElementById("pt-settings-body");
  settBody.id = "settings-body";
  if (typeof renderSettingsScreen === "function") renderSettingsScreen();
  /* restore ids */
  accBody.id = "pt-profile-body";
  settBody.id = "pt-settings-body";
}

function switchProfileTab(tab) {
  document.getElementById("pt-profile").classList.toggle("active", tab==="profile");
  document.getElementById("pt-settings").classList.toggle("active", tab==="settings");
  document.getElementById("pt-profile-body").style.display = tab==="profile" ? "" : "none";
  document.getElementById("pt-settings-body").style.display = tab==="settings" ? "" : "none";
}

/* ── FAB ACTION ───────────────────────────────────────────────── */
function fabAction() {
  /* jeśli jesteśmy na liście — wróć do góry i podświetl wyszukiwarkę */
  var listActive = document.getElementById("screen-list").classList.contains("active");
  if (listActive) {
    window.scrollTo(0, 0);
    var si = document.getElementById("si");
    if (si) si.focus();
    return;
  }
  /* w pozostałych ekranach — wróć do listy */
  showList();
}

/* ── NAV BADGES (liczniki) ────────────────────────────────────── */
function updateNavBadges() {
  /* badge na Wyzwania — niezrobione wyzwanie dnia */
  try {
    var daily = typeof getDailyChallenge === "function" ? getDailyChallenge() : null;
    var chBadge = document.getElementById("badge-challenges");
    if (chBadge) chBadge.textContent = (daily && !daily.done) ? "!" : "";
  } catch(e) {}

  /* badge na Historię — złapania dzisiaj */
  try {
    var today = new Date().toLocaleDateString("pl-PL");
    var todayCnt = 0;
    for (var k in catches) {
      catches[k].forEach(function(e) { if (e.date === today) todayCnt++; });
    }
    var hBadge = document.getElementById("badge-history");
    if (hBadge) hBadge.textContent = todayCnt > 0 ? todayCnt : "";
  } catch(e) {}

  /* badge na Więcej — nowe odznaki (sprawdź czy jest nowa) */
  try {
    var moreBadge = document.getElementById("badge-more");
    if (moreBadge) moreBadge.textContent = "";
  } catch(e) {}
}

function showDetail(bus) {
  curBus = bus;
  showScreen("screen-detail");
  renderDetail();
}

function showCapture(bus, edit) {
  curBus = bus; capPh = null;
  var bm = BM[bus.brand], tm = TM[bus.type];
  var lbl = bus.num ? "#" + bus.num : bus.model;

  /* selector linii */
  var catchIdx = (catches[bus.id] && catches[bus.id].length) ? catches[bus.id].length - 1 : 0;
  setTimeout(function() {
    var wrap = document.getElementById("line-selector-wrap");
    if (wrap && typeof renderLineSelector === "function") {
      wrap.innerHTML = renderLineSelector(bus.id, catchIdx);
    }
  }, 80);

  document.getElementById("cap-title").textContent = "Złap " + lbl;
  document.getElementById("cap-back").onclick = function() { showDetail(bus); };

  var info = document.getElementById("cap-info");
  info.style.borderColor = bm.color;
  info.innerHTML =
    '<span style="font-size:26px">' + bm.icon + '</span>' +
    '<div style="flex:1">' +
      '<div style="font-size:28px;font-weight:900;color:' + tm.color + ';line-height:1">' + lbl + '</div>' +
      '<div style="color:#777;font-size:12px;margin-top:3px">' + bus.brand + ' — ' + bus.model + '</div>' +
    '</div>' +
    '<span style="font-size:20px">' + tm.icon + '</span>';

  var btnColor = bm.retro ? "#a07820" : (bus.rare ? "#7c3aed" : tm.color);
  document.getElementById("btn-save").style.background = btnColor;
  document.getElementById("note").value =
    (edit && caught[bus.id] && caught[bus.id].note) ? caught[bus.id].note : "";

  if (edit && caught[bus.id] && caught[bus.id].hp) {
    var ex = loadPh(bus.id);
    ex ? setPrev(ex) : setPrev(null);
  } else {
    setPrev(null);
  }

  showScreen("screen-capture");
}

function setPrev(src) {
  var ph = document.getElementById("pph"),
      pr = document.getElementById("pprev"),
      db = document.getElementById("btn-del-ph");
  if (src) {
    pr.src = src; pr.style.display = "block";
    ph.style.display = "none"; db.style.display = "inline-block";
  } else {
    pr.style.display = "none"; pr.src = "";
    ph.style.display = "block"; db.style.display = "none";
  }
}

function handleFile(inp) {
  closeMod();
  var file = inp.files[0];
  if (!file) return;
  inp.value = "";
  toast("Kompresowanie…");
  compress(file, function(err, b64) {
    if (err) { toast("Błąd wczytywania zdjęcia"); return; }
    capPh = b64;
    setPrev(b64);
    toast("Zdjęcie gotowe");
  });
}

function trigCam() { closeMod(); setTimeout(function() { document.getElementById("in-cam").click(); }, 80); }
function trigGal() { closeMod(); setTimeout(function() { document.getElementById("in-gal").click(); }, 80); }

/* ── ANIMACJA CRT ────────────────────────────────────────────── */
var caGT;

function caGrain() {
  var cv = document.getElementById("ca-grain");
  var w = cv.offsetWidth, h = cv.offsetHeight;
  if (!w || !h) return;
  cv.width = w; cv.height = h;
  var ctx = cv.getContext("2d"), img = ctx.createImageData(w, h);
  for (var i = 0; i < img.data.length; i += 4) {
    var v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i+1] = img.data[i+2] = v; img.data[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function showCatchAnim(bus, photoSrc, onClose) {
  var tm = TM[bus.type], bm = BM[bus.brand];
  var isRetro = !!bm.retro, isRare = !!bus.rare;
  var badgeColor = isRetro ? "#c9a84c" : (isRare ? "#c084fc" : tm.color);
  var lbl = bus.num ? "#" + bus.num : bus.model;

  document.getElementById("ca-badge").textContent =
    isRetro ? "LEGENDA ZŁAPANA!" : (isRare ? "RZADKI ZŁAPANY!" : "ZŁAPANY!");
  document.getElementById("ca-badge").style.color = badgeColor;
  document.getElementById("ca-sub").textContent = bus.brand + " " + lbl + " — " + bus.model;
  document.getElementById("ca-sub").style.color  = badgeColor + "99";

  // Ikarus: zdjęcie z serwera z folderu grafika/
  var imgSrc = isRetro ? "grafika/ikarus.jpg" : (photoSrc || null);

  var ov     = document.getElementById("ca"),
      photo  = document.getElementById("ca-photo"),
      tint   = document.getElementById("ca-tint"),
      il     = document.getElementById("ca-il"),
      led    = document.getElementById("ca-led"),
      status = document.getElementById("ca-status"),
      ghost  = document.getElementById("ca-noghost");

  // reset
  photo.classList.remove("on"); photo.src = "";
  tint.style.transition = "none"; tint.style.opacity = "0";
  il.classList.remove("show"); led.classList.remove("on");
  status.textContent = "WŁĄCZANIE";
  clearInterval(caGT);
  ghost.style.display = "none";
  photo.style.display = "block";

  ov.classList.add("show");
  ov.onclick = function() {
    clearInterval(caGT);
    ov.classList.remove("show");
    photo.classList.remove("on");
    if (onClose) onClose();
  };

  if (!imgSrc) {
    ghost.style.display = "block";
    led.classList.add("on");
    status.textContent = "ZŁAPANO";
    return;
  }

  photo.src = imgSrc;
  il.classList.add("show");

  setTimeout(function() {
    photo.classList.add("on");
    tint.style.opacity = "1";
    led.classList.add("on");
    status.textContent = "ŁADOWANIE";
    setTimeout(function() {
      il.classList.remove("show");
      tint.style.transition = "opacity 1.4s";
      tint.style.opacity = "0";
      status.textContent = "ZŁAPANO";
      caGT = setInterval(caGrain, 80);
    }, 330);
  }, 110);
}

/* ── ZAPISYWANIE ZŁAPANIA ────────────────────────────────────── */
function saveCatch() {
  var id    = curBus.id;
  var note  = document.getElementById("note").value.trim();
  var today = new Date().toLocaleDateString("pl-PL");

  var ok = true;
  /* zdjęcie: każde złapanie dostaje własne — nadpisujemy "najświeższe" */
  if (capPh) ok = savePh(id + "_" + Date.now(), capPh);

  var entry = { id: Date.now(), date: today, note: note, hp: !!(capPh && ok) };
  if (capPh && ok) entry.photoKey = id + "_" + entry.id;

  if (!catches[id]) catches[id] = [];
  catches[id].push(entry);
  _rebuildCaught();
  saveData();

  var savedBus = curBus, savedPh = capPh, savedEntry = entry;

  /* GPS */
  getGpsAndSave(id, function(pos) {
    if (pos) {
      savedEntry.lat = pos.lat;
      savedEntry.lng = pos.lng;
      _rebuildCaught();
      saveData();
    }
    if (typeof notifOnCatch === "function") notifOnCatch(savedBus);
    if (typeof syncProgress === "function") syncProgress();
    if (typeof refreshChallengesAfterCatch === "function") refreshChallengesAfterCatch();
    updateNavBadges();
    showCatchAnim(savedBus, savedPh, function() { showDetail(savedBus); });
  });
}

function delCatch(id, catchIdx) {
  if (catchIdx !== undefined) {
    /* usuń konkretne złapanie z historii */
    if (!confirm("Usunąć to złapanie?")) return;
    if (catches[id]) {
      catches[id].splice(catchIdx, 1);
      if (catches[id].length === 0) delete catches[id];
    }
  } else {
    /* usuń wszystkie złapania */
    if (!confirm("Usunąć WSZYSTKIE złapania tego autobusu?")) return;
    if (catches[id]) {
      catches[id].forEach(function(e) { if (e.photoKey) delPh(e.photoKey); });
      delete catches[id];
    }
  }
  _rebuildCaught();
  saveData();
  toast("Złapanie usunięte");
  renderDetail();
}

function openViewer(id, num, model, brand, photoKey) {
  var pk = photoKey || id;
  var p = "?id="    + encodeURIComponent(id)    +
          "&num="   + encodeURIComponent(num)   +
          "&model=" + encodeURIComponent(model) +
          "&brand=" + encodeURIComponent(brand) +
          "&pk="    + encodeURIComponent(pk);
  window.location.href = "viewer.html" + p;
}

/* ── USTAWIENIA ─────────────────────────────────────────────── */
function showSettingsScreen() {
  showScreen("screen-settings");
  setNav("nav-settings");
  renderSettingsScreen();
}

function renderSettingsScreen() {
  var body = document.getElementById("settings-body") || document.getElementById("pt-settings-body");
  if (!body) return;

  var notifPerm = "Notification" in window ? Notification.permission : "unsupported";
  var notifStatus = notifPerm === "granted" ? "Włączone ✅" : notifPerm === "denied" ? "Zablokowane ❌" : "Wyłączone";

  body.innerHTML =
    /* motyw */
    '<div class="dev-section-title" style="margin-top:0">&#x1F3A8; Wygląd</div>' +
    '<div class="settings-group">' +
      '<div class="settings-row" onclick="toggleTheme()">' +
        '<span class="settings-row-label">Motyw</span>' +
        '<span class="settings-row-val" id="theme-val">' +
          (currentTheme === "dark" ? "&#x1F319; Ciemny" : "&#x2600;&#xFE0F; Jasny") +
        '</span>' +
        '<span style="font-size:20px;margin-left:8px" id="theme-toggle-icon">' +
          (currentTheme === "dark" ? "&#x2600;&#xFE0F;" : "&#x1F319;") +
        '</span>' +
      '</div>' +
    '</div>' +

    /* powiadomienia */
    '<div class="dev-section-title">&#x1F514; Powiadomienia</div>' +
    '<div id="notif-settings"><div class="notif-panel">' +
      (notifPerm !== "granted" ?
        '<div class="notif-warn" style="border-color:var(--yel)">' +
        'Status: ' + notifStatus + '</div>' +
        '<button class="btnp" style="background:var(--red)" onclick="enableNotifs()">&#x1F514; Włącz powiadomienia</button>'
        : '') +
    '</div></div>' +

    /* koniec */
    '<div class="dev-section-title">&#x2139;&#xFE0F; O aplikacji</div>' +
    '<div class="settings-group">' +
      '<div class="settings-row">' +
        '<span class="settings-row-label">BuseDex Kielce</span>' +
        '<span class="settings-row-val">v2.0</span>' +
      '</div>' +
      '<div class="settings-row">' +
        '<span class="settings-row-label">Autobusy w katalogu</span>' +
        '<span class="settings-row-val">' + CATALOG.length + '</span>' +
      '</div>' +
    '</div>' +

    /* deweloper — dyskretny link */
    '<div style="text-align:center;margin-top:24px">' +
    '</div>';

  /* załaduj szczegóły powiadomień */
  if (notifPerm === "granted") renderNotifSettings();
}

/* ── FILTR TYLKO NIEZŁAPANE ─────────────────────────────────── */
function toggleUncaught() {
  onlyUncaught = !onlyUncaught;
  var el = document.getElementById("filter-uncaught");
  if (el) el.className = "filter-uncaught" + (onlyUncaught ? " on" : "");
  renderList();
}

function toggleSort() {
  sortMode = (sortMode === "caught-last") ? "az" : "caught-last";
  var lbl = document.getElementById("sort-label");
  if (lbl) lbl.textContent = sortMode === "caught-last" ? "Nowe ↑" : "A–Z";
  var el = document.getElementById("filter-sort");
  if (el) el.classList.toggle("on", sortMode === "caught-last");
  renderList();
}

/* ── BANNER INSTALACJI PWA ───────────────────────────────────── */
function renderInstall() {
  var w = document.getElementById("inst-wrap");
  if (localStorage.getItem("bd-inst")) { w.innerHTML = ""; return; }
  var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  var isAnd = /android/i.test(navigator.userAgent);
  if (!isIos && !isAnd) return;
  var tip = isIos
    ? "&#x1F4F1; Dodaj do ekranu głównego: Udostępnij → Dodaj do ekranu"
    : "&#x1F4F1; Dodaj do ekranu głównego: menu → Dodaj do ekranu";
  w.innerHTML =
    '<div class="ibanner">' +
      '<span style="flex:1;line-height:1.5">' + tip + '</span>' +
      '<button class="iclose" onclick="localStorage.setItem(\'bd-inst\',\'1\');' +
        'document.getElementById(\'inst-wrap\').innerHTML=\'\'">&#xD7;</button>' +
    '</div>';
}

/* ── INICJALIZACJA ───────────────────────────────────────────── */
/* ── OFFLINE-FIRST SYNC ─────────────────────────────────────── */
var _syncPending = false;

function _initOfflineSync() {
  window.addEventListener("online", function() {
    if (_syncPending) {
      _syncPending = false;
      toast("📶 Online — synchronizuję...");
      if (typeof syncProgress === "function") syncProgress();
    }
  });
  window.addEventListener("offline", function() {
    toast("📵 Tryb offline");
    _syncPending = true;
  });
  if (!navigator.onLine) _syncPending = true;
}

window.addEventListener("DOMContentLoaded", function() {
  document.getElementById("in-cam").addEventListener("change", function() { handleFile(this); });
  document.getElementById("in-gal").addEventListener("change", function() { handleFile(this); });
  document.getElementById("pbox").addEventListener("click", openMod);
  document.getElementById("btn-cam").addEventListener("click", trigCam);
  document.getElementById("btn-gal").addEventListener("click", trigGal);
  document.getElementById("btn-del-ph").addEventListener("click", function() {
    capPh = null; setPrev(null); toast("Zdjęcie usunięte");
  });
  document.getElementById("btn-save").addEventListener("click", saveCatch);
  document.getElementById("ov").addEventListener("click", function(e) {
    if (e.target === this) closeMod();
  });
  document.getElementById("m-cam").addEventListener("click", trigCam);
  document.getElementById("m-gal").addEventListener("click", trigGal);
  document.getElementById("m-cancel").addEventListener("click", closeMod);
  document.getElementById("si").addEventListener("input", function() { renderList(); });

  loadTheme();            /* motyw przed renderem */
  _initOfflineSync();     /* offline-first background sync */
  loadAccount();          /* załaduj sesję konta */
  loadData();
  initProgressCanvas();   /* canvas postępu */
  renderList();
  renderInstall();
  setTimeout(updateNavBadges, 300);
  initNotifications();    /* harmonogram powiadomień */

  /* Obsługa PWA shortcuts (?action=...) */
  var action = new URLSearchParams(location.search).get("action");
  if      (action === "map")    { showMap(); }
  else if (action === "badges") { showBadges(); }
  else if (action === "catch")  { /* zostań na liście */ }

  /* Service Worker — PWA offline */
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(function() {});
  }
});
