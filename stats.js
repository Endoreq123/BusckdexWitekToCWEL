/* ============================================================
   BuseDex Kielce — stats.js
   Ekran statystyk i lokalnego rankingu.
   ============================================================ */

function renderStats2() {
  var body = document.getElementById("stats-body");
  if (!body) return;

  var total = CATALOG.length;
  var got   = Object.keys(caught).length;
  var pct   = total ? Math.round(got / total * 100) : 0;
  var lv    = getLevel(caught);
  var earned = getEarnedBadges(caught).length;

  /* ── podsumowanie globalne ── */
  var html =
    '<div class="stat-hero">' +
      '<div class="stat-hero-num" style="color:' + lv.level.color + '">' + pct + '%</div>' +
      '<div class="stat-hero-sub">Ukończenie kolekcji</div>' +
      '<div class="stat-hero-sub2">' + lv.level.icon + ' ' + lv.level.name + ' &middot; ' + earned + ' odznak</div>' +
    '</div>';

  /* ── ranking marek ── */
  html += '<div class="rank-title">&#x1F3C6; Ranking marek</div>';
  html += '<div class="rank-list">';

  var brandRanks = [];
  for (var b in BM) {
    var buses = CATALOG.filter(function(x) { return x.brand === b; });
    var g = buses.filter(function(x) { return caught[x.id]; }).length;
    brandRanks.push({ brand: b, got: g, total: buses.length,
                      pct: buses.length ? Math.round(g/buses.length*100) : 0 });
  }
  brandRanks.sort(function(a,b) { return b.pct - a.pct || b.got - a.got; });

  for (var i = 0; i < brandRanks.length; i++) {
    var r  = brandRanks[i];
    var bm = BM[r.brand];
    var col = bm.retro ? "#c9a84c" : bm.color;
    var medal = i===0 ? "&#x1F947;" : i===1 ? "&#x1F948;" : i===2 ? "&#x1F949;" : ("#"+(i+1));
    html +=
      '<div class="rank-row">' +
        '<div class="rank-pos">' + medal + '</div>' +
        '<span style="font-size:18px">' + bm.icon + '</span>' +
        '<div class="rank-info">' +
          '<div class="rank-name">' + r.brand + '</div>' +
          '<div class="rank-bar-wrap">' +
            '<div class="rank-bar" style="width:' + r.pct + '%;background:' + col + '"></div>' +
          '</div>' +
        '</div>' +
        '<div class="rank-pct" style="color:' + col + '">' + r.pct + '%</div>' +
        '<div class="rank-frac">' + r.got + '/' + r.total + '</div>' +
      '</div>';
  }
  html += '</div>';

  /* ── ranking typów ── */
  html += '<div class="rank-title">&#x26A1; Według napędu</div>';
  html += '<div class="rank-list">';
  var typeRanks = [];
  for (var t in TM) {
    var tb = CATALOG.filter(function(x) { return x.type === t; });
    var tg = tb.filter(function(x) { return caught[x.id]; }).length;
    typeRanks.push({ type: t, got: tg, total: tb.length,
                     pct: tb.length ? Math.round(tg/tb.length*100) : 0 });
  }
  typeRanks.sort(function(a,b) { return b.pct - a.pct; });
  for (var j = 0; j < typeRanks.length; j++) {
    var tr2 = typeRanks[j], tm2 = TM[tr2.type];
    html +=
      '<div class="rank-row">' +
        '<div class="rank-pos" style="font-size:20px">' + tm2.icon + '</div>' +
        '<div class="rank-info">' +
          '<div class="rank-name">' + tm2.label + '</div>' +
          '<div class="rank-bar-wrap">' +
            '<div class="rank-bar" style="width:' + tr2.pct + '%;background:' + tm2.color + '"></div>' +
          '</div>' +
        '</div>' +
        '<div class="rank-pct" style="color:' + tm2.color + '">' + tr2.pct + '%</div>' +
        '<div class="rank-frac">' + tr2.got + '/' + tr2.total + '</div>' +
      '</div>';
  }
  html += '</div>';

  /* ── eksport / udostępnianie ── */
  html +=
    '<div class="rank-title">&#x1F4E4; Udostępnij wynik</div>' +
    '<button class="export-btn" onclick="exportStats()">&#x1F4CB; Kopiuj do schowka</button>' +
    '<div id="export-ok" style="text-align:center;color:#4caf50;font-size:12px;margin-top:6px;display:none">Skopiowano!</div>';

  body.innerHTML = html;
}

/* ── EKSPORT WYNIKÓW ────────────────────────────────────────── */
function exportStats() {
  var total = CATALOG.length;
  var got   = Object.keys(caught).length;
  var pct   = Math.round(got / total * 100);
  var lv    = getLevel(caught);
  var earned = getEarnedBadges(caught).length;

  var lines = [
    "🚌 BuseDex Kielce — moje wyniki",
    "────────────────────────────",
    lv.level.icon + " Poziom: " + lv.level.name,
    "📊 Ukończenie: " + pct + "% (" + got + "/" + total + ")",
    "🏅 Odznaki: " + earned + "/" + BADGES.length,
    ""
  ];

  /* marki */
  for (var b in BM) {
    var buses = CATALOG.filter(function(x) { return x.brand === b; });
    var g = buses.filter(function(x) { return caught[x.id]; }).length;
    lines.push(b + ": " + g + "/" + buses.length);
  }

  var text = lines.join("\n");
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      document.getElementById("export-ok").style.display = "block";
      setTimeout(function() {
        document.getElementById("export-ok").style.display = "none";
      }, 2000);
    });
  } else {
    /* fallback */
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    document.getElementById("export-ok").style.display = "block";
  }
}
