<!-- src/components/BookLocationNode.vue -->
<template>
  <div class="book-node location-node" :class="{ 'is-selected': selected }" :style="nodeStyle">
    <div class="node-header">
      <q-icon name="place" class="q-mr-sm" />
      <span class="text-weight-bold">{{ label }}</span>
    </div>
    <div class="node-content">
      <div class="node-text-content text-grey-4">
        (Localización de Mapa)
      </div>
    </div>
    <!-- Las localizaciones pueden tener entradas y salidas -->
    <Handle type="target" :position="Position.Top" id="top-target" />
    <Handle type="target" :position="Position.Left" id="left-target" />
    <Handle type="source" :position="Position.Bottom" id="bottom-source" />
    <Handle type="source" :position="Position.Right" id="right-source" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  id: string;
  label?: string;
  data?: {
    color?: string;
  };
  selected?: boolean;
}>();

const nodeStyle = computed(() => ({
  backgroundColor: props.data?.color || '#795548',
}));
</script>

<style lang="scss" scoped>
// Reutilizamos los estilos base de los otros nodos
.book-node {
  width: 180px;
  height: 80px;
  padding: 10px;
  border-radius: 8px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 0.9rem;

  &.is-selected {
    box-shadow: 0 0 0 2px var(--q-primary), 0 5px 15px rgba(0, 0, 0, 0.5);
  }
}

.node-header {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.node-content {
  margin-top: 5px;
  font-size: 0.8rem;
}

.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--q-primary);
  border: 1px solid white;
}
</style>
