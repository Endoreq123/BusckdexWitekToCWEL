/* ============================================================
   BuseDex Kielce — accounts.js
   Lokalny profil użytkownika — w pełni offline,
   bez rejestracji, bez e-maila, bez serwisów zewnętrznych.
   Opcjonalna synchronizacja z Supabase jeśli skonfigurowane.
   ============================================================ */

var ACCOUNT_KEY    = "bdk-profile";
var currentUser    = null;   /* { username, color, since } | null */
var _editMode      = false;
var _selectedColor = "#c0191a";

var AVATAR_COLORS = [
  "#c0191a","#e67e22","#f5c800","#27ae60","#2980b9",
  "#8e44ad","#16a085","#d35400","#2c3e50","#7f8c8d"
];

/* ── ŁADOWANIE / ZAPIS ──────────────────────────────────────── */
function loadAccount() {
  try {
    var raw = localStorage.getItem(ACCOUNT_KEY);
    if (raw) currentUser = JSON.parse(raw);
  } catch(e) { currentUser = null; }
}

function _saveAccount() {
  try {
    if (currentUser) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(currentUser));
    else             localStorage.removeItem(ACCOUNT_KEY);
  } catch(e) {}
}

/* ── TWORZENIE / EDYCJA / USUWANIE ─────────────────────────── */
function createProfile(username, color) {
  username = username.trim().slice(0, 24);
  if (!username) return false;
  currentUser = {
    username: username,
    color:    color || AVATAR_COLORS[0],
    since:    new Date().toLocaleDateString("pl-PL")
  };
  _saveAccount();
  return true;
}

function updateProfile(username, color) {
  if (!currentUser) return createProfile(username, color);
  if (username && username.trim()) currentUser.username = username.trim().slice(0, 24);
  if (color)                       currentUser.color    = color;
  _saveAccount();
  return true;
}

function deleteProfile() {
  currentUser = null;
  _saveAccount();
}

/* ── OPCJONALNA SYNCHRONIZACJA Z SUPABASE ───────────────────── */
async function syncProgress() {
  if (!currentUser || !CONFIG.supabaseUrl || !CONFIG.supabaseKey) return;
  try {
    var got    = Object.keys(caught).length;
    var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
    await fetch(CONFIG.supabaseUrl + "/rest/v1/user_progress", {
      method: "POST",
      headers: {
        "apikey":        CONFIG.supabaseKey,
        "Authorization": "Bearer " + CONFIG.supabaseKey,
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        user_id:    _usernameId(currentUser.username),
        username:   currentUser.username,
        color:      currentUser.color,
        caught:     got,
        badges:     earned,
        updated_at: new Date().toISOString()
      })
    });
  } catch(e) {}
}

async function fetchLeaderboard() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return null;
  try {
    var res = await fetch(
      CONFIG.supabaseUrl + "/rest/v1/user_progress?order=caught.desc&limit=20",
      { headers: { "apikey": CONFIG.supabaseKey, "Authorization": "Bearer " + CONFIG.supabaseKey } }
    );
    return res.ok ? await res.json() : null;
  } catch(e) { return null; }
}

/* deterministyczny pseudo-UUID z nazwy */
function _usernameId(name) {
  var h = 5381;
  for (var i = 0; i < name.length; i++) h = ((h<<5)-h) + name.charCodeAt(i) | 0;
  var hex = (h >>> 0).toString(16).padStart(8,"0");
  return hex + "-0000-0000-0000-" + hex + "0000";
}

/* ══════════════════════════════════════════════════════════════
   UI
   ══════════════════════════════════════════════════════════════ */
function showAccountScreen() {
  showScreen("screen-account");
  setNav("nav-account");
  renderAccountScreen();
}

function renderAccountScreen() {
  var body = document.getElementById("account-body");
  if (!body) return;
  if (!currentUser)   _renderCreateProfile(body);
  else if (_editMode) _renderEditProfile(body);
  else                _renderProfile(body);
}

