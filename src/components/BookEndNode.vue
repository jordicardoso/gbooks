<!-- src/components/BookEndNode.vue -->
<template>
  <!-- [1] Añadimos la clase dinámica para el resaltado -->
  <div class="book-node" :class="{ 'is-selected': selected }" :style="nodeStyle">
    <div class="node-header">
      <q-icon name="flag" class="q-mr-xs" />
      <span class="text-weight-bold">{{ label || 'Fin' }}</span>
    </div>
    <div class="node-content q-mt-xs node-content-truncated">
      {{ description || 'Nodo final sin descripción.' }}
    </div>
    <!-- [2. LA CLAVE] Añadimos un 'id' al Handle -->
    <Handle type="target" :position="Position.Top" id="top-target" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

// [3] Añadimos las props que faltaban para consistencia
const props = defineProps<{
  id: string;
  label?: string;
  description?: string;
  color?: string;
  selected?: boolean;
}>();

const nodeStyle = computed(() => {
  const style: Record<string, string> = {};
  style.backgroundColor = props.color || '#d32f2f';
  return style;
});
</script>

<!-- El CSS ya estaba perfecto, solo he añadido el estilo para .is-selected -->
<style lang="scss" scoped>
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
  transition: background-color 0.3s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

/* Estilo para cuando el nodo está seleccionado */
.is-selected {
  box-shadow: 0 0 0 2px var(--q-primary), 0 5px 15px rgba(0, 0, 0, 0.5);
  transform: scale(1.02);
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
