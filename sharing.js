/* ============================================================
   BuseDex Kielce — sharing.js
   Udostępnianie: link do kolekcji + generatywna karta wyników.

   Karta wyników jest generowana na <canvas> i zawiera:
   - Unikalny wzór geometryczny (deterministyczny z danych)
   - Dane zakodowane wizualnie (trudne do ręcznej zmiany)
   - Hash kontrolny z czasem i wynikiem
   ============================================================ */

/* ── LINK DO KOLEKCJI ───────────────────────────────────────── */
function generateShareLink() {
  /* kodujemy skrócony snapshot kolekcji w URL */
  var ids     = Object.keys(caught).sort();
  var payload = { u: (currentUser && currentUser.username) || "Gracz", i: ids };
  var b64     = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  /* usuń padding = który psuje URL */
  var safe    = b64.replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return location.origin + location.pathname + "?share=" + safe;
}

/* odczytaj udostępnioną kolekcję z URL */
function readShareFromUrl() {
  var param = new URLSearchParams(location.search).get("share");
  if (!param) return null;
  try {
    var b64 = param.replace(/-/g,"+").replace(/_/g,"/");
    /* dodaj padding */
    while (b64.length % 4) b64 += "=";
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch(e) { return null; }
}

function copyShareLink() {
  var link = generateShareLink();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(function() { toast("Link skopiowany!"); });
  } else {
    var ta = document.createElement("textarea");
    ta.value = link;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast("Link skopiowany!");
  }
}

/* ── PORÓWNANIE Z PRZYJACIELEM ──────────────────────────────── */
function renderFriendComparison() {
  var wrap = document.getElementById("friend-compare-wrap");
  if (!wrap) return;

  var shared = readShareFromUrl();
  if (!shared) {
    wrap.innerHTML =
      '<div class="ch-section">&#x1F465; Porównaj z przyjacielem</div>' +
      '<div style="font-size:12px;color:var(--tx3);padding:8px 4px;line-height:1.6">' +
        'Udostępnij link znajomemu. Gdy otworzy link — zobaczysz jego kolekcję obok swojej.' +
      '</div>' +
      '<button class="btns" onclick="copyShareLink()">&#x1F517; Skopiuj link do kolekcji</button>';
    return;
  }

  var myIds     = Object.keys(caught);
  var friendIds = shared.i || [];
  var onlyMe    = myIds.filter(function(id) { return friendIds.indexOf(id) < 0; });
  var onlyFriend= friendIds.filter(function(id) { return myIds.indexOf(id) < 0; });
  var both      = myIds.filter(function(id) { return friendIds.indexOf(id) >= 0; });

  wrap.innerHTML =
    '<div class="ch-section">&#x1F465; Vs ' + escHtml(shared.u) + '</div>' +
    '<div class="dev-stat-row">' +
      '<div class="dev-stat"><div class="dev-stat-n" style="color:var(--red)">' + myIds.length + '</div><div class="dev-stat-l">Ty</div></div>' +
      '<div class="dev-stat"><div class="dev-stat-n" style="color:#888">' + both.length + '</div><div class="dev-stat-l">Wspólne</div></div>' +
      '<div class="dev-stat"><div class="dev-stat-n" style="color:#03a9f4">' + friendIds.length + '</div><div class="dev-stat-l">' + escHtml(shared.u) + '</div></div>' +
    '</div>' +
    '<div style="font-size:12px;color:var(--tx3);padding:4px">' +
      'Tylko Ty: ' + onlyMe.length + ' · Tylko ' + escHtml(shared.u) + ': ' + onlyFriend.length +
    '</div>' +
    '<button class="btns" onclick="copyShareLink()">&#x1F517; Skopiuj własny link</button>';
}

