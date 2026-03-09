/* ============================================================
   BuseDex Kielce — desktop.js
   Pełny layout desktopowy (900px+)
   Spotify-style: lewy sidebar + główna treść
   ============================================================ */

var _dtActive    = "dash";   /* aktywny panel */
var _dtBrandF    = "Wszystkie";
var _dtTypeF     = "Wszystkie";
var _dtSelBus    = null;     /* aktualnie wybrany autobus */
var _dtMapInited = false;
var _dtMap       = null;
var _dtMQ        = null;

/* ── INICJALIZACJA ─────────────────────────────────────────── */
function dtInit() {
  _dtMQ = window.matchMedia("(min-width: 900px)");
  _dtMQ.addEventListener("change", function(e) {
    if (e.matches) dtEnter(); else dtLeave();
  });
  if (_dtMQ.matches) dtEnter();
}

function dtEnter() {
  document.getElementById("dt-topbar").style.display   = "";
  document.getElementById("dt-workspace").style.display = "";
  dtRenderFilters();
  dtRenderBusList();
  dtUpdate();
  dtShowPanel(_dtActive);
}

function dtLeave() {
  document.getElementById("dt-topbar").style.display    = "none";
  document.getElementById("dt-workspace").style.display = "none";
}

/* ── AKTUALIZACJA PO ZŁAPANIU ─────────────────────────────── */
function dtUpdate() {
  if (!_dtMQ || !_dtMQ.matches) return;
  var got    = Object.keys(caught).length;
  var total  = CATALOG.length;
  var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
  var pct    = total ? Math.round(got / total * 100) : 0;

  /* topbar progress */
  var fill = document.getElementById("dt-prog-fill");
  var txt  = document.getElementById("dt-prog-txt");
  var sub  = document.getElementById("dt-prog-sub");
  if (fill) fill.style.width = pct + "%";
  if (txt)  txt.textContent  = pct + "%";
  if (sub)  sub.textContent  = got + "/" + total;

  /* odśwież listę i aktywny panel */
  dtRenderBusList();
  if (_dtActive === "dash")   dtRenderDash();
}

/* ── FILTRY W SIDEBARZE ────────────────────────────────────── */
function dtRenderFilters() {
  var bf = document.getElementById("dt-brand-filters");
  var tf = document.getElementById("dt-type-filters");
  if (!bf || !tf) return;

  /* marki */
  bf.innerHTML = "";
  var brands = ["Wszystkie"];
  CATALOG.forEach(function(b) { if (brands.indexOf(b.brand) < 0) brands.push(b.brand); });
  brands.sort(function(a,b){ return a==="Wszystkie"?-1:b==="Wszystkie"?1:a.localeCompare(b); });
  brands.forEach(function(br) {
    var bm  = BM[br] || {};
    var btn = document.createElement("button");
    btn.className = "dt-chip" + (_dtBrandF === br ? " on" : "");
    btn.textContent = (bm.icon ? bm.icon + " " : "") + br;
    if (_dtBrandF === br && bm.color) { btn.style.background = bm.color; btn.style.borderColor = bm.color; }
    btn.onclick = function() { _dtBrandF = br; dtRenderFilters(); dtRenderBusList(); };
    bf.appendChild(btn);
  });

  /* napęd */
  tf.innerHTML = "";
  var types = ["Wszystkie"];
  CATALOG.forEach(function(b) { if (types.indexOf(b.type) < 0) types.push(b.type); });
  types.forEach(function(t) {
    var tm  = TM[t] || {};
    var btn = document.createElement("button");
    btn.className = "dt-chip" + (_dtTypeF === t ? " on" : "");
    btn.textContent = (tm.icon ? tm.icon + " " : "") + (tm.label || t);
    if (_dtTypeF === t && tm.color) { btn.style.background = tm.color; btn.style.borderColor = tm.color; }
    btn.onclick = function() { _dtTypeF = t; dtRenderFilters(); dtRenderBusList(); };
    tf.appendChild(btn);
  });
}

