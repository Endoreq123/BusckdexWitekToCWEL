/* ============================================================
   BuseDex Kielce — devmode.js
   Tryb dewelopera: szyfrowane logowanie + dodawanie autobusów
   globalnie przez Supabase.

   Szyfrowanie: AES-GCM 256-bit (Web Crypto API).
   Hasło nigdy nie jest przechowywane w czystym tekście.
   ============================================================ */

var DEV_KEY   = "bdk-dev-hash";  // klucz w localStorage
var devLogged = false;

/* ══════════════════════════════════════════════════════════════
   KRYPTOGRAFIA — AES-GCM przez SubtleCrypto
   ══════════════════════════════════════════════════════════════ */

async function _deriveKey(password) {
  var enc  = new TextEncoder();
  var raw  = await crypto.subtle.importKey("raw", enc.encode(password),
               "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt: enc.encode("busedex-kielce"), iterations:100000, hash:"SHA-256" },
    raw, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]
  );
}

async function _encrypt(text, password) {
  var key = await _deriveKey(password);
  var iv  = crypto.getRandomValues(new Uint8Array(12));
  var enc = new TextEncoder();
  var buf = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, enc.encode(text));
  /* zapisz iv + dane jako base64 */
  var combined = new Uint8Array(iv.length + buf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(buf), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function _decrypt(b64, password) {
  try {
    var key  = await _deriveKey(password);
    var data = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    var iv   = data.slice(0, 12);
    var buf  = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, data.slice(12));
    return new TextDecoder().decode(buf);
  } catch(e) { return null; }
}

/* ══════════════════════════════════════════════════════════════
   LOGOWANIE
   ══════════════════════════════════════════════════════════════ */

async function devLogin(username, password) {
  if (username !== CONFIG.devUsername) return false;

  var stored = localStorage.getItem(DEV_KEY);

  if (!stored) {
    /* pierwsze logowanie — zapisz zaszyfrowane hasło */
    var enc = await _encrypt("BUSEDEX_DEV_OK", password);
    localStorage.setItem(DEV_KEY, enc);
    devLogged = true;
    return true;
  }

  /* weryfikacja */
  var dec = await _decrypt(stored, password);
  if (dec === "BUSEDEX_DEV_OK") { devLogged = true; return true; }
  return false;
}

async function devChangePassword(oldPass, newPass) {
  var stored = localStorage.getItem(DEV_KEY);
  if (!stored) return false;
  var dec = await _decrypt(stored, oldPass);
  if (dec !== "BUSEDEX_DEV_OK") return false;
  var enc = await _encrypt("BUSEDEX_DEV_OK", newPass);
  localStorage.setItem(DEV_KEY, enc);
  return true;
}

function devLogout() {
  devLogged = false;
  showScreen("screen-list");
  setNav("nav-list");
  renderList();
  toast("Wylogowano z trybu dewelopera");
}

function devHasPassword() {
  return !!localStorage.getItem(DEV_KEY);
}

/* ══════════════════════════════════════════════════════════════
   SUPABASE — globalny katalog
   ══════════════════════════════════════════════════════════════ */

function _sbHeaders() {
  return {
    "apikey":        CONFIG.supabaseKey,
    "Authorization": "Bearer " + CONFIG.supabaseKey,
    "Content-Type":  "application/json",
    "Prefer":        "return=representation"
  };
}

async function sbFetchCatalog() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return null;
  try {
    var res = await fetch(
      CONFIG.supabaseUrl + "/rest/v1/buses?active=eq.true&order=brand,num",
      { headers: _sbHeaders() }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

async function sbAddBus(bus) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return false;
  try {
    var res = await fetch(
      CONFIG.supabaseUrl + "/rest/v1/buses",
      {
        method: "POST",
        headers: _sbHeaders(),
        body: JSON.stringify({
          id:         bus.id,
          num:        bus.num        || "",
          brand:      bus.brand,
          sub:        bus.sub        || null,
          model:      bus.model,
          type:       bus.type,
          rare:       !!bus.rare,
          unique_bus: !!bus.unique,
          active:     true
        })
      }
    );
    return res.ok;
  } catch(e) { return false; }
}

async function sbDeleteBus(id) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return false;
  try {
    /* soft delete — ustawiamy active=false */
    var res = await fetch(
      CONFIG.supabaseUrl + "/rest/v1/buses?id=eq." + encodeURIComponent(id),
      {
        method: "PATCH",
        headers: _sbHeaders(),
        body: JSON.stringify({ active: false })
      }
    );
    return res.ok;
  } catch(e) { return false; }
}

