<!-- src/components/BookStoryNode.vue -->
<template>
  <!-- La etiqueta del nodo ahora viene de la prop 'label' estándar -->
  <div class="book-node book-node-story" :style="nodeStyle">
    <div class="node-header">
      <div class="row items-center no-wrap">
        <q-icon name="menu_book" class="q-mr-xs" />
        <span class="text-weight-bold">{{ label || 'Pasaje' }}</span>
      </div>
      <q-chip
        v-if="data.tag"
        :label="data.tag"
        color="primary"
        text-color="white"
        dense
        size="sm"
        class="q-ml-sm"
      />
    </div>
    <div class="node-content q-mt-xs">
      <q-img
        v-if="imageUrl"
        :src="imageUrl"
        class="q-mb-sm node-image"
        fit="cover"
      />
      <!-- Accedemos a la descripción a través de 'data' -->
      <div>{{ data.description }}</div>
    </div>
    <Handle type="target" :position="Position.Top" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// Importa 'NodeProps' para una mejor integración
import { Handle, Position, type NodeProps } from '@vue-flow/core';
// Importa solo el tipo de datos, no el nodo completo
import { type BookNodeData } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

// Usa NodeProps, que es el estándar de Vue Flow.
// Te da acceso a 'id', 'label', 'data', 'position', etc.
const props = defineProps<NodeProps<BookNodeData>>();

const assetsStore = useAssetsStore();

const imageUrl = computed(() => {
  // Accede a las propiedades personalizadas a través de `props.data`
  if (!props.data.imageId) {
    return null;
  }
  const asset = assetsStore.getAssetById(props.data.imageId);
  return asset ? asset.src : null;
});

const nodeStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.data.color) {
    style.backgroundColor = props.data.color;
  }
  // ... resto de tu lógica de estilos usando props.data.size
  return style;
});
</script>

<!-- Los estilos no cambian -->
<style scoped>
.book-node {
  /* min-width y max-width ahora se controlan por JS */
  padding: 10px;
  border-radius: 8px;
  color: white;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  position: relative;
  transition: background-color 0.3s, min-width 0.3s, max-width 0.3s;
}

.book-node-story {
  /* El color de fondo por defecto si no hay uno personalizado */
  background-color: #455a64;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Para alinear el chip a la derecha */
  font-size: 0.9rem;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
  gap: 8px; /* Espacio entre elementos del header */
}
.node-content {
  white-space: pre-wrap;
}
.node-image {
  border-radius: 4px;
  max-height: 120px;
}
.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--q-primary);
  border: 1px solid white;
}
</style>
