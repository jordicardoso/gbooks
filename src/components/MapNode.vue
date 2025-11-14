<!-- src/components/MapNode.vue (NUEVO) -->
<template>
  <div
    class="map-node"
    :style="nodeStyle"
    :title="node.label"
  >
    <q-icon name="location_on" size="sm" class="map-node-icon" />
    <q-tooltip anchor="top middle" self="bottom middle" :offset="[10, 10]">
      {{ node.label }}
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { BookNode } from 'src/stores/types';

const props = defineProps({
  node: {
    type: Object as PropType<BookNode>,
    required: true,
  },
});

const nodeStyle = computed(() => {
  if (!props.node.data.mapPosition) return {};
  return {
    position: 'absolute',
    left: `${props.node.data.mapPosition.x}%`,
    top: `${props.node.data.mapPosition.y}%`,
    transform: 'translate(-50%, -50%)', // Centra el nodo en el cursor
    '--node-color': props.node.data.color || '#795548',
  };
});
</script>

<style lang="scss" scoped>
.map-node {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--node-color);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: blur(2px);

  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 15px var(--node-color);
    z-index: 10;
  }

  .map-node-icon {
    color: var(--node-color);
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.8));
  }
}
</style>
