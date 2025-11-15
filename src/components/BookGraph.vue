<!-- src/components/BookGraph.vue (CORREGIDO Y MEJORADO) -->
<template>
  <div v-if="isGraphReady" class="fit absolute">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :min-zoom="0.2"
      :max-zoom="4"
      class="book-graph"
      @connect="onConnect"
      @move-end="onMoveEnd"
      @pane-context-menu="onPaneContextMenu"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      multi-selection-key-code="Shift"
    >
      <Background :variant="BackgroundVariant.Dots" :gap="24" :size="1" />
      <MiniMap
        :style="{ backgroundColor: 'transparent', border: '2px solid white' }"
        :node-color="getNodeColor"
        mask-color="rgba(40, 40, 40, 0.6)"
      />
      <Controls />

      <!-- [REFACTOR] Pasamos las props de forma explícita para mayor claridad y robustez -->
      <template #node-start="props">
        <BookStartNode
          :id="props.id"
          :label="props.label"
          :selected="props.selected"
          :paragraph-number="props.data.paragraphNumber"
          :description="props.data.description"
          :color="props.data.color"
          :tags="props.data.tags"
          :image-id="props.data.imageId"
          :data="props.data"
        />
      </template>

      <template #node-story="props">
        <BookStoryNode
          :id="props.id"
          :label="props.label"
          :selected="props.selected"
          :paragraph-number="props.data.paragraphNumber"
          :description="props.data.description"
          :color="props.data.color"
          :tags="props.data.tags"
          :image-id="props.data.imageId"
          :data="props.data"
        />
      </template>

      <template #node-default="props">
        <BookStoryNode
          :id="props.id"
          :label="props.label"
          :selected="props.selected"
          :paragraph-number="props.data.paragraphNumber"
          :description="props.data.description"
          :color="props.data.color"
          :tags="props.data.tags"
          :image-id="props.data.imageId"
          :data="props.data"
        />
      </template>

      <template #node-end="props">
        <BookEndNode
          :id="props.id"
          :label="props.label"
          :selected="props.selected"
          :paragraph-number="props.data.paragraphNumber"
          :description="props.data.description"
          :color="props.data.color"
          :tags="props.data.tags"
          :image-id="props.data.imageId"
          :data="props.data"
        />
      </template>
      <template #node-location="props">
        <BookLocationNode v-bind="props" />
      </template>
    </VueFlow>

    <!-- El resto del componente no necesita cambios -->
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
        @delete="handleNodeDelete"
      />
    </Transition>
    <Transition name="slide-fade-right">
      <EdgeEditorPanel
        v-if="isEdgeEditorOpen"
        :edge="selectedEdge"
        class="node-editor-container"
        @close="handleEdgeEditorClose"
        @save="handleEdgeEditorSave"
        @delete="handleEdgeDelete"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
// CSS imports
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

import { ref, nextTick, onMounted, computed } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import type { Connection, NodeMouseEvent, Viewport } from '@vue-flow/core';
import { Background, BackgroundVariant } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { useBookStore } from 'src/stores/book-store';
import { useNodesStore } from 'src/stores/nodes-store';
import { storeToRefs } from 'pinia';

import ContextMenu from './ContextMenu.vue';
import type { MenuItem } from './ContextMenu.vue';

import BookStartNode from './BookStartNode.vue';
import BookStoryNode from './BookStoryNode.vue';
import BookEndNode from './BookEndNode.vue';
import BookLocationNode from './BookLocationNode.vue';
import NodeEditorPanel from './NodeEditorPanel.vue';
import EdgeEditorPanel from './EdgeEditorPanel.vue';
import type { BookEdge, BookNode } from 'src/stores/types';

const nodesStore = useNodesStore();
const { nodes, edges } = storeToRefs(nodesStore);

// Desestructuramos las funciones que vamos a usar a lo largo del componente.
const { setViewport, project, onInit } = useVueFlow();

