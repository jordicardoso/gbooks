<!-- src/components/BookPreview.vue -->
<template>
  <div class="fit column no-wrap bg-grey-10 text-white" style="height: 100%;">
    <div class="col-auto q-pa-md">
      <div class="text-h5">Vista Previa del Libro</div>
      <div class="text-caption text-grey-5 q-mb-md">
        Genera una vista previa en PDF de tu libro. El contenido se ordenará por el número de párrafo.
      </div>
      <q-btn
        label="Generar PDF"
        color="primary"
        icon="picture_as_pdf"
        :loading="isGenerating"
        @click="generatePdf"
      />
      <q-separator dark class="q-my-md" />
    </div>

    <!-- Visor de PDF -->
    <div class="col relative-position" style="flex: 1; min-height: 0;">
      <div v-if="!pdfDataUrl && !isGenerating" class="absolute-center text-center text-grey-6">
        <q-icon name="visibility" size="4rem" />
        <p>Haz clic en "Generar PDF" para ver la previsualización.</p>
      </div>

      <div v-if="isGenerating" class="absolute-center text-center">
        <q-spinner-dots color="primary" size="50px" />
        <div class="q-mt-md text-grey-5">Generando PDF, esto puede tardar un momento...</div>
      </div>

      <iframe
        v-if="pdfDataUrl"
        :src="pdfDataUrl"
        frameborder="0"
        class="fit"
        style="width: 100%; height: 100%;"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Componente: BookPreview.vue
 * Genera PDF nativo con pdf-lib, paginación automática en 2 columnas por página A4.
 *
 * Requisitos: tener instaladas las dependencias:
 *   npm install pdf-lib
 *
 * Nota: pdf-lib es bastante pequeño y estático; no requiere html2canvas.
 */

import { ref } from 'vue';
import { useNodesStore } from 'stores/nodes-store';
import { useBookStore } from 'stores/book-store';
import { useAssetsStore } from 'stores/assets-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const $q = useQuasar();
const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

const isGenerating = ref(false);
const pdfDataUrl = ref('');

// Helpers de unidades
function mmToPt(mm: number) {
  return mm * 2.834645669; // 1 mm ≈ 2.834645669 points
}
function ptToMm(pt: number) {
  return pt / 2.834645669;
}

