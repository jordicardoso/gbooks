<!-- src/components/BookPreview.vue (CORREGIDO) -->
<template>
  <!-- 1. Quitamos el padding 'q-pa-md' de aquí para que el componente ocupe todo el espacio -->
  <div class="col column no-wrap bg-grey-10 text-white">
    <!-- 2. Añadimos el padding 'q-pa-md' aquí, solo para la cabecera -->
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
    <!-- 3. Quitamos la clase 'full-height' que era innecesaria -->
    <div class="col scroll relative-position">
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
// El script no necesita cambios
import { ref } from 'vue';
import { useNodesStore } from 'src/stores/nodes-store';
import { useBookStore } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';
import jsPDF from 'jspdf';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

const isGenerating = ref(false);
const pdfDataUrl = ref('');

async function generatePdf() {
  if (!activeBook.value) {
    $q.notify({ type: 'negative', message: 'No hay un libro activo para generar el PDF.' });
    return;
  }

  isGenerating.value = true;
  pdfDataUrl.value = '';

  // Usamos un timeout para permitir que la UI se actualice y muestre el spinner
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const doc = new jsPDF({
      orientation: 'p', // portrait
      unit: 'pt',       // points
      format: 'a4'      // A4 size
    });

    const pageMargin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (pageMargin * 2);
    let yPos = pageMargin;

    // 1. Página de Título
    doc.setFontSize(24);
    doc.text(activeBook.value.meta.title, pageWidth / 2, yPos + 20, { align: 'center' });
    yPos += 40;
    doc.setFontSize(16);
    doc.text(`por ${activeBook.value.meta.author}`, pageWidth / 2, yPos + 20, { align: 'center' });
    doc.addPage();
    yPos = pageMargin;

    // 2. Ordenar los nodos por número de párrafo
    const sortedNodes = [...nodes.value].sort((a, b) => a.data.paragraphNumber - b.data.paragraphNumber);

    // 3. Renderizar cada nodo
    for (const node of sortedNodes) {
      // Añadir cabecera del párrafo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const paragraphHeader = `Párrafo ${node.data.paragraphNumber}`;
      doc.text(paragraphHeader, pageMargin, yPos);
      yPos += 20;

      // Renderizar el contenido HTML del QEditor
      doc.setFont('times', 'normal');
      doc.setFontSize(12);

      // jsPDF necesita un elemento HTML para renderizar. Creamos uno temporal.
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = node.data.description;
      // Estilos básicos para que jsPDF los interprete mejor
      tempDiv.style.width = `${contentWidth}pt`;
      tempDiv.style.fontFamily = 'Times-Roman';
      tempDiv.style.fontSize = '12pt';

      // El método .html() es asíncrono y maneja el paginado automático
      await doc.html(tempDiv, {
        x: pageMargin,
        y: yPos,
        width: contentWidth,
        windowWidth: contentWidth,
        autoPaging: 'text',
        margin: [0, pageMargin, pageMargin, pageMargin],
        callback: (doc) => {
          // Después de añadir el contenido, actualizamos la posición Y para el siguiente nodo
          yPos = doc.internal.pageSize.getHeight() + 1; // Forzamos un salto de página virtual
        }
      });
    }

    // 4. Añadir números de página en el pie
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }

    // 5. Generar la URL de datos para el iframe
    pdfDataUrl.value = doc.output('datauristring');

  } catch (error) {
    console.error("Error generando el PDF:", error);
    $q.notify({ type: 'negative', message: 'Ocurrió un error al generar el PDF.' });
  } finally {
    isGenerating.value = false;
  }
}
</script>
