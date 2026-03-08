/* ============================================================
   BuseDex Kielce — routes.js
   Statystyki linii KM Kielce.
   Użytkownik zaznacza na jakiej linii złapał autobus.
   ============================================================ */

/* ── LINIE KM KIELCE ────────────────────────────────────────── */
var KM_LINES = [
  "1","2","4","5","7","8",
  "9","10","11","12","13","14",
  "18","19","21",
  "23","24","25","26","27","28","29","30","31","32","33","34","35","36",
  "38","41","43","44","45","46","47","50","51","53","54",
  "F","Z",
  "102","103","104","107","108","112","114"
];

/* kategoryzacja linii */
var LINE_GROUPS = {
  "Podmiejskie":  ["F","Z","102","103","104","107","108","112","114"],
  "Główne":       ["1","2","4","5","7","8","18","19","21","38","41"],
  "Osiedlowe":    ["9","10","11","12","13","14","23","24","25","26","27",
                   "28","29","30","31","32","33","34","35","36",
                   "43","44","45","46","47","50","51","53","54"]
};

/* ── ZARZĄDZANIE LINIAMI W ZŁAPANIACH ───────────────────────── */
/* entry.line = "1" | "2" | ... */

function setEntryLine(busId, catchIdx, line) {
  if (!catches[busId] || !catches[busId][catchIdx]) return;
  catches[busId][catchIdx].line = line;
  _rebuildCaught();
  saveData();
}

/* ── STATYSTYKI ─────────────────────────────────────────────── */
function calcRouteStats() {
  var stats = {};  /* { "1": { catches:N, buses:Set, brands:{...} } } */

  for (var busId in catches) {
    catches[busId].forEach(function(e) {
      if (!e.line) return;
      var ln = e.line;
      if (!stats[ln]) stats[ln] = { catches:0, busIds:{}, brands:{} };
      stats[ln].catches++;
      stats[ln].busIds[busId] = true;

      /* marka */
      for (var i = 0; i < CATALOG.length; i++) {
        if (CATALOG[i].id === busId) {
          var br = CATALOG[i].brand;
          stats[ln].brands[br] = (stats[ln].brands[br] || 0) + 1;
          break;
        }
      }
    });
  }

  /* zamień Set na liczby */
  for (var k in stats) stats[k].uniqueBuses = Object.keys(stats[k].busIds).length;
  return stats;
}

/* ── RENDEROWANIE ───────────────────────────────────────────── */
function showRoutesScreen() {
  showScreen("screen-routes");
  setNav("nav-routes");
  renderRoutes();
}

function renderRoutes() {
  var body = document.getElementById("routes-body");
  if (!body) return;

  var stats   = calcRouteStats();
  var hasData = Object.keys(stats).length > 0;

  var html = "";

  /* top 5 linii */
  if (hasData) {
    var sorted = Object.keys(stats).sort(function(a,b) {
      return stats[b].catches - stats[a].catches;
    });

    html += '<div class="ch-section">&#x1F3C6; Twoje ulubione linie</div>';
    html += '<div class="rank-list">';
    sorted.slice(0,5).forEach(function(ln, i) {
      var s = stats[ln];
      var medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1);
      var topBrand = Object.keys(s.brands).sort(function(a,b){ return s.brands[b]-s.brands[a]; })[0] || "";
      var bm = BM[topBrand] || { icon:"🚌", color:"#888" };
      html +=
        '<div class="rank-row">' +
          '<div class="rank-pos">' + medal + '</div>' +
          '<div style="font-size:22px;font-weight:900;color:var(--yel);width:34px;text-align:center">'+ln+'</div>' +
          '<div class="rank-info">' +
            '<div class="rank-name">' + s.catches + ' złapań · ' + s.uniqueBuses + ' unikalnych</div>' +
            '<div style="font-size:10px;color:var(--tx3)">Najczęstsza marka: ' + bm.icon + ' ' + topBrand + '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
  }

  /* tabela wszystkich linii */
  html += '<div class="ch-section">&#x1F68D; Wszystkie linie</div>';

  Object.keys(LINE_GROUPS).forEach(function(grp) {
    html += '<div class="route-group-title">' + grp + '</div>';
    html += '<div class="route-grid">';
    LINE_GROUPS[grp].forEach(function(ln) {
      var s   = stats[ln];
      var cnt = s ? s.catches : 0;
      html +=
        '<div class="route-cell' + (cnt>0?" route-active":"") + '" onclick="showLineDetail(\'' + ln + '\')">' +
          '<div class="route-num">' + ln + '</div>' +
          (cnt > 0 ? '<div class="route-cnt">' + cnt + '</div>' : '') +
        '</div>';
    });
    html += '</div>';
  });

  body.innerHTML = html;
}

function showLineDetail(ln) {
  var stats = calcRouteStats();
  var s     = stats[ln];
  if (!s) { toast("Brak złapań na linii " + ln); return; }

  var buses = Object.keys(s.busIds).map(function(id) {
    for (var i=0;i<CATALOG.length;i++) if (CATALOG[i].id===id) return CATALOG[i];
    return null;
  }).filter(Boolean);

  var msg = "Linia " + ln + "\n" + s.catches + " złapań, " + s.uniqueBuses + " unikalnych\n\n";
  buses.forEach(function(b) {
    msg += b.brand + (b.num?" #"+b.num:"") + " — " + b.model + "\n";
  });
  alert(msg);
}

/* ── SELECTOR LINII W FORMULARZU ZŁAPANIA ───────────────────── */
function renderLineSelector(busId, catchIdx) {
  var current = (catches[busId] && catches[busId][catchIdx] && catches[busId][catchIdx].line) || "";
  var html = '<div class="plbl" style="margin-top:10px;margin-bottom:6px">&#x1F68D; Linia (opcjonalnie)</div>';
  html += '<div class="line-grid">';
  html += '<div class="line-opt' + (!current?" line-sel":"") + '" onclick="selectLine(\'' + busId + '\',' + catchIdx + ',\'\')" style="color:var(--tx3)">—</div>';
  KM_LINES.forEach(function(ln) {
    var sel = current === ln;
    html += '<div class="line-opt' + (sel?" line-sel":"") + '" onclick="selectLine(\'' + busId + '\',' + catchIdx + ',\'' + ln + '\')">' + ln + '</div>';
  });
  html += '</div>';
  return html;
}

function selectLine(busId, catchIdx, line) {
  setEntryLine(busId, catchIdx, line);
  /* odśwież selector */
  var wrap = document.getElementById("line-selector-wrap");
  if (wrap) wrap.innerHTML = renderLineSelector(busId, catchIdx);
  toast(line ? "Linia " + line + " zapisana" : "Linia odznaczona");
}
