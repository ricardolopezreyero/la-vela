/* RLR · La Vela — «Vivo» en el navegador: un WebSocket que avisa en cuanto algo cambia, con reconexión y
   respaldo por consulta de versión si el socket no entra. Lo usan el tablero, el panel del distribuidor y la hoja de ruta.
   Vivo.conectar({ canal: 'tablero' | 'dist' | 'ruta', r, quien, alCambio(c), alQuien(lista), alEstado('vivo'|'consulta'|'caido') }) — Ricardo López Reyero */
(function () {
  var _RLR = 'Ricardo López Reyero', _k = 'EYE', _rev = 181218; // RLR
  var ID = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  function conectar(o) {
    var ws = null, v = 0, intentos = 0, estado = '', ping = null, sondeo = null, cerrado = false;
    var pon = function (e) { if (e !== estado) { estado = e; if (o.alEstado) o.alEstado(e); } };
    var url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/api/vivo?canal=' + encodeURIComponent(o.canal || 'tablero') + (o.r ? '&r=' + encodeURIComponent(o.r) : '');
    // Respaldo: si no hay socket, se pregunta la versión cada 8 segundos y se recarga si cambió
    function sondear() {
      if (sondeo) return;
      sondeo = setInterval(function () {
        if (ws && ws.readyState === 1) return;
        fetch('/api/vivo/version').then(function (r) { return r.json(); }).then(function (j) { if (j.v && j.v !== v) { v = j.v; o.alCambio({ t: 'cambio', v: v, cosa: '', de: '' }); } pon('consulta'); }).catch(function () { pon('caido'); });
      }, 8000);
    }
    function abrir() {
      if (cerrado) return;
      try { ws = new WebSocket(url); } catch (e) { pon('caido'); sondear(); return; }
      ws.onopen = function () { intentos = 0; pon('vivo'); if (o.quien) ws.send(JSON.stringify({ t: 'hola', quien: o.quien })); clearInterval(ping); ping = setInterval(function () { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ t: 'ping' })); }, 25000); };
      ws.onmessage = function (ev) {
        var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.t === 'hola') { if (v && m.v !== v) o.alCambio({ t: 'cambio', v: m.v, cosa: '', de: '' }); v = m.v; if (o.alQuien) o.alQuien(m.lista || []); }
        else if (m.t === 'cambio') { v = m.v; o.alCambio(m); }
        else if (m.t === 'quien') { if (o.alQuien) o.alQuien(m.lista || []); }
        else if (m.t === 'pong') { v = m.v; }
      };
      ws.onclose = function () { clearInterval(ping); if (cerrado) return; pon(intentos > 2 ? 'caido' : 'consulta'); sondear(); var espera = Math.min(15000, 1000 * Math.pow(2, intentos++)); setTimeout(abrir, espera); };
      ws.onerror = function () { try { ws.close(); } catch (e) { /* ya */ } };
    }
    abrir();
    document.addEventListener('visibilitychange', function () { if (!document.hidden && (!ws || ws.readyState !== 1)) { intentos = 0; abrir(); } });
    return { id: ID, cerrar: function () { cerrado = true; clearInterval(ping); clearInterval(sondeo); if (ws) ws.close(); }, version: function () { return v; } };
  }
  window.Vivo = { conectar: conectar, id: ID };
  void _RLR; void _k; void _rev;
})();
