/* ============================================================
   BuseDex Kielce — render.js
   Wszystkie funkcje renderujące widoki i karty autobusów.
   ============================================================ */

/* ── STATYSTYKI (pasek górny) ───────────────────────────────── */
function renderStats() {
  var tot = CATALOG.length,
      got = Object.keys(caught).length;

  /* canvas zamiast tekstu */
  if (typeof animateProgressCanvas === "function") {
    animateProgressCanvas(got, tot);
  }

  var sr = document.getElementById("stats-row");
  sr.innerHTML = "";
  var types = ["spalinowy", "hybrydowy", "elektryczny"];
  for (var ti = 0; ti < types.length; ti++) {
    var k = types[ti], v = TM[k], cnt = 0, g = 0;
    for (var ci = 0; ci < CATALOG.length; ci++) {
      if (CATALOG[ci].type === k) { cnt++; if (caught[CATALOG[ci].id]) g++; }
    }
    var p2 = cnt ? Math.round(g / cnt * 100) : 0;
    var ch = document.createElement("div");
    ch.className = "stat-chip";
    ch.style.borderColor = v.color + "44";
    ch.innerHTML =
      '<span style="font-size:18px">' + v.icon + '</span>' +
      '<span style="font-weight:800;font-size:14px;color:' + v.color + '">' + g + "/" + cnt + '</span>' +
      '<div class="smbar"><div class="smfill" style="width:' + p2 + '%;background:' + v.color + '"></div></div>' +
      '<span style="font-size:9px;color:#555;letter-spacing:.5px">' + v.label.toUpperCase() + '</span>';
    sr.appendChild(ch);
  }
}

/* ── FILTRY ─────────────────────────────────────────────────── */
function renderFilters() {
  // filtry marki
  var bf = document.getElementById("bf");
  bf.innerHTML = "";
  for (var i = 0; i < BRANDS.length; i++) {
    var b = BRANDS[i], bm = BM[b], on = brandF === b;
    var btn = document.createElement("button");
    btn.className = "chip" + (on ? " on" : "");
    btn.innerHTML = (bm ? bm.icon + " " : "") + b;
    if (on && bm) { btn.style.background = bm.color; btn.style.borderColor = bm.color; }
    (function(br) { btn.onclick = function() { brandF = br; renderList(); }; })(b);
    bf.appendChild(btn);
  }

  // filtry napędu
  var tf = document.getElementById("tf");
  tf.innerHTML = "";
  for (var j = 0; j < TYPES.length; j++) {
    var t = TYPES[j], tm = TM[t], on2 = typeF === t;
    var btn2 = document.createElement("button");
    btn2.className = "chip" + (on2 ? " on" : "");
    btn2.innerHTML = tm ? tm.icon + " " + tm.label : t;
    if (on2 && tm) { btn2.style.background = tm.color; btn2.style.borderColor = tm.color; }
    (function(ty) { btn2.onclick = function() { typeF = ty; renderList(); }; })(t);
    tf.appendChild(btn2);
  }
}

