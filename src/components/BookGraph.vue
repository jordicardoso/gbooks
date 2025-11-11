<!-- src/components/BookGraph.vue -->
<template>
  <div v-if="isGraphReady" class="fit absolute">
    <VueFlow
      @load="onLoad"
      v-model:nodes="nodes"
      v-model:edges="edges"
      :min-zoom="0.2"
      :max-zoom="4"
      @connect="onConnect"
      @move-end="onMoveEnd"
      @pane-context-menu="onPaneContextMenu"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
    >
      <Background />
      <MiniMap
        :style="{ backgroundColor: 'transparent', border: '2px solid white' }"
        :node-color="getNodeColor"
        mask-color="rgba(40, 40, 40, 0.6)"
      />
      <Controls />

      <template #node-start="props">
        <BookStartNode
          :id="props.id"
          v-bind="props.data"
          :label="props.label"
          :selected="props.selected"
        />
      </template>

      <template #node-story="props">
        <BookStoryNode
          :id="props.id"
          v-bind="props.data"
          :label="props.label"
          :selected="props.selected"
        />
      </template>

      <template #node-default="props">
        <BookStoryNode
          :id="props.id"
          v-bind="props.data"
          :label="props.label"
          :selected="props.selected"
        />
      </template>


      <template #node-end="props">
        <BookEndNode
          :id="props.id"
          v-bind="props.data"
          :label="props.label"
          :selected="props.selected"
        />
      </template>
    </VueFlow>

    <!--<ContextMenu
      :show="isMenuOpen"
      :position="menuPosition"
      :items="contextMenuItems"
      @close="isMenuOpen = false"
      @action="handleMenuAction"
    />-->
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
import '@vue-flow/minimap/dist/style.css';

import { watch, ref, nextTick, onMounted } from 'vue';
import { VueFlow } from '@vue-flow/core';
import type { Connection, NodeMouseEvent, VueFlowInstance, Viewport } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { useNodesStore } from 'src/stores/nodes-store';
import { storeToRefs } from 'pinia';
//import ContextMenu from './ContextMenu.vue';
//import type { MenuItem } from './ContextMenu.vue';
import BookStartNode from './BookStartNode.vue';
import BookStoryNode from './BookStoryNode.vue';
import BookEndNode from './BookEndNode.vue';
import NodeEditorPanel from './NodeEditorPanel.vue';
import EdgeEditorPanel from './EdgeEditorPanel.vue';
import type { BookEdge, BookNode } from 'src/stores/types';

const nodesStore = useNodesStore();
const { nodes, edges, viewport } = storeToRefs(nodesStore);

const vueFlowInstance = ref<VueFlowInstance | null>(null);

const isGraphReady = ref(false);
const isEditorOpen = ref(false);
const selectedNode = ref<BookNode | null>(null);
const isEdgeEditorOpen = ref(false);
const selectedEdge = ref<BookEdge | null>(null);
const lastPaneMenuEvent = ref<MouseEvent | null>(null);

function syncViewport() {
  // Solo actúa si AMBAS condiciones se cumplen: la instancia está lista Y el viewport tiene datos válidos.
  if (vueFlowInstance.value && viewport.value) {
    console.log('[LOG BookGraph] Syncing viewport. Instance and data are ready.');
    vueFlowInstance.value.setViewport({
      x: viewport.value.x,
      y: viewport.value.y,
      zoom: viewport.value.zoom,
    });
  } else {
    console.log(`[LOG BookGraph] Sync skipped. Instance ready: ${!!vueFlowInstance.value}, Viewport valid: ${!!viewport.value}`);
  }
}

function onLoad(instance: VueFlowInstance) {
  console.log('[LOG BookGraph] VueFlow instance loaded.');
  vueFlowInstance.value = instance;
  syncViewport();
}

watch(viewport, () => {
  console.log('[LOG BookGraph] Viewport in store has changed.');
  // Intento 2: Los datos del store han cambiado, intentamos sincronizar.
  // Si la instancia ya está lista, funcionará. Si no, no hará nada.
  syncViewport();
}, { deep: true }); // Quitamos 'immediate' porque la lógica ya no lo necesita.

onMounted(() => {
  nextTick(() => {
    isGraphReady.value = true;
    console.log('[LOG BookGraph] El grafo está listo para renderizarse.');
  });
});

function getNodeColor(node: BookNode): string {
  return node.data.color || '#78909c'; // Un gris azulado como fallback
}

function onConnect(params: Connection) {
  nodesStore.addConnection(params);
}

function onMoveEnd(event: Viewport | undefined) {
  if (event) {
    console.log('[LOG BookGraph] Move End detectado. Llamando a la acción updateViewport con:', event);
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
  isEditorOpen.value = false; // Cerramos el otro panel
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
  lastPaneMenuEvent.value = event;
}
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
</style>
