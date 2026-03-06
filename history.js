/* ============================================================
   BuseDex Kielce — history.js
   Kalendarz złapań i lista chronologiczna.
   ============================================================ */

var histMonth = new Date(); /* aktualnie wyświetlany miesiąc */

/* ── POMOCNICZE ─────────────────────────────────────────────── */
function _parsePl(dateStr) {
  /* "DD.MM.YYYY" → Date */
  var p = dateStr.split(".");
  if (p.length !== 3) return null;
  return new Date(+p[2], +p[1]-1, +p[0]);
}

function _catchesByDate() {
  /* zwraca { "YYYY-MM-DD": [bus, bus, ...] } */
  var map = {};
  for (var k in caught) {
    var c = caught[k];
    if (!c.date) continue;
    var d = _parsePl(c.date);
    if (!d) continue;
    var key = d.getFullYear() + "-" +
              String(d.getMonth()+1).padStart(2,"0") + "-" +
              String(d.getDate()).padStart(2,"0");
    if (!map[key]) map[key] = [];
    var bus = null;
    for (var i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].id === k) { bus = CATALOG[i]; break; }
    }
    if (bus) map[key].push(bus);
  }
  return map;
}

/* ── RENDEROWANIE KALENDARZA ─────────────────────────────────── */
function renderHistory() {
  var body = document.getElementById("history-body");
  if (!body) return;

  var byDate = _catchesByDate();
  var y = histMonth.getFullYear(), m = histMonth.getMonth();
  var monthNames = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
                    "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  var dayNames   = ["Pn","Wt","Śr","Cz","Pt","So","Nd"];

  /* nagłówek nawigacji */
  var html =
    '<div class="cal-nav">' +
      '<button class="cal-btn" onclick="historyPrev()">&#x2190;</button>' +
      '<span class="cal-title">' + monthNames[m] + " " + y + '</span>' +
      '<button class="cal-btn" onclick="historyNext()">&#x2192;</button>' +
    '</div>';

  /* siatka dni tygodnia */
  html += '<div class="cal-grid">';
  for (var d = 0; d < 7; d++) {
    html += '<div class="cal-dow">' + dayNames[d] + '</div>';
  }

  /* pierwszy dzień miesiąca — jaki dzień tygodnia (0=Nd→6, 1=Pn→0...) */
  var firstDay = new Date(y, m, 1).getDay();
  var offset   = (firstDay === 0) ? 6 : firstDay - 1; /* Pn=0 */
  var daysInMonth = new Date(y, m+1, 0).getDate();

  /* puste komórki przed 1-szym */
  for (var e = 0; e < offset; e++) {
    html += '<div class="cal-cell empty"></div>';
  }

  /* komórki dni */
  for (var day = 1; day <= daysInMonth; day++) {
    var key = y + "-" + String(m+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
    var buses = byDate[key] || [];
    var today = new Date();
    var isToday = (today.getFullYear()===y && today.getMonth()===m && today.getDate()===day);
    var cls = "cal-cell" + (buses.length ? " has-catch" : "") + (isToday ? " today" : "");
    html +=
      '<div class="' + cls + '" ' + (buses.length ? 'onclick="showDayDetail(\'' + key + '\')"' : '') + '>' +
        '<span class="cal-day-num">' + day + '</span>' +
        (buses.length ? '<span class="cal-dot">' + buses.length + '</span>' : '') +
      '</div>';
  }
  html += '</div>';

  /* lista chronologiczna (ostatnie 30) */
  var allEntries = [];
  for (var dk in byDate) {
    var arr = byDate[dk];
    for (var ai = 0; ai < arr.length; ai++) {
      allEntries.push({ key: dk, bus: arr[ai] });
    }
  }
  allEntries.sort(function(a,b) { return b.key.localeCompare(a.key); });

  html += '<div class="hist-title">Ostatnie złapania</div>';
  if (!allEntries.length) {
    html += '<div class="hist-empty">Jeszcze nic nie złapałeś &#x1F614;</div>';
  } else {
    html += '<div class="hist-list">';
    var shown = allEntries.slice(0, 30);
    var prevDate = "";
    for (var hi = 0; hi < shown.length; hi++) {
      var entry = shown[hi], bus2 = entry.bus, c2 = caught[bus2.id];
      var bm2 = BM[bus2.brand], tm2 = TM[bus2.type];
      var lbl2 = bus2.num ? "#" + bus2.num : bus2.model;
      var color2 = bm2.retro ? "#c9a84c" : (bus2.rare ? "#a855f7" : tm2.color);

      if (entry.key !== prevDate) {
        /* separator daty */
        var dp = entry.key.split("-");
        html += '<div class="hist-date-sep">&#x1F4C5; ' + dp[2] + "." + dp[1] + "." + dp[0] + '</div>';
        prevDate = entry.key;
      }

      html +=
        '<div class="hist-row" onclick="showDetail(getBusById(\'' + bus2.id + '\'))">' +
          '<span style="font-size:20px">' + bm2.icon + '</span>' +
          '<div style="flex:1">' +
            '<div style="font-weight:700;color:' + color2 + '">' + lbl2 + '</div>' +
            '<div style="font-size:11px;color:#666">' + bus2.brand + ' — ' + bus2.model + '</div>' +
          '</div>' +
          '<span style="font-size:18px">' + tm2.icon + '</span>' +
        '</div>';
    }
    if (allEntries.length > 30) {
      html += '<div class="hist-empty">... i ' + (allEntries.length-30) + ' wcześniejszych</div>';
    }
    html += '</div>';
  }

  body.innerHTML = html;
}

/* ── NAWIGACJA MIESIĘCY ─────────────────────────────────────── */
function historyPrev() {
  histMonth = new Date(histMonth.getFullYear(), histMonth.getMonth()-1, 1);
  renderHistory();
}
function historyNext() {
  histMonth = new Date(histMonth.getFullYear(), histMonth.getMonth()+1, 1);
  renderHistory();
}

/* ── POPUP DNIA ─────────────────────────────────────────────── */
function showDayDetail(key) {
  var byDate  = _catchesByDate();
  var buses   = byDate[key] || [];
  var dp      = key.split("-");
  var dateStr = dp[2] + "." + dp[1] + "." + dp[0];

  var msg = dateStr + ": " + buses.length + " złapań\n";
  for (var i = 0; i < buses.length; i++) {
    var b = buses[i];
    msg += "\n" + b.brand + (b.num ? " #"+b.num : "") + " — " + b.model;
  }
  alert(msg);
}

/* ── POMOCNICZE: BUS PO ID ──────────────────────────────────── */
function getBusById(id) {
  for (var i = 0; i < CATALOG.length; i++) {
    if (CATALOG[i].id === id) return CATALOG[i];
  }
  return null;
}
