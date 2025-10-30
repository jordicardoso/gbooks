<!-- src/components/BookEndNode.vue -->
<template>
  <div class="book-node" :style="nodeStyle">
    <div class="node-header">
      <q-icon name="flag" class="q-mr-xs" />
      <span class="text-weight-bold">{{ label || 'Fin' }}</span>
    </div>
    <div class="node-content q-mt-xs node-content-truncated">
      <!-- El valor por defecto ya estaba bien -->
      {{ description || 'Nodo final sin descripción.' }}
    </div>
    <Handle type="target" :position="Position.Top" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import type { BookNode } from 'src/stores/types';

const props = defineProps<{
  label?: string;
  description?: string;
  color?: string;
}>();

const nodeStyle = computed(() => {
  const style: Record<string, string> = {};
  // Usa el color de la prop, o un color por defecto si no existe.
  style.backgroundColor = props.color || '#d32f2f';
  return style;
});
</script>

<style scoped>
/* El CSS ya estaba correcto, con el color de fondo dinámico */
.book-node {
  min-width: 150px;
  max-width: 250px;
  padding: 10px;
  border-radius: 8px;
  color: white;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  position: relative;
  transition: background-color 0.3s ease;
}

.node-header {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
}
.node-content {
  white-space: pre-wrap;
}

.node-content-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--q-primary);
  border: 1px solid white;
}
</style>
