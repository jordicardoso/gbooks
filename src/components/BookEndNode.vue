<!-- src/components/BookEndNode.vue (CORREGIDO) -->
<template>
  <div class="book-node book-node-end">
    <div class="node-header">
      <q-icon name="flag" class="q-mr-xs" />
      <!-- Usamos la prop 'label' que nos da Vue Flow -->
      <span class="text-weight-bold">{{ label || 'Fin' }}</span>
    </div>
    <div class="node-content q-mt-xs">
      <!-- Accedemos a la descripción a través de 'data' -->
      {{ data.description }}
    </div>
    <Handle type="target" :position="Position.Top" />
  </div>
</template>

<script setup lang="ts">
// 1. Importamos NodeProps
import { Handle, Position, type NodeProps } from '@vue-flow/core';
// 2. Importamos el tipo de nuestros datos personalizados
import type { BookNodeData } from 'src/stores/book-store';

// 3. Usamos NodeProps para definir las props.
// Esto nos da acceso a 'label', 'data', 'id', etc.
defineProps<NodeProps<BookNodeData>>();
</script>

<style scoped>
/* Tus estilos están perfectos y no necesitan cambios */
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
