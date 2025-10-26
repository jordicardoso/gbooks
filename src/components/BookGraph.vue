<!-- src/components/BookGraph.vue -->
<template>
  <!-- 1. Contenedor relativo para posicionar elementos sobre el grafo -->
  <!--<div style="width: 100%; height: 100%; position: relative">-->
  <div class="fit absolute">
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
      @pane-context-menu="onPaneContextMenu"
      @node-click="onNodeClick"
    >
      <Background />
      <MiniMap />
      <Controls />

      <template #node-start="props">
        <BookStartNode v-bind="props" />
      </template>
      <template #node-story="props">
        <BookStoryNode v-bind="props" />
      </template>
      <template #node-end="props">
        <BookEndNode v-bind="props" />
      </template>
    </VueFlow>

    <!-- 2. Nuestro menú contextual personalizado -->
    <ContextMenu
      :show="isMenuOpen"
      :position="menuPosition"
      :items="contextMenuItems"
      @close="isMenuOpen = false"
      @action="handleMenuAction"
    />
    <Transition name="slide-fade-right">
      <NodeEditorPanel
        v-if="isEditorOpen"
        :node="selectedNode"
        class="node-editor-container"
        @close="handleEditorClose"
        @save="handleEditorSave"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
// CSS imports
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

import { ref, watch, nextTick, computed } from 'vue';
import {
  VueFlow,
  useVueFlow,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  Viewport,
  NodeMouseEvent,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { useBookStore } from 'src/stores/book-store';
import { debounce } from 'quasar';
import ContextMenu, { type MenuItem } from './ContextMenu.vue';
import BookStartNode from './BookStartNode.vue';
import BookStoryNode from './BookStoryNode.vue';
import BookEndNode from './BookEndNode.vue';
import NodeEditorPanel from './NodeEditorPanel.vue';
import { BookNode } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

const bookStore = useBookStore();
const assetsStore = useAssetsStore();

const { onConnect, addEdges, project } = useVueFlow();

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const viewport = ref<Viewport>({ x: 0, y: 0, zoom: 1 });

// --- 5. State para el menú contextual ---
const isMenuOpen = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
// --- 6. State para el panel edición ---
const isEditorOpen = ref(false);
const selectedNode = ref<BookNode | null>(null);
// Guardamos el evento para tener acceso a las coordenadas al crear el nodo
const lastPaneMenuEvent = ref<MouseEvent | null>(null);

const hasStartNode = computed(() => nodes.value.some((node) => node.type === 'start'));

const contextMenuItems = computed<MenuItem[]>(() => {
  if (!hasStartNode.value) {
    return [
      {
        action: 'add-start-node',
        label: 'Crear Nodo Inicial',
        icon: 'play_arrow',
        color: 'positive',
      },
    ];
  }

  return [
    {
      action: 'add-story-node',
      label: 'Crear Nodo de Historia',
      icon: 'article',
    },
    {
      action: 'add-end-node',
      label: 'Crear Nodo Final',
      icon: 'flag',
      color: 'negative',
    },
  ];
});

// --- Watcher y Lógica del Grafo (sin cambios) ---
watch(
  () => bookStore.activeBook,
  (newBook) => {
    if (newBook) {
      nodes.value = newBook.chapters;
      edges.value = newBook.edges;
      viewport.value = newBook.viewport || { x: 0, y: 0, zoom: 1 };
    } else {
      nodes.value = [];
      edges.value = [];
    }
  },
  {
    immediate: true,
    deep: true,
  }
);

onConnect((params: Connection) => {
  addEdges([params]);
  // onEdgesChange se encargará de guardar
});

const debouncedSave = debounce(() => {
  if (bookStore.isDirty) {
    console.log('[BookGraph] Auto-guardando cambios...');
    void bookStore.saveCurrentBook();
  }
}, 1000);

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

function onNodeClick(event: NodeMouseEvent) {
  // Asegurarnos de que el nodo existe en nuestro store antes de abrir
  const nodeInData = bookStore.activeBook?.chapters.find(n => n.id === event.node.id);
  if (nodeInData) {
    selectedNode.value = nodeInData;
    isEditorOpen.value = true;
    isMenuOpen.value = false; // Cerramos el menú contextual si estuviera abierto
  }
}

function handleEditorClose() {
  isEditorOpen.value = false;
  selectedNode.value = null;
}

function handleEditorSave({ nodeId, updates }: { nodeId: string; updates: Partial<BookNode> }) {
  // 1. Actualiza el store. Esta sigue siendo la fuente de la verdad.
  bookStore.updateNodeData({ nodeId, updates });

  // 2. Ahora, sincroniza el estado local del grafo (`nodes.value`) con el store
  //    para forzar la reactividad inmediata en Vue Flow.
  if (bookStore.activeBook) {
    const nodeIndex = nodes.value.findIndex(n => n.id === nodeId);
    if (nodeIndex > -1) {
      // Busca el nodo completamente actualizado desde el store
      const updatedNodeFromStore = bookStore.activeBook.chapters.find(n => n.id === nodeId);
      if (updatedNodeFromStore) {
        // Reemplaza el nodo en el array local.
        // Esto es crucial para que Vue Flow detecte el cambio y re-renderice el nodo.
        nodes.value[nodeIndex] = updatedNodeFromStore;
      }
    }
  }
  // El debouncedSave se activará automáticamente porque el store se marca como 'dirty'
}

/**
 * Se dispara al hacer clic derecho en el panel del grafo.
 */
function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault(); // Prevenir el menú contextual nativo del navegador
  isMenuOpen.value = false; // Cerrar cualquier menú anterior

  // Guardar el evento para usar sus coordenadas más tarde
  lastPaneMenuEvent.value = event;

  // Usamos nextTick para asegurar que el DOM se actualice antes de posicionar y mostrar el menú
  void nextTick(() => {
    menuPosition.value = { x: event.clientX, y: event.clientY };
    isMenuOpen.value = true;
  });
}

/**
 * Maneja las acciones emitidas por el componente ContextMenu.
 */
function handleMenuAction(action: string) {
  if (!lastPaneMenuEvent.value) return;

  const flowPosition = project({
    x: lastPaneMenuEvent.value.clientX,
    y: lastPaneMenuEvent.value.clientY,
  });

  let nodeType = '';
  if (action === 'add-start-node') nodeType = 'start';
  if (action === 'add-story-node') nodeType = 'story';
  if (action === 'add-end-node') nodeType = 'end';

  if (nodeType) {
    bookStore.createNode({
      position: flowPosition,
      type: nodeType,
    });
  }
}
</script>
<style lang="scss" scoped>
.node-editor-container {
  position: absolute;
  top: 10px;
  right: 10px;
  bottom: 10px;
  width: 350px;
  z-index: 10; /* Asegura que esté por encima del grafo */
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2), 0 6px 6px rgba(0, 0, 0, 0.25);
}
/*
  Clases para la transición de entrada y salida.
  Definimos la duración y el tipo de curva de la animación.
*/
.slide-fade-right-enter-active,
.slide-fade-right-leave-active {
  transition: all 0.4s ease-out;
}

/*
  Estado inicial de la entrada (antes de aparecer) y
  estado final de la salida (cuando ya ha desaparecido).
  - Lo movemos 100% de su ancho hacia la derecha (fuera de la pantalla).
  - Lo hacemos completamente transparente.
*/
.slide-fade-right-enter-from,
.slide-fade-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
