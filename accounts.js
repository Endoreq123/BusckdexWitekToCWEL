/* ============================================================
   BuseDex Kielce — accounts.js
   Konta użytkowników przez Supabase Auth.
   
   Supabase Auth daje: rejestrację emailem, logowanie,
   sesję JWT, reset hasła — wszystko za darmo.
   
   Globalny ranking: tabela "user_progress" w Supabase:
     user_id   uuid  FK auth.users
     username  text
     caught    int
     badges    int
     updated_at timestamptz
   ============================================================ */

var currentUser = null;   /* { id, email, username } lub null */
var AUTH_KEY    = "bdk-session";

/* ── SUPABASE AUTH HELPERS ──────────────────────────────────── */
function _authHeaders(token) {
  return {
    "apikey":        CONFIG.supabaseKey,
    "Authorization": "Bearer " + (token || CONFIG.supabaseKey),
    "Content-Type":  "application/json"
  };
}

async function authRegister(email, password, username) {
  if (!CONFIG.supabaseUrl) return { error: "Brak konfiguracji Supabase" };
  try {
    var res = await fetch(CONFIG.supabaseUrl + "/auth/v1/signup", {
      method: "POST",
      headers: _authHeaders(),
      body: JSON.stringify({ email, password, data: { username } })
    });
    var d = await res.json();
    if (d.error) return { error: d.error.message || d.error };
    /* zapisz sesję */
    if (d.access_token) _saveSession(d, username);
    return { ok: true, needConfirm: !d.access_token };
  } catch(e) { return { error: "Błąd sieci" }; }
}

async function authLogin(email, password) {
  if (!CONFIG.supabaseUrl) return { error: "Brak konfiguracji Supabase" };
  try {
    var res = await fetch(
      CONFIG.supabaseUrl + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: _authHeaders(),
      body: JSON.stringify({ email, password })
    });
    var d = await res.json();
    if (d.error) return { error: d.error.message || d.error };
    var username = (d.user && d.user.user_metadata && d.user.user_metadata.username) || email.split("@")[0];
    _saveSession(d, username);
    return { ok: true };
  } catch(e) { return { error: "Błąd sieci" }; }
}

async function authLogout() {
  if (currentUser && CONFIG.supabaseUrl) {
    var sess = _loadSession();
    if (sess && sess.token) {
      fetch(CONFIG.supabaseUrl + "/auth/v1/logout", {
        method: "POST",
        headers: _authHeaders(sess.token)
      }).catch(function(){});
    }
  }
  currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  toast("Wylogowano");
  renderAccountScreen();
}

async function authResetPassword(email) {
  if (!CONFIG.supabaseUrl) return { error: "Brak konfiguracji Supabase" };
  try {
    var res = await fetch(CONFIG.supabaseUrl + "/auth/v1/recover", {
      method: "POST",
      headers: _authHeaders(),
      body: JSON.stringify({ email })
    });
    return res.ok ? { ok: true } : { error: "Błąd" };
  } catch(e) { return { error: "Błąd sieci" }; }
}

/* ── SESJA ──────────────────────────────────────────────────── */
function _saveSession(data, username) {
  currentUser = {
    id:       data.user && data.user.id,
    email:    data.user && data.user.email,
    username: username,
    token:    data.access_token,
    refresh:  data.refresh_token
  };
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser)); } catch(e) {}
}