/* ── LISTA AUTOBUSÓW W SIDEBARZE ───────────────────────────── */
function dtRenderBusList() {
  var container = document.getElementById("dt-bus-list");
  var counter   = document.getElementById("dt-list-count");
  if (!container) return;

  var q = (document.getElementById("dt-si") || {}).value || "";
  q = q.toLowerCase();

  /* filtrowanie */
  var filtered = CATALOG.filter(function(b) {
    if (_dtBrandF !== "Wszystkie" && b.brand !== _dtBrandF) return false;
    if (_dtTypeF  !== "Wszystkie" && b.type  !== _dtTypeF)  return false;
    if (q && b.num.toLowerCase().indexOf(q) < 0 &&
             b.model.toLowerCase().indexOf(q) < 0 &&
             b.brand.toLowerCase().indexOf(q) < 0) return false;
    return true;
  });

  /* sortowanie: niezłapane na dół */
  filtered.sort(function(a, b) {
    var ac = caught[a.id] ? 0 : 1, bc = caught[b.id] ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return a.brand.localeCompare(b.brand) || a.num.localeCompare(b.num);
  });

  if (counter) counter.textContent = filtered.length + "/" + CATALOG.length;

  container.innerHTML = "";
  var lastBrand = null;

  filtered.forEach(function(bus) {
    var tm  = TM[bus.type] || { color:"#888", icon:"🚌" };
    var bm  = BM[bus.brand] || { icon:"🚌" };
    var isCaught = !!caught[bus.id];
    var lbl  = bus.num ? "#" + bus.num : bus.model;

    /* separator marki */
    if (bus.brand !== lastBrand) {
      var sep = document.createElement("div");
      sep.className = "dt-brand-sep";
      sep.textContent = bm.icon + " " + bus.brand;
      container.appendChild(sep);
      lastBrand = bus.brand;
    }

    var row = document.createElement("div");
    row.className = "dt-bus-row" +
      (isCaught ? " caught" : "") +
      (_dtSelBus && _dtSelBus.id === bus.id ? " active" : "");

    row.innerHTML =
      '<div class="dt-row-info">' +
        '<div class="dt-row-num">' + lbl + '</div>' +
        '<div class="dt-row-model">' + bus.model + (bus.sub ? " · " + bus.sub : "") + '</div>' +
      '</div>' +
      '<div class="dt-row-dot" style="background:' + tm.color + ';opacity:' + (isCaught?"1":".25") + '"></div>';

    (function(b) {
      row.onclick = function() { dtSelectBus(b); };
    })(bus);

    container.appendChild(row);
  });
}

/* ── WYBÓR AUTOBUSU ────────────────────────────────────────── */
function dtSelectBus(bus) {
  _dtSelBus = bus;
  /* podświetl wiersz */
  dtRenderBusList();
  /* pokaż szczegóły w głównym panelu */
  dtShowPanel("detail");
  dtRenderDetail(bus);
}

/* ── SZCZEGÓŁY AUTOBUSU (desktop) ─────────────────────────── */
function dtRenderDetail(bus) {
  var body = document.getElementById("dt-detail-body");
  if (!body) return;

  /* użyj istniejącego renderDetail z render.js — ustaw curBus i renderuj */
  curBus = bus;

  /* stwórz tymczasowy kontener */
  var tmpId = "dt-det-tmp";
  var tmp = document.getElementById(tmpId);
  if (!tmp) {
    tmp = document.createElement("div");
    tmp.id = tmpId;
  }

  /* override det-title i det-body tymczasowo */
  var origTitle = document.getElementById("det-title");
  var origBody  = document.getElementById("det-body");
  var titleHolder = document.createElement("div");
  titleHolder.id = "det-title";
  var bodyHolder  = document.createElement("div");
  bodyHolder.id   = "det-body";

  document.body.appendChild(titleHolder);
  document.body.appendChild(bodyHolder);

  renderDetail();

  var titleTxt = titleHolder.textContent;
  var bodyHTML = bodyHolder.innerHTML;

  /* przywróć oryginały */
  document.body.removeChild(titleHolder);
  document.body.removeChild(bodyHolder);
  if (origTitle) origTitle.id = "det-title";
  if (origBody)  origBody.id  = "det-body";

  var tm = TM[bus.type] || { color:"#888" };
  var bm = BM[bus.brand] || { color:"#555" };

  body.innerHTML =
    '<button onclick="dtShowPanel(\'dash\')" style="' +
      'background:transparent;border:1px solid #2a2a2a;color:#777;' +
      'padding:6px 12px;border-radius:6px;cursor:pointer;font-family:\'Courier New\',monospace;' +
      'font-size:11px;margin-bottom:16px"' +
    '>&#x2190; Wróć</button>' +
    '<h2 style="font-size:22px;color:' + tm.color + ';margin-bottom:16px">' + titleTxt + '</h2>' +
    bodyHTML;

  /* mini-mapa — jeśli już jest w bodyHTML, Leaflet ją zainicjuje */
}

