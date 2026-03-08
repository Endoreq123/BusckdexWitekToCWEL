/* ============================================================
   BuseDex Kielce — notifications.js
   Powiadomienia push (lokalne + Web Push jeśli skonfigurowane).

   Typy powiadomień:
   - Codzienne przypomnienie o łowach (rano)
   - Gratulacje po złapaniu legendy / unikatu
   - Streak zagrożony (nie złapałeś nic od 23h)
   ============================================================ */

var NOTIF_KEY = "bdk-notif";

/* ── UPRAWNIENIA ────────────────────────────────────────────── */
async function requestNotifPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied")  return "denied";
  var result = await Notification.requestPermission();
  return result;
}

function notifEnabled() {
  return "Notification" in window && Notification.permission === "granted";
}

/* ── USTAWIENIA ─────────────────────────────────────────────── */
function loadNotifSettings() {
  try {
    var raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : {
      daily:   true,   /* codzienne przypomnienie */
      streak:  true,   /* przypomnienie o streak */
      special: true,   /* złapanie legendy / unikatu */
      hour:    9       /* godzina dziennego przypomnienia */
    };
  } catch(e) {
    return { daily:true, streak:true, special:true, hour:9 };
  }
}

function saveNotifSettings(s) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(s));
}

/* ── WYSŁANIE LOKALNEGO POWIADOMIENIA ───────────────────────── */
function sendNotif(title, body, icon, tag) {
  if (!notifEnabled()) return;
  try {
    new Notification(title, {
      body:    body,
      icon:    icon || "grafika/icon-192.png",
      badge:   "grafika/icon-192.png",
      tag:     tag || "busedex",
      vibrate: [100, 50, 100],
      data:    { url: "/" }
    });
  } catch(e) {}
}

/* ── POWIADOMIENIE PO ZŁAPANIU ──────────────────────────────── */
function notifOnCatch(bus) {
  var s = loadNotifSettings();
  if (!s.special) return;

  var bm = BM[bus.brand];
  if (bus.unique) {
    sendNotif(
      "🏆 UNIKAT ZŁAPANY!",
      bus.brand + (bus.num ? " #"+bus.num : "") + " — " + bus.model + " · 1 OF 1",
      null, "catch-unique"
    );
  } else if (bm && bm.retro) {
    sendNotif(
      "⭐ LEGENDA ZŁAPANA!",
      "Ikarus 260.04 dołączył do kolekcji!",
      null, "catch-legend"
    );
  } else if (bus.rare) {
    sendNotif(
      "💎 RZADKI EGZEMPLARZ!",
      bus.brand + (bus.num ? " #"+bus.num : "") + " — " + bus.model,
      null, "catch-rare"
    );
  }
}

/* ── REJESTRACJA CYKLICZNEGO PRZYPOMNIENIA ──────────────────── */
/* Używamy Periodic Background Sync jeśli dostępny,
   w przeciwnym razie setTimeout na czas sesji        */
