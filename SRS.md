# SRS: mes.

## Objetivo y alcance

Una página donde cualquier persona conecta su Spotify y descarga una card
compartible (PNG) con su top del período: cinco artistas y su tema. Proyecto
público no comercial, sin backend, sin base de datos y sin secretos propios.
Todo corre en el navegador del visitante.

## Requisitos funcionales

1. Conexión con Spotify por Authorization Code con PKCE (cliente público de la
   app de Wrapped en el dashboard de Spotify, sin client secret). Scope único:
   `user-top-read`. El token vive solo en `sessionStorage`: se pierde al cerrar
   la pestaña y nunca sale del navegador. "Desconectar" lo borra.
2. Períodos: los tres `time_range` de la API (4 semanas / 6 meses / 1 año). La
   API no expone tops por mes calendario ni minutos ni conteo de
   reproducciones: la card muestra únicamente lo que Spotify devuelve
   (artistas ordenados, tema #1), nunca cifras inventadas.
3. Formatos: Historia 1080×1920 y Cuadrada 1080×1080. La card se pinta en
   canvas con el patrón de la sección 7 del brand kit (fonts.load de cada
   peso antes de pintar, familia del kit primero). La imagen del artista #1 se
   pide con `crossOrigin=anonymous`; si falla, se dibuja un marcador con el
   acento. Descarga por `toBlob`, nombre `mes-<periodo>-<formato>.png`.
4. Estados: sin conexión, error de autorización (`?error=`), error de API,
   sin escuchas en el período (aviso y sugerencia de período más largo) y
   carga. Nada de spinners eternos ni datos de muestra.
5. Marca `mes.` con punto mandarina `#f26a1b`. Papel oscuro `#0f0e15`, tinta
   `#f1eee6` (herramienta: modo oscuro). Space Grotesk + DM Mono servidas
   desde lucasramos.uy/brand. `kit-header` y `kit-footer` con colores
   explícitos; el link a la raíz vive en el footer. 404 propio con salida.
6. HIG: botones y segmentos ≥44px, `:hover` solo en `@media (hover: hover)`,
   foco visible con el acento, inputs a 16px en táctil (kit-base), sin
   bloquear el zoom, safe areas con `viewport-fit=cover`.

## Datos y costo

- Llamadas a la API: 2 por período elegido (`/me/top/artists?limit=5` y
  `/me/top/tracks?limit=1`), cacheadas en memoria por período durante la
  sesión. Sin polling ni almacenamiento.
- Hosting: GitHub Pages desde `main`, cero costo. Ruta final
  `lucasramos.uy/mes` vía el Worker proxy (PR en lucasramosuy/router) más la
  ruta explícita en el panel de Cloudflare.
- Redirect URIs registradas en la app de Spotify: la del dominio final y la de
  GitHub Pages (playtest).
