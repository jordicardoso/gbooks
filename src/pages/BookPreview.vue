<!-- src/pages/BookPreview.vue -->
<template>
  <div class="fit column no-wrap bg-grey-10 text-white" style="height: 100%">
    <div class="col-auto q-pa-md">
      <div class="text-h5">{{ $t('bookPreview.title') }}</div>
      <div class="text-caption text-grey-5 q-mb-md">
        {{ $t('bookPreview.subtitle') }}
      </div>
      <q-btn
        :label="$t('bookPreview.generateButton')"
        color="primary"
        icon="picture_as_pdf"
        :loading="isGenerating"
        @click="generatePdf"
      />
      <q-separator dark class="q-my-md" />
    </div>

    <!-- Visor de PDF -->
    <div class="col relative-position" style="flex: 1; min-height: 0">
      <div v-if="!pdfDataUrl && !isGenerating" class="absolute-center text-center text-grey-6">
        <q-icon name="visibility" size="4rem" />
        <p>{{ $t('bookPreview.placeholder') }}</p>
      </div>

      <div v-if="isGenerating" class="absolute-center text-center">
        <q-spinner-dots color="primary" size="50px" />
        <div class="q-mt-md text-grey-5">{{ $t('bookPreview.generating') }}</div>
      </div>

      <iframe
        v-if="pdfDataUrl"
        :src="pdfDataUrl"
        frameborder="0"
        class="fit"
        style="width: 100%; height: 100%"
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
import { useI18n } from 'vue-i18n';
import * as pdfLib from 'pdf-lib';
import type { AnyAction, AnyChoice, BookNode } from 'src/stores/types';

const $q = useQuasar();
const { t } = useI18n();
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

/**
 * [NUEVO] Dibuja un texto con ajuste de línea automático en una página.
 * Maneja saltos de línea explícitos (\n) para crear párrafos.
 */
function drawSimpleWrappedText(
  page: pdfLib.PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    font: pdfLib.PDFFont;
    fontSize: number;
    lineHeight: number;
    maxWidth: number;
    color: pdfLib.RGB;
  },
) {
  const { x, y, font, fontSize, lineHeight, maxWidth, color } = options;
  const paragraphs = text.split(/\n/);
  let cursorY = y;

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      cursorY -= lineHeight; // Handle empty lines as paragraph breaks
      continue;
    }
    const words = paragraph.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width > maxWidth && currentLine.length > 0) {
        page.drawText(currentLine, { x, y: cursorY, font, size: fontSize, color });
        cursorY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    // Draw the last line of the paragraph
    page.drawText(currentLine, { x, y: cursorY, font, size: fontSize, color });
    cursorY -= lineHeight * 1.5; // Move to the next line and add space for the next paragraph
  }
}