/* ── KARTA AUTOBUSU ─────────────────────────────────────────── */
function buildCard(bus, retro) {
  var c  = caught[bus.id],
      tm = TM[bus.type],
      bm = BM[bus.brand];
  var ph  = c && c.hp ? loadPh(bus.id) : null;
  var lbl = bus.num ? "#" + bus.num : bus.model;
  var el  = document.createElement("div");

  if (retro) {
    // ── karta Ikarusa ────────────────────────────────────────
    el.className = "icard" + (c ? " caught" : "");
    var thumb = ph
      ? '<img class="cthumb" src="' + ph + '" alt="' + lbl + '" style="filter:sepia(.3)">'
      : (c
          ? '<div class="cicon" style="font-size:24px;opacity:.85;filter:sepia(.5)">&#x1F68C;</div>'
          : '<div class="cicon" style="font-size:24px">&#x1F68C;</div>');
    el.innerHTML =
      thumb +
      '<div class="cnum" style="font-size:' + (bus.num ? "12px" : "9px") + '">' + lbl + '</div>' +
      (bus.num ? '<div class="iera">' + bus.model + '</div>' : '') +
      '<div class="ctype">&#x26FD;</div>' +
      (bus.unique ? '<div class="oneof">1 OF 1</div>' : '') +
      (c ? '<div class="cchk">&#x2B50;</div>' : '');

  } else if (bus.rare) {
    // ── karta rzadka (fioletowa) ─────────────────────────────
    el.className = "card rare" + (c ? " caught" : "");
    el.innerHTML =
      (ph
        ? '<img class="cthumb" src="' + ph + '" alt="' + lbl + '" style="filter:hue-rotate(260deg) saturate(.7)">'
        : '<div class="cicon">&#x1F68C;</div>') +
      '<div class="cnum">' + lbl + '</div>' +
      '<div class="cmod" style="color:#4a2060">' + bus.model.split(" ").slice(-2).join(" ") + '</div>' +
      '<div class="ctype">' + tm.icon + '</div>' +
      (bus.unique ? '<div class="oneof">1 OF 1</div>' : '') +
      (c ? '<div class="cchk" style="right:18px">&#x2705;</div>' : '');

  } else {
    // ── karta zwykła ─────────────────────────────────────────
    el.className = "card" + (c ? " caught" : "");
    el.style.borderColor = c ? tm.color : "#1e1e1e";
    el.style.background  = c ? tm.color + "0d" : "#111";
    var catchCount = catches[bus.id] ? catches[bus.id].length : 0;
    el.innerHTML =
      (ph ? '<img class="cthumb" src="' + ph + '" alt="' + lbl + '">'
          : '<div class="cicon">&#x1F68C;</div>') +
      '<div class="cnum" style="color:' + (c ? tm.color : "#444") + '">' + lbl + '</div>' +
      '<div class="cmod">' + bus.model.split(" ").slice(-2).join(" ") + '</div>' +
      '<div class="ctype">' + tm.icon + '</div>' +
      (catchCount > 1 ? '<div class="catch-count">x' + catchCount + '</div>' : '') +
      (c ? '<div class="cchk">&#x2705;</div>' : '');
  }

  el.onclick = function() { showDetail(bus); };
  return el;
}

