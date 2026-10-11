// La card compartible. Canvas + fuentes del kit (regla: fonts.load antes de
// pintar, nunca una genérica a secas). Papel #0f0e15, tinta #f1eee6, acento
// mandarina #f26a1b.

export const FORMATOS = {
  historia: { id: 'historia', label: 'Historia 9:16', w: 1080, h: 1920 },
  cuadrada: { id: 'cuadrada', label: 'Cuadrada 1:1', w: 1080, h: 1080 },
};

export const PAPEL = '#0f0e15';
export const TINTA = '#f1eee6';
export const ACENTO = '#f26a1b';
export const META = '#a8a29a';
export const LINEA = '#2a2731';

export async function cargarFuentes() {
  await Promise.all([
    document.fonts.load('500 40px "Space Grotesk"'),
    document.fonts.load('700 64px "Space Grotesk"'),
    document.fonts.load('400 30px "DM Mono"'),
    document.fonts.load('500 30px "DM Mono"'),
  ]);
  await document.fonts.ready;
}

export function recortar(ctx, texto, max) {
  let t = String(texto || '');
  while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -2) + '…';
  return t;
}

const grotesk = (w, px) => `${w} ${px}px "Space Grotesk", sans-serif`;
const mono = (w, px) => `${w} ${px}px "DM Mono", monospace`;

function cargarImagen(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function imagenCover(ctx, img, x, y, w, h, radio) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radio);
  ctx.clip();
  if (img) {
    const escala = Math.max(w / img.width, h / img.height);
    const iw = img.width * escala;
    const ih = img.height * escala;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else {
    ctx.fillStyle = LINEA;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = ACENTO;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function wordmark(ctx, x, y, px) {
  ctx.font = grotesk(700, px);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TINTA;
  ctx.fillText('mes', x, y);
  const ancho = ctx.measureText('mes').width;
  ctx.fillStyle = ACENTO;
  ctx.fillText('.', x + ancho, y);
}

function cabecera(ctx, w, resumen, periodoCard) {
  wordmark(ctx, 90, 170, 64);
  ctx.font = mono(400, 30);
  ctx.fillStyle = META;
  ctx.textAlign = 'right';
  ctx.fillText(periodoCard.toUpperCase(), w - 90, 164);
  ctx.textAlign = 'left';
}

function pie(ctx, w, h, fecha) {
  ctx.font = mono(400, 28);
  ctx.fillStyle = META;
  ctx.fillText('lucasramos.uy/mes', 90, h - 64);
  ctx.textAlign = 'right';
  ctx.fillText(fecha, w - 90, h - 64);
  ctx.textAlign = 'left';
}

function listaArtistas(ctx, artistas, x, y, ancho, filaAlto, pxNombre, mostrarDesde = 1) {
  artistas.slice(mostrarDesde).forEach((a, i) => {
    const yy = y + i * filaAlto;
    ctx.strokeStyle = LINEA;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + ancho, yy);
    ctx.stroke();
    ctx.font = mono(500, pxNombre * 0.62);
    ctx.fillStyle = ACENTO;
    ctx.fillText(String(i + 1 + mostrarDesde).padStart(2, '0'), x, yy + filaAlto * 0.62);
    ctx.font = grotesk(500, pxNombre);
    ctx.fillStyle = TINTA;
    ctx.fillText(recortar(ctx, a.nombre, ancho - 110), x + 90, yy + filaAlto * 0.66);
  });
}

export async function pintarCard(canvas, resumen, formatoId, fecha) {
  const f = FORMATOS[formatoId] || FORMATOS.historia;
  canvas.width = f.w;
  canvas.height = f.h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAPEL;
  ctx.fillRect(0, 0, f.w, f.h);
  // Halo mandarina suave arriba a la derecha
  const glow = ctx.createRadialGradient(f.w * 0.9, 60, 40, f.w * 0.9, 60, 700);
  glow.addColorStop(0, 'rgba(242,106,27,.28)');
  glow.addColorStop(1, 'rgba(242,106,27,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, f.w, f.h);

  const periodoCard = resumen.periodoCard || resumen.periodo || '';
  cabecera(ctx, f.w, resumen, periodoCard);
  const img = await cargarImagen(resumen.artistas[0]?.imagen);

  if (f.id === 'historia') {
    imagenCover(ctx, img, 90, 260, 900, 900, 36);
    ctx.font = mono(500, 32);
    ctx.fillStyle = ACENTO;
    ctx.fillText('01', 90, 1268);
    ctx.font = grotesk(700, 78);
    ctx.fillStyle = TINTA;
    ctx.fillText(recortar(ctx, resumen.artistas[0]?.nombre || '—', 800), 180, 1272);
    listaArtistas(ctx, resumen.artistas, 90, 1330, 900, 84, 42);
    if (resumen.tema) {
      ctx.font = mono(400, 30);
      ctx.fillStyle = ACENTO;
      ctx.fillText('TU TEMA', 90, 1700);
      ctx.font = grotesk(700, 52);
      ctx.fillStyle = TINTA;
      ctx.fillText(recortar(ctx, resumen.tema.nombre, 900), 90, 1762);
      ctx.font = grotesk(500, 38);
      ctx.fillStyle = META;
      ctx.fillText(recortar(ctx, resumen.tema.artista, 900), 90, 1814);
    }
  } else {
    imagenCover(ctx, img, 90, 240, 400, 400, 28);
    ctx.font = mono(500, 28);
    ctx.fillStyle = ACENTO;
    ctx.fillText('01', 540, 330);
    ctx.font = grotesk(700, 56);
    ctx.fillStyle = TINTA;
    ctx.fillText(recortar(ctx, resumen.artistas[0]?.nombre || '—', 450), 540, 392);
    if (resumen.tema) {
      ctx.font = mono(400, 24);
      ctx.fillStyle = ACENTO;
      ctx.fillText('TU TEMA', 540, 480);
      ctx.font = grotesk(700, 36);
      ctx.fillStyle = TINTA;
      ctx.fillText(recortar(ctx, resumen.tema.nombre, 450), 540, 528);
      ctx.font = grotesk(500, 28);
      ctx.fillStyle = META;
      ctx.fillText(recortar(ctx, resumen.tema.artista, 450), 540, 572);
    }
    listaArtistas(ctx, resumen.artistas, 90, 700, 900, 62, 32);
  }

  pie(ctx, f.w, f.h, fecha);
  return canvas;
}

export function descargar(canvas, nombre) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('sin blob'));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nombre;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}
