<!-- src/components/NodeResizer.vue (NUEVO FICHERO) -->
<template>
  <div class="node-resizer" @mousedown.stop.prevent="onMouseDown"></div>
</template>

<script setup lang="ts">
import { useNodesStore } from 'src/stores/nodes-store';
import type { BookNode } from 'src/stores/types';

const props = defineProps<{
  nodeId: string;
  minWidth?: number;
  minHeight?: number;
}>();

const nodesStore = useNodesStore();

function onMouseDown(event: MouseEvent) {
  const node = nodesStore.nodes.find((n) => n.id === props.nodeId) as BookNode | undefined;
  if (!node) return;

  // Obtenemos el elemento del DOM para tener una referencia
  const nodeElement = document.querySelector(`[data-id="${props.nodeId}"]`) as HTMLElement;
  if (!nodeElement) return;

  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = nodeElement.offsetWidth;
  const startHeight = nodeElement.offsetHeight;

  const minW = props.minWidth ?? 150;
  const minH = props.minHeight ?? 100;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;

    const newWidth = Math.max(minW, startWidth + dx);
    const newHeight = Math.max(minH, startHeight + dy);

    // Actualizamos el estilo directamente para un feedback visual instantáneo
    nodeElement.style.width = `${newWidth}px`;
    nodeElement.style.height = `${newHeight}px`;
  };

  const onMouseUp = () => {
    // Limpiamos los listeners
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);

    const finalWidth = nodeElement.offsetWidth;
    const finalHeight = nodeElement.offsetHeight;

    // Llamamos a la acción del store para persistir el cambio
    nodesStore.updateNodeDimensions(props.nodeId, finalWidth, finalHeight);
  };

  // Añadimos los listeners a la ventana para que el drag funcione
  // incluso si el cursor sale del resizer.
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}
</script>

<style scoped>
.node-resizer {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-left: 2px solid white;
  cursor: se-resize;
  z-index: 11; /* Por encima del contenido del nodo */
  border-top-left-radius: 3px;
}
.node-resizer:hover {
  background: var(--q-primary);
}
</style>
