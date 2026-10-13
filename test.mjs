import { test } from 'node:test';
import assert from 'node:assert/strict';
import { base64url, generarVerificador, urlAutorizacion, redirectUri, shapeResumen, PERIODOS } from './spotify.mjs';
import { FORMATOS } from './card.mjs';

test('base64url sin caracteres de URL inseguros ni padding', () => {
  const bytes = new Uint8Array([251, 255, 190, 239, 61, 125]);
  const out = base64url(bytes);
  assert.match(out, /^[A-Za-z0-9_-]+$/);
  assert.equal(out.includes('='), false);
});

test('verificador PKCE: 64 bytes → 86 chars base64url y distinto cada vez', () => {
  let n = 0;
  const rng = (arr) => arr.map(() => n++ % 256);
  const v = generarVerificador(rng);
  assert.equal(v.length, 86);
  assert.notEqual(generarVerificador(), generarVerificador());
});

test('url de autorización pide code con S256 y scope de tops', () => {
  const url = new URL(urlAutorizacion('ABC', 'https://lucasramos.uy/mes/', 'cid'));
  assert.equal(url.origin + url.pathname, 'https://accounts.spotify.com/authorize');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'), 'ABC');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://lucasramos.uy/mes/');
  assert.equal(url.searchParams.get('scope'), 'user-top-read');
  assert.equal(url.searchParams.get('client_id'), 'cid');
});

test('redirectUri conserva origen y path (Pages y dominio)', () => {
  assert.equal(redirectUri({ origin: 'https://lucasramosuy.github.io', pathname: '/mes/' }), 'https://lucasramosuy.github.io/mes/');
});

test('shapeResumen: top 5 con imagen más grande y tema #1', () => {
  const artistas = { items: Array.from({ length: 8 }, (_, i) => ({
    name: `Artista ${i + 1}`,
    images: [{ url: 'chica', width: 64 }, { url: `grande${i}`, width: 640 }],
  })) };
  const tracks = { items: [{ name: 'Tema X', artists: [{ name: 'Artista 1' }, { name: 'Otro' }] }] };
  const r = shapeResumen(artistas, tracks, 'short_term');
  assert.equal(r.artistas.length, 5);
  assert.equal(r.artistas[0].imagen, 'grande0');
  assert.deepEqual(r.tema, { nombre: 'Tema X', artista: 'Artista 1, Otro' });
});

test('shapeResumen sin datos: listas vacías y tema null, sin explotar', () => {
  const r = shapeResumen({}, { items: [] }, 'long_term');
  assert.deepEqual(r.artistas, []);
  assert.equal(r.tema, null);
});

test('períodos y formatos son los ofrecidos en la página', () => {
  assert.deepEqual(PERIODOS.map((p) => p.id), ['short_term', 'medium_term', 'long_term']);
  assert.equal(FORMATOS.historia.w * 16, FORMATOS.historia.h * 9);
  assert.equal(FORMATOS.cuadrada.w, FORMATOS.cuadrada.h);
});
