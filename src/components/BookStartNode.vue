<template>
  <div class="book-node book-node-start">
    <div class="node-header">
      <q-icon name="play_arrow" class="q-mr-xs" />
      <span class="text-weight-bold">Inicio</span>
    </div>
    <div class="node-content q-mt-xs">
      {{ node.description }}
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
// CORREGIDO: Se usa 'import type'
import { BookNode } from 'src/stores/book-store';

defineProps<{
  node: BookNode;
}>();
</script>

<style scoped>
/* ... tus estilos ... */
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
}

.book-node-start { background-color: #388e3c; }
.book-node-story { background-color: #455a64; }
.book-node-end { background-color: #d32f2f; }

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

.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--q-primary);
  border: 1px solid white;
}
</style>
