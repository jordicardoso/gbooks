<!-- src/components/BookGraph.vue -->
<template>
  <div class="column no-wrap fit">
    <!-- Controls -->
    <div class="row items-center q-mb-md">
      <q-btn-group flat rounded>
        <q-btn icon="zoom_in" dense @click="handleZoomIn" color="grey-7" text-color="white" />
        <q-btn icon="zoom_out" dense @click="handleZoomOut" color="grey-7" text-color="white" />
        <q-btn icon="fullscreen" dense @click="handleFitView" color="grey-7" text-color="white" />
        <q-btn
          icon="center_focus_strong"
          dense
          @click="handleZoomToSelected"
          :disable="!selectedNode"
          color="grey-7"
          text-color="white"
        >
          <q-tooltip v-if="!selectedNode">Selecciona un nodo para hacer zoom</q-tooltip>
        </q-btn>
      </q-btn-group>
      <q-space />
      <q-btn
        label="Añadir Nodo"
        color="secondary"
        icon="add"
        dense
        @click="addNode"
      />
    </div>

    <!-- VueFlow Container -->
    <div class="vue-flow-container">
      <VueFlow
        v-model="elements"
        :default-zoom="1"
        :min-zoom="0.2"
        :max-zoom="4"
        @connect="handleConnect"
        @nodes-change="onNodesChange"
        @node-click="onNodeClick"
        @node-drag-stop="onNodeDragStop"
      >
        <Background variant="lines" :gap="20" :line-width="0.5" color="#616161" />
        <Controls />

        <template #node-story="nodeProps">
          <BookStoryNode :node="nodeProps.data" />
        </template>
        <template #node-start="nodeProps">
          <BookStartNode :node="nodeProps.data" />
        </template>
        <template #node-end="nodeProps">
          <BookEndNode :node="nodeProps.data" />
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar, debounce } from 'quasar';
import { useBookStore } from 'src/stores/book-store';
import type { BookNode, BookEdge } from 'src/stores/book-store';
import '@vue-flow/core/dist/style.css';

import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core';
import type {
  Elements,
  Node,
  Edge,
  Connection,
  OnNodeDragStopEvent,
  NodeChange,
  NodeMouseEvent,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';

import BookStoryNode from 'src/components/BookStoryNode.vue';
import BookStartNode from 'src/components/BookStartNode.vue';
import BookEndNode from 'src/components/BookEndNode.vue';

// --- EMITS ---
const emit = defineEmits<{
  (e: 'node-selected', node: BookNode): void
}>();

// --- STORES & QUASAR ---
const $q = useQuasar();
const bookStore = useBookStore();

// --- VUE FLOW COMPOSABLE ---
// This is now called *inside* a component that is guaranteed to be mounted in a sized container.
const { fitView, onPaneReady, zoomIn, zoomOut, getSelectedNodes } = useVueFlow();

// --- STATE ---
const elements = ref<Elements>([]);

// --- COMPUTED ---
const selectedNode = computed(() => {
  const nodes = getSelectedNodes.value;
  return nodes.length > 0 ? nodes[0] : null;
});

// --- WATCHERS ---
const debouncedSave = debounce(() => {
  void bookStore.saveCurrentBook();
  console.log('Auto-guardado del grafo activado...');
}, 750);

watch(
  () => [bookStore.nodes, bookStore.edges],
  ([newNodes, newEdges]) => {
    const flowNodes: Node[] = newNodes.map((node: BookNode) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node,
      draggable: true,
    }));

    const flowEdges: Edge[] = newEdges.map((edge: BookEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.description,
      markerEnd: MarkerType.ArrowClosed,
      data: edge,
    }));

    elements.value = [...flowNodes, ...flowEdges];
    debouncedSave();
  },
  { deep: true, immediate: true } // immediate: true to load the graph on mount
);

// --- HOOKS ---
onPaneReady(() => {
  console.log('✅ BookGraph: Vue Flow pane is ready. Fitting view.');
  fitView({ duration: 50 });
});

// --- METHODS ---
const onNodeDragStop = (event: OnNodeDragStopEvent) => {
  const { node } = event;
  if (node && node.position) {
    bookStore.updateNodePosition(node.id, node.position);
  }
};

const onNodesChange = (_changes: NodeChange[]) => {
  // No action needed, handled by the main watcher
};

const onNodeClick = (event: NodeMouseEvent) => {
  if (
    event.event.target instanceof Element &&
    event.event.target.closest('.vue-flow__handle')
  ) {
    return;
  }
  if (event.node && event.node.data) {
    // Emit an event to the parent to handle opening the editor
    emit('node-selected', event.node.data as BookNode);
  }
};

const handleConnect = (params: Connection) => {
  if (params.source && params.target) {
    $q.dialog({
      title: 'Nueva Conexión',
      message: 'Introduce la descripción para esta elección:',
      prompt: {
        model: 'Elegir',
        type: 'text',
      },
      dark: true,
      class: 'bg-grey-9',
      cancel: true,
      persistent: true,
    }).onOk(description => {
      bookStore.addEdge({
        source: params.source as string,
        target: params.target as string,
        description: description,
      });
    });
  }
};

function addNode() {
  $q.dialog({
    title: 'Nuevo Pasaje',
    message: 'Introduce la descripción para el nuevo pasaje:',
    prompt: {
      model: 'Nuevo Pasaje',
      type: 'text',
    },
    dark: true,
    class: 'bg-grey-9',
    cancel: true,
    persistent: true,
  }).onOk(description => {
    bookStore.addNode({
      description: description,
      type: 'story',
      position: { x: Math.random() * 400, y: Math.random() * 200 },
    });
  });
}

function handleZoomIn() {
  void zoomIn();
}

function handleZoomOut() {
  void zoomOut();
}

function handleFitView() {
  void fitView();
}

function handleZoomToSelected() {
  const node = selectedNode.value;
  if (node) {
    void fitView({ nodes: [node], duration: 300, padding: 0.5 });
  }
}
</script>

<style lang="scss" scoped>
// These styles are now local to the graph component
.vue-flow-container {
  flex: 1;
  min-height: 0;
  background-color: $grey-10;
  border-radius: 8px;
  overflow: hidden;
}

// We need to use :deep() for the Vue Flow internal classes because the style is `scoped`.
:deep(.vue-flow__edge-path) {
  stroke: #00bcd4;
  stroke-width: 2;
}

:deep(.vue-flow__edge-label) {
  background-color: rgba(33, 33, 33, 0.8);
  color: white;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  border: 1px solid #00bcd4;
}
</style>