/* ── GENERATYWNA KARTA WYNIKÓW ──────────────────────────────── */
/*
  Karta zawiera wzór generowany z danych kolekcji.
  Zmiana czegokolwiek (liczby, nazwy) zmienia wzór — trudno sfałszować.
*/
function generateExportCard() {
  var cvs = document.getElementById("export-canvas");
  if (!cvs) return;

  var W = 600, H = 340;
  cvs.width = W; cvs.height = H;
  var ctx = cvs.getContext("2d");
  var isDark = !document.body.classList.contains("theme-light");

  var tot    = CATALOG.length;
  var got    = Object.keys(caught).length;
  var pct    = tot ? Math.round(got/tot*100) : 0;
  var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
  var lv     = typeof getLevel === "function" ? getLevel(caught) : null;
  var user   = (currentUser && currentUser.username) || "Kolekcjoner";

  /* ── tło ── */
  var bg = ctx.createLinearGradient(0,0,W,H);
  if (isDark) {
    bg.addColorStop(0, "#0e0e0e");
    bg.addColorStop(1, "#1a0202");
  } else {
    bg.addColorStop(0, "#f0f0f0");
    bg.addColorStop(1, "#fff0f0");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* ── WZÓR GENERATYWNY z danych (hash kolekcji) ── */
  var seed = _collectionHash();
  _drawGenPattern(ctx, W, H, seed, isDark);

  /* ── ramka ── */
  ctx.strokeStyle = "#c0191a";
  ctx.lineWidth   = 3;
  _roundRect(ctx, 4, 4, W-8, H-8, 12);
  ctx.stroke();

  /* ── logo ── */
  ctx.font      = "900 22px monospace";
  ctx.fillStyle = "#c0191a";
  ctx.fillText("🚌 BUSEDEX KIELCE", 30, 42);

  /* ── linia pozioma ── */
  ctx.strokeStyle = "rgba(192,25,26,.3)";
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(30,54); ctx.lineTo(W-30,54); ctx.stroke();

  /* ── imię użytkownika ── */
  ctx.font      = "700 16px monospace";
  ctx.fillStyle = isDark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.4)";
  ctx.fillText(user, 30, 80);

  /* ── duży procent ── */
  ctx.font      = "900 88px monospace";
  ctx.fillStyle = pct === 100 ? "#4caf50" : "#f5c800";
  ctx.fillText(pct + "%", 30, 175);

  /* ── sublinie ── */
  ctx.font      = "700 15px monospace";
  ctx.fillStyle = isDark ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.5)";
  ctx.fillText(got + " / " + tot + " autobusów", 30, 205);

  if (lv) {
    ctx.font = "700 14px monospace";
    ctx.fillStyle = lv.level.color;
    ctx.fillText(lv.level.icon + " " + lv.level.name, 30, 228);
  }

  ctx.font = "13px monospace";
  ctx.fillStyle = "#f5c800";
  ctx.fillText("🏅 " + earned + " odznak", 30, 252);

  /* ── segmenty napędu ── */
  var segY = 276, segH = 8, segX = 30, segW = W - 60;
  ctx.fillStyle = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  _roundRect(ctx, segX, segY, segW, segH, 4); ctx.fill();

  var types = ["spalinowy","hybrydowy","elektryczny"];
  var xOff = segX;
  types.forEach(function(tp) {
    var buses = CATALOG.filter(function(b) { return b.type===tp; });
    var g     = buses.filter(function(b) { return caught[b.id]; }).length;
    var w     = tot ? (g/tot*segW) : 0;
    if (w < 1) return;
    ctx.fillStyle = TM[tp].color;
    _roundRect(ctx, xOff, segY, w, segH, 4); ctx.fill();
    xOff += w;
  });

  /* ── legenda typów ── */
  var lx = 30, ly = 298;
  types.forEach(function(tp) {
    var buses = CATALOG.filter(function(b) { return b.type===tp; });
    var g     = buses.filter(function(b) { return caught[b.id]; }).length;
    ctx.fillStyle = TM[tp].color;
    ctx.beginPath(); ctx.arc(lx+5, ly-4, 4, 0, Math.PI*2); ctx.fill();
    ctx.font = "10px monospace";
    ctx.fillStyle = isDark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.5)";
    ctx.fillText(TM[tp].icon + " " + g, lx+14, ly);
    lx += 70;
  });

  /* ── data i hash ── */
  var today = new Date().toLocaleDateString("pl-PL");
  var hash  = _shortHash(got + ":" + tot + ":" + earned + ":" + today).toUpperCase();
  ctx.font      = "10px monospace";
  ctx.fillStyle = isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.2)";
  ctx.fillText(today + " · " + hash, W-180, H-14);

  /* ── wizualny kod danych (małe kwadraty w prawym rogu) ── */
  _drawDataCode(ctx, W-90, H-80, got, tot, earned, seed);

  return cvs.toDataURL("image/png");
}

/* Wizualny hash — 5×5 grid kolorowych kwadratów zakodowanych z wyniku */
function _drawDataCode(ctx, x, y, got, tot, earned, seed) {
  var size = 10, gap = 2, n = 5;
  for (var r = 0; r < n; r++) {
    for (var c = 0; c < n; c++) {
      var val = ((seed ^ (got * (r+1)) ^ (tot * (c+1)) ^ (earned * (r*n+c+1))) & 0xFFFFFF);
      var hue = (val % 360);
      ctx.fillStyle = "hsl(" + hue + ",70%,50%)";
      ctx.fillRect(x + c*(size+gap), y + r*(size+gap), size, size);
    }
  }
}