/* ── LISTA AUTOBUSÓW ────────────────────────────────────────── */
function renderList() {
  renderStats();
  renderFilters();

  var q = document.getElementById("si").value.toLowerCase();

  // filtrowanie
  var filtered = [];
  for (var i = 0; i < CATALOG.length; i++) {
    var b = CATALOG[i];
    if (brandF !== "Wszystkie" && b.brand !== brandF) continue;
    if (typeF  !== "Wszystkie" && b.type  !== typeF)  continue;
    if (onlyUncaught && caught[b.id]) continue;
    if (q && b.num.indexOf(q) === -1 && b.model.toLowerCase().indexOf(q) === -1) continue;
    filtered.push(b);
  }

  // grupowanie po marce
  var brandOrder = [], groups = {};
  for (var j = 0; j < filtered.length; j++) {
    var br = filtered[j].brand;
    if (!groups[br]) { groups[br] = []; brandOrder.push(br); }
    groups[br].push(filtered[j]);
  }

  var container = document.getElementById("bus-list");
  container.innerHTML = "";

  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;color:#444;margin-top:50px;font-size:14px">Brak wyników</div>';
    return;
  }

  for (var bi = 0; bi < brandOrder.length; bi++) {
    var brand = brandOrder[bi],
        buses = groups[brand],
        bm    = BM[brand];
    var got = 0;
    for (var gi = 0; gi < buses.length; gi++) if (caught[buses[gi].id]) got++;
    var pct2 = Math.round(got / buses.length * 100);

    var sec = document.createElement("div");

    if (bm.retro) {
      // ── sekcja Ikarusa ──────────────────────────────────────
      var ihdr = document.createElement("div");
      ihdr.className = "ihdr";
      ihdr.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:22px">' + bm.icon + '</span>' +
          '<div><div class="itit">Ikarus</div><div class="isub">Węgierska legenda · 1895</div></div>' +
        '</div>' +
        '<div style="flex:1"></div>' +
        '<span style="font-size:12px;color:#7a6020">' + got + "/" + buses.length + '</span>' +
        '<div style="width:60px;height:4px;background:#2a2000;border-radius:2px;margin-left:8px">' +
          '<div style="width:' + pct2 + '%;height:100%;background:linear-gradient(90deg,#a07820,#f0c040);border-radius:2px"></div>' +
        '</div>';
      sec.appendChild(ihdr);

      var ig = document.createElement("div");
      ig.className = "igrid";
      for (var ii = 0; ii < buses.length; ii++) ig.appendChild(buildCard(buses[ii], true));
      sec.appendChild(ig);

    } else {
      // ── sekcja zwykłej marki ────────────────────────────────
      var shdr = document.createElement("div");
      shdr.className = "shdr";
      shdr.style.borderLeftColor = bm.color;
      shdr.innerHTML =
        '<span style="font-size:20px">' + bm.icon + '</span>' +
        '<span class="stit" style="color:' + bm.color + '">' + brand + '</span>' +
        '<span class="scnt">' + got + "/" + buses.length + '</span>' +
        '<div style="flex:1"></div>' +
        '<div class="sminibar"><div class="sminifill" style="width:' + pct2 + '%;background:' + bm.color + '"></div></div>';
      sec.appendChild(shdr);

      // sprawdź czy są podgrupy
      var hasSub = false;
      for (var si2 = 0; si2 < buses.length; si2++) if (buses[si2].sub) { hasSub = true; break; }

      if (hasSub) {
        var subOrder = [], subGroups = {};
        for (var si = 0; si < buses.length; si++) {
          var sub = buses[si].sub || "Inne";
          if (!subGroups[sub]) { subGroups[sub] = []; subOrder.push(sub); }
          subGroups[sub].push(buses[si]);
        }
        for (var soi = 0; soi < subOrder.length; soi++) {
          var subName  = subOrder[soi],
              subBuses = subGroups[subName],
              isRareSub = false;
          for (var ri = 0; ri < subBuses.length; ri++) if (subBuses[ri].rare) { isRareSub = true; break; }
          var subGot = 0;
          for (var sgi = 0; sgi < subBuses.length; sgi++) if (caught[subBuses[sgi].id]) subGot++;
          var subP = Math.round(subGot / subBuses.length * 100);

          var subHdr = document.createElement("div");
          if (isRareSub) {
            subHdr.className = "rshdr";
            subHdr.innerHTML =
              '<span style="font-size:14px">&#x1F48E;</span>' +
              '<span class="rstit">' + subName + '</span>' +
              '<span style="font-size:11px;color:#6b21a8">' + subGot + "/" + subBuses.length + '</span>' +
              '<div style="width:40px;height:3px;background:#1a0a2a;border-radius:2px;margin-left:6px">' +
                '<div style="width:' + subP + '%;height:100%;background:linear-gradient(90deg,#7c3aed,#c084fc);border-radius:2px"></div>' +
              '</div>';
          } else {
            subHdr.className = "subhdr";
            subHdr.style.borderLeftColor = bm.color + "55";
            subHdr.innerHTML =
              '<span class="subtit" style="color:' + bm.color + 'bb">' + subName + '</span>' +
              '<span style="font-size:11px;color:#444">' + subGot + "/" + subBuses.length + '</span>' +
              '<div style="width:40px;height:3px;background:#1a1a1a;border-radius:2px;margin-left:6px">' +
                '<div style="width:' + subP + '%;height:100%;background:' + bm.color + '88;border-radius:2px"></div>' +
              '</div>';
          }
          sec.appendChild(subHdr);

          var subGrid = document.createElement("div");
          subGrid.className = "grid";
          for (var sbi = 0; sbi < subBuses.length; sbi++) subGrid.appendChild(buildCard(subBuses[sbi], false));
          sec.appendChild(subGrid);
        }
      } else {
        var grid = document.createElement("div");
        grid.className = "grid";
        for (var gbi = 0; gbi < buses.length; gbi++) grid.appendChild(buildCard(buses[gbi], false));
        sec.appendChild(grid);
      }
    }

    container.appendChild(sec);
  }
}

