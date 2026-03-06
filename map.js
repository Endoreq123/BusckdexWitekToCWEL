/* ============================================================
   BuseDex Kielce — map.js
   Interaktywna mapa złapanych autobusów (Leaflet + OSM).
   Centrum Kielc: 50.8661°N, 20.6286°E
   ============================================================ */

var leafletMap    = null;
var mapMarkers    = [];
var mapInitialized = false;

/* ── INICJALIZACJA MAPY ─────────────────────────────────────── */
function initMap() {
  if (mapInitialized) { refreshMap(); return; }

  leafletMap = L.map("map-container", {
    center: [50.8661, 20.6286],
    zoom: 13,
    zoomControl: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
    maxZoom: 19
  }).addTo(leafletMap);

  mapInitialized = true;
  refreshMap();
}

/* ── ODŚWIEŻENIE PINEZEK ────────────────────────────────────── */
function refreshMap() {
  if (!leafletMap) return;

  /* usuń stare markery */
  for (var i = 0; i < mapMarkers.length; i++) leafletMap.removeLayer(mapMarkers[i]);
  mapMarkers = [];

  var hasPins = false;

  for (var k in caught) {
    var c = caught[k];
    if (!c.lat || !c.lng) continue;
    hasPins = true;

    var bus = null;
    for (var j = 0; j < CATALOG.length; j++) {
      if (CATALOG[j].id === k) { bus = CATALOG[j]; break; }
    }
    if (!bus) continue;

    var bm    = BM[bus.brand];
    var tm    = TM[bus.type];
    var lbl   = bus.num ? "#" + bus.num : bus.model;
    var color = bm.retro ? "#c9a84c" : (bus.rare ? "#a855f7" : tm.color);

    var icon = L.divIcon({
      className: "",
      html:
        '<div style="' +
          'width:32px;height:32px;border-radius:50% 50% 50% 4px;' +
          'background:' + color + ';' +
          'border:2px solid #fff;' +
          'box-shadow:0 2px 8px rgba(0,0,0,.6);' +
          'display:flex;align-items:center;justify-content:center;' +
          'font-size:13px;transform:rotate(-45deg)' +
        '">' +
          '<span style="transform:rotate(45deg)">' + tm.icon + '</span>' +
        '</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    var popup =
      '<div style="font-family:monospace;min-width:140px">' +
        '<div style="font-weight:900;font-size:15px;color:' + color + '">' + lbl + '</div>' +
        '<div style="font-size:11px;color:#888;margin-top:2px">' + bus.brand + ' — ' + bus.model + '</div>' +
        (c.date ? '<div style="font-size:10px;color:#666;margin-top:4px">&#x1F4C5; ' + c.date + '</div>' : '') +
        (c.note ? '<div style="font-size:11px;color:#aaa;margin-top:3px">&#x1F4DD; ' + c.note + '</div>' : '') +
      '</div>';

    var marker = L.marker([c.lat, c.lng], { icon: icon })
                  .bindPopup(popup)
                  .addTo(leafletMap);
    mapMarkers.push(marker);
  }

  /* jeśli są piny — dopasuj widok */
  if (hasPins && mapMarkers.length > 0) {
    var group = L.featureGroup(mapMarkers);
    leafletMap.fitBounds(group.getBounds().pad(0.15));
  }

  /* legenda statystyk */
  var cnt = mapMarkers.length;
  var el  = document.getElementById("map-stats");
  if (el) {
    el.textContent = cnt > 0
      ? cnt + " złapań z lokalizacją"
      : "Brak zapisanych lokalizacji — włącz GPS przy złapaniu";
  }
}

/* ── ZAPIS GPS PODCZAS ZŁAPANIA ─────────────────────────────── */
function getGpsAndSave(busId, callback) {
  if (!navigator.geolocation) { callback(null); return; }

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      callback({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    },
    function() { callback(null); },
    { timeout: 5000, maximumAge: 30000 }
  );
}

/* ── RENDEROWANIE EKRANU MAPY ───────────────────────────────── */
function renderMap() {
  /* mapa musi mieć chwilę na render po pokazaniu ekranu */
  setTimeout(function() {
    initMap();
    /* invalidate size jeśli mapa była ukryta */
    if (leafletMap) leafletMap.invalidateSize();
  }, 80);
}
