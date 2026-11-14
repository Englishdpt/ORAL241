// Photo -> text, free and in the browser (Tesseract.js), tuned for phone photos of book pages.
// Steps: fix rotation, resize, grayscale, flatten uneven lighting (adaptive threshold), then read with
// the more accurate "best" English model. Two versions of the picture are tried; the more confident wins.

const BEST_LANG = "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int";

async function loadBitmap(file) {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { return await createImageBitmap(file); }
}

function toCanvas(bitmap) {
  const max = Math.max(bitmap.width, bitmap.height);
  const scale = max < 1500 ? 1800 / max : Math.min(1, 2400 / max);
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return c;
}

function grayOf(img) {
  const d = img.data, g = new Float32Array(img.width * img.height);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  return g;
}

function writeGray(canvas, ctx, img, values) {
  const d = img.data;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) { d[i] = d[i + 1] = d[i + 2] = values[j]; d[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}

// Version A: grayscale with stretched contrast (keeps soft text intact).
function contrastVersion(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const g = grayOf(img);
  const hist = new Uint32Array(256);
  for (const v of g) hist[v | 0]++;
  const cut = g.length * 0.01;
  let lo = 0, hi = 255, acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > cut) { lo = i; break; } }
  acc = 0;
  for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc > cut) { hi = i; break; } }
  const span = Math.max(1, hi - lo);
  const out = new Uint8ClampedArray(g.length);
  for (let i = 0; i < g.length; i++) out[i] = Math.max(0, Math.min(255, ((g[i] - lo) * 255) / span));
  return writeGray(canvas, ctx, img, out);
}

// Version B: adaptive threshold (Bradley) - removes shadows and uneven lighting on phone photos.
function binarizedVersion(canvas) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const g = grayOf(img);
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += g[y * w + x];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
    }
  }
  const r = Math.max(8, Math.round(w / 24)), t = 0.14;
  const out = new Uint8ClampedArray(g.length);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r);
      const n = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum = integral[(y1 + 1) * (w + 1) + x1 + 1] - integral[y0 * (w + 1) + x1 + 1]
        - integral[(y1 + 1) * (w + 1) + x0] + integral[y0 * (w + 1) + x0];
      out[y * w + x] = g[y * w + x] * n < sum * (1 - t) ? 0 : 255;
    }
  }
  return writeGray(canvas, ctx, img, out);
}

// Tidy raw OCR output: drop junk lines, join broken words and lines into paragraphs.
function clean(data) {
  const lines = (data.lines?.length ? data.lines : [])
    .filter((l) => {
      const t = l.text.trim();
      const letters = (t.match(/[A-Za-z]/g) || []).length;
      return t.length > 0 && l.confidence >= 45 && letters >= Math.ceil(t.length * 0.5);
    })
    .map((l) => l.text.trim());
  const raw = lines.length ? lines.join("\n") : data.text;
  return raw
    .replace(/-\n(?=[a-z])/g, "")          // hyphenated line breaks
    .replace(/\n{2,}/g, "\u0000")           // keep paragraph breaks
    .replace(/\n/g, " ")
    .replace(/\u0000/g, "\n\n")
    .replace(/\|/g, "I")                    // classic OCR confusion
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export async function readPhoto(file, onProgress = () => {}) {
  const bitmap = await loadBitmap(file);
  const base = toCanvas(bitmap);
  const copy = document.createElement("canvas");
  copy.width = base.width; copy.height = base.height;
  copy.getContext("2d").drawImage(base, 0, 0);
  const [blobA, blobB] = [await contrastVersion(base), await binarizedVersion(copy)];

  const { createWorker } = await import("tesseract.js");
  const logger = (m) => { if (m.status === "recognizing text") onProgress(Math.round(m.progress * 100)); };
  let worker;
  try { worker = await createWorker("eng", 1, { langPath: BEST_LANG, logger }); }
  catch { worker = await createWorker("eng", 1, { logger }); }
  await worker.setParameters({ preserve_interword_spaces: "1", user_defined_dpi: "300" });
  try {
    const a = (await worker.recognize(blobA)).data;
    const b = (await worker.recognize(blobB)).data;
    return clean(b.confidence > a.confidence ? b : a);
  } finally { await worker.terminate(); }
}