/* ── PRZEŁĄCZANIE PANELI ───────────────────────────────────── */
function dtShowPanel(name) {
  _dtActive = name;

  /* aktualizuj przyciski topbara */
  ["dash","map","challenges","history","results","profile"].forEach(function(p) {
    var btn = document.getElementById("dt-btn-" + p);
    if (btn) btn.classList.toggle("active", p === name);
  });

  /* ukryj wszystkie panele */
  document.querySelectorAll(".dt-panel-wrap").forEach(function(el) {
    el.style.display = "none";
  });

  /* pokaż właściwy */
  var target = document.getElementById("dt-panel-" + name);
  if (target) target.style.display = (name === "map") ? "block" : "block";

  /* render treści */
  switch (name) {
    case "dash":       dtRenderDash();       break;
    case "map":        dtRenderMap();        break;
    case "challenges": dtRenderChallenges(); break;
    case "history":    dtRenderHistory();    break;
    case "results":    dtRenderResults();    break;
    case "profile":    dtRenderProfile();    break;
  }
}

/* ── DASHBOARD ─────────────────────────────────────────────── */
function dtRenderDash() {
  var top    = document.getElementById("dt-panels-top");
  var recent = document.getElementById("dt-panel-recent");
  if (!top) return;

  var got    = Object.keys(caught).length;
  var total  = CATALOG.length;
  var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
  var pct    = total ? Math.round(got / total * 100) : 0;

  /* zlicz napędy */
  var fuelCnt = {};
  CATALOG.forEach(function(b) {
    var isCaught = !!caught[b.id];
    if (!fuelCnt[b.type]) fuelCnt[b.type] = { total:0, caught:0 };
    fuelCnt[b.type].total++;
    if (isCaught) fuelCnt[b.type].caught++;
  });

  /* panel statystyk */
  var statsHtml =
    '<div class="dt-panel">' +
      '<div class="dt-panel-title">&#x1F4CA; Postęp kolekcji</div>' +
      '<div class="dt-stat-grid">' +
        '<div class="dt-stat-box"><div class="dt-stat-val">' + got + '</div><div class="dt-stat-lbl">ZŁAPANE</div></div>' +
        '<div class="dt-stat-box"><div class="dt-stat-val">' + (total-got) + '</div><div class="dt-stat-lbl">BRAKUJE</div></div>' +
        '<div class="dt-stat-box"><div class="dt-stat-val">' + pct + '%</div><div class="dt-stat-lbl">UKOŃCZONO</div></div>' +
        '<div class="dt-stat-box"><div class="dt-stat-val">' + earned + '</div><div class="dt-stat-lbl">ODZNAKI</div></div>' +
      '</div>' +
      '<div style="margin-top:16px">' +
        '<div class="dt-panel-title">&#x26FD; Napęd</div>' +
        '<div class="dt-fuel-bar">';

  Object.keys(fuelCnt).forEach(function(t) {
    var tm  = TM[t] || { color:"#888", icon:"🚌", label:t };
    var fc  = fuelCnt[t];
    var pct2 = fc.total ? Math.round(fc.caught / fc.total * 100) : 0;
    statsHtml +=
      '<div class="dt-fuel-seg">' +
        '<div class="dt-fuel-cnt" style="color:' + tm.color + '">' + fc.caught + '/' + fc.total + '</div>' +
        '<div class="dt-fuel-bar-fill" style="background:' + tm.color + '22;position:relative;overflow:hidden">' +
          '<div style="position:absolute;left:0;top:0;height:100%;width:' + pct2 + '%;background:' + tm.color + ';border-radius:4px;transition:width .4s"></div>' +
        '</div>' +
        '<div class="dt-fuel-lbl">' + tm.icon + ' ' + (tm.label||t).toUpperCase() + '</div>' +
      '</div>';
  });

  statsHtml += '</div></div></div>';

  /* panel ostatnich złapań */
  var allCatches = [];
  Object.keys(catches).forEach(function(bid) {
    catches[bid].forEach(function(e) {
      allCatches.push({ busId:bid, entry:e });
    });
  });
  allCatches.sort(function(a,b) { return (b.entry.date||"").localeCompare(a.entry.date||""); });
  var recentSlice = allCatches.slice(0, 8);

  var recentHtml = '<div class="dt-panel" style="grid-column:1/-1">' +
    '<div class="dt-panel-title">&#x1F552; Ostatnie złapania</div>';

  if (recentSlice.length === 0) {
    recentHtml += '<div style="color:#444;font-size:12px;text-align:center;padding:20px">Jeszcze nic nie złapano</div>';
  } else {
    recentSlice.forEach(function(item) {
      var bus = CATALOG.filter(function(b){ return b.id===item.busId; })[0];
      if (!bus) return;
      var tm  = TM[bus.type] || { color:"#888" };
      var bm  = BM[bus.brand] || { icon:"🚌" };
      var lbl = bus.num ? "#" + bus.num : bus.model;
      recentHtml +=
        '<div class="dt-recent-row" onclick="dtSelectBus(' + JSON.stringify(bus).replace(/</g,'&lt;') + ')">' +
          '<span style="font-size:18px">' + bm.icon + '</span>' +
          '<div style="flex:1">' +
            '<div class="dt-recent-num">' + lbl + ' <span style="font-size:10px;color:#555">' + bus.model + '</span></div>' +
            '<div class="dt-recent-date">' + (item.entry.date || "") + (item.entry.note ? " · " + item.entry.note.substring(0,30) : "") + '</div>' +
          '</div>' +
          '<div class="dt-recent-dot" style="background:' + tm.color + '"></div>' +
        '</div>';
    });
  }
  recentHtml += '</div>';

  top.innerHTML = statsHtml;
  if (recent) recent.innerHTML = recentHtml;
}

