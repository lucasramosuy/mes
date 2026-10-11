# mes.

Tu Spotify en una card compartible: conectás tu cuenta, elegís el período
(4 semanas, 6 meses o 1 año) y el formato (Historia 9:16 o Cuadrada 1:1), y
descargás un PNG con tu top 5 de artistas y tu tema. Todo se genera en tu
navegador; nada se guarda ni se sube a ningún servidor.

## Desarrollo

Node 22. Sin dependencias de runtime ni de build.

```sh
pnpm test
```

Servir la carpeta con un servidor estático (los módulos requieren HTTP, no
`file://`). Todo vive bajo `/mes/` tanto en GitHub Pages como en la ruta del
dominio. Los archivos fuente están en la raíz para mantener el proyecto
chico. No hay capturas en el repo; el playtest guarda sus PNG fuera.

## Spotify

- PKCE de cliente público contra la app de Wrapped
  (developer.spotify.com): no hay client secret en el código, solo el
  client ID, que es público por diseño en este flujo.
- Scope: `user-top-read`. Token en `sessionStorage`, muere con la pestaña.
- La API de Spotify no da tops por mes calendario ni minutos ni
  reproducciones: los períodos son los `time_range` de la API y la card
  muestra solo datos reales devueltos por ella.

## Datos y costo

- Dos llamadas a la API por período elegido, cacheadas en memoria durante la
  sesión. Cero backend, cero base de datos, cero costo.
- Hosting en GitHub Pages desde `main`; el dominio `lucasramos.uy/mes` sale
  por el Worker proxy (ver SRS.md).
