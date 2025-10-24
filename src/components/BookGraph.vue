<!-- src/components/BookGraph.vue -->
<template>
  <VueFlow
    v-model:nodes="nodes"
    v-model:edges="edges"
    v-model:viewport="viewport"
    :default-viewport="bookStore.activeBook?.viewport"
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
// CSS imports (están correctos)
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
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const viewport = ref<Viewport>({ x: 0, y: 0, zoom: 1 });

watch(
  () => bookStore.activeBook,
  (newBook) => {
    if (newBook) {
      console.log('[BookGraph] Sincronizando grafo desde el store...');
      nodes.value = newBook.chapters.map((n) => ({ ...n }));
      edges.value = newBook.edges.map((e) => ({ ...e }));
      viewport.value = newBook.viewport;
    } else {
      nodes.value = [];
      edges.value = [];
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

// --- SOLUCIÓN: Llamar a useVueFlow sin argumentos ---
// Se conectará automáticamente al contexto del componente <VueFlow>
const { onConnect, addEdges } = useVueFlow();
// --- FIN SOLUCIÓN ---

onConnect((params: Connection) => {
  addEdges([params]);
});

const debouncedSave = debounce(() => {
  if (bookStore.isDirty) {
    console.log('[BookGraph] Auto-guardando cambios...');
    void bookStore.saveCurrentBook();
  }
}, 500);

function onNodesChange(changes: NodeChange[]) {
  bookStore.updateNodes(nodes.value);
  debouncedSave();
}

function onEdgesChange(changes: EdgeChange[]) {
  bookStore.updateEdges(edges.value);
  debouncedSave();
}

function onMoveEnd() {
  bookStore.updateViewport(viewport.value);
  debouncedSave();
}
</script>

<style></style>
