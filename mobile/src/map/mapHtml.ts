import type { LatLng } from '../domain/types';

/**
 * Página do mapa (MapLibre GL + tiles OpenFreeMap/OpenStreetMap) carregada
 * numa WebView. Só os tiles do mapa usam internet; os dados vêm do app.
 *
 * Mensagens mapa → app: ready | bounds | select | mapclick | offline | water
 * Chamadas app → mapa: gosafe.setPins, gosafe.select, gosafe.setUser, gosafe.flyTo, gosafe.checkWater
 */
export function mapHtml(center: LatLng, zoom: number): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet">
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; background: #ECE8E1; }
  .pin { display: flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border-radius: 15px;
         border: 2px solid #fff; color: #fff; font: 700 13px system-ui, sans-serif; white-space: nowrap;
         box-shadow: 0 3px 8px rgba(29,23,38,.3); transition: transform .15s; transform-origin: bottom center; }
  .pin.sel { transform: scale(1.3); background: #2B1446 !important; }
  .pin .warn { display: inline-flex; width: 16px; height: 16px; border-radius: 8px; background: #fff; color: #B03A2E;
               align-items: center; justify-content: center; font-size: 12px; }
  .hit { padding: 6px; }
  .me { width: 18px; height: 18px; border-radius: 9px; background: #2F6FDB; border: 3px solid #fff;
        box-shadow: 0 0 0 10px rgba(47,111,219,.18); }
  #offline { position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
             text-align: center; padding: 24px; font: 15px system-ui, sans-serif; color: #5E566A; }
</style>
</head>
<body>
<div id="map"></div>
<div id="offline">Sem internet para desenhar o mapa.<br>Os dados de teste continuam disponíveis na aba Locais.</div>
<script>
  function post(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  if (!window.maplibregl) {
    document.getElementById('offline').style.display = 'flex';
    post({ type: 'offline' });
  } else {
    var map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [${center.longitude}, ${center.latitude}],
      zoom: ${zoom},
      attributionControl: { compact: true }
    });
    var markers = {};
    var selected = null;
    var me = null;

    function emitBounds() {
      var b = map.getBounds();
      var c = map.getCenter();
      post({ type: 'bounds', west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth(),
             zoom: map.getZoom(), center: { latitude: c.lat, longitude: c.lng } });
    }

    map.on('load', function () { post({ type: 'ready' }); emitBounds(); });
    map.on('moveend', emitBounds);
    map.on('click', function () { post({ type: 'mapclick' }); });

    window.gosafe = {
      setPins: function (pins) {
        var keep = {};
        pins.forEach(function (p) {
          keep[p.id] = true;
          var marker = markers[p.id];
          if (!marker) {
            var hit = document.createElement('div');
            hit.className = 'hit';
            var pin = document.createElement('div');
            pin.className = 'pin';
            hit.appendChild(pin);
            hit.addEventListener('click', function (event) {
              event.stopPropagation();
              post({ type: 'select', id: p.id });
            });
            marker = new maplibregl.Marker({ element: hit, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(map);
            markers[p.id] = marker;
          }
          var el = marker.getElement().firstChild;
          el.style.background = p.color;
          el.innerHTML = (p.alert ? '<span class="warn">!</span>' : '') + p.label;
          el.classList.toggle('sel', p.id === selected);
        });
        Object.keys(markers).forEach(function (id) {
          if (!keep[id]) { markers[id].remove(); delete markers[id]; }
        });
      },
      select: function (id) {
        selected = id;
        Object.keys(markers).forEach(function (key) {
          markers[key].getElement().firstChild.classList.toggle('sel', key === id);
        });
      },
      setUser: function (lat, lng) {
        if (!me) {
          var el = document.createElement('div');
          el.className = 'me';
          me = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        } else {
          me.setLngLat([lng, lat]);
        }
      },
      flyTo: function (lat, lng, zoom) {
        map.flyTo({ center: [lng, lat], zoom: zoom || Math.max(map.getZoom(), 14) });
      },

      // Confere se os locais caíram na água (camada "water" do OpenStreetMap).
      // Só os locais dentro da área visível são conferidos; os demais ficam para quando aparecerem.
      checkWater: function (points) {
        if (!points.length) return;
        var canvas = map.getCanvas();
        var inside = function (px) {
          return px.x >= 0 && px.y >= 0 && px.x <= canvas.clientWidth && px.y <= canvas.clientHeight;
        };
        var isWater = function (x, y) {
          return map.queryRenderedFeatures([x, y]).some(function (f) { return f.sourceLayer === 'water'; });
        };
        var run = function () {
          var results = [];
          points.forEach(function (p) {
            var px = map.project([p.lng, p.lat]);
            if (!inside(px)) return;
            if (!isWater(px.x, px.y)) { results.push({ id: p.id, water: false }); return; }
            var found = null;
            for (var r = 12; r <= 360 && !found; r += 12) {
              for (var a = 0; a < 16 && !found; a++) {
                var x = px.x + r * Math.cos(a * Math.PI / 8);
                var y = px.y + r * Math.sin(a * Math.PI / 8);
                if (inside({ x: x, y: y }) && !isWater(x, y)) {
                  var ll = map.unproject([x, y]);
                  found = { lat: ll.lat, lng: ll.lng };
                }
              }
            }
            results.push({ id: p.id, water: true, lat: found ? found.lat : null, lng: found ? found.lng : null });
          });
          post({ type: 'water', results: results });
        };
        // Só confere com os tiles desenhados e com zoom suficiente para ver rios e lagos.
        if (map.getZoom() < 12) return;
        if (map.loaded() && map.areTilesLoaded()) run(); else map.once('idle', run);
      }
    };
  }
</script>
</body>
</html>`;
}