/* Wczytaj globalny katalog i połącz z lokalnym CATALOG */
async function syncGlobalCatalog() {
  var remote = await sbFetchCatalog();
  if (!remote || !remote.length) return false;

  /* Mapuj pola Supabase → format lokalny */
  var remoteIds = {};
  remote.forEach(function(row) {
    remoteIds[row.id] = true;
    /* sprawdź czy już istnieje lokalnie */
    var exists = CATALOG.some(function(b) { return b.id === row.id; });
    if (!exists) {
      CATALOG.push({
        id:     row.id,
        num:    row.num    || "",
        brand:  row.brand,
        sub:    row.sub    || undefined,
        model:  row.model,
        type:   row.type,
        rare:   row.rare   || undefined,
        unique: row.unique_bus || undefined,
        _remote: true   /* flaga: pochodzi z Supabase */
      });
    }
  });

  /* Zaktualizuj metadane marek jeśli nowa marka */
  CATALOG.forEach(function(b) {
    if (!BM[b.brand]) {
      BM[b.brand]    = { icon:"&#x1F68C;", color:"#607d8b" };
      BRANDS.push(b.brand);
    }
  });

  return true;
}

/* ══════════════════════════════════════════════════════════════
   PANEL DEWELOPERA — UI
   ══════════════════════════════════════════════════════════════ */

function showDevScreen() {
  showScreen("screen-dev");
  setNav("");
  renderDevPanel();
}