/* ── TWORZENIE PROFILU ──────────────────────────────────────── */
function _renderCreateProfile(body) {
  _selectedColor = AVATAR_COLORS[0];
  body.innerHTML =
    '<div class="auth-wrap">' +
      '<div class="auth-logo" id="av-preview" style="' + _avStyle(_selectedColor) + '">&#x1F464;</div>' +
      '<div class="auth-title">Utwórz profil</div>' +
      '<div style="font-size:12px;color:var(--tx3);text-align:center;margin-top:-6px;margin-bottom:4px">' +
        '&#x1F4BE; Lokalnie &middot; bez rejestracji &middot; offline' +
      '</div>' +
      '<div><div class="plbl">Twoja nazwa</div>' +
        '<input class="dev-inp" id="ac-name" type="text" placeholder="np. BusTrooper" maxlength="24" autocomplete="off">' +
      '</div>' +
      '<div><div class="plbl">Kolor avatara</div>' +
        '<div class="avatar-color-grid">' +
          AVATAR_COLORS.map(function(c,i) {
            return '<div class="avatar-color-dot' + (i===0?" ac-sel":"") + '" style="background:' + c + '" ' +
              'onclick="selectAvatarColor(\'' + c + '\')" data-color="' + c + '"></div>';
          }).join("") +
        '</div>' +
      '</div>' +
      '<div id="ac-err" class="auth-err"></div>' +
      '<button class="btnp" style="background:var(--red)" onclick="doCreateProfile()">&#x2705; Gotowe</button>' +
    '</div>';
}

/* ── EDYCJA PROFILU ─────────────────────────────────────────── */
function _renderEditProfile(body) {
  _selectedColor = currentUser.color;
  body.innerHTML =
    '<div class="auth-wrap">' +
      '<div class="auth-logo" id="av-preview" style="' + _avStyle(currentUser.color) + '">' +
        _avInitial(currentUser.username) +
      '</div>' +
      '<div class="auth-title">Edytuj profil</div>' +
      '<div><div class="plbl">Nazwa</div>' +
        '<input class="dev-inp" id="ac-name" type="text" value="' + _esc(currentUser.username) + '" maxlength="24">' +
      '</div>' +
      '<div><div class="plbl">Kolor avatara</div>' +
        '<div class="avatar-color-grid">' +
          AVATAR_COLORS.map(function(c) {
            return '<div class="avatar-color-dot' + (c===currentUser.color?" ac-sel":"") + '" style="background:' + c + '" ' +
              'onclick="selectAvatarColor(\'' + c + '\')" data-color="' + c + '"></div>';
          }).join("") +
        '</div>' +
      '</div>' +
      '<button class="btnp" style="background:var(--red)" onclick="doUpdateProfile()">&#x2705; Zapisz zmiany</button>' +
      '<button class="btns" onclick="_editMode=false;renderAccountScreen()">Anuluj</button>' +
      '<button class="btns btnd" onclick="doDeleteProfile()">&#x1F5D1; Usuń profil</button>' +
    '</div>';
}

/* ── WIDOK PROFILU ──────────────────────────────────────────── */
function _renderProfile(body) {
  var got    = Object.keys(caught).length;
  var tot    = CATALOG.length;
  var pct    = tot ? Math.round(got/tot*100) : 0;
  var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
  var lv     = typeof getLevel === "function" ? getLevel(caught) : null;
  var hasSb  = !!(CONFIG.supabaseUrl && CONFIG.supabaseKey);

  body.innerHTML =
    '<div class="auth-wrap">' +
      '<div style="' + _avStyle(currentUser.color) + ';font-size:32px;font-weight:900">' +
        _avInitial(currentUser.username) +
      '</div>' +
      '<div class="auth-title" style="color:' + currentUser.color + '">' + _esc(currentUser.username) + '</div>' +
      '<div style="font-size:11px;color:var(--tx3);text-align:center;margin-top:-6px">Konto od ' + currentUser.since + '</div>' +

      '<div class="dev-stat-row" style="margin-top:10px">' +
        '<div class="dev-stat"><div class="dev-stat-n" style="color:var(--red)">' + got + '</div><div class="dev-stat-l">Złapanych</div></div>' +
        '<div class="dev-stat"><div class="dev-stat-n" style="color:var(--yel)">' + pct + '%</div><div class="dev-stat-l">Ukończono</div></div>' +
        '<div class="dev-stat"><div class="dev-stat-n">' + earned + '</div><div class="dev-stat-l">Odznak</div></div>' +
      '</div>' +
      (lv ? '<div style="text-align:center;padding:6px 0;font-size:14px;color:' + lv.level.color + '">' + lv.level.icon + ' ' + lv.level.name + '</div>' : '') +

      '<div style="font-size:11px;color:var(--tx3);text-align:center;padding:8px;border:1px solid var(--bd);border-radius:8px;line-height:1.6">' +
        '&#x1F4BE; Profil lokalny &mdash; działa bez internetu<br>' +
        '&#x1F512; Dane tylko na tym urządzeniu' +
      '</div>' +

      (hasSb
        ? '<button class="btns" onclick="doSyncProgress()">&#x1F504; Wyślij do rankingu globalnego</button>' +
          '<button class="btns" onclick="showLeaderboardInline()">&#x1F3C6; Ranking globalny</button>' +
          '<div id="lb-wrap"></div>'
        : '') +

      '<button class="btns" onclick="_editMode=true;renderAccountScreen()">&#x270F;&#xFE0F; Edytuj profil</button>' +
    '</div>';
}

