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
        <BookStartNode
          :label="props.label"
          :description="props.data.description"
          :color="props.data.color"
          :imageId="props.data.imageId"
          :tags="props.data.tags"
          :selected="props.selected"
        />
      </template>

      <template #node-story="props">
        <BookStoryNode
          :label="props.label"
          :description="props.data.description"
          :color="props.data.color"
          :imageId="props.data.imageId"
          :tags="props.data.tags"
          :selected="props.selected"
        />
      </template>

      <template #node-end="props">
        <BookEndNode
          :label="props.label"
          :description="props.data.description"
          :color="props.data.color"
          :imageId="props.data.imageId"
          :tags="props.data.tags"
          :selected="props.selected"
        />
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
// El resto del script no necesita cambios, ya que la lógica es correcta.
// CSS imports
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

import { ref, nextTick, computed } from 'vue';
import { VueFlow, useVueFlow, applyNodeChanges, applyEdgeChanges } from '@vue-flow/core';
import type { Connection, NodeChange, EdgeChange, NodeMouseEvent, FlowEvents, Viewport } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { useNodesStore } from 'src/stores/nodes-store';
import { storeToRefs } from 'pinia';
import ContextMenu from './ContextMenu.vue';
import type { MenuItem } from './ContextMenu.vue';
import BookStartNode from './BookStartNode.vue';
import BookStoryNode from './BookStoryNode.vue';
import BookEndNode from './BookEndNode.vue';
import NodeEditorPanel from './NodeEditorPanel.vue';
import type { BookNode } from 'src/stores/types';

const nodesStore = useNodesStore();
const { nodes, edges, viewport } = storeToRefs(nodesStore);
const { project } = useVueFlow();

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

function onNodesChange(changes: NodeChange[]) {
  nodesStore.applyNodeChanges(changes);
}

function onEdgesChange(changes: EdgeChange[]) {
  nodesStore.applyEdgeChanges(changes);
}

function onConnect(params: Connection) {
  nodesStore.addConnection(params);
}

function onMoveEnd(viewport: Viewport | undefined) {
  if (viewport) {
    nodesStore.updateViewport(viewport);
  }
}


function onMove(flowEvent: FlowEvents['move']) {
  viewport.value = flowEvent;
}

// --- Handlers de UI (simplificados) ---
function onNodeClick(event: NodeMouseEvent) {
  // El `event.node` aquí es el objeto aplanado original, por eso el editor funciona.
  selectedNode.value = event.node as BookNode;
  isEditorOpen.value = true;
  isMenuOpen.value = false;
}

function handleEditorClose() {
  isEditorOpen.value = false;
  selectedNode.value = null;
}

function handleEditorSave(payload: {
  nodeId: string;
  updates: Partial<Omit<BookNode, 'id' | 'position'>>;
}) {
  nodesStore.updateNode(payload.nodeId, payload.updates);

  handleEditorClose();
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
