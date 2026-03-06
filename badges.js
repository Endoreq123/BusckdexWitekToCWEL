/* ============================================================
   BuseDex Kielce — badges.js
   System odznak i poziomów.
   ============================================================ */

/* ── DEFINICJE ODZNAK ───────────────────────────────────────── */
var BADGES = [
  /* pierwsze złapania */
  { id:"b01", icon:"&#x1F35E;", name:"Debiutant",        desc:"Złap pierwszego autobusy",                    check: function(c,tot) { return Object.keys(c).length >= 1; } },
  { id:"b02", icon:"&#x1F9B5;", name:"Pierwsze kroki",   desc:"Złap 5 autobusów",                            check: function(c)     { return Object.keys(c).length >= 5; } },
  { id:"b03", icon:"&#x1F3AB;", name:"Kolekcjoner",      desc:"Złap 25 autobusów",                           check: function(c)     { return Object.keys(c).length >= 25; } },
  { id:"b04", icon:"&#x1F48E;", name:"Łowca",            desc:"Złap 50 autobusów",                           check: function(c)     { return Object.keys(c).length >= 50; } },
  { id:"b05", icon:"&#x1F451;", name:"Kielczanin",       desc:"Złap 100 autobusów",                          check: function(c)     { return Object.keys(c).length >= 100; } },
  { id:"b06", icon:"&#x1F3C6;", name:"Kompletny zbiór",  desc:"Złap wszystkie autobusy",                     check: function(c,tot) { return Object.keys(c).length >= tot; } },

  /* marki */
  { id:"b07", icon:"&#x1F1E7;&#x1F1FE;", name:"MAZ-ter",       desc:"Złap wszystkie MAZ-y",       check: function(c) { return _allBrand(c,"MAZ"); } },
  { id:"b08", icon:"&#x1F1F9;&#x1F1F7;", name:"Temsator",      desc:"Złap wszystkie Temsy",       check: function(c) { return _allBrand(c,"Temsa"); } },
  { id:"b09", icon:"&#x1F1F5;&#x1F1F1;", name:"Solarysta",     desc:"Złap wszystkie Solarisy",    check: function(c) { return _allBrand(c,"Solaris"); } },
  { id:"b10", icon:"&#x1F1E9;&#x1F1EA;", name:"MAN-iak",       desc:"Złap wszystkie MAN-y",       check: function(c) { return _allBrand(c,"MAN"); } },
  { id:"b11", icon:"&#x2B50;",           name:"Gwiazdka",       desc:"Złap wszystkie Mercedesy",   check: function(c) { return _allBrand(c,"Mercedes"); } },
  { id:"b12", icon:"&#x1F1F5;&#x1F1F1;", name:"Autosanista",   desc:"Złap wszystkie Autosany",    check: function(c) { return _allBrand(c,"Autosan"); } },
  { id:"b13", icon:"&#x1F3DB;&#xFE0F;",  name:"Legenda!",      desc:"Złap Ikarusa",               check: function(c) { return !!c["i1"]; } },

  /* typy napędu */
  { id:"b14", icon:"&#x26FD;",   name:"Spalinowiec",   desc:"Złap 20 autobusów spalinowych",  check: function(c) { return _typeCount(c,"spalinowy") >= 20; } },
  { id:"b15", icon:"&#x1F50B;",  name:"Hybrydysta",   desc:"Złap wszystkie hybrydy",          check: function(c) { return _allType(c,"hybrydowy"); } },

  /* specjalne */
  { id:"b16", icon:"&#x1F48E;",  name:"Unikat x2",    desc:"Złap oba unikaty (1 OF 1)",       check: function(c) { return !!c["s1"] && !!c["s51"]; } },
  { id:"b17", icon:"&#x1F4F8;",  name:"Fotograf",     desc:"Dodaj zdjęcie do 10 złapań",      check: function(c) { return _withPhoto(c) >= 10; } },
  { id:"b18", icon:"&#x1F4F9;",  name:"Papparazi",    desc:"Dodaj zdjęcie do 50 złapań",      check: function(c) { return _withPhoto(c) >= 50; } },
  { id:"b19", icon:"&#x1F5D3;&#xFE0F;", name:"Regularny",   desc:"Złap coś 7 dni z rzędu",   check: function(c) { return _streak(c) >= 7; } },
  { id:"b20", icon:"&#x1F4CD;",  name:"Mapeusz",      desc:"Zapisz lokalizację 5 złapań",     check: function(c) { return _withGps(c) >= 5; } },
];