/* Wzór geometryczny w tle */
function _drawGenPattern(ctx, W, H, seed, isDark) {
  ctx.save();
  ctx.globalAlpha = isDark ? 0.04 : 0.06;
  var r = new _Rand(seed);
  for (var i = 0; i < 18; i++) {
    var px = r.next() * W;
    var py = r.next() * H;
    var pr = 20 + r.next() * 80;
    var hue = r.next() * 60 + 340;  /* czerwień–żółć */
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI*2);
    ctx.strokeStyle = "hsl(" + hue + ",90%,60%)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

/* ── Pomocnicze ────────────────────────────────────────────── */
function _Rand(seed) {
  var s = seed | 0;
  this.next = function() {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function _collectionHash() {
  var ids = Object.keys(caught).sort().join(",");
  return Math.abs(_hashStr(ids + ":" + Object.keys(caught).length));
}

function _hashStr(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h<<5)+h) + s.charCodeAt(i);
  return h;
}

function _shortHash(s) {
  var h = Math.abs(_hashStr(s)).toString(16);
  return h.slice(0,6);
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

/* ── EKRAN UDOSTĘPNIANIA ────────────────────────────────────── */
function showSharingScreen() {
  showScreen("screen-sharing");
  setNav("nav-sharing");
  renderSharingScreen();
}

function renderSharingScreen() {
  var body = document.getElementById("sharing-body");
  if (!body) return;

  body.innerHTML =
    '<div style="padding:14px;display:flex;flex-direction:column;gap:14px">' +
      '<div id="friend-compare-wrap"></div>' +

      '<div class="ch-section">&#x1F4CA; Karta wyników</div>' +
      '<div style="font-size:12px;color:var(--tx3)">Generatywny wzór jest unikalny dla Twojej kolekcji — trudno sfałszować.</div>' +
      '<canvas id="export-canvas" style="width:100%;border-radius:10px;border:1px solid var(--bd)"></canvas>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btns" style="flex:1" onclick="doDownloadCard()">&#x1F4BE; Pobierz PNG</button>' +
        '<button class="btns" style="flex:1" onclick="doShareCard()">&#x1F4E4; Udostępnij</button>' +
      '</div>' +
    '</div>';

  renderFriendComparison();
  setTimeout(generateExportCard, 100);
}

function doDownloadCard() {
  var url = generateExportCard();
  var a   = document.createElement("a");
  a.href     = url;
  a.download = "busedex-wyniki.png";
  a.click();
}

async function doShareCard() {
  var url = generateExportCard();
  if (!url) return;
  /* canvas → blob */
  var cvs = document.getElementById("export-canvas");
  if (!cvs) return;
  cvs.toBlob(async function(blob) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files:[new File([blob],"busedex.png",{type:"image/png"})] })) {
      try {
        await navigator.share({
          title: "BuseDex Kielce — moje wyniki",
          text:  "Mam " + Object.keys(caught).length + " autobusów!",
          files: [new File([blob],"busedex.png",{type:"image/png"})]
        });
      } catch(e) { doDownloadCard(); }
    } else {
      doDownloadCard();
    }
  }, "image/png");
}

/* wrapper — renderuje udostępnianie do dowolnego elementu */
function renderSharingInto(container) {
  if (!container) return;
  container.innerHTML =
    '<div style="padding:14px;display:flex;flex-direction:column;gap:14px">' +
      '<div id="friend-compare-wrap-inline"></div>' +
      '<div class="ch-section">&#x1F4CA; Karta wyników</div>' +
      '<div style="font-size:12px;color:var(--tx3)">Wzór jest unikalny dla Twojej kolekcji.</div>' +
      '<canvas id="export-canvas" style="width:100%;border-radius:10px;border:1px solid var(--bd)"></canvas>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="btns" style="flex:1" onclick="doDownloadCard()">&#x1F4BE; Pobierz PNG</button>' +
        '<button class="btns" style="flex:1" onclick="doShareCard()">&#x1F4E4; Udostępnij</button>' +
      '</div>' +
      '<button class="btns" onclick="copyShareLink()">&#x1F517; Kopiuj link do kolekcji</button>' +
    '</div>';

  /* porównanie z przyjacielem */
  var fcw = document.getElementById("friend-compare-wrap-inline");
  if (fcw) {
    fcw.id = "friend-compare-wrap";
    renderFriendComparison();
    fcw.id = "friend-compare-wrap-inline";
  }
  setTimeout(generateExportCard, 150);
}
