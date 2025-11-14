<!-- src/pages/BookPreview.vue -->
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
import { ref } from 'vue';
import { useNodesStore } from 'stores/nodes-store';
import { useBookStore } from 'stores/book-store';
import { useAssetsStore } from 'stores/assets-store';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
// [1. LA CLAVE] Cambiamos la importación para mayor compatibilidad
import * as pdfLib from 'pdf-lib';

const $q = useQuasar();
const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

const isGenerating = ref(false);
const pdfDataUrl = ref('');

function mmToPt(mm: number) {
  return mm * 2.834645669;
}

async function getImageAsDataUrl(url: string): Promise<string | null> {
  // Esta función no necesita cambios
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

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

  // [2. LA CLAVE] Usamos el objeto 'pdfLib' para acceder a las funciones y constantes
  const pdfDoc = await pdfLib.PDFDocument.create();

  const font = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRomanItalic);
  const fontBoldItalic = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRomanBoldItalic);

  const fonts = {
    normal: font,
    bold: fontBold,
    italic: fontItalic,
    boldItalic: fontBoldItalic,
  };

  const fontSizeTitle = 36;
  const fontSizeAuthor = 14;
  const fontSizeNumber = 11;
  const fontSizeText = 10;
  const lineHeight = 1.4;

  const pageWidthPt = mmToPt(210);
  const pageHeightPt = mmToPt(297);
  const marginTopPt = mmToPt(15);
  const marginBottomPt = mmToPt(15);
  const marginLeftPt = mmToPt(10);
  const marginRightPt = mmToPt(10);
  const gapBetweenColumnsPt = mmToPt(10);
  const columnWidthPt = (pageWidthPt - marginLeftPt - marginRightPt - gapBetweenColumnsPt) / 2;

  // --------------- PORTADA (Lógica simplificada y corregida) ----------------
  const coverPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
  if (imageId) {
    const asset = assetsStore.getAssetById(imageId);
    if (asset) {
      const assetUrl = assetsStore.getAssetUrl(asset.filename);
      const imgDataUrl = await getImageAsDataUrl(assetUrl);
      if (imgDataUrl) {
        const img = await pdfDoc.embedJpg(imgDataUrl);
        const imgDims = img.scaleToFit(pageWidthPt, pageHeightPt);
        coverPage.drawImage(img, {
          x: (pageWidthPt - imgDims.width) / 2,
          y: (pageHeightPt - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });
      }
    }
  }
  // ... (puedes añadir aquí el título sobre la imagen si lo deseas)

  // --------------- LÓGICA DE CONTENIDO Y RENDERIZADO ----------------
  let currentPage: pdfLib.PDFPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
  let cursorY = pageHeightPt - marginTopPt;
  let currentColumn = 0; // 0 for left, 1 for right
  const columnX = [marginLeftPt, marginLeftPt + columnWidthPt + gapBetweenColumnsPt];

  const checkAndSwitchColumn = (neededHeight = fontSizeText * lineHeight) => {
    if (cursorY - neededHeight < marginBottomPt) {
      currentColumn++;
      if (currentColumn > 1) {
        currentPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
        currentColumn = 0;
      }
      cursorY = pageHeightPt - marginTopPt;
      return true;
    }
    return false;
  };

  const drawStyledHtmlText = (htmlText: string) => {
    const parts = htmlText.split(/(<(?:strong|b|em|i)>|<\/(?:strong|b|em|i)>)/gi).filter(Boolean);
    let cursorX = columnX[currentColumn];
    const styleStack: ('normal' | 'bold' | 'italic')[] = ['normal'];
    const spaceWidth = fonts.normal.widthOfTextAtSize(' ', fontSizeText);

    for (const part of parts) {
      const lowerPart = part.toLowerCase();

      if (lowerPart === '<strong>' || lowerPart === '<b>') { styleStack.push('bold'); continue; }
      if (lowerPart === '<em>' || lowerPart === '<i>') { styleStack.push('italic'); continue; }
      if (lowerPart === '</strong>' || lowerPart === '</b>') {
        const idx = styleStack.lastIndexOf('bold');
        if (idx > 0) styleStack.splice(idx, 1);
        continue;
      }
      if (lowerPart === '</em>' || lowerPart === '</i>') {
        const idx = styleStack.lastIndexOf('italic');
        if (idx > 0) styleStack.splice(idx, 1);
        continue;
      }

      const hasBold = styleStack.includes('bold');
      const hasItalic = styleStack.includes('italic');
      let currentFont = fonts.normal;
      if (hasBold && hasItalic) currentFont = fonts.boldItalic;
      else if (hasBold) currentFont = fonts.bold;
      else if (hasItalic) currentFont = fonts.italic;

      const words = part.split(/\s+/);
      for (const word of words) {
        if (!word) continue;
        const wordWidth = currentFont.widthOfTextAtSize(word, fontSizeText);

        if (cursorX > columnX[currentColumn] && cursorX + wordWidth > columnX[currentColumn] + columnWidthPt) {
          cursorX = columnX[currentColumn];
          cursorY -= fontSizeText * lineHeight;
          if (checkAndSwitchColumn()) {
            cursorX = columnX[currentColumn];
          }
        }

        currentPage.drawText(word, { x: cursorX, y: cursorY, font: currentFont, size: fontSizeText, color: pdfLib.rgb(0, 0, 0) });
        cursorX += wordWidth + spaceWidth;
      }
    }
    if (cursorX > columnX[currentColumn]) {
      cursorX = columnX[currentColumn];
      cursorY -= fontSizeText * lineHeight;
      checkAndSwitchColumn();
    }
  };

  for (const blk of blocks) {
    const nro = String(blk.number);
    const desc = blk.description.trim();

    checkAndSwitchColumn((fontSizeNumber * lineHeight) + (fontSizeText * lineHeight));

    currentPage.drawText(nro, { x: columnX[currentColumn], y: cursorY, font: fontBold, size: fontSizeNumber, color: pdfLib.rgb(0, 0, 0) });
    cursorY -= fontSizeNumber * lineHeight;

    if (desc) {
      const paragraphs = desc.split(/\n+/);
      for (const paragraph of paragraphs) {
        if (checkAndSwitchColumn()) {
          // Si cambiamos de columna, el cursor Y ya está reseteado
        }
        drawStyledHtmlText(paragraph);
      }
    }

    cursorY -= mmToPt(4); // Margen inferior tras el bloque
  }

  const pages = pdfDoc.getPages();
  for (let i = 1; i < pages.length; i++) { // Empezamos en 1 para saltar la portada
    const p = pages[i];
    const pageNumberText = `Página ${i}`;
    const textWidth = font.widthOfTextAtSize(pageNumberText, 8);
    p.drawText(pageNumberText, {
      x: (pageWidthPt - textWidth) / 2,
      y: marginBottomPt / 2,
      size: 8,
      font,
      color: pdfLib.rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function generatePdf() {
  if (!activeBook.value) {
    $q.notify({ type: 'negative', message: 'No hay un libro activo para generar el PDF.' });
    return;
  }

  isGenerating.value = true;
  pdfDataUrl.value = '';
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const sortedNodes = [...nodes.value].sort((a, b) => {
      const numA = parseFloat(String(a.data?.paragraphNumber ?? '').trim());
      const numB = parseFloat(String(b.data?.paragraphNumber ?? '').trim());
      if (isNaN(numA) && isNaN(numB)) return 0;
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    const blocks = sortedNodes
      .filter(n => n.data?.paragraphNumber && String(n.data?.paragraphNumber).trim() !== '')
      .map(n => ({
        number: n.data.paragraphNumber,
        description: n.data.description || '(Sin descripción)',
      }));

    const blob = await buildPdfNative({
      imageId: activeBook.value.meta.imageId,
      title: activeBook.value.meta.title || 'Sin Título',
      author: activeBook.value.meta.author || 'Autor Desconocido',
      blocks,
    });

    pdfDataUrl.value = URL.createObjectURL(blob);
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
.fit { width: 100%; height: 100%; }
.absolute-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
</style>
