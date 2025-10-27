<!-- src/components/BookGraph.vue -->
<template>
  <div class="fit absolute">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :min-zoom="0.2"
      :max-zoom="4"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @connect="onConnect"
      @move-end="onMoveEnd"
      @pane-context-menu="onPaneContextMenu"
      @node-click="onNodeClick"
      @move="onMove"
    >
      <!-- ... componentes de VueFlow ... -->
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

import { ref, nextTick, computed } from 'vue';
import {
  VueFlow,
  useVueFlow,
  Connection,
  NodeChange,
  EdgeChange,
  NodeMouseEvent,
  applyNodeChanges, // ¡Importado!
  applyEdgeChanges, // ¡Importado!
  FlowEvents,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { useNodesStore } from 'src/stores/nodes-store';
import { storeToRefs } from 'pinia'; // ¡Importante!
import ContextMenu, { type MenuItem } from './ContextMenu.vue';
import BookStartNode from './BookStartNode.vue';
import BookStoryNode from './BookStoryNode.vue';
import BookEndNode from './BookEndNode.vue';
import NodeEditorPanel from './NodeEditorPanel.vue';
import { type BookNode } from 'src/stores/types';

const nodesStore = useNodesStore();

// --- LA MAGIA DE storeToRefs ---
// `nodes` y `edges` ahora son refs reactivas directamente conectadas al store.
// Cuando el store cambie, estos refs se actualizarán automáticamente.
const { nodes, edges, viewport } = storeToRefs(nodesStore);

const { addEdges, project } = useVueFlow();

// --- State para la UI (sin cambios) ---
const isMenuOpen = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
const isEditorOpen = ref(false);
const selectedNode = ref<BookNode | null>(null);
const lastPaneMenuEvent = ref<MouseEvent | null>(null);

// --- Propiedades Computadas (ahora leen directamente del ref del store) ---
const hasStartNode = computed(() => nodes.value.some((node) => node.type === 'start'));

const contextMenuItems = computed<MenuItem[]>(() => {
  if (!hasStartNode.value) {
    return [{ action: 'add-start-node', label: 'Crear Nodo Inicial', icon: 'play_arrow', color: 'positive' }];
  }
  return [
    { action: 'add-story-node', label: 'Crear Nodo de Historia', icon: 'article' },
    { action: 'add-end-node', label: 'Crear Nodo Final', icon: 'flag', color: 'negative' },
  ];
});

// --- Ya no se necesita el `watch` en `bookStore.activeBook` ---

// --- Handlers de Vue Flow (ahora llaman a acciones del store) ---
function onNodesChange(changes: NodeChange[]) {
  const newNodes = applyNodeChanges(changes, nodes.value);
  nodesStore.updateNodes(newNodes);
}

function onEdgesChange(changes: EdgeChange[]) {
  const newEdges = applyEdgeChanges(changes, edges.value);
  nodesStore.updateEdges(newEdges);
}

function onConnect(params: Connection) {
  addEdges([params]); // Esto dispara onEdgesChange, que actualiza el store.
}

function onMove(flowEvent: FlowEvents['move']) {
  viewport.value = flowEvent;
}

function onMoveEnd() {
  nodesStore.updateViewport(viewport.value);
}

// --- Handlers de UI (simplificados) ---
function onNodeClick(event: NodeMouseEvent) {
  selectedNode.value = event.node as BookNode;
  isEditorOpen.value = true;
  isMenuOpen.value = false;
}

function handleEditorClose() {
  isEditorOpen.value = false;
  selectedNode.value = null;
}

function handleEditorSave({ nodeId, updates }: { nodeId: string; updates: Partial<BookNode['data']> }) {
  nodesStore.updateNode(nodeId, updates);
}

function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault();
  isMenuOpen.value = false;
  lastPaneMenuEvent.value = event;
  void nextTick(() => {
    menuPosition.value = { x: event.clientX, y: event.clientY };
    isMenuOpen.value = true;
  });
}

function handleMenuAction(action: string) {
  if (!lastPaneMenuEvent.value) return;
  const flowPosition = project({ x: lastPaneMenuEvent.value.clientX, y: lastPaneMenuEvent.value.clientY });
  const nodeType = action.replace('add-', '').replace('-node', '');

  if (nodeType) {
    // La llamada correcta que ya habías implementado
    nodesStore.createNode({ position: flowPosition, type: nodeType });
  }
}
</script>

<style lang="scss" scoped>
/* ... tus estilos ... */
.node-editor-container {
  position: absolute;
  top: 10px;
  right: 10px;
  bottom: 10px;
  width: 350px;
  z-index: 10;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2), 0 6px 6px rgba(0, 0, 0, 0.25);
}
.slide-fade-right-enter-active,
.slide-fade-right-leave-active {
  transition: all 0.4s ease-out;
}
.slide-fade-right-enter-from,
.slide-fade-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
