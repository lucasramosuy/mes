// mes. — tu Spotify en una card. Todo corre en el navegador: Spotify se
// conecta con PKCE, los tops se piden a la API y la card se pinta en canvas.
import { conectar, manejarCallback, cerrarSesion, resumen, PERIODOS } from './spotify.mjs';
import { FORMATOS, cargarFuentes, pintarCard, descargar } from './card.mjs';

const $ = (id) => document.getElementById(id);
const cache = new Map();
let datos = null;
let formato = 'historia';
let periodo = PERIODOS[0].id;

const fechaHoy = () =>
  new Intl.DateTimeFormat('es-UY', { month: 'long', year: 'numeric', timeZone: 'America/Montevideo' }).format(new Date());

function mostrar(estado) {
  for (const id of ['conectar', 'generar', 'aviso']) $(id).hidden = id !== estado;
}

function aviso(texto) {
  $('aviso-texto').textContent = texto;
  mostrar('aviso');
}

async function pintar() {
  if (!datos) return;
  const p = PERIODOS.find((x) => x.id === periodo);
  await cargarFuentes();
  await pintarCard($('preview'), { ...datos, periodoCard: p.card }, formato, fechaHoy());
}

async function cargarDatos() {
  $('descargar').disabled = true;
  $('estado').textContent = 'Pidiendo tu top a Spotify…';
  const r = await resumen(periodo);
  if (r.sinSesion) { cerrarSesion(); mostrar('conectar'); return; }
  if (r.error) { aviso('Spotify no respondió bien. Probá de nuevo en un rato.'); return; }
  if (!r.data.artistas.length) {
    datos = null;
    aviso('Spotify todavía no tiene escuchas tuyas en este período. Probá con uno más largo.');
    return;
  }
  datos = r.data;
  cache.set(periodo, datos);
  $('estado').textContent = '';
  $('descargar').disabled = false;
  await pintar();
}

function segmentos(contenedor, opciones, actual, alElegir) {
  const c = $(contenedor);
  c.replaceChildren(...opciones.map((o) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg';
    b.textContent = o.label;
    b.setAttribute('aria-pressed', String(o.id === actual));
    b.addEventListener('click', () => {
      for (const x of c.children) x.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-pressed', 'true');
      alElegir(o.id);
    });
    return b;
  }));
}

async function arranque() {
  segmentos('periodos', PERIODOS, periodo, async (id) => {
    periodo = id;
    if (cache.has(id)) { datos = cache.get(id); await pintar(); }
    else await cargarDatos();
  });
  segmentos('formatos', Object.values(FORMATOS), formato, async (id) => { formato = id; await pintar(); });
  $('conectar-btn').addEventListener('click', conectar);
  $('salir').addEventListener('click', () => { cerrarSesion(); datos = null; cache.clear(); mostrar('conectar'); });
  $('descargar').addEventListener('click', async () => {
    await pintar();
    await descargar($('preview'), `mes-${periodo}-${formato}.png`);
  });

  const cb = await manejarCallback();
  if (cb?.error) {
    aviso(cb.error === 'access_denied'
      ? 'Cancelaste la conexión; no se tocó nada tuyo.'
      : 'No se pudo conectar con Spotify. Probá de nuevo.');
    return;
  }
  if (sessionStorage.getItem('mes_token')) {
    mostrar('generar');
    await cargarDatos();
  } else {
    mostrar('conectar');
  }
}

arranque();