/* ── WIDOK SZCZEGÓŁÓW ───────────────────────────────────────── */
function renderDetail() {
  var bus = curBus;
  if (!bus) return;
  var c  = caught[bus.id],
      tm = TM[bus.type],
      bm = BM[bus.brand];
  var ph      = c && c.hp ? loadPh(bus.id) : null;
  var lbl     = bus.num ? "#" + bus.num : bus.model;
  var isRetro = !!bm.retro,
      isRare  = !!bus.rare,
      isUniq  = !!bus.unique;

  document.getElementById("det-title").textContent =
    bus.brand + (bus.num ? " #" + bus.num : " — " + bus.model);
  document.getElementById("det-back").onclick = function() { showList(); };

  var body = document.getElementById("det-body");

  // ── wiersz informacyjny ─────────────────────────────────────
  var irowBg = isRetro ? "background:linear-gradient(135deg,#131006,#0e0c05);" : "";
  var html =
    '<div class="irow" style="border-color:' + bm.color + ';' + irowBg + '">' +
      '<span style="font-size:34px">' + bm.icon + '</span>' +
      '<div>' +
        '<div class="bnum" style="color:' + tm.color + ';font-size:' + (bus.num ? "38px" : "22px") + '">' + lbl + '</div>' +
        '<div class="bmod"' + (isRetro ? ' style="color:#7a6020"' : '') + '>' + bus.model + '</div>' +
        (bus.sub ? '<div style="font-size:11px;color:#555;margin-top:3px;letter-spacing:1px">' + bus.sub + '</div>' : '') +
      '</div>' +
    '</div>';

  // ── odznaka typu napędu ─────────────────────────────────────
  html +=
    '<div class="tbadge" style="color:' + tm.color + ';background:' + tm.color + '18;border-color:' + tm.color + '66">' +
    tm.icon + ' ' + tm.label + '</div>';

  if (c) {
    // ── złapany ─────────────────────────────────────────────
    var bst, bsy, btxt;
    if      (isRetro) { bst="cbadge"; bsy="background:#1a1200;border:1px solid #c9a84c;color:#c9a84c;";       btxt="&#x2B50; ZŁAPANA LEGENDA"; }
    else if (isRare)  { bst="cbadge"; bsy="background:#1a0a2a;border:1px solid #a855f7;color:#c084fc;";       btxt="&#x1F48E; RZADKI · ZŁAPANY"; }
    else              { bst="cbadge"; bsy="background:#051a05;border:1px solid #4caf50;color:#4caf50;";       btxt="&#x2705; ZŁAPANY"; }
    html += '<div class="' + bst + '" style="' + bsy + '">' + btxt + '</div>';

    if (isUniq) {
      var ps = isRetro
        ? "background:#120d00;border:1px solid #a07820;color:#c9a84c;"
        : "background:#12052a;border:1px solid #7c3aed;color:#c084fc;";
      html += '<div class="oneof-pill" style="' + ps + '">&thinsp;&#x2736; 1 OF 1 &#x2736;&thinsp;</div>';
    }

    // historia wszystkich złapań
    var allCatches  = catches[bus.id] || [];
    var borderColor = isRetro ? "#c9a84c" : (isRare ? "#a855f7" : tm.color);

    if (allCatches.length > 1) {
      html += '<div class="catch-header" style="color:' + borderColor + '">&#x1F4CB; Złapano ' + allCatches.length + '&times;</div>';
    }

    for (var ci2 = allCatches.length - 1; ci2 >= 0; ci2--) {
      var ce  = allCatches[ci2];
      var cph = ce.photoKey ? loadPh(ce.photoKey) : null;
      var mbs = isRetro ? "background:#0e0c05;border:1px solid #2a2000;" : "background:#111;border:1px solid #1e1e1e;";
      html += '<div style="' + mbs + 'border-radius:10px;padding:12px;margin-bottom:6px">';
      if (allCatches.length > 1) {
        html += '<div style="font-size:10px;font-weight:700;color:' + borderColor + ';margin-bottom:6px;letter-spacing:1px">ZŁAPANIE #' + (ci2+1) + '</div>';
      }
      if (cph) {
        html += '<img class="bphoto" src="' + cph + '"' +
          ' style="border-color:' + borderColor + ';margin-bottom:8px"' +
          ' onclick="openViewer(\'' + bus.id + '\',\'' + (bus.num||'') + '\',\'' + bus.model.replace(/'/g,"") + '\',\'' + bus.brand + '\',\'' + (ce.photoKey||bus.id) + '\')"' +
          ' alt="zdjęcie">';
      }
      html += '<div style="display:flex;flex-direction:column;gap:4px;font-size:13px;color:#777">';
      if (ce.date) html += '<span>&#x1F4C5; ' + ce.date + '</span>';
      if (ce.lat)  html += '<span>&#x1F4CD; ' + ce.lat.toFixed(4) + ', ' + ce.lng.toFixed(4) + '</span>';
      if (ce.note) html += '<span style="color:#aaa">&#x1F4DD; ' + ce.note.replace(/</g,"&lt;") + '</span>';
      if (!ce.date && !ce.note) html += '<span style="color:#333">Brak notatki</span>';
      html += '</div>';
      if (allCatches.length > 1) {
        html += '<button class="btns btnd" style="margin-top:8px;padding:7px;font-size:11px" onclick="delCatch(\'' + bus.id + '\',' + ci2 + ')">&#x1F5D1; Usuń to złapanie</button>';
      }
      html += '</div>';
    }

    html += '<button class="btnp" style="background:' + borderColor + ';margin-top:2px" onclick="showCapture(curBus,false)">&#x1F4F8; Złap ponownie!</button>';
    html += '<button class="btns" onclick="showCapture(curBus,true)">&#x270F;&#xFE0F; Dodaj notatkę do ostatniego</button>';
    html += '<button class="btns btnd" onclick="delCatch(\'' + bus.id + '\')">&#x1F5D1; Usuń wszystkie złapania</button>';

  } else {
    // ── niezłapany ──────────────────────────────────────────
    var ubs, ubt;
    if      (isRetro) { ubs = "background:#1a1200;border:1px solid #c9a84c44;color:#7a6020;"; ubt = "&#x1F3DB; NIEZŁAPANA"; }
    else if (isRare)  { ubs = "background:#1a0a2a;border:1px solid #a855f744;color:#6b21a8;"; ubt = "&#x1F48E; RZADKI EGZEMPLARZ"; }
    else              { ubs = "";                                                              ubt = "&#x2753; NIE ZŁAPANY"; }
    html += '<div class="ubadge" style="' + ubs + '">' + ubt + '</div>';

    if (isUniq) {
      var ps2 = isRetro
        ? "background:#120d00;border:1px solid #a07820;color:#c9a84c;"
        : "background:#12052a;border:1px solid #7c3aed;color:#c084fc;";
      html += '<div class="oneof-pill" style="' + ps2 + '">&thinsp;&#x2736; 1 OF 1 &#x2736;&thinsp;</div>';
    }

    var gs = isRetro ? "filter:sepia(.8);opacity:.1" : (isRare ? "filter:hue-rotate(270deg);opacity:.12" : "");
    html += '<div class="ghost" style="' + gs + '">&#x1F68C;</div>';

    var bc  = isRetro ? "#a07820" : (isRare ? "#7c3aed" : tm.color);
    var bt  = isRetro ? "&#x1F4F8; Złap tę legendę!" : (isRare ? "&#x1F4F8; Złap ten rzadki egzemplarz!" : "&#x1F4F8; Złap ten autobus!");
    html += '<button class="btnp" style="background:' + bc + '" onclick="showCapture(curBus,false)">' + bt + '</button>';
  }

  body.innerHTML = html;
}