function scheduleDaily() {
  var s = loadNotifSettings();
  if (!s.daily || !notifEnabled()) return;

  var now  = new Date();
  var next = new Date();
  next.setHours(s.hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  var ms = next - now;
  setTimeout(function() {
    var tot = CATALOG.length;
    var got = Object.keys(caught).length;
    sendNotif(
      "🚌 Czas na łowy! — BuseDex",
      "Masz " + got + " z " + tot + " autobusów. Chodź złapać więcej!",
      null, "daily-reminder"
    );
    scheduleDaily(); /* zaplanuj następny */
  }, ms);
}

/* ── STREAK ALERT ───────────────────────────────────────────── */
function scheduleStreakAlert() {
  var s = loadNotifSettings();
  if (!s.streak || !notifEnabled()) return;

  /* sprawdź co godzinę czy minęło 23h bez złapania */
  setInterval(function() {
    if (Object.keys(caught).length === 0) return;
    var lastDate = null;
    for (var k in caught) {
      var c = caught[k];
      if (!c.date) continue;
      var p = c.date.split(".");
      var d = new Date(+p[2], +p[1]-1, +p[0]);
      if (!lastDate || d > lastDate) lastDate = d;
    }
    if (!lastDate) return;
    var hoursAgo = (Date.now() - lastDate) / 3600000;
    if (hoursAgo >= 23 && hoursAgo < 24) {
      sendNotif(
        "⚠️ Streak zagrożony!",
        "Nie złapałeś nic od ponad doby — nie przerywaj serii!",
        null, "streak-alert"
      );
    }
  }, 3600000); /* co godzinę */
}

/* ── EKRAN USTAWIEŃ POWIADOMIEŃ ─────────────────────────────── */
function renderNotifSettings() {
  var wrap = document.getElementById("notif-settings");
  if (!wrap) return;

  var perm = "Notification" in window ? Notification.permission : "unsupported";
  var s    = loadNotifSettings();

  var html = '<div class="notif-panel">';

  if (perm === "unsupported") {
    html += '<div class="notif-warn">&#x26A0;&#xFE0F; Twoja przeglądarka nie obsługuje powiadomień.</div>';
  } else if (perm === "denied") {
    html += '<div class="notif-warn">&#x1F6AB; Powiadomienia zablokowane w ustawieniach przeglądarki.<br>Odblokuj je ręcznie w ustawieniach strony.</div>';
  } else if (perm === "default") {
    html +=
      '<div class="notif-warn" style="border-color:var(--yel);color:#ccc">&#x1F514; Powiadomienia nieaktywne</div>' +
      '<button class="btnp" style="background:var(--red)" onclick="enableNotifs()">&#x1F514; Włącz powiadomienia</button>';
  } else {
    /* granted — pokaż przełączniki */
    html += '<div style="font-size:11px;color:var(--tx3);letter-spacing:1px;margin-bottom:8px">&#x2705; Powiadomienia aktywne</div>';
    html += _notifToggle("daily",   "&#x2600;&#xFE0F; Codzienne przypomnienie", s.daily);
    html += '<div style="padding:0 4px 8px"><div class="plbl" style="margin-bottom:4px">Godzina przypomnienia</div>' +
      '<input type="range" min="6" max="22" value="' + s.hour + '" id="notif-hour" style="width:100%" oninput="updateNotifHour(this.value)">' +
      '<div style="text-align:center;font-size:12px;color:var(--yel)" id="notif-hour-label">' + s.hour + ':00</div></div>';
    html += _notifToggle("streak",  "&#x1F525; Alert o streak (po 23h bez złapania)", s.streak);
    html += _notifToggle("special", "&#x1F3C6; Powiadomienie o legendach i unikatach", s.special);
    html += '<button class="btns" onclick="testNotif()" style="margin-top:8px">&#x1F514; Testowe powiadomienie</button>';
  }

  html += '</div>';
  wrap.innerHTML = html;
}

function _notifToggle(key, label, val) {
  return '<div class="notif-row" onclick="toggleNotifSetting(\'' + key + '\')">' +
    '<span style="flex:1;font-size:13px;color:var(--tx2)">' + label + '</span>' +
    '<div class="fu-toggle" id="nt-' + key + '"><div class="fu-knob"></div></div>' +
    (val ? '<script>document.getElementById("nt-' + key + '").parentElement.classList.add("on")<\/script>' : '') +
  '</div>';
}

function _notifToggleClass(key, val) {
  var row = document.getElementById("nt-" + key);
  if (row) row.parentElement.classList.toggle("on", val);
}

function toggleNotifSetting(key) {
  var s = loadNotifSettings();
  s[key] = !s[key];
  saveNotifSettings(s);
  _notifToggleClass(key, s[key]);
}

function updateNotifHour(val) {
  var s = loadNotifSettings();
  s.hour = +val;
  saveNotifSettings(s);
  var lbl = document.getElementById("notif-hour-label");
  if (lbl) lbl.textContent = val + ":00";
}

async function enableNotifs() {
  var perm = await requestNotifPermission();
  if (perm === "granted") {
    scheduleDaily();
    scheduleStreakAlert();
    toast("Powiadomienia włączone!");
  } else {
    toast("Brak zgody na powiadomienia");
  }
  renderNotifSettings();
}

function testNotif() {
  sendNotif(
    "🚌 BuseDex — test",
    "Powiadomienia działają poprawnie!",
    null, "test"
  );
  toast("Wysłano powiadomienie testowe");
}

/* ── INIT ────────────────────────────────────────────────────── */
function initNotifications() {
  if (notifEnabled()) {
    scheduleDaily();
    scheduleStreakAlert();
  }
}
