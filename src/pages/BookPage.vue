<!-- src/pages/BookPage.vue -->
<template>
  <q-page padding>
    <!-- 1. El v-if ahora depende del ID del libro en el store -->
    <div v-if="currentBookId" class="q-pa-md">
      <!-- 2. El título viene directamente del 'meta' del store -->
      <div class="text-h4 text-white q-mb-md">{{ meta.title || 'Cargando título...' }}</div>

      <q-tabs
        v-model="tab"
        dense
        class="text-grey-5"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="graph" label="Grafo de Capítulos" />
        <q-tab name="details" label="Detalles del Libro" />
        <q-tab name="assets" label="Assets" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated class="bg-blue-grey-10 text-white">
        <q-tab-panel name="graph">
          <BookGraph />
        </q-tab-panel>

        <q-tab-panel name="details">
          <div class="text-h6">Detalles del Libro</div>
          <p>Aquí irían los detalles del libro.</p>
        </q-tab-panel>

        <q-tab-panel name="assets">
          <!-- 3. Pasamos el ID reactivo del store directamente como prop -->
          <AssetsPage :book-id="currentBookId" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <div v-else class="text-center text-h6 text-grey-6 q-mt-xl">
      <q-icon name="book" size="3em" class="q-mb-sm" />
      <div>Cargando libro o ningún libro seleccionado...</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useBookStore } from 'src/stores/book-store';
import { storeToRefs } from 'pinia'; // 1. Importamos storeToRefs
import BookGraph from 'src/components/BookGraph.vue';
import AssetsPage from 'src/pages/AssetsPage.vue';

const route = useRoute();
const bookStore = useBookStore();

// 2. Obtenemos referencias reactivas directamente del store
// 'id' se renombra a 'currentBookId' para claridad.
const { id: currentBookId, meta } = storeToRefs(bookStore);

const tab = ref('graph');

// 3. El watch ahora es más simple: solo le dice al store qué libro cargar.
// El store se encarga de actualizar el estado (currentBookId, meta, etc.).
watch(() => route.params.id, async (newId) => {
  if (typeof newId === 'string' && newId) {
    // Llamamos a la acción del store que se encarga de toda la lógica de carga
    await bookStore.loadBookById(newId);
  } else {
    // Si no hay ID en la ruta, limpiamos el estado del libro en el store
    bookStore.clearBook();
  }
}, { immediate: true }); // 'immediate: true' asegura que se ejecute al cargar la página
</script>
