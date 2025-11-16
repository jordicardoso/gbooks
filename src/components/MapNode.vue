<!-- src/components/MapNode.vue -->
<template>
  <div
    class="map-node"
    :style="nodeStyle"
    draggable="true"
    @dragstart="onDragStart"
    :title="node.label"
  >
    <q-icon
      :name="node.data.icon || 'place'"
      size="24px"
      class="map-node-icon"
      :style="{ color: node.data.color || 'white' }"
    />
    <div class="map-node-label">{{ node.label }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BookNode } from 'src/stores/types';

const props = defineProps<{
  node: BookNode;
}>();

// Calcula la posición absoluta del nodo en el mapa
const nodeStyle = computed(() => {
  if (!props.node.data.mapPosition) {
    return { display: 'none' };
  }
  const backgroundColor = 'rgba(255, 255, 255, 0.1)';
  return {
    left: `${props.node.data.mapPosition.x}%`,
    top: `${props.node.data.mapPosition.y}%`,
    backgroundColor: backgroundColor,
  };
});

/**
 * [LA CLAVE] Al empezar a arrastrar, guardamos el ID del nodo.
 * La función handleDrop del padre (BookMap.vue) lo recogerá.
 */
function onDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', props.node.id);
    event.dataTransfer.effectAllowed = 'move';
  }
}
</script>

<style lang="scss" scoped>
.map-node {
  position: absolute;
  transform: translate(-50%, -50%); // Centra el nodo en el cursor
  padding: 4px 8px;
  border-radius: 16px;
  color: white;
  display: flex;
  align-items: center;
  cursor: grab;
  user-select: none; // Evita que el texto se seleccione al arrastrar
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  &:active {
    cursor: grabbing;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    transform: translate(-50%, -50%) scale(1.05);
  }
}

.map-node-icon {
  margin-right: 5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.map-node-label {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}
</style>
