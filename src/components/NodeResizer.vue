<!-- src/components/NodeResizer.vue (NUEVO FICHERO) -->
<template>
  <div class="node-resizer nodrag nopan" @mousedown="onMouseDown"></div>
</template>

<script setup lang="ts">
import { useNodesStore } from 'src/stores/nodes-store';
import type { BookNode } from 'src/stores/types';

const props = defineProps<{
  nodeId: string;
  minWidth?: number;
  minHeight?: number;
}>();

const emit = defineEmits<{
  (e: 'resize-end', payload: { width: number; height: number }): void;
}>();

const nodesStore = useNodesStore();

function onMouseDown(event: MouseEvent) {
  console.log('[NodeResizer] onMouseDown triggered', props.nodeId, event);
  event.stopPropagation();
  event.preventDefault();

  const node = nodesStore.nodes.find((n) => n.id === props.nodeId) as BookNode | undefined;
  if (!node) {
    console.warn('[NodeResizer] Node not found in store', props.nodeId);
    return;
  }

  // Usamos closest para encontrar el nodo contenedor de Vue Flow de forma más robusta
  const target = event.target as HTMLElement;
  let nodeElement = target.closest('.vue-flow__node') as HTMLElement;

  if (!nodeElement) {
    console.warn('[NodeResizer] Node element not found in DOM via closest(). Trying fallback...');
    // Fallback to querySelector just in case
    const fallbackElement = document.querySelector(`[data-id="${props.nodeId}"]`) as HTMLElement;
    console.log('[NodeResizer] Fallback querySelector found:', fallbackElement);

    if (fallbackElement) {
      nodeElement = fallbackElement;
    } else {
      return;
    }
  }

  console.log('[NodeResizer] Node element found:', nodeElement);

  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = nodeElement.offsetWidth;
  const startHeight = nodeElement.offsetHeight;

  console.log('[NodeResizer] Start dimensions:', { startWidth, startHeight, startX, startY });

  const minW = props.minWidth ?? 150;
  const minH = props.minHeight ?? 100;

  let moveCount = 0;

  const onMouseMove = (moveEvent: MouseEvent) => {
    moveCount++;

    moveEvent.stopPropagation();
    moveEvent.preventDefault();

    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;

    const newWidth = Math.max(minW, startWidth + dx);
    const newHeight = Math.max(minH, startHeight + dy);

    // Actualizamos el estilo directamente para un feedback visual instantáneo
    nodeElement.style.width = `${newWidth}px`;
    nodeElement.style.height = `${newHeight}px`;

    // También actualizamos el store en tiempo real para que Vue Flow no lo revierta
    const node = nodesStore.nodes.find((n) => n.id === props.nodeId);
    if (node) {
      if (!node.data) node.data = {};
      node.data.width = newWidth;
      node.data.height = newHeight;
      if (!node.style) node.style = {};
      node.style.width = `${newWidth}px`;
      node.style.height = `${newHeight}px`;
    }

    if (moveCount % 10 === 0) {
      console.log('[NodeResizer] onMouseMove', moveCount, { newWidth, newHeight });
    }
  };

  const onMouseUp = () => {
    console.log('[NodeResizer] onMouseUp triggered, total moves:', moveCount);
    // Limpiamos los listeners
    window.removeEventListener('mousemove', onMouseMove, true);
    window.removeEventListener('mouseup', onMouseUp, true);

    const finalWidth = nodeElement.offsetWidth;
    const finalHeight = nodeElement.offsetHeight;

    console.log('[NodeResizer] Final dimensions:', { finalWidth, finalHeight });

    // Llamamos a la acción del store para persistir el cambio y marcar como dirty
    nodesStore.updateNodeDimensions(props.nodeId, finalWidth, finalHeight);

    // Emitimos el evento para que el componente padre también pueda reaccionar
    emit('resize-end', { width: finalWidth, height: finalHeight });
  };

  // Añadimos los listeners a la ventana para que el drag funcione
  // incluso si el cursor sale del resizer.
  // Usamos capture: true para capturar los eventos antes que otros handlers
  console.log('[NodeResizer] Adding event listeners...');
  window.addEventListener('mousemove', onMouseMove, true);
  window.addEventListener('mouseup', onMouseUp, true);
  console.log('[NodeResizer] Event listeners added');
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