/* ── MAPA ──────────────────────────────────────────────────── */
function dtRenderMap() {
  var container = document.getElementById("dt-map-container");
  if (!container) return;

  container.style.height = "100%";
  container.style.minHeight = "500px";

  if (!_dtMapInited) {
    _dtMapInited = true;
    setTimeout(function() {
      if (!window.L) return;
      _dtMap = L.map(container).setView([50.8661, 20.6286], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(_dtMap);

      /* pinezki złapanych autobusów */
      Object.keys(catches).forEach(function(bid) {
        catches[bid].forEach(function(e) {
          if (!e.lat) return;
          var bus = CATALOG.filter(function(b){ return b.id===bid; })[0];
          if (!bus) return;
          var tm  = TM[bus.type] || { color:"#888" };
          var lbl = bus.num ? "#" + bus.num : bus.model;
          var icon = L.divIcon({
            className: "",
            html: '<div style="width:12px;height:12px;border-radius:50%;background:' + tm.color + ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>',
            iconAnchor: [6,6]
          });
          L.marker([e.lat, e.lng], { icon:icon })
           .bindPopup("<b>" + lbl + "</b><br>" + bus.model + (e.date ? "<br>" + e.date : ""))
           .addTo(_dtMap);
        });
      });

      setTimeout(function() { _dtMap.invalidateSize(); }, 100);
    }, 100);
  } else if (_dtMap) {
    setTimeout(function() { _dtMap.invalidateSize(); }, 100);
  }
}

/* ── WYZWANIA ─────────────────────────────────────────────── */
function dtRenderChallenges() {
  var body = document.getElementById("dt-challenges-body");
  if (!body) return;
  /* użyj istniejącej funkcji challenges.js */
  if (typeof renderChallengesInto === "function") {
    renderChallengesInto(body);
  } else if (typeof renderChallenges === "function") {
    body.id = "challenges-body";
    renderChallenges();
    body.id = "dt-challenges-body";
  } else {
    body.innerHTML = '<div style="color:#555;padding:20px;text-align:center">Brak danych wyzwań</div>';
  }
}

/* ── HISTORIA ──────────────────────────────────────────────── */
function dtRenderHistory() {
  var body = document.getElementById("dt-history-body");
  if (!body) return;
  if (typeof renderHistory === "function") {
    body.id = "history-body";
    renderHistory();
    body.id = "dt-history-body";
  }
}

/* ── WYNIKI ────────────────────────────────────────────────── */
function dtRenderResults() {
  var body = document.getElementById("dt-results-body");
  if (!body) return;
  if (typeof renderStatsInto === "function") renderStatsInto(body);
  else body.innerHTML = '<div style="color:#555;padding:20px;text-align:center">Brak danych</div>';
}

/* ── PROFIL ────────────────────────────────────────────────── */
function dtRenderProfile() {
  var body = document.getElementById("dt-profile-body");
  if (!body) return;
  var html =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
      '<div id="dt-acc-body"></div>' +
      '<div id="dt-sett-body"></div>' +
    '</div>';
  body.innerHTML = html;

  var accEl  = document.getElementById("dt-acc-body");
  var settEl = document.getElementById("dt-sett-body");

  if (typeof renderAccountScreen === "function") {
    accEl.id = "account-body";
    renderAccountScreen();
    accEl.id = "dt-acc-body";
  }
  if (typeof renderSettingsScreen === "function") {
    settEl.id = "settings-body";
    renderSettingsScreen();
    settEl.id = "dt-sett-body";
  }
}
