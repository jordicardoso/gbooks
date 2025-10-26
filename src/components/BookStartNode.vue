<!-- src/components/BookStartNode.vue (CORREGIDO) -->
<template>
  <div class="book-node book-node-start">
    <div class="node-header">
      <q-icon name="play_arrow" class="q-mr-xs" />
      <span class="text-weight-bold">{{ label || 'Inicio' }}</span>
    </div>
    <q-img
      v-if="imageUrl"
      :src="imageUrl"
      fit="cover"
      style="height: 80px;"
    >
      <!-- He eliminado el label de aquí porque ya está en el header, para evitar duplicidad -->
    </q-img>
    <div class="node-content q-mt-xs node-content-truncated">
      {{ data.description }}
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position, type NodeProps } from '@vue-flow/core';
import type { BookNodeData } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

// ÚNICA LLAMADA A defineProps, que es lo correcto.
const props = defineProps<NodeProps<BookNodeData>>();
const assetsStore = useAssetsStore();

const imageUrl = computed(() => {
  if (!props.data.imageId) {
    return null;
  }
  // Usamos los getters del store, que es la forma correcta
  const asset = assetsStore.getAssetById(props.data.imageId);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

// La segunda llamada a defineProps ha sido eliminada.
</script>

<style scoped>
/* ... tus estilos no necesitan cambiar ... */
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

.node-content-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* El número de líneas que quieres mostrar */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word; /* Ayuda a evitar que palabras largas rompan el layout */
}

.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--q-primary);
  border: 1px solid white;
}
</style>