async function buildPdfNative(options: {
  imageId?: string | null;
  title: string;
  author: string;
  description: string; // [CAMBIO]
  blocks: {
    number: string | number;
    description: string;
    actions: AnyAction[];
    choices: AnyChoice[];
  }[];
  allNodes: BookNode[];
}) {
  const { imageId, title, author, description, blocks, allNodes } = options; // [CAMBIO]

  if (!activeBook.value) {
    $q.notify({ type: 'negative', message: t('bookPreview.notifications.noActiveBook') });
    return;
  }

  const pdfDoc = await pdfLib.PDFDocument.create();

  const font = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRomanItalic);
  const fontBoldItalic = await pdfDoc.embedFont(pdfLib.StandardFonts.TimesRomanBoldItalic);
  const fontTitle = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);

  const fonts = {
    normal: font,
    bold: fontBold,
    italic: fontItalic,
    boldItalic: fontBoldItalic,
  };

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

  // --------------- PORTADA ----------------
  const coverPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
  if (imageId) {
    const asset = assetsStore.getAssetById(imageId);
    if (asset) {
      const assetUrl = assetsStore.getAssetUrl(asset.filename);
      const imgDataUrl = await getImageAsDataUrl(assetUrl);
      if (imgDataUrl) {
        const img = await pdfDoc.embedJpg(imgDataUrl);
        coverPage.drawImage(img, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: pageHeightPt,
        });
      }
    }
  }

  // Añadir el título del libro en la portada
  if (title) {
    const titleText = title.toUpperCase();
    let titleFontSize = 60; // Tamaño de fuente inicial grande
    const margin = mmToPt(20);
    const maxWidth = pageWidthPt - margin * 2;

    // Ajustar el tamaño de la fuente para que el título quepa en el ancho de la página
    let textWidth = fontTitle.widthOfTextAtSize(titleText, titleFontSize);
    while (textWidth > maxWidth && titleFontSize > 12) {
      titleFontSize -= 2;
      textWidth = fontTitle.widthOfTextAtSize(titleText, titleFontSize);
    }

    const x = (pageWidthPt - textWidth) / 2; // Centrado horizontalmente
    const y = pageHeightPt * 0.6; // Posicionado verticalmente en el 60% superior

    // --- Simulación de sombra difuminada (blur) ---
    const blurRadius = 5; // Radio del difuminado
    const blurSteps = 8; // Número de capas de sombra
    const blurOpacity = 0.2; // Opacidad de cada capa de sombra

    for (let i = 0; i < blurSteps; i++) {
      const angle = (i / blurSteps) * 2 * Math.PI;
      const offsetX = Math.cos(angle) * blurRadius;
      const offsetY = Math.sin(angle) * blurRadius;
      coverPage.drawText(titleText, {
        x: x + offsetX,
        y: y + offsetY,
        font: fontTitle,
        size: titleFontSize,
        color: pdfLib.rgb(0, 0, 0),
        opacity: blurOpacity,
      });
    }
    // --- Fin de la simulación de sombra ---

    // Texto principal en blanco (se dibuja encima de la sombra)
    coverPage.drawText(titleText, {
      x: x,
      y: y,
      font: fontTitle,
      size: titleFontSize,
      color: pdfLib.rgb(1, 1, 1),
    });
  }

  // Añadir el nombre del autor en la portada
  if (author) {
    const authorText = author.toUpperCase();
    const authorFontSize = 12;
    const authorFont = fontBold;

    // Para mejorar la legibilidad, dibujamos una sombra sutil
    coverPage.drawText(authorText, {
      x: marginLeftPt + 3,
      y: marginBottomPt - 3,
      font: authorFont,
      size: authorFontSize,
      color: pdfLib.rgb(0, 0, 0),
      opacity: 0.5,
    });

    // Dibujamos el texto principal en blanco
    coverPage.drawText(authorText, {
      x: marginLeftPt,
      y: marginBottomPt,
      font: authorFont,
      size: authorFontSize,
      color: pdfLib.rgb(1, 1, 1),
    });
  }

  // --------------- LÓGICA DE CONTENIDO Y RENDERIZADO ----------------
  let currentPage: pdfLib.PDFPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
  let cursorY = pageHeightPt - marginTopPt;
  let currentColumn = 0; // 0 for left, 1 for right
  const columnX = [marginLeftPt, marginLeftPt + columnWidthPt + gapBetweenColumnsPt];

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const getParagraphNumber = (nodeId: string): string => {
    const targetNode = nodeMap.get(nodeId);
    return targetNode?.data?.paragraphNumber ? String(targetNode.data.paragraphNumber) : '???';
  };

  const formatActionText = (action: AnyAction): string => {
    switch (action.type) {
      case 'setVariable':
        return `[Se establece la variable '${action.variable}' a '${action.value}']`;
      case 'addItem':
        return `[Se añade el objeto '${action.itemId}' al inventario]`;
      case 'delItem':
        return `[Se añade el objeto '${action.itemId}' al inventario]`;
      case 'setFlag':
        return `Marca el evento ${action.flag}`;
      // [CORRECCIÓN] Añadimos un caso por defecto para que la función SIEMPRE devuelva un string.
      default:
        // Para acciones que no tienen una representación textual (como 'diceRoll'),
        // devolvemos una cadena vacía para que no se impriman en el PDF y no causen errores.
        return '';
    }
  };

  const formatChoiceText = (choice: AnyChoice): string => {
    let text = `${choice.label || 'Sigue leyendo el párrafo'}`;
    if (choice.targetNodeId) {
      const targetPara = getParagraphNumber(choice.targetNodeId);
      text += ` ${targetPara}`;
    }

    if (choice.conditions && choice.conditions.length > 0) {
      const conditionStr = choice.conditions
        .map((c: any) => `${c.variable} ${c.operator} ${c.value}`)
        .join(' y ');
      text = `Si (${conditionStr}), ${text}`;
    }
    return text;
  };

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

  // --- [FUNCIÓN DE DIBUJO MEJORADA CON JUSTIFICACIÓN E INDENTACIÓN] ---
  const drawStyledHtmlText = (
    htmlText: string,
    options: { isChoiceOrAction?: boolean; indent?: number } = {},
  ) => {
    const indent = options.indent || 0;
    const availableWidth = columnWidthPt - indent;

    // Si es un elemento de lista, dibujamos la viñeta primero
    if (indent > 0) {
      checkAndSwitchColumn();
      const bullet = '•';
      const bulletFont = fonts.bold;
      const bulletSize = fontSizeText;
      // Centramos la viñeta en el espacio de la sangría para un mejor aspecto
      const bulletX =
        columnX[currentColumn] + indent / 2 - bulletFont.widthOfTextAtSize(bullet, bulletSize) / 2;
      currentPage.drawText(bullet, {
        x: bulletX,
        y: cursorY,
        font: bulletFont,
        size: bulletSize,
        color: pdfLib.rgb(0, 0, 0),
      });
    }

    // 1. Parsear HTML a una lista plana de palabras con su estilo
    const wordParts: { text: string; font: pdfLib.PDFFont; width: number }[] = [];
    const parts = htmlText.split(/(<(?:strong|b|em|i)>|<\/(?:strong|b|em|i)>)/gi).filter(Boolean);
    const styleStack: ('normal' | 'bold' | 'italic')[] = ['normal'];

    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      if (lowerPart === '<strong>' || lowerPart === '<b>') {
        styleStack.push('bold');
        continue;
      }
      if (lowerPart === '<em>' || lowerPart === '<i>') {
        styleStack.push('italic');
        continue;
      }
      if (lowerPart === '</strong>' || lowerPart === '</b>') {
        const idx = styleStack.lastIndexOf('bold');
        if (idx > -1) styleStack.splice(idx, 1);
        continue;
      }
      if (lowerPart === '</em>' || lowerPart === '</i>') {
        const idx = styleStack.lastIndexOf('italic');
        if (idx > -1) styleStack.splice(idx, 1);
        continue;
      }

      const hasBold = styleStack.includes('bold');
      const hasItalic = styleStack.includes('italic');
      let currentFont = options.isChoiceOrAction ? fonts.italic : fonts.normal;
      if (hasBold && hasItalic) currentFont = fonts.boldItalic;
      else if (hasBold) currentFont = fonts.bold;
      else if (hasItalic) currentFont = fonts.italic;

      const words = part.split(/\s+/).filter(Boolean);
      for (const word of words) {
        wordParts.push({
          text: word,
          font: currentFont,
          width: currentFont.widthOfTextAtSize(word, fontSizeText),
        });
      }
    }

    // 2. Agrupar palabras en líneas
    const lines: (typeof wordParts)[] = [];
    let currentLine: typeof wordParts = [];
    let currentLineWidth = 0;
    const spaceWidth = fonts.normal.widthOfTextAtSize(' ', fontSizeText);

    for (const part of wordParts) {
      const potentialWidth =
        currentLineWidth + (currentLine.length > 0 ? spaceWidth : 0) + part.width;
      if (potentialWidth > availableWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [part];
        currentLineWidth = part.width;
      } else {
        currentLine.push(part);
        currentLineWidth += (currentLine.length > 1 ? spaceWidth : 0) + part.width;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // 3. Dibujar las líneas, justificando todas menos la última
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isLastLine = i === lines.length - 1;
      checkAndSwitchColumn();
      let cursorX = columnX[currentColumn] + indent;

      // No justificar la última línea, ni las de acciones/elecciones, ni las de una sola palabra
      if (isLastLine || options.isChoiceOrAction || line.length <= 1) {
        // Dibujar alineado a la izquierda
        for (const part of line) {
          currentPage.drawText(part.text, {
            x: cursorX,
            y: cursorY,
            font: part.font,
            size: fontSizeText,
            color: pdfLib.rgb(0, 0, 0),
          });
          cursorX += part.width + spaceWidth;
        }
      } else {
        // Dibujar con justificación
        const totalWordsWidth = line.reduce((sum, part) => sum + part.width, 0);
        const totalSpacing = availableWidth - totalWordsWidth;
        const gap = totalSpacing / (line.length - 1);

        for (const part of line) {
          currentPage.drawText(part.text, {
            x: cursorX,
            y: cursorY,
            font: part.font,
            size: fontSizeText,
            color: pdfLib.rgb(0, 0, 0),
          });
          cursorX += part.width + gap;
        }
      }
      cursorY -= fontSizeText * lineHeight;
    }
  };

  for (const blk of blocks) {
    const nro = String(blk.number);
    const desc = blk.description.trim();

    checkAndSwitchColumn(fontSizeNumber * lineHeight + fontSizeText * lineHeight);

    const numberWidth = fontBold.widthOfTextAtSize(nro, fontSizeNumber);
    const numberX = columnX[currentColumn] + (columnWidthPt - numberWidth) / 2;
    currentPage.drawText(nro, {
      x: numberX,
      y: cursorY,
      font: fontBold,
      size: fontSizeNumber,
      color: pdfLib.rgb(0, 0, 0),
    });

    cursorY -= fontSizeNumber * lineHeight * 1.5; // Un poco más de espacio tras el número

    if (blk.actions?.length > 0) {
      for (const action of blk.actions) {
        drawStyledHtmlText(formatActionText(action), { isChoiceOrAction: true });
      }
      cursorY -= mmToPt(2);
      checkAndSwitchColumn();
    }

    if (desc) {
      const bulletMarker = '##BULLET##';
      // Pre-procesamos el HTML para marcar los <li> y limpiar las etiquetas de lista
      const processedHtml = desc
        .replace(/<li>/gi, `${bulletMarker} `) // Marcamos cada elemento de lista
        .replace(/<\/?(ul|ol).*?>/gi, ''); // Eliminamos las etiquetas <ul> y <ol>

      const textWithNewlines = processedHtml
        .replace(/<\/p>|<\/div>|<\/li>|<br\s*\/?>/gi, '\n')
        .replace(/<p.*?>|<div>/gi, '')
        .trim();

      const paragraphs = textWithNewlines.split(/\n+/);
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          const isListItem = paragraph.startsWith(bulletMarker);
          const textToDraw = isListItem ? paragraph.substring(bulletMarker.length) : paragraph;
          const indentSize = mmToPt(5);

          drawStyledHtmlText(textToDraw, { indent: isListItem ? indentSize : 0 });

          // Añadimos un espacio extra solo después de un párrafo completo, no entre elementos de lista
          if (!isListItem) {
            cursorY -= fontSizeText * lineHeight;
            checkAndSwitchColumn();
          }
        }
      }
    }

    if (blk.choices?.length > 0) {
      // Quitamos el espacio extra que se añadía después del último párrafo de descripción
      cursorY += fontSizeText * lineHeight;
      cursorY -= mmToPt(2);
      checkAndSwitchColumn();
      for (const choice of blk.choices) {
        drawStyledHtmlText(formatChoiceText(choice), { isChoiceOrAction: true });
      }
    }

    cursorY -= mmToPt(4);
  }

  const pages = pdfDoc.getPages();
  for (let i = 1; i < pages.length; i++) {
    const p = pages[i];
    const pageNumberText = t('bookPreview.pdfContent.pageNumbering', {
      currentPage: i,
      totalPages: pages.length - 1,
    }); // Exclude cover
    const textWidth = font.widthOfTextAtSize(pageNumberText, 8);
    p.drawText(pageNumberText, {
      x: (pageWidthPt - textWidth) / 2,
      y: marginBottomPt / 2,
      size: 8,
      font,
      color: pdfLib.rgb(0.5, 0.5, 0.5),
    });
  }

  // --------------- [NUEVO] CONTRAPORTADA ----------------
  if (description) {
    const backCoverPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    const backCoverMargin = mmToPt(25);
    drawSimpleWrappedText(backCoverPage, description, {
      x: backCoverMargin,
      y: pageHeightPt - backCoverMargin,
      font: fontItalic, // Usamos cursiva para un estilo clásico de contraportada
      fontSize: 11,
      lineHeight: 11 * 1.5,
      maxWidth: pageWidthPt - backCoverMargin * 2,
      color: pdfLib.rgb(0.1, 0.1, 0.1),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function generatePdf() {
  if (!activeBook.value) {
    $q.notify({ type: 'negative', message: t('bookPreview.notifications.noActiveBook') });
    return;
  }

  isGenerating.value = true;
  pdfDataUrl.value = '';
  await new Promise((resolve) => setTimeout(resolve, 50));

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
      .filter((n) => n.data?.paragraphNumber && String(n.data?.paragraphNumber).trim() !== '')
      .map((n) => ({
        number: n.data.paragraphNumber,
        description: n.data.description || t('bookPreview.pdfContent.noDescription'),
        actions: n.actions || [],
        choices: n.choices || [],
      }));

    const blob = await buildPdfNative({
      imageId: activeBook.value.meta.imageId,
      title: activeBook.value.meta.title || t('bookPreview.pdfContent.untitled'),
      author: activeBook.value.meta.author || t('bookPreview.pdfContent.unknownAuthor'),
      description: activeBook.value.meta.description || '', // [CAMBIO]
      blocks,
      allNodes: sortedNodes,
    });

    pdfDataUrl.value = URL.createObjectURL(blob);
    $q.notify({ type: 'positive', message: 'PDF generado correctamente.' });
  } catch (err) {
    console.error('Error generando PDF nativo:', err);
    $q.notify({ type: 'negative', message: t('bookPreview.notifications.generationError') });
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped>
.fit {
  width: 100%;
  height: 100%;
}
.absolute-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
