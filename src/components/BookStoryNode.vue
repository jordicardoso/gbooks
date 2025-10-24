<!-- src/components/BookStoryNode.vue -->
<template>
  <div class="book-node book-node-story" :style="nodeStyle">
    <div class="node-header">
      <div class="row items-center no-wrap">
        <q-icon name="menu_book" class="q-mr-xs" />
        <span class="text-weight-bold">Pasaje</span>
      </div>
      <!-- Mostramos la etiqueta si existe -->
      <q-chip
        v-if="node.tag"
        :label="node.tag"
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
      <div>{{ node.description }}</div>
    </div>
    <Handle type="target" :position="Position.Top" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { BookNode } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

const props = defineProps<{
  node: BookNode;
}>();

const assetsStore = useAssetsStore();

const imageUrl = computed(() => {
  if (!props.node.imageId) {
    return null;
  }
  const asset = assetsStore.getAssetById(props.node.imageId);
  return asset ? asset.src : null;
});

// Propiedad computada para los estilos dinámicos
const nodeStyle = computed(() => {
  const style: Record<string, string> = {};

  // Aplicar color de fondo si está definido
  if (props.node.color) {
    style.backgroundColor = props.node.color;
  }

  // Aplicar tamaño
  switch (props.node.size) {
    case 'small':
      style.minWidth = '120px';
      style.maxWidth = '200px';
      break;
    case 'large':
      style.minWidth = '200px';
      style.maxWidth = '350px';
      break;
    case 'medium':
    default:
      style.minWidth = '150px';
      style.maxWidth = '250px';
      break;
  }

  return style;
});
</script>

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
