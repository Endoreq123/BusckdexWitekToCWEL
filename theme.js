/* ============================================================
   BuseDex Kielce — theme.js
   Motyw ciemny (domyślny) i jasny.
   Preferencja zapisana w localStorage.
   ============================================================ */

var THEME_KEY    = "bdk-theme";
var currentTheme = "dark";

var THEMES = {
  dark: {
    "--bg":   "#0a0a0a",
    "--bg2":  "#111111",
    "--bd":   "#222222",
    "--mu":   "#666666",
    "--tx":   "#ffffff",
    "--tx2":  "#aaaaaa",
    "--tx3":  "#555555",
    "--card": "#111111",
    "--hdr":  "#0e0e0e",
    "--inp":  "#111111",
    "--inp-b":"#2a2a2a",
    "--shd":  "rgba(0,0,0,.6)",
    "--topbg":"linear-gradient(135deg,#1a0202,#120101)",
  },
  light: {
    "--bg":   "#f0f0f0",
    "--bg2":  "#ffffff",
    "--bd":   "#dddddd",
    "--mu":   "#999999",
    "--tx":   "#111111",
    "--tx2":  "#444444",
    "--tx3":  "#aaaaaa",
    "--card": "#ffffff",
    "--hdr":  "#f8f8f8",
    "--inp":  "#ffffff",
    "--inp-b":"#cccccc",
    "--shd":  "rgba(0,0,0,.15)",
    "--topbg":"linear-gradient(135deg,#8b0000,#6b0000)",
  }
};

function applyTheme(name) {
  currentTheme = name || "dark";
  var vars = THEMES[currentTheme];
  var root = document.documentElement;
  for (var k in vars) root.style.setProperty(k, vars[k]);

  /* przełącz klasy body */
  document.body.classList.toggle("theme-light", currentTheme === "light");
  document.body.classList.toggle("theme-dark",  currentTheme === "dark");

  /* zaktualizuj ikonę przycisku */
  var btn = document.getElementById("theme-toggle");
  if (btn) btn.innerHTML = currentTheme === "dark" ? "&#x2600;&#xFE0F;" : "&#x1F319;";

  localStorage.setItem(THEME_KEY, currentTheme);

  /* odśwież canvas postępu pod nowy motyw */
  if (typeof redrawProgressCanvas === "function") redrawProgressCanvas();
  /* odśwież etykietę w ustawieniach jeśli ekran otwarty */
  var tv = document.getElementById("theme-val");
  if (tv) tv.innerHTML = currentTheme === "dark" ? "&#x1F319; Ciemny" : "&#x2600;&#xFE0F; Jasny";
}

function toggleTheme() {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
}

function loadTheme() {
  var saved = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(saved);
}
