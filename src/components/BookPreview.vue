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
import { ref } from 'vue';
import { useNodesStore } from 'src/stores/nodes-store';
import { useBookStore } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';
import { storeToRefs } from 'pinia';
import html2pdf from 'html2pdf.js';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

const isGenerating = ref(false);
const pdfDataUrl = ref('');

async function waitForRender(ms = 100) {
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, ms));
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

async function generatePdf() {
  if (!activeBook.value) {
    $q.notify({ type: 'negative', message: 'No hay un libro activo para generar el PDF.' });
    return;
  }

  isGenerating.value = true;
  pdfDataUrl.value = '';
  await new Promise(resolve => setTimeout(resolve, 50));

  const container = document.createElement('div');
  try {
    console.log('[PDF Generation] Proceso iniciado.');

    container.style.top = '0';
    container.style.left = '100vw'; // Posiciona fuera de la pantalla
    container.style.width = '210mm';
    container.style.background = 'white';

    document.body.appendChild(container);

    const styles = `
      <style>
        body, html { margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; color: black; background-color: white; }
        .page-content { padding: 20mm 20mm 0 20mm; }
        .salto-pagina { page-break-after: always; }

        /* --- PORTADA CON IMAGEN A PÁGINA COMPLETA --- */
        .portada-container {
          position: relative;
          width: 210mm;
          height: 297mm;
          background-color: #111;
          overflow: hidden;
        }
        .cover-image-full {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover;
          z-index: 0;
        }
        .portada-container::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(0,0,0,0.7) 100%);
            z-index: 1;
        }
        .portada-texto {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20mm;
        }
        .portada-texto .titulo-principal {
          font-size: 48pt;
          color: white;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.9);
          margin-bottom: 20px;
        }
        .portada-texto .autor {
          font-size: 20pt;
          color: #f0f0f0;
          text-shadow: 1px 1px 6px rgba(0,0,0,0.9);
          line-height: 1.4;
        }

        /* --- PORTADA SIN IMAGEN (Fallback) --- */
        .portada-sin-imagen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 257mm;
        }
        .portada-sin-imagen .titulo-principal {
            font-size: 40pt;
            margin-bottom: 20px;
            text-align: center;
            color: black;
        }
        .portada-sin-imagen .autor {
            font-size: 16pt;
            color: #444;
            text-align: center;
            line-height: 1.4;
        }

        /* --- CONTENIDO DEL LIBRO --- */
        .seccion-parrafo { margin-bottom: 30px; page-break-inside: avoid; }
        .numero-parrafo { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 15px; }
        .descripcion-parrafo { font-size: 12pt; line-height: 1.6; text-align: justify; }
      </style>
    `;

    let coverPageHtml = '';
    let hasCoverImage = false;
    const imageId = activeBook.value.meta.imageId;
    // --- PRIMERA Y ÚNICA DECLARACIÓN DE authorHtml ---
    const authorHtml = (activeBook.value.meta.author || 'Autor Desconocido').replace(/\n/g, '<br />');

    if (imageId) {
      const asset = assetsStore.getAssetById(imageId);
      if (asset) {
        const assetUrl = assetsStore.getAssetUrl(asset.filename);
        const imageDataUrl = await getImageAsDataUrl(assetUrl);
        if (imageDataUrl) {
          hasCoverImage = true;
          coverPageHtml = `
            <div class="portada-container">
              <img src="${imageDataUrl}" class="cover-image-full" />
              <div class="portada-texto">
                <div class="titulo-principal">${activeBook.value.meta.title || 'Sin Título'}</div>
                <div class="autor">${authorHtml}</div>
              </div>
            </div>
          `;
        }
      }
    }

    if (!hasCoverImage) {
      coverPageHtml = `
        <div class="page-content">
          <div class="portada-sin-imagen">
            <div class="titulo-principal">${activeBook.value.meta.title || 'Sin Título'}</div>
            <div class="autor">${authorHtml}</div>
          </div>
        </div>
      `;
    }

    const sortedNodes = [...nodes.value].sort((a, b) => {
      const numA = parseFloat(String(a.data?.paragraphNumber ?? '').trim());
      const numB = parseFloat(String(b.data?.paragraphNumber ?? '').trim());
      if (isNaN(numA) && isNaN(numB)) return 0;
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    let bookContent = '';
    for (const node of sortedNodes) {
      const paragraphNumber = node.data?.paragraphNumber;
      const description = node.data?.description || '(Sin descripción)';
      if (!paragraphNumber || String(paragraphNumber).trim() === '') continue;
      bookContent += `
        <div class="seccion-parrafo">
          <div class="numero-parrafo">${paragraphNumber}</div>
          <div class="descripcion-parrafo">${description}</div>
        </div>
      `;
    }

    // --- CORRECCIÓN: Eliminar la segunda declaración de authorHtml y corregir la estructura de finalHtml ---
    const finalHtml = `
      ${styles}
      ${coverPageHtml}
      <div class="page-content">
        ${bookContent}
      </div>
    `;

    container.innerHTML = finalHtml;

    await waitForRender();

    console.log('[PDF Generation] Contenido renderizado. Iniciando captura...');

    const opt = {
      margin: 0,
      filename: `${activeBook.value.meta.title || 'libro'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    const worker = html2pdf().set(opt).from(container);

    await worker.toPdf().get('pdf').then(pdf => {
      const totalPages = pdf.internal.getNumberOfPages();
      console.log(`[PDF Generation] El PDF se generó con ${totalPages} páginas.`);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // No numeramos la portada
      for (let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        // Ajustamos la numeración para que empiece en 1 en la segunda página
        pdf.text(`Página ${i - 1} de ${totalPages - 1}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      }
    });

    const pdfBlob = await worker.outputPdf('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    pdfDataUrl.value = blobUrl;

    console.log('[PDF Generation] Proceso finalizado con éxito.');

  } catch (error) {
    console.error('[PDF Generation] Ocurrió un error catastrófico:', error);
    $q.notify({ type: 'negative', message: 'Ocurrió un error al generar el PDF.' });
  } finally {
    // Asegurarse de que el contenedor se elimina siempre
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    isGenerating.value = false;
  }
}
</script>