function _loadSession() {
  try {
    var raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function loadAccount() {
  var sess = _loadSession();
  if (sess && sess.token) currentUser = sess;
}

/* ── SYNCHRONIZACJA POSTĘPU ─────────────────────────────────── */
async function syncProgress() {
  if (!currentUser || !CONFIG.supabaseUrl) return;
  try {
    var got    = Object.keys(caught).length;
    var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
    await fetch(CONFIG.supabaseUrl + "/rest/v1/user_progress", {
      method: "POST",
      headers: Object.assign(_authHeaders(currentUser.token), { "Prefer": "resolution=merge-duplicates" }),
      body: JSON.stringify({
        user_id:    currentUser.id,
        username:   currentUser.username,
        caught:     got,
        badges:     earned,
        updated_at: new Date().toISOString()
      })
    });
  } catch(e) {}
}

/* ── GLOBALNY RANKING ───────────────────────────────────────── */
async function fetchLeaderboard() {
  if (!CONFIG.supabaseUrl) return null;
  try {
    var res = await fetch(
      CONFIG.supabaseUrl + "/rest/v1/user_progress?order=caught.desc&limit=20",
      { headers: _authHeaders(currentUser && currentUser.token) }
    );
    return res.ok ? await res.json() : null;
  } catch(e) { return null; }
}

/* ══════════════════════════════════════════════════════════════
   EKRAN KONT — UI
   ══════════════════════════════════════════════════════════════ */
var accountTab = "login";  /* "login" | "register" | "profile" */

function showAccountScreen() {
  showScreen("screen-account");
  setNav("nav-account");
  renderAccountScreen();
}

function renderAccountScreen() {
  var body = document.getElementById("account-body");
  if (!body) return;

  if (currentUser) {
    _renderProfile(body);
  } else if (!CONFIG.supabaseUrl) {
    _renderNoSupabase(body);
  } else if (accountTab === "register") {
    _renderRegister(body);
  } else {
    _renderLogin(body);
  }
}

function _renderNoSupabase(body) {
  body.innerHTML =
    '<div style="padding:40px 20px;text-align:center">' +
      '<div style="font-size:56px">&#x1F512;</div>' +
      '<div style="font-size:16px;font-weight:900;color:var(--yel);margin:14px 0 8px">Konta wyłączone</div>' +
      '<div style="font-size:12px;color:var(--tx3);line-height:1.6">Skonfiguruj Supabase w pliku<br><code>js/config.js</code><br>aby włączyć konta użytkowników.</div>' +
    '</div>';
}

function _renderLogin(body) {
  body.innerHTML =
    '<div class="auth-wrap">' +
      '<div class="auth-logo">&#x1F68C;</div>' +
      '<div class="auth-title">Zaloguj się</div>' +
      '<input class="dev-inp" id="au-email" type="email" placeholder="E-mail" autocomplete="email">' +
      '<input class="dev-inp" id="au-pass"  type="password" placeholder="Hasło">' +
      '<div id="au-err" class="auth-err"></div>' +
      '<button class="btnp" style="background:var(--red)" onclick="doLogin()">Zaloguj</button>' +
      '<button class="btns" onclick="doForgot()">&#x1F4E7; Zapomniałem hasła</button>' +
      '<div class="auth-switch">Nie masz konta? <span onclick="accountTab=\'register\';renderAccountScreen()">Zarejestruj się</span></div>' +
    '</div>';
}

function _renderRegister(body) {
  body.innerHTML =
    '<div class="auth-wrap">' +
      '<div class="auth-logo">&#x2795;</div>' +
      '<div class="auth-title">Rejestracja</div>' +
      '<input class="dev-inp" id="au-user" type="text"  placeholder="Nazwa użytkownika">' +
      '<input class="dev-inp" id="au-email" type="email" placeholder="E-mail" autocomplete="email">' +
      '<input class="dev-inp" id="au-pass"  type="password" placeholder="Hasło (min. 6 znaków)">' +
      '<div id="au-err" class="auth-err"></div>' +
      '<button class="btnp" style="background:var(--red)" onclick="doRegister()">Zarejestruj</button>' +
      '<div class="auth-switch">Masz konto? <span onclick="accountTab=\'login\';renderAccountScreen()">Zaloguj się</span></div>' +
    '</div>';
}

function _renderProfile(body) {
  var got    = Object.keys(caught).length;
  var tot    = CATALOG.length;
  var pct    = tot ? Math.round(got/tot*100) : 0;
  var earned = typeof getEarnedBadges === "function" ? getEarnedBadges(caught).length : 0;
  var lv     = typeof getLevel === "function" ? getLevel(caught) : null;

  body.innerHTML =
    '<div class="auth-wrap">' +
      '<div class="auth-logo">&#x1F464;</div>' +
      '<div class="auth-title">' + escHtml(currentUser.username) + '</div>' +
      '<div style="font-size:11px;color:var(--tx3);margin-top:-6px;margin-bottom:14px">' + escHtml(currentUser.email) + '</div>' +

      '<div class="dev-stat-row">' +
        '<div class="dev-stat"><div class="dev-stat-n" style="color:var(--red)">' + got + '</div><div class="dev-stat-l">Złapanych</div></div>' +
        '<div class="dev-stat"><div class="dev-stat-n" style="color:var(--yel)">' + pct + '%</div><div class="dev-stat-l">Ukończono</div></div>' +
        '<div class="dev-stat"><div class="dev-stat-n">' + earned + '</div><div class="dev-stat-l">Odznak</div></div>' +
      '</div>' +

      (lv ? '<div style="text-align:center;padding:8px 0;font-size:14px;color:' + lv.level.color + '">' +
        lv.level.icon + ' ' + lv.level.name + '</div>' : '') +

      '<button class="btns" onclick="doSyncProgress()">&#x1F504; Synchronizuj wyniki</button>' +
      '<button class="btns" onclick="showLeaderboard()">&#x1F3C6; Globalny ranking</button>' +
      '<div id="lb-wrap"></div>' +
      '<button class="btns btnd" onclick="authLogout()">&#x23CF;&#xFE0F; Wyloguj</button>' +
    '</div>';
}

async function doLogin() {
  var email = _val("au-email"), pass = _val("au-pass");
  if (!email || !pass) { _authErr("Wypełnij wszystkie pola"); return; }
  _authErr("Logowanie\u2026");
  var r = await authLogin(email, pass);
  if (r.ok) { syncProgress(); renderAccountScreen(); toast("Zalogowano jako " + currentUser.username); }
  else _authErr(r.error);
}

async function doRegister() {
  var user = _val("au-user"), email = _val("au-email"), pass = _val("au-pass");
  if (!user || !email || !pass) { _authErr("Wypełnij wszystkie pola"); return; }
  if (pass.length < 6) { _authErr("Hasło minimum 6 znaków"); return; }
  _authErr("Rejestracja\u2026");
  var r = await authRegister(email, pass, user);
  if (r.ok && !r.needConfirm) { syncProgress(); renderAccountScreen(); toast("Konto założone!"); }
  else if (r.ok && r.needConfirm) { _authErr("Sprawdź e-mail i potwierdź konto"); }
  else _authErr(r.error);
}

async function doForgot() {
  var email = _val("au-email");
  if (!email) { _authErr("Wpisz e-mail"); return; }
  var r = await authResetPassword(email);
  if (r.ok) toast("Link resetowania wysłany na " + email);
  else _authErr(r.error);
}

async function doSyncProgress() {
  toast("Synchronizacja\u2026");
  await syncProgress();
  toast("Wyniki zaktualizowane!");
}

async function showLeaderboard() {
  var wrap = document.getElementById("lb-wrap");
  if (!wrap) return;
  wrap.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:12px">Wczytywanie\u2026</div>';
  var data = await fetchLeaderboard();
  if (!data || !data.length) { wrap.innerHTML = '<div style="text-align:center;color:var(--tx3);padding:12px">Brak danych rankingu</div>'; return; }

  var html = '<div class="dev-section-title" style="margin-top:10px">&#x1F3C6; Ranking globalny</div><div class="rank-list">';
  data.forEach(function(row, i) {
    var isMe = currentUser && row.user_id === currentUser.id;
    var medal = i===0?"&#x1F947;":i===1?"&#x1F948;":i===2?"&#x1F949;":"#"+(i+1);
    html += '<div class="rank-row" style="' + (isMe ? "border:1px solid var(--yel);" : "") + '">' +
      '<div class="rank-pos">' + medal + '</div>' +
      '<div class="rank-info"><div class="rank-name" style="color:' + (isMe?"var(--yel)":"var(--tx)") + '">' +
        escHtml(row.username || "Gracz") + (isMe ? " (Ty)" : "") + '</div></div>' +
      '<div class="rank-pct" style="color:var(--red)">' + row.caught + '</div>' +
      '<div class="rank-frac" style="font-size:10px;color:var(--tx3)">' + (row.badges||0) + ' odzn.</div>' +
    '</div>';
  });
  wrap.innerHTML = html + '</div>';
}

function _val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
function _authErr(msg) { var el = document.getElementById("au-err"); if (el) { el.textContent = msg; el.style.display = msg ? "block" : "none"; } }
function escHtml(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
