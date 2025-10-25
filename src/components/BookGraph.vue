<!-- src/components/BookGraph.vue -->
<template>
  <VueFlow
    v-model:nodes="nodes"
    v-model:edges="edges"
    v-model:viewport="viewport"
    :min-zoom="0.2"
    :max-zoom="4"
    @nodes-change="onNodesChange"
    @edges-change="onEdgesChange"
    @connect="onConnect"
    @move-end="onMoveEnd"
  >
    <Background />
    <MiniMap />
    <Controls />
  </VueFlow>
</template>

<script setup lang="ts">
// CSS imports
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

import { ref, watch } from 'vue';
import {
  VueFlow,
  useVueFlow,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  Viewport,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { useBookStore } from 'src/stores/book-store';
import { debounce } from 'quasar';

const bookStore = useBookStore();
const { onConnect, addEdges } = useVueFlow();

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const viewport = ref<Viewport>({ x: 0, y: 0, zoom: 1 });

// --- REFACTORIZADO ---
// Este watcher ahora solo reacciona cuando el libro activo es reemplazado por otro,
// no a cada pequeño cambio dentro del libro. Es mucho más eficiente.
watch(
  () => bookStore.activeBook,
  (newBook) => {
    if (newBook) {
      console.log('[BookGraph] Libro cambiado. Sincronizando grafo desde el store...');
      // Sincronizamos los datos del grafo desde el store al componente
      nodes.value = newBook.chapters.map((n) => ({ ...n }));
      edges.value = newBook.edges.map((e) => ({ ...e }));
      // Asignamos el viewport guardado o uno por defecto
      viewport.value = newBook.viewport || { x: 0, y: 0, zoom: 1 };
    } else {
      // Si no hay libro, vaciamos el grafo
      nodes.value = [];
      edges.value = [];
    }
  },
  {
    // Ya no se necesita 'deep: true'. 'immediate: true' asegura que se cargue al inicio.
    immediate: true,
  }
);

onConnect((params: Connection) => {
  addEdges([params]);
  // La llamada a onEdgesChange se encargará de guardar
});

const debouncedSave = debounce(() => {
  // Solo guardamos si hay cambios pendientes
  if (bookStore.isDirty) {
    console.log('[BookGraph] Auto-guardando cambios...');
    void bookStore.saveCurrentBook();
  }
}, 1000); // Aumentado a 1 segundo para no guardar tan agresivamente

// Los eventos 'on...Change' ya no provocan un bucle gracias a la eliminación del 'deep watch'.
// Su función es actualizar el store con los datos locales del grafo.
function onNodesChange(changes: NodeChange[]) {
  bookStore.updateNodes(nodes.value);
  bookStore.setDirty();
  debouncedSave();
}

function onEdgesChange(changes: EdgeChange[]) {
  bookStore.updateEdges(edges.value);
  bookStore.setDirty();
  debouncedSave();
}

function onMoveEnd() {
  // Solo actualizamos y guardamos si el viewport realmente ha cambiado
  if (
    bookStore.activeBook &&
    (bookStore.activeBook.viewport.x !== viewport.value.x ||
      bookStore.activeBook.viewport.y !== viewport.value.y ||
      bookStore.activeBook.viewport.zoom !== viewport.value.zoom)
  ) {
    bookStore.updateViewport(viewport.value);
    bookStore.setDirty();
    debouncedSave();
  }
}
</script>
