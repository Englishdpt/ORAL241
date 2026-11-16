// Turns a user's file (photo, PDF, text file) into plain English text for the "Importer un texte" form.
//  - photo  -> AI vision on the server (read-photo), falling back to in-browser OCR
//  - PDF    -> embedded text when there is some; scanned pages are rendered and read like photos
//  - Word (.docx) -> text extracted in the browser (mammoth)
//  - .txt   -> read as is
import { callFunction } from "./supabase.js";
import { readPhoto, readPhotoAI } from "./ocr.js";

export const MAX_CHARS = 8000;        // same limit as the database function add_uploaded_text
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_PDF_PAGES = 6;

const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/";
let pdfLib;
async function loadPdfjs() {
  if (pdfLib) return pdfLib;
  const lib = await import(/* @vite-ignore */ PDFJS + "pdf.min.mjs");
  // A worker cannot be started straight from another site, so it is fetched and wrapped first.
  const code = await (await fetch(PDFJS + "pdf.worker.min.mjs")).text();
  lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  return (pdfLib = lib);
}

// Word files: mammoth is loaded from a CDN only when needed, so the main app stays light.
const MAMMOTH = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
let mammothLoad;
function loadMammoth() {
  if (window.mammoth) return Promise.resolve(window.mammoth);
  return (mammothLoad ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = MAMMOTH;
    s.onload = () => (window.mammoth ? resolve(window.mammoth) : reject(new Error("mammoth")));
    s.onerror = () => { mammothLoad = null; reject(new Error("mammoth")); };
    document.head.appendChild(s);
  }));
}
async function readDocx(file) {
  const mammoth = await loadMammoth();
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return String(value || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// PDF text arrives line by line: rebuild words cut at line ends and paragraphs.
function tidyPdfText(raw) {
  const lines = raw.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!lines.length) return "";
  const max = Math.max(...lines.map((l) => l.length));
  let out = "", prev = "";
  for (const line of lines) {
    if (!out) out = line;
    else if (out.endsWith("-") && /^[a-z]/.test(line)) out = out.slice(0, -1) + line;
    else out += (prev.length < max * 0.6 && /[.!?”"']$/.test(prev) ? "\n\n" : " ") + line;
    prev = line;
  }
  return out;
}

async function pageToJpegBase64(page) {
  const v1 = page.getViewport({ scale: 1 });
  const scale = Math.min(2.5, 1800 / Math.max(v1.width, v1.height));
  const viewport = page.getViewport({ scale });
  const c = document.createElement("canvas");
  c.width = Math.round(viewport.width); c.height = Math.round(viewport.height);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return c.toDataURL("image/jpeg", 0.85).split(",")[1];
}

async function readPdf(file, token, onProgress, notes) {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = Math.min(pdf.numPages, MAX_PDF_PAGES);
  if (pdf.numPages > pages) notes.push(`Seules les ${pages} premières pages du PDF sont lues (limite de longueur).`);
  const parts = [];
  for (let n = 1; n <= pages; n++) {
    onProgress(`PDF : page ${n}/${pages}…`);
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const raw = content.items.map((it) => it.str + (it.hasEOL ? "\n" : " ")).join("");
    const text = tidyPdfText(raw);
    if (text.replace(/[^A-Za-z]/g, "").length >= 30) { parts.push(text); }
    else {                                      // scanned page: read it like a photo
      onProgress(`PDF scanné : lecture IA de la page ${n}/${pages}… (10 à 30 s)`);
      const image = await pageToJpegBase64(page);
      const { text: t } = await callFunction("read-photo", { image, mime: "image/jpeg" }, token);
      if (t) parts.push(String(t).trim());
    }
    if (parts.join("\n\n").length >= MAX_CHARS) break;
  }
  return parts.join("\n\n");
}

export async function readFileToText(file, { token, onProgress = () => {}, notes = [] }) {
  if (file.size > MAX_BYTES) throw new Error(`« ${file.name} » est trop lourd (15 Mo maximum).`);
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    try { return await readPdf(file, token, onProgress, notes); }
    catch (e) {
      if (/Crédit/i.test(e.message)) throw e;
      throw new Error("Impossible de lire ce PDF. Essayez une photo de la page.");
    }
  }
  if (file.type.startsWith("image/")) {
    onProgress("Lecture de la photo par l'IA… (10 à 30 secondes)");
    try { return await readPhotoAI(file, token); }
    catch (e) {
      if (/Crédit/i.test(e.message)) throw e;
      return await readPhoto(file, (pct) => onProgress(`Lecture simplifiée… ${pct}%`));
    }
  }
  if (file.type === "text/plain" || name.endsWith(".txt")) return (await file.text()).trim();
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    onProgress("Lecture du fichier Word…");
    let text;
    try { text = await readDocx(file); }
    catch { throw new Error("Impossible de lire ce fichier Word. Enregistrez-le en PDF puis importez-le."); }
    if (text.length < 20)
      throw new Error("Ce fichier Word ne contient pas de texte lisible (peut-être des images). Enregistrez-le en PDF puis importez-le.");
    return text;
  }
  if (name.endsWith(".doc"))
    throw new Error("L'ancien format .doc n'est pas pris en charge : ouvrez le fichier dans Word et enregistrez-le en .docx ou en PDF.");
  throw new Error(`Format non pris en charge : « ${file.name} ». Utilisez une photo, un PDF, un fichier Word (.docx) ou un fichier .txt.`);
}

// Cuts at the last full sentence under the limit.
export function fitLimit(text) {
  if (text.length <= MAX_CHARS) return { text, cut: false };
  const head = text.slice(0, MAX_CHARS);
  const i = Math.max(head.lastIndexOf(". "), head.lastIndexOf(".\n"), head.lastIndexOf("? "), head.lastIndexOf("! "));
  return { text: (i > MAX_CHARS * 0.6 ? head.slice(0, i + 1) : head).trim(), cut: true };
}