// Espera 2 frames + ms (útil para render oculto si se necesita)
async function waitForRender(ms = 50) {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context.');
        return resolve(null);
      }
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg');
      resolve(dataURL);
    };
    img.onerror = (err) => {
      console.error('Error loading image into memory canvas:', url, err);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Divide el texto en líneas usando la métrica del font embedido (pdf-lib).
 * Devuelve array de líneas (strings).
 */
function wrapTextLines(font: any, text: string, fontSize: number, maxWidthPt: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const test = current ? current + ' ' + w : w;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width <= maxWidthPt) {
      current = test;
    } else {
      if (current) {
        lines.push(current);
      } else {
        // una palabra más larga que la línea: partirla
        let long = w;
        let j = 0;
        let chunk = '';
        while (j < long.length) {
          chunk += long[j];
          const chunkWidth = font.widthOfTextAtSize(chunk, fontSize);
          if (chunkWidth > maxWidthPt) {
            // quitar último caracter y push
            lines.push(chunk.slice(0, -1));
            chunk = long[j];
          }
          j++;
        }
        if (chunk) lines.push(chunk);
        current = '';
      }
      current = w;
      // si la palabra sola supera (se trató arriba), seguimos
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Genera PDF nativo con pdf-lib usando dos columnas por página.
 * Recibe:
 *  - coverImageArrayBuffer?: ArrayBuffer | null -> cubierta (JPEG/PNG)
 *  - title, author
 *  - blocks: array de objetos { number: string|number, description: string }
 */
async function buildPdfNative(options: {
  imageId?: string | null;
  title: string;
  author: string;
  blocks: { number: string | number; description: string }[];
}) {
  const { imageId, title, author, blocks } = options;

  if (!activeBook.value) {
    $q.notify({ type: 'negative', message: 'No hay un libro activo para generar el PDF.' });
    return;
  }

  // Crear documento
  const pdfDoc = await PDFDocument.create();

  // Fuente estándar
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // para números
  const fontSizeTitle = 36;
  const fontSizeAuthor = 14;
  const fontSizeNumber = 11;
  const fontSizeText = 10;
  const lineHeight = 1.4; // multiplicador

  // Medidas A4 en puntos
  const pageWidthPt = mmToPt(210); // ancho A4
  const pageHeightPt = mmToPt(297); // alto A4

  // Márgenes (igual que antes)
  const marginTopPt = mmToPt(15);
  const marginBottomPt = mmToPt(15);
  const marginLeftPt = mmToPt(10);
  const marginRightPt = mmToPt(10);
  const contentHeightPt = pageHeightPt - marginTopPt - marginBottomPt; // ~267mm
  const gapBetweenColumnsPt = mmToPt(10);
  const columnWidthPt = (pageWidthPt - marginLeftPt - marginRightPt - gapBetweenColumnsPt) / 2;
  const imagePortrait = activeBook.value.meta.imageId;

  // --------------- PORTADA ----------------
  if (imagePortrait) {
    // Intentamos detectar si JPG o PNG (pdf-lib tiene embedJpg/embedPng)
    let img;

    img = await getImageAsDataUrl(imagePortrait);

    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    // Si hay imagen, la dibujamos como fondo a cubrir la página
    if (img) {
      const imgDims = img.scaleToFit(pageWidthPt, pageHeightPt);
      page.drawImage(img, {
        x: 0,
        y: pageHeightPt - imgDims.height,
        width: pageWidthPt,
        height: imgDims.height,
      });
    } else {
      // fondo oscuro si no hay imagen
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidthPt,
        height: pageHeightPt,
        color: rgb(0.07, 0.07, 0.07),
      });
    }

    // Caja central del título (semi-oscura)
    const boxWidth = pageWidthPt * 0.8;
    const boxX = (pageWidthPt - boxWidth) / 2;
    const boxY = pageHeightPt / 2 - mmToPt(20);
    // sombra/rect translucida
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: mmToPt(40),
      color: rgb(0, 0, 0),
      opacity: 0.55,
    });

    // Título
    const titleLines = wrapTextLines(font, title || 'Sin Título', fontSizeTitle, boxWidth - mmToPt(20));
    // dibujar líneas centradas
    let ty = boxY + mmToPt(40) - fontSizeTitle - mmToPt(6); // un poco hacia abajo dentro de box
    for (const line of titleLines) {
      const w = font.widthOfTextAtSize(line, fontSizeTitle);
      page.drawText(line, {
        x: boxX + (boxWidth - w) / 2,
        y: ty,
        size: fontSizeTitle,
        font,
        color: rgb(1, 1, 1),
      });
      ty -= fontSizeTitle * 1.1;
    }

    // Autor debajo
    const authorText = author || 'Autor Desconocido';
    const wAuth = font.widthOfTextAtSize(authorText, fontSizeAuthor);
    page.drawText(authorText, {
      x: boxX + (boxWidth - wAuth) / 2,
      y: ty - 6,
      size: fontSizeAuthor,
      font,
      color: rgb(0.95, 0.95, 0.95),
    });
  } else {
    // Portada simple (sin imagen)
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    // fondo blanco
    page.drawRectangle({ x: 0, y: 0, width: pageWidthPt, height: pageHeightPt, color: rgb(1, 1, 1) });

    // Título centrado verticalmente
    const boxWidth = pageWidthPt * 0.8;
    const x = (pageWidthPt - boxWidth) / 2;
    let y = pageHeightPt / 2 + mmToPt(10);

    const titleLines = wrapTextLines(font, title || 'Sin Título', fontSizeTitle, boxWidth);
    for (const line of titleLines) {
      const w = font.widthOfTextAtSize(line, fontSizeTitle);
      page.drawText(line, {
        x: x + (boxWidth - w) / 2,
        y,
        size: fontSizeTitle,
        font,
        color: rgb(0, 0, 0),
      });
      y -= fontSizeTitle * 1.1;
    }

    // Autor
    const authorText = author || 'Autor Desconocido';
    const wAuth = font.widthOfTextAtSize(authorText, fontSizeAuthor);
    page.drawText(authorText, {
      x: x + (boxWidth - wAuth) / 2,
      y: y - 8,
      size: fontSizeAuthor,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  // --------------- CONTENIDO: 2 columnas por página ----------------
  // Variables de cursor:
  let currentPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]); // empezamos con página 2 (1 fue portada)
  // Reusar fuentes locales
  const contentPages: any[] = []; // solo para tracking si necesitamos numerar luego
  // Setup primera content page
  let cursorXLeft = marginLeftPt;
  let cursorYLeft = pageHeightPt - marginTopPt; // partir desde arriba (coordenada Y del baseline de la primera línea)
  let cursorXRight = marginLeftPt + columnWidthPt + gapBetweenColumnsPt;
  let cursorYRight = pageHeightPt - marginTopPt;

  // La altura disponible para texto = contentHeightPt
  const maxColumnHeight = contentHeightPt;

  // funcion para crear nueva página y reset cursors
  function newContentPage() {
    currentPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    contentPages.push(currentPage);
    cursorYLeft = pageHeightPt - marginTopPt;
    cursorYRight = pageHeightPt - marginTopPt;
  }
  // Aseguramos que el primer currentPage quede en contentPages para numerar más tarde
  contentPages.push(currentPage);

  // Recorremos bloques y vamos escribiendo en columnas
  // Para cada bloque, creamos líneas: número (bold) + descripción (varias líneas)
  for (const blk of blocks) {
    const nro = String(blk.number);
    const desc = String(blk.description || '(Sin descripción)');

    // --- calcular líneas para número y descripción ---
    const numberLines = wrapTextLines(fontBold, nro, fontSizeNumber, columnWidthPt);
    // Para descripcion, procesar párrafos nuevos (mantener saltos de linea simples)
    const descParagraphs = desc.split(/\n+/).map(s => s.trim()).filter(Boolean);
    let descLines: string[] = [];
    for (const p of descParagraphs) {
      const lines = wrapTextLines(font, p, fontSizeText, columnWidthPt);
      descLines.push(...lines);
      // añadir linea vacía entre párrafos (si varios)
      descLines.push('');
    }
    if (descLines.length && descLines[descLines.length - 1] === '') descLines.pop();

    // Altura necesaria estimada en puntos
    const numberHeight = numberLines.length * fontSizeNumber * lineHeight;
    const descHeight = descLines.length * fontSizeText * lineHeight + (descLines.length ? mmToPt(1) : 0);
    const blockHeightPt = numberHeight + descHeight + mmToPt(2); // pequeño margen inferior

    // Intentar colocar en la columna izquierda, luego derecha, si no cabe -> nueva página
    // comprobar espacio disponible en left
    const leftUsed = pageHeightPt - marginTopPt - cursorYLeft; // cuánto se ha usado desde top en left
    const leftRemaining = maxColumnHeight - (pageHeightPt - marginTopPt - cursorYLeft);

    let placed = false;

    // función para dibujar en página actual en una columna dada
    function drawBlockAt(column: 'left' | 'right') {
      const x = column === 'left' ? cursorXLeft : cursorXRight;
      let y = column === 'left' ? cursorYLeft : cursorYRight;
      // Dibujar número (bold)
      for (const ln of numberLines) {
        // number centered respect to column width? We'll draw flush left with small indent
        const indent = mmToPt(2);
        currentPage.drawText(ln, {
          x: x + indent,
          y: y - fontSizeNumber,
          size: fontSizeNumber,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        y -= fontSizeNumber * lineHeight;
      }
      // Dibujar descripción líneas
      for (const ln of descLines) {
        if (ln === '') {
          y -= fontSizeText * lineHeight * 0.5; // paragraph gap
          continue;
        }
        currentPage.drawText(ln, {
          x: x + mmToPt(2),
          y: y - fontSizeText,
          size: fontSizeText,
          font,
          color: rgb(0, 0, 0),
        });
        y -= fontSizeText * lineHeight;
      }
      // pequeño margen inferior tras bloque
      y -= mmToPt(2);

      if (column === 'left') cursorYLeft = y;
      else cursorYRight = y;
      placed = true;
    }

    // Check left remaining
    const leftConsumed = pageHeightPt - marginTopPt - cursorYLeft;
    const remainingLeft = maxColumnHeight - leftConsumed;
    if (blockHeightPt <= remainingLeft) {
      drawBlockAt('left');
      continue;
    }

    // Try right column
    const rightConsumed = pageHeightPt - marginTopPt - cursorYRight;
    const remainingRight = maxColumnHeight - rightConsumed;
    if (blockHeightPt <= remainingRight) {
      drawBlockAt('right');
      continue;
    }

    // Neither fits: need to move to next page
    // But if left is empty and block bigger than single column height (very large paragraph),
    // we will still write until bottom (text will overflow). To be robust, we'll split descLines across pages.
    // Strategy: if blockHeight > maxColumnHeight -> split the description across columns/pages
    if (blockHeightPt > maxColumnHeight) {
      // Dibujar número en la columna que has elegido (left if space, else new page left)
      // We'll split descLines into chunks that fit the remaining space iteratively
      // First, ensure we are at a column with remaining space; prefer left if still has very small content
      // Approach: treat the paragraph as sequence of lines and pour them into columns/pages.

      // We will recompose the block as sequence: numberLines + descLines, and pour them line-by-line.
      const allLines: { text: string; size: number }[] = [];
      for (const ln of numberLines) allLines.push({ text: ln, size: fontSizeNumber });
      for (const ln of descLines) allLines.push({ text: ln, size: fontSizeText });

      let lineIndex = 0;
      while (lineIndex < allLines.length) {
        // Calcular remaining en left
        const leftConsumed2 = pageHeightPt - marginTopPt - cursorYLeft;
        const remainingLeft2 = maxColumnHeight - leftConsumed2;

        // Si cabe en left? intentamos
        let y = cursorYLeft;
        let spaceLeft = remainingLeft2;
        let chunkStart = lineIndex;
        let usedHeight = 0;
        // consumir lineas hasta llenar
        while (lineIndex < allLines.length) {
          const l = allLines[lineIndex];
          const h = l.size * lineHeight;
          if (h <= spaceLeft) {
            spaceLeft -= h;
            usedHeight += h;
            lineIndex++;
          } else break;
        }
        // dibujar desde chunkStart hasta lineIndex-1 en left
        for (let k = chunkStart; k < lineIndex; k++) {
          const l = allLines[k];
          // determinar font a usar
          const useFont = (k < numberLines.length) ? fontBold : font;
          const fSize = l.size;
          currentPage.drawText(l.text, {
            x: cursorXLeft + mmToPt(2),
            y: y - fSize,
            size: fSize,
            font: useFont,
            color: rgb(0, 0, 0),
          });
          y -= fSize * lineHeight;
        }
        cursorYLeft = y - mmToPt(2);

        // si aun quedan lineas, intentar llenar right column
        if (lineIndex < allLines.length) {
          const remainingRight2 = maxColumnHeight - (pageHeightPt - marginTopPt - cursorYRight);
          let yR = cursorYRight;
          let spaceR = remainingRight2;
          const chunkStartR = lineIndex;
          while (lineIndex < allLines.length) {
            const l = allLines[lineIndex];
            const h = l.size * lineHeight;
            if (h <= spaceR) {
              spaceR -= h;
              lineIndex++;
            } else break;
          }
          for (let k = chunkStartR; k < lineIndex; k++) {
            const l = allLines[k];
            const useFont = (k < numberLines.length) ? fontBold : font;
            const fSize = l.size;
            currentPage.drawText(l.text, {
              x: cursorXRight + mmToPt(2),
              y: yR - fSize,
              size: fSize,
              font: useFont,
              color: rgb(0, 0, 0),
            });
            yR -= fSize * lineHeight;
          }
          cursorYRight = yR - mmToPt(2);
        }

        // si aun quedan líneas -> new page y repetir
        if (lineIndex < allLines.length) {
          newContentPage();
        }
      } // while lines
      continue;
    } // if blockHeight > maxColumnHeight

    // Si llegamos aquí, simplemente creamos nueva página y dibujamos al inicio (col izquierda)
    newContentPage();
    drawBlockAt('left');
  } // for blocks

  // --------------- Numeración de páginas (excluyendo portada) ----------------
  // contentPages contiene todas las páginas de contenido en orden
  const totalContentPages = contentPages.length;
  for (let i = 0; i < totalContentPages; i++) {
    const p = contentPages[i];
    const pageIndexForNumber = i + 1; // empezando en 1 para la primera página de contenido
    const text = `Página ${pageIndexForNumber}`;
    const fontSizeFooter = 10;
    const textWidth = font.widthOfTextAtSize(text, fontSizeFooter);
    p.drawText(text, {
      x: (pageWidthPt - textWidth) / 2,
      y: marginBottomPt / 2,
      size: fontSizeFooter,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // --------------- Output ----------------
  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return blob;
}

// ------------------ generatePdf (integración con stores y UI) -------------------
async function generatePdf() {
  if (!activeBook.value) {
    $q.notify({ type: 'negative', message: 'No hay un libro activo para generar el PDF.' });
    return;
  }

  isGenerating.value = true;
  pdfDataUrl.value = '';
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    // Ordenar nodos por paragraphNumber
    const sortedNodes = [...nodes.value].sort((a, b) => {
      const numA = parseFloat(String(a.data?.paragraphNumber ?? '').trim());
      const numB = parseFloat(String(b.data?.paragraphNumber ?? '').trim());
      if (isNaN(numA) && isNaN(numB)) return 0;
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    // Crear bloques (número + descripción)
    const blocks = sortedNodes
      .filter(n => n.data?.paragraphNumber && String(n.data?.paragraphNumber).trim() !== '')
      .map(n => ({
        number: n.data.paragraphNumber,
        description: n.data.description || '(Sin descripción)',
      }));

    // Intentar cargar imagen de portada si existe
    let coverBuf: ArrayBuffer | undefined = undefined;
    const imageId = activeBook.value.meta.imageId;
    if (imageId) {
      const asset = assetsStore.getAssetById(imageId);
      if (asset) {
        const assetUrl = assetsStore.getAssetUrl(asset.filename);
        const arr = await getImageAsDataUrl(assetUrl);
        if (arr) coverBuf = arr;
        else console.warn('No se pudo cargar la imagen de portada desde', assetUrl);
      }
    }

    $q.notify({ type: 'info', message: 'Generando PDF nativo (pdf-lib)...' });

    const blob = await buildPdfNative({
      coverImageArrayBuffer: coverBuf ?? null,
      title: activeBook.value.meta.title || 'Sin Título',
      author: activeBook.value.meta.author || 'Autor Desconocido',
      blocks,
    });

    const blobUrl = URL.createObjectURL(blob);
    pdfDataUrl.value = blobUrl;

    $q.notify({ type: 'positive', message: 'PDF generado correctamente.' });
  } catch (err) {
    console.error('Error generando PDF nativo:', err);
    $q.notify({ type: 'negative', message: 'Ocurrió un error al generar el PDF.' });
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped>
/* Mantengo estilos mínimos: todo el render del PDF es gestionado por pdf-lib */
.fit { width: 100%; height: 100%; }
.absolute-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
</style>