const isMenuOpen = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
const contextMenuItems = computed<MenuItem[]>(() => [
  { action: 'add_story', label: 'Añadir Párrafo', icon: 'add_circle' },
  { action: 'add_location', label: 'Añadir Localización', icon: 'map' },
  { action: 'add_end', label: 'Añadir Final', icon: 'flag' },
]);
const menuProjectedPosition = ref<{ x: number; y: number } | null>(null);

const isGraphReady = ref(false);
const isEditorOpen = ref(false);
const selectedNode = ref<BookNode | null>(null);
const isEdgeEditorOpen = ref(false);
const selectedEdge = ref<BookEdge | null>(null);

onMounted(() => {
  // Usamos nextTick para asegurarnos de que el DOM está listo antes de cambiar la variable.
  nextTick(() => {
    isGraphReady.value = true;
  });
});

onInit(() => {
  console.log('[LOG BookGraph] VueFlow instance is ready via onInit hook.');
  const bookStore = useBookStore();
  const initialViewport = bookStore.getViewport();
  if (initialViewport) {
    setViewport(initialViewport);
  }
});

function getNodeColor(node: BookNode): string {
  return node.data.color || '#78909c';
}

function onConnect(params: Connection) {
  nodesStore.addConnection(params);
}

function onMoveEnd(event: Viewport | undefined) {
  if (event) {
    nodesStore.updateViewport(event);
  }
}

function onNodeClick(event: NodeMouseEvent) {
  selectedNode.value = event.node as BookNode;
  isEditorOpen.value = true;
  isEdgeEditorOpen.value = false;
}

function onEdgeClick(event: { edge: BookEdge }) {
  selectedEdge.value = event.edge;
  isEdgeEditorOpen.value = true;
  isEditorOpen.value = false;
}

function handleEdgeDelete(edgeId: string) {
  nodesStore.deleteEdge(edgeId);
  handleEdgeEditorClose(); // Cierra el panel después de borrar
}

function handleEditorClose() {
  isEditorOpen.value = false;
  selectedNode.value = null;
}

function handleEdgeEditorClose() {
  isEdgeEditorOpen.value = false;
  selectedEdge.value = null;
}

function handleEditorSave(payload: {
  nodeId: string;
  updates: Partial<Omit<BookNode, 'id' | 'position'>>;
}) {
  nodesStore.updateNode(payload.nodeId, payload.updates);
  handleEditorClose();
}

function handleEdgeEditorSave(payload: {
  edgeId: string;
  updates: Partial<Omit<BookEdge, 'id'>>;
}) {
  nodesStore.updateEdge(payload.edgeId, payload.updates);
  handleEdgeEditorClose();
}

function handleNodeDelete(nodeId: string) {
  nodesStore.deleteNode(nodeId);
  handleEditorClose();
}

function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault();

  const projectedPosition = project({
    x: event.clientX,
    y: event.clientY,
  });

  menuProjectedPosition.value = projectedPosition;
  menuPosition.value = { x: event.clientX, y: event.clientY };
  isMenuOpen.value = true;
  isEditorOpen.value = false;
  isEdgeEditorOpen.value = false;
}

function handleMenuAction(actionId: string) {
  if (!menuProjectedPosition.value) {
    console.error("handleMenuAction was called but no projected position was found.");
    isMenuOpen.value = false;
    return;
  }

  let nodeType = '';
  if (actionId === 'add_story') {
    nodeType = 'story';
  } else if (actionId === 'add_end') {
    nodeType = 'end';
  } else if (actionId === 'add_location') { // [NUEVO]
    nodeType = 'location';
  }

  if (nodeType) {
    nodesStore.createNode({
      position: menuProjectedPosition.value,
      type: nodeType,
    });
  }

  isMenuOpen.value = false;
  menuProjectedPosition.value = null;
}

function clearSelection() {
  selectedNode.value = null;
  selectedEdge.value = null;
  console.log('[BookGraph] Selección limpiada.'); // Añadimos un log para depurar
}

defineExpose({
  clearSelection,
});
</script>

<style lang="scss" scoped>
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
.vue-flow__selection {
  background: rgba(0, 110, 255, 0.15);
  border: 1px solid rgba(0, 110, 255, 0.8);
  border-radius: 4px;
}
</style>