function renderDevPanel() {
  var body = document.getElementById("dev-body");
  if (!body) return;

  if (!devLogged) {
    /* ── formularz logowania ── */
    body.innerHTML =
      '<div class="dev-login">' +
        '<div class="dev-logo">&#x1F6E0;&#xFE0F;</div>' +
        '<div class="dev-title">Tryb dewelopera</div>' +
        '<div class="dev-sub">' + CONFIG.devUsername + '</div>' +
        '<input class="dev-inp" id="dev-pass" type="password" placeholder="Hasło">' +
        '<div id="dev-err" style="color:#e74c3c;font-size:12px;min-height:18px;text-align:center"></div>' +
        '<button class="dev-btn-login" id="dev-login-btn" onclick="doDevLogin()">Zaloguj</button>' +
        (devHasPassword() ? "" :
          '<div style="font-size:10px;color:#555;text-align:center;margin-top:8px">Pierwsze logowanie — ustaw swoje hasło</div>'
        ) +
        '<button class="btns" style="margin-top:12px" onclick="showList()">&#x2190; Wróć</button>' +
      '</div>';

    document.getElementById("dev-pass").addEventListener("keydown", function(e) {
      if (e.key === "Enter") doDevLogin();
    });
    return;
  }

  /* ── panel główny ── */
  var hasSupabase = !!(CONFIG.supabaseUrl && CONFIG.supabaseKey);
  var localOnly   = CATALOG.filter(function(b) { return !b._remote; }).length;
  var remoteCount = CATALOG.filter(function(b) { return b._remote; }).length;

  body.innerHTML =
    '<div class="dev-panel">' +

    /* status */
    '<div class="dev-status-row">' +
      '<div class="dev-status-dot ' + (hasSupabase ? "on" : "") + '"></div>' +
      '<span style="font-size:12px;color:#888">' +
        (hasSupabase
          ? 'Supabase połączony · ' + remoteCount + ' autobusów zdalnych'
          : 'Tryb lokalny (brak konfiguracji Supabase)') +
      '</span>' +
    '</div>' +

    /* stat */
    '<div class="dev-stat-row">' +
      '<div class="dev-stat"><div class="dev-stat-n">' + CATALOG.length + '</div><div class="dev-stat-l">Wszystkich</div></div>' +
      '<div class="dev-stat"><div class="dev-stat-n">' + localOnly + '</div><div class="dev-stat-l">Lokalnych</div></div>' +
      '<div class="dev-stat"><div class="dev-stat-n">' + remoteCount + '</div><div class="dev-stat-l">Globalnych</div></div>' +
    '</div>' +

    /* formularz dodawania */
    '<div class="dev-section-title">&#x2795; Dodaj autobus</div>' +
    '<div class="dev-form">' +
      '<div class="dev-row2">' +
        '<div><div class="plbl">Marka *</div>' +
          '<select class="dev-inp" id="df-brand" onchange="devBrandChange()">' +
            _devBrandOptions() +
            '<option value="__new__">+ Nowa marka</option>' +
          '</select></div>' +
        '<div><div class="plbl">Numer boczny</div><input class="dev-inp" id="df-num" type="text" placeholder="np. 428"></div>' +
      '</div>' +
      '<div id="df-newbrand-wrap" style="display:none">' +
        '<div class="plbl">Nazwa nowej marki *</div>' +
        '<input class="dev-inp" id="df-newbrand" type="text" placeholder="np. Volvo">' +
      '</div>' +
      '<div><div class="plbl">Model *</div><input class="dev-inp" id="df-model" type="text" placeholder="np. 7900 Electric"></div>' +
      '<div class="dev-row2">' +
        '<div><div class="plbl">Napęd *</div>' +
          '<select class="dev-inp" id="df-type">' +
            '<option value="spalinowy">Spalinowy</option>' +
            '<option value="hybrydowy">Hybrydowy</option>' +
            '<option value="elektryczny">Elektryczny</option>' +
          '</select></div>' +
        '<div><div class="plbl">Podgrupa (opcja)</div><input class="dev-inp" id="df-sub" type="text" placeholder="np. U12 V"></div>' +
      '</div>' +
      '<div class="dev-row2">' +
        '<label class="dev-check"><input type="checkbox" id="df-rare"> Rzadki (fioletowy)</label>' +
        '<label class="dev-check"><input type="checkbox" id="df-unique"> 1 OF 1 (unikat)</label>' +
      '</div>' +
      '<div id="dev-add-err" style="color:#e74c3c;font-size:12px;min-height:16px"></div>' +
      '<div id="dev-add-ok"  style="color:#4caf50;font-size:12px;min-height:16px;display:none">&#x2705; Dodano!</div>' +
      '<button class="dev-btn-add" onclick="doDevAddBus()">&#x2795; Dodaj autobus</button>' +
    '</div>' +

    /* lista z możliwością usunięcia */
    '<div class="dev-section-title">&#x1F4CB; Katalog — ostatnio dodane</div>' +
    _devCatalogList() +

    /* zmiana hasła */
    '<div class="dev-section-title">&#x1F512; Zmień hasło</div>' +
    '<div class="dev-form">' +
      '<input class="dev-inp" id="cp-old" type="password" placeholder="Stare hasło">' +
      '<input class="dev-inp" id="cp-new" type="password" placeholder="Nowe hasło">' +
      '<div id="cp-msg" style="font-size:12px;min-height:16px"></div>' +
      '<button class="btns" onclick="doChangePass()">Zmień hasło</button>' +
    '</div>' +

    '<button class="btns btnd" style="margin-top:16px" onclick="devLogout()">&#x23CF;&#xFE0F; Wyloguj</button>' +
    '</div>';
}

function _devBrandOptions() {
  return BRANDS.filter(function(b) { return b !== "Wszystkie"; })
    .map(function(b) { return '<option>' + b + '</option>'; }).join("");
}

function _devCatalogList() {
  var recent = CATALOG.slice().reverse().slice(0, 20);
  var html = '<div class="dev-catalog-list">';
  recent.forEach(function(b) {
    var lbl = b.brand + (b.num ? " #" + b.num : "") + " — " + b.model;
    html +=
      '<div class="dev-catalog-row">' +
        '<span style="flex:1;font-size:12px;color:#aaa">' + lbl + '</span>' +
        (b._remote ? '<span style="font-size:9px;color:#2196f3;margin-right:8px">GLOBAL</span>' : '') +
        '<button class="dev-del-btn" onclick="doDevDel(\'' + b.id + '\')">&#x1F5D1;</button>' +
      '</div>';
  });
  return html + '</div>';
}

function devBrandChange() {
  var sel = document.getElementById("df-brand");
  var wrap = document.getElementById("df-newbrand-wrap");
  if (wrap) wrap.style.display = sel.value === "__new__" ? "block" : "none";
}

