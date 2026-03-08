/* ============================================================
   BuseDex Kielce — progress-canvas.js
   Animowany canvas zamiast zwykłego paska postępu.
   
   Rysuje:
   - Pierścieniowy licznik (arc) z gradientem czerwień→żółć
   - Centralny procent i licznik złapanych
   - Małe "autobusy" rozjeżdżające się po okręgu
   - Pulsujące światełka LED
   ============================================================ */

var _pc = {
  canvas: null, ctx: null,
  target: 0, current: 0,
  total: 0, caught: 0,
  raf: null, startTime: null,
  duration: 1200
};

function initProgressCanvas() {
  var el = document.getElementById("progress-canvas");
  if (!el) return;

  _pc.canvas = el;
  _pc.ctx    = el.getContext("2d");

  /* high-DPI */
  var dpr = window.devicePixelRatio || 1;
  var size = Math.min(window.innerWidth * 0.55, 200) | 0;
  el.style.width  = size + "px";
  el.style.height = size + "px";
  el.width  = size * dpr;
  el.height = size * dpr;
  _pc.ctx.scale(dpr, dpr);
  _pc.size = size;

  drawProgressCanvas(0, 0, 0);
}

function animateProgressCanvas(caughtN, totalN) {
  if (!_pc.canvas) { initProgressCanvas(); }
  if (!_pc.canvas) return;

  _pc.caught  = caughtN;
  _pc.total   = totalN;
  _pc.target  = totalN ? caughtN / totalN : 0;
  _pc.startTime = null;

  var from = _pc.current;

  function step(ts) {
    if (!_pc.startTime) _pc.startTime = ts;
    var elapsed = ts - _pc.startTime;
    var t = Math.min(elapsed / _pc.duration, 1);
    /* easeOutCubic */
    t = 1 - Math.pow(1 - t, 3);
    _pc.current = from + (_pc.target - from) * t;
    drawProgressCanvas(_pc.current, caughtN, totalN);
    if (elapsed < _pc.duration) _pc.raf = requestAnimationFrame(step);
    else { _pc.current = _pc.target; drawProgressCanvas(_pc.target, caughtN, totalN); }
  }

  if (_pc.raf) cancelAnimationFrame(_pc.raf);
  _pc.raf = requestAnimationFrame(step);
}

function drawProgressCanvas(fraction, caughtN, totalN) {
  var cvs = _pc.canvas;
  if (!cvs) return;
  var ctx  = _pc.ctx;
  var dpr  = window.devicePixelRatio || 1;
  var S    = _pc.size || 160;
  var cx   = S / 2, cy = S / 2;
  var R    = S * 0.40;
  var isDark = !document.body.classList.contains("theme-light");

  ctx.clearRect(0, 0, S, S);

  /* ── track (pusta szyna) ── */
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.1)";
  ctx.lineWidth   = S * 0.085;
  ctx.lineCap     = "round";
  ctx.stroke();

  /* ── gradient łuku ── */
  if (fraction > 0.001) {
    var startAngle = -Math.PI / 2;
    var endAngle   = startAngle + Math.PI * 2 * fraction;
    var grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
    grad.addColorStop(0,   "#c0191a");
    grad.addColorStop(0.5, "#d44000");
    grad.addColorStop(1,   "#f5c800");
    ctx.beginPath();
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = S * 0.085;
    ctx.lineCap     = "round";
    ctx.stroke();

    /* ── świecąca końcówka ── */
    var ex = cx + R * Math.cos(endAngle);
    var ey = cy + R * Math.sin(endAngle);
    var glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, S * 0.07);
    glow.addColorStop(0, "rgba(245,200,0,.55)");
    glow.addColorStop(1, "rgba(245,200,0,0)");
    ctx.beginPath();
    ctx.arc(ex, ey, S * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  /* ── małe autobusy jako separatory na szynie ── */
  var busCount = Math.min(totalN || 10, 12);
  for (var i = 0; i < busCount; i++) {
    var angle = -Math.PI / 2 + (Math.PI * 2 * i / busCount);
    var bx = cx + R * Math.cos(angle);
    var by = cy + R * Math.sin(angle);
    var isCaught = i < Math.round(fraction * busCount);
    ctx.beginPath();
    ctx.arc(bx, by, S * 0.028, 0, Math.PI * 2);
    ctx.fillStyle = isCaught
      ? (i === Math.round(fraction * busCount) - 1 ? "#f5c800" : "rgba(192,25,26,.8)")
      : (isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.1)");
    ctx.fill();
  }

  /* ── tło koła środkowego ── */
  var innerR = R - S * 0.05;
  var bgGrad = ctx.createRadialGradient(cx, cy - S*0.05, 0, cx, cy, innerR);
  if (isDark) {
    bgGrad.addColorStop(0, "#1a1a1a");
    bgGrad.addColorStop(1, "#0e0e0e");
  } else {
    bgGrad.addColorStop(0, "#ffffff");
    bgGrad.addColorStop(1, "#f0f0f0");
  }
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  /* ── tekst procentowy ── */
  var pct = Math.round(fraction * 100);
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";

  /* numer dużym fontem */
  ctx.font      = "900 " + (S * 0.22) + "px monospace";
  ctx.fillStyle = pct === 100 ? "#f5c800" : (isDark ? "#ffffff" : "#111111");
  ctx.fillText(pct + "%", cx, cy - S * 0.04);

  /* caught / total */
  ctx.font      = "700 " + (S * 0.09) + "px monospace";
  ctx.fillStyle = isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.4)";
  ctx.fillText(caughtN + " / " + totalN, cx, cy + S * 0.14);

  /* ikonka autobusu w centrum */
  ctx.font      = (S * 0.12) + "px sans-serif";
  ctx.fillStyle = isDark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.12)";
  ctx.fillText("🚌", cx, cy + S * 0.02);

  /* ── LED blinker (pulsowanie przez sin czasu) ── */
  if (fraction > 0) {
    var pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    var lx = cx + R * 0.82, ly = cy - R * 0.82;
    var ledGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, S * 0.035);
    ledGrad.addColorStop(0, "rgba(192,25,26," + (0.6 + 0.4 * pulse) + ")");
    ledGrad.addColorStop(1, "rgba(192,25,26,0)");
    ctx.beginPath();
    ctx.arc(lx, ly, S * 0.035, 0, Math.PI * 2);
    ctx.fillStyle = ledGrad;
    ctx.fill();
  }

  /* animacja pulsowania LED — odświeżaj co 50ms */
  if (fraction > 0 && fraction < 1) {
    if (_pc._ledTimer) clearTimeout(_pc._ledTimer);
    _pc._ledTimer = setTimeout(function() {
      if (_pc.current === _pc.target) drawProgressCanvas(_pc.target, caughtN, totalN);
    }, 80);
  }
}

/* Wywoływane przy zmianie motywu — przerysuj */
function redrawProgressCanvas() {
  if (_pc.canvas) drawProgressCanvas(_pc.current, _pc.caught, _pc.total);
}
