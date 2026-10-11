// Conexión con Spotify: PKCE de cliente público, sin secret ni backend.
// El token vive solo en sessionStorage de esta pestaña; nada sale del navegador.

export const CLIENT_ID = 'SPOTIFY_CLIENT_ID_PENDIENTE'; // app de Wrapped (developer.spotify.com)
export const SCOPES = 'user-top-read';

export const PERIODOS = [
  { id: 'short_term', label: '4 semanas', card: 'últimas 4 semanas' },
  { id: 'medium_term', label: '6 meses', card: 'últimos 6 meses' },
  { id: 'long_term', label: '1 año', card: 'último año' },
];

const K_VERIFIER = 'mes_verifier';
const K_TOKEN = 'mes_token';

export function base64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generarVerificador(random = crypto.getRandomValues.bind(crypto)) {
  return base64url(random(new Uint8Array(64)));
}

export async function desafio(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function redirectUri(loc = location) {
  return loc.origin + loc.pathname;
}

export function urlAutorizacion(challenge, redirect, clientId = CLIENT_ID) {
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirect,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  return `https://accounts.spotify.com/authorize?${p}`;
}

export async function conectar() {
  const verifier = generarVerificador();
  sessionStorage.setItem(K_VERIFIER, verifier);
  location.assign(urlAutorizacion(await desafio(verifier), redirectUri()));
}

function guardarToken(data) {
  const token = {
    access: data.access_token,
    refresh: data.refresh_token || null,
    expira: Date.now() + (data.expires_in || 3600) * 1000 - 60000,
  };
  sessionStorage.setItem(K_TOKEN, JSON.stringify(token));
  return token;
}

export function cerrarSesion() {
  sessionStorage.removeItem(K_TOKEN);
  sessionStorage.removeItem(K_VERIFIER);
}

export async function manejarCallback(fetchImpl = fetch) {
  const params = new URLSearchParams(location.search);
  const error = params.get('error');
  const code = params.get('code');
  if (!error && !code) return null;
  history.replaceState(null, '', location.pathname);
  if (error) return { error };
  const verifier = sessionStorage.getItem(K_VERIFIER);
  sessionStorage.removeItem(K_VERIFIER);
  if (!verifier) return { error: 'sin_verifier' };
  const res = await fetchImpl('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) return { error: 'intercambio' };
  return { token: guardarToken(await res.json()) };
}

async function pedirToken(fetchImpl = fetch) {
  const raw = sessionStorage.getItem(K_TOKEN);
  if (!raw) return null;
  let token;
  try { token = JSON.parse(raw); } catch { return null; }
  if (token.access && Date.now() < token.expira) return token.access;
  if (!token.refresh) return null;
  const res = await fetchImpl('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh,
      client_id: CLIENT_ID,
    }),
  });
  if (!res.ok) { cerrarSesion(); return null; }
  const data = await res.json();
  if (!data.refresh_token) data.refresh_token = token.refresh;
  return guardarToken(data).access;
}

async function api(path, fetchImpl = fetch) {
  const access = await pedirToken(fetchImpl);
  if (!access) return { sinSesion: true };
  const res = await fetchImpl(`https://api.spotify.com/v1${path}`, {
    headers: { authorization: `Bearer ${access}` },
  });
  if (res.status === 401) { cerrarSesion(); return { sinSesion: true }; }
  if (!res.ok) return { error: res.status };
  return { data: await res.json() };
}

// Modelo real de la API: los tops vienen por time_range y no traen minutos
// ni conteo de reproducciones; la card muestra solo lo que Spotify devuelve.
export function shapeResumen(artistas, tracks, periodo) {
  const lista = (artistas?.items || []).slice(0, 5).map((a) => ({
    nombre: a.name,
    imagen: (a.images || []).slice().sort((x, y) => y.width - x.width)[0]?.url || null,
  }));
  const t = tracks?.items?.[0];
  return {
    periodo,
    artistas: lista,
    tema: t ? { nombre: t.name, artista: (t.artists || []).map((x) => x.name).join(', ') } : null,
  };
}

export async function resumen(periodoId, fetchImpl = fetch) {
  const [artistas, tracks] = await Promise.all([
    api(`/me/top/artists?time_range=${periodoId}&limit=5`, fetchImpl),
    api(`/me/top/tracks?time_range=${periodoId}&limit=1`, fetchImpl),
  ]);
  if (artistas.sinSesion || tracks.sinSesion) return { sinSesion: true };
  if (artistas.error || tracks.error) return { error: artistas.error || tracks.error };
  return { data: shapeResumen(artistas.data, tracks.data, periodoId) };
}