/* ── AKCJE ──────────────────────────────────────────────────── */
function selectAvatarColor(col) {
  _selectedColor = col;
  document.querySelectorAll(".avatar-color-dot").forEach(function(d) {
    d.classList.toggle("ac-sel", d.dataset.color === col);
  });
  var prev = document.getElementById("av-preview");
  if (prev) { prev.style.cssText = _avStyle(col); }
}

function doCreateProfile() {
  var name = (document.getElementById("ac-name") || {}).value || "";
  var err  = document.getElementById("ac-err");
  if (!name.trim()) {
    if (err) { err.textContent = "Wpisz nazwę użytkownika"; err.style.display = "block"; }
    return;
  }
  if (createProfile(name, _selectedColor)) {
    _editMode = false;
    renderAccountScreen();
    toast("Profil \"" + name.trim() + "\" gotowy!");
  }
}

function doUpdateProfile() {
  var name = (document.getElementById("ac-name") || {}).value || "";
  updateProfile(name, _selectedColor);
  _editMode = false;
  renderAccountScreen();
  toast("Profil zaktualizowany");
}

function doDeleteProfile() {
  if (!confirm("Usunąć profil?\n\nDane kolekcji (złapane autobusy) pozostaną na urządzeniu.")) return;
  deleteProfile();
  _editMode = false;
  renderAccountScreen();
  toast("Profil usunięty");
}

async function doSyncProgress() {
  if (!currentUser) return;
  toast("Synchronizacja...");
  await syncProgress();
  toast("Wyniki wysłane!");
}

async function showLeaderboardInline() {
  var wrap = document.getElementById("lb-wrap");
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:12px;font-size:12px">Wczytywanie...</div>';
  var data = await fetchLeaderboard();
  if (!data || !data.length) {
    wrap.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:12px;font-size:12px">Brak danych rankingu</div>';
    return;
  }
  var myId = currentUser ? _usernameId(currentUser.username) : null;
  var html = '<div class="dev-section-title" style="margin-top:10px">&#x1F3C6; Ranking</div><div class="rank-list">';
  data.forEach(function(row, i) {
    var isMe  = myId && row.user_id === myId;
    var medal = i===0?"&#x1F947;":i===1?"&#x1F948;":i===2?"&#x1F949;":"#"+(i+1);
    var col   = row.color || "#888";
    html +=
      '<div class="rank-row" style="' + (isMe?"border:1px solid var(--yel);":"") + '">' +
        '<div class="rank-pos">' + medal + '</div>' +
        '<div style="width:22px;height:22px;border-radius:50%;background:' + col + ';flex-shrink:0;' +
          'display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff">' +
          (row.username||"?")[0].toUpperCase() +
        '</div>' +
        '<div class="rank-info"><div class="rank-name" style="color:' + (isMe?"var(--yel)":"var(--tx)") + '">' +
          _esc(row.username||"Gracz") + (isMe?" (Ty)":"") + '</div></div>' +
        '<div class="rank-pct" style="color:var(--red)">' + (row.caught||0) + '</div>' +
        '<div class="rank-frac">' + (row.badges||0) + ' odzn.</div>' +
      '</div>';
  });
  wrap.innerHTML = html + '</div>';
}

/* ── HELPERS ────────────────────────────────────────────────── */
function _avStyle(col) {
  return 'width:72px;height:72px;border-radius:50%;background:' + col + ';' +
    'display:flex;align-items:center;justify-content:center;' +
    'font-size:32px;font-weight:900;color:#fff;margin:0 auto;' +
    'box-shadow:0 4px 20px ' + col + '55';
}
function _avInitial(name) { return (name||"?")[0].toUpperCase(); }
function _esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