/* ── POMOCNICZE ─────────────────────────────────────────────── */
function _allBrand(c, brand) {
  for (var i = 0; i < CATALOG.length; i++) {
    if (CATALOG[i].brand === brand && !c[CATALOG[i].id]) return false;
  }
  return true;
}
function _allType(c, type) {
  for (var i = 0; i < CATALOG.length; i++) {
    if (CATALOG[i].type === type && !c[CATALOG[i].id]) return false;
  }
  return true;
}
function _typeCount(c, type) {
  var n = 0;
  for (var i = 0; i < CATALOG.length; i++) {
    if (CATALOG[i].type === type && c[CATALOG[i].id]) n++;
  }
  return n;
}
function _withPhoto(c) {
  var n = 0;
  for (var k in c) if (c[k].hp) n++;
  return n;
}
function _withGps(c) {
  var n = 0;
  for (var k in c) if (c[k].lat) n++;
  return n;
}
function _streak(c) {
  /* zbieramy unikalne daty złapań i sprawdzamy ciąg */
  var dates = {};
  for (var k in c) {
    if (c[k].date) dates[c[k].date] = true;
  }
  var list = Object.keys(dates).map(function(d) {
    var p = d.split(".");
    return new Date(+p[2], +p[1]-1, +p[0]);
  }).sort(function(a,b) { return b - a; });

  if (!list.length) return 0;
  var streak = 1, ms = 864e5;
  for (var i = 1; i < list.length; i++) {
    if (Math.round((list[i-1] - list[i]) / ms) === 1) streak++;
    else break;
  }
  return streak;
}

/* ── POZIOMY ────────────────────────────────────────────────── */
var LEVELS = [
  { min:0,   name:"Nowicjusz",   color:"#555",    icon:"&#x1F331;" },
  { min:5,   name:"Pasażer",     color:"#8bc34a", icon:"&#x1F68D;" },
  { min:15,  name:"Obserwator",  color:"#03a9f4", icon:"&#x1F441;&#xFE0F;" },
  { min:30,  name:"Łowca",       color:"#ff9800", icon:"&#x1F3AF;" },
  { min:60,  name:"Ekspert",     color:"#e91e63", icon:"&#x1F9E0;" },
  { min:100, name:"Mistrz KM",   color:"#9c27b0", icon:"&#x1F451;" },
  { min:140, name:"Legenda",     color:"#f5c800", icon:"&#x1F3C6;" },
];

function getLevel(caught) {
  var n = Object.keys(caught).length;
  var lv = LEVELS[0];
  for (var i = 0; i < LEVELS.length; i++) {
    if (n >= LEVELS[i].min) lv = LEVELS[i];
  }
  var next = null;
  for (var j = 0; j < LEVELS.length; j++) {
    if (LEVELS[j].min > n) { next = LEVELS[j]; break; }
  }
  return { level: lv, next: next, count: n };
}

function getEarnedBadges(caught) {
  var tot = CATALOG.length;
  return BADGES.filter(function(b) { return b.check(caught, tot); });
}

/* ── RENDEROWANIE EKRANU ODZNAK ─────────────────────────────── */
function renderBadges() {
  var body = document.getElementById("badges-body");
  if (!body) return;

  var lv = getLevel(caught);
  var earned = getEarnedBadges(caught);
  var tot = CATALOG.length;
  var next_min = lv.next ? lv.next.min : lv.level.min;
  var prev_min = lv.level.min;
  var pct = lv.next
    ? Math.min(100, Math.round((lv.count - prev_min) / (next_min - prev_min) * 100))
    : 100;

  var html =
    /* karta poziomu */
    '<div class="level-card" style="border-color:' + lv.level.color + '">' +
      '<div class="level-icon">' + lv.level.icon + '</div>' +
      '<div class="level-info">' +
        '<div class="level-name" style="color:' + lv.level.color + '">' + lv.level.name + '</div>' +
        '<div class="level-sub">' + lv.count + ' złapanych' +
          (lv.next ? ' · do &bdquo;' + lv.next.name + '&rdquo;: ' + (lv.next.min - lv.count) + ' brakuje' : ' · MAX!') +
        '</div>' +
        '<div class="level-bar">' +
          '<div class="level-fill" style="width:' + pct + '%;background:' + lv.level.color + '"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* sekcja odznak */
  html += '<div class="badges-title">Odznaki (' + earned.length + ' / ' + BADGES.length + ')</div>';
  html += '<div class="badges-grid">';

  for (var i = 0; i < BADGES.length; i++) {
    var b   = BADGES[i];
    var got = b.check(caught, tot);
    html +=
      '<div class="badge-card' + (got ? ' earned' : '') + '">' +
        '<div class="badge-icon">' + b.icon + '</div>' +
        '<div class="badge-name">' + b.name + '</div>' +
        '<div class="badge-desc">' + b.desc + '</div>' +
        (got ? '<div class="badge-check">&#x2705;</div>' : '') +
      '</div>';
  }

  html += '</div>';
  body.innerHTML = html;
}