async function doDevLogin() {
  var pass = document.getElementById("dev-pass").value;
  var err  = document.getElementById("dev-err");
  if (!pass) { err.textContent = "Wpisz hasło"; return; }
  err.textContent = "Sprawdzanie…";
  var ok = await devLogin(CONFIG.devUsername, pass);
  if (ok) {
    if (CONFIG.syncOnStart) {
      toast("Synchronizacja katalogu…");
      await syncGlobalCatalog();
    }
    renderDevPanel();
  } else {
    err.textContent = "Błędne hasło";
    document.getElementById("dev-pass").value = "";
  }
}

async function doDevAddBus() {
  var brand    = document.getElementById("df-brand").value;
  var newBrand = document.getElementById("df-newbrand") ? document.getElementById("df-newbrand").value.trim() : "";
  var num      = document.getElementById("df-num").value.trim();
  var model    = document.getElementById("df-model").value.trim();
  var type     = document.getElementById("df-type").value;
  var sub      = document.getElementById("df-sub").value.trim();
  var rare     = document.getElementById("df-rare").checked;
  var unique   = document.getElementById("df-unique").checked;
  var errEl    = document.getElementById("dev-add-err");
  var okEl     = document.getElementById("dev-add-ok");

  if (brand === "__new__") brand = newBrand;
  if (!brand) { errEl.textContent = "Wybierz lub wpisz markę"; return; }
  if (!model) { errEl.textContent = "Wpisz model"; return; }
  errEl.textContent = "";

  /* generuj id */
  var prefix = brand.toLowerCase().replace(/[^a-z]/g,"").slice(0,3);
  var id = prefix + "_" + Date.now();

  var bus = {
    id: id, num: num, brand: brand, model: model, type: type,
    sub: sub || undefined, rare: rare || undefined, unique: unique || undefined
  };

  /* dodaj globalnie lub lokalnie */
  var addedGlobal = false;
  if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
    toast("Dodawanie do Supabase…");
    addedGlobal = await sbAddBus(bus);
    if (!addedGlobal) {
      errEl.textContent = "Błąd Supabase — dodano tylko lokalnie";
    }
  }

  /* zawsze dodaj do lokalnego CATALOG */
  if (addedGlobal) bus._remote = true;
  CATALOG.push(bus);

  /* zaktualizuj metadane jeśli nowa marka */
  if (!BM[brand]) {
    BM[brand] = { icon:"&#x1F68C;", color:"#607d8b" };
    BRANDS.push(brand);
  }

  okEl.style.display = "block";
  okEl.textContent   = "✅ Dodano" + (addedGlobal ? " globalnie!" : " lokalnie!");
  setTimeout(function() { okEl.style.display = "none"; }, 3000);

  /* wyczyść formularz */
  document.getElementById("df-num").value   = "";
  document.getElementById("df-model").value = "";
  document.getElementById("df-sub").value   = "";
  document.getElementById("df-rare").checked   = false;
  document.getElementById("df-unique").checked = false;

  toast((addedGlobal ? "Globalnie: " : "Lokalnie: ") + brand + (num ? " #"+num : "") + " " + model);
  renderList(); /* odśwież listę */
}

async function doDevDel(id) {
  if (!confirm("Usunąć autobus " + id + " ?")) return;

  var bus = CATALOG.find(function(b) { return b.id === id; });
  var wasRemote = bus && bus._remote;

  /* usuń z CATALOG */
  var idx = CATALOG.findIndex(function(b) { return b.id === id; });
  if (idx > -1) CATALOG.splice(idx, 1);

  /* usuń z Supabase */
  if (wasRemote && CONFIG.supabaseUrl && CONFIG.supabaseKey) {
    await sbDeleteBus(id);
  }

  /* usuń złapanie */
  if (caught[id]) { delete caught[id]; saveData(); }

  toast("Usunięto " + id);
  renderDevPanel();
  renderList();
}

async function doChangePass() {
  var oldP = document.getElementById("cp-old").value;
  var newP = document.getElementById("cp-new").value;
  var msg  = document.getElementById("cp-msg");
  if (!oldP || !newP) { msg.style.color="#e74c3c"; msg.textContent="Wypełnij oba pola"; return; }
  if (newP.length < 4) { msg.style.color="#e74c3c"; msg.textContent="Minimum 4 znaki"; return; }
  var ok = await devChangePassword(oldP, newP);
  if (ok) { msg.style.color="#4caf50"; msg.textContent="Hasło zmienione!"; }
  else    { msg.style.color="#e74c3c"; msg.textContent="Błędne stare hasło"; }
  document.getElementById("cp-old").value = "";
  document.getElementById("cp-new").value = "";
}
