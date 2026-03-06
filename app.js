/* ============================================================
   BuseDex Kielce — app.js
   Logika aplikacji: storage, ekrany, złapania, animacja CRT
   ============================================================ */

/* ── STAN APLIKACJI ─────────────────────────────────────────── */
var caught   = {};          // { id: { date, note, hp } }
var brandF   = "Wszystkie";
var typeF    = "Wszystkie";
var curBus   = null;
var capPh    = null;

/* ── STORAGE ────────────────────────────────────────────────── */
var STORAGE_KEY = "bdk2";   // zmiana klucza = czyste dane (naprawia błąd fab. złapania)

function loadData() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) caught = JSON.parse(raw);
  } catch(e) { caught = {}; }
}

function saveData() {
  var m = {};
  for (var k in caught) {
    m[k] = { date: caught[k].date, note: caught[k].note, hp: caught[k].hp };
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch(e) {}
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
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function showList() {
  showScreen("screen-list");
  renderList();
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
  if (capPh) ok = savePh(id, capPh);
  else delPh(id);

  caught[id] = { date: today, note: note, hp: !!(capPh && ok) };
  saveData();

  var savedBus = curBus, savedPh = capPh;
  showCatchAnim(savedBus, savedPh, function() { showDetail(savedBus); });
}

function delCatch(id) {
  if (!confirm("Usunąć złapanie tego autobusu?")) return;
  delete caught[id];
  delPh(id);
  saveData();
  toast("Złapanie usunięte");
  renderDetail();
}

function openViewer(id, num, model, brand) {
  var p = "?id="    + encodeURIComponent(id)    +
          "&num="   + encodeURIComponent(num)   +
          "&model=" + encodeURIComponent(model) +
          "&brand=" + encodeURIComponent(brand);
  window.location.href = "viewer.html" + p;
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

  loadData();
  renderList();
  renderInstall();
});
