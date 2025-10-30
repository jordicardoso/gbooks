<!-- src/components/BookStoryNode.vue -->
<template>
  <div class="book-node" :style="nodeStyle">
    <div class="node-header">
      <div class="row items-center no-wrap">
        <q-icon name="menu_book" class="q-mr-xs" />
        <span class="text-weight-bold">{{ label || 'Pasaje' }}</span>
      </div>
      <div v-if="tags && tags.length > 0" class="row items-center q-ml-sm gap-xs">
        <q-chip
          v-for="tag in tags"
          :key="tag"
          :label="tag"
          color="primary"
          text-color="white"
          dense
          size="sm"
        />
      </div>
    </div>
    <div class="node-content q-mt-xs">
      <q-img
        v-if="imageUrl"
        :src="imageUrl"
        class="q-mb-sm node-image"
        fit="cover"
      />
      <div class="node-content q-mt-xs node-content-truncated">
        <!-- [CORREGIDO] Añadido valor por defecto para robustez -->
        {{ description || 'Sin texto' }}
      </div>
    </div>
    <Handle type="target" :position="Position.Top" />
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { useAssetsStore } from 'src/stores/assets-store';
import type { BookNode } from 'src/stores/types';

// [UNIFICADO] Patrón de props opcionales para máxima robustez
const props = defineProps<{
  label?: string;
  description?: string;
  color?: string;
  tags?: string[];
  imageId?: string;
}>();

const assetsStore = useAssetsStore();

const imageUrl = computed(() => {
  if (!props.imageId) return null;
  const asset = assetsStore.getAssetById(props.imageId);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

const nodeStyle = computed(() => {
  const style: Record<string, string> = {};
  // Usa el color de la prop, o un color por defecto si no existe.
  style.backgroundColor = props.color || '#455a64';
  return style;
});
</script>

<style scoped>
/* Se elimina la clase estática .book-node-story para permitir el color dinámico */
.book-node {
  padding: 10px;
  border-radius: 8px;
  color: white;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  position: relative;
  transition: background-color 0.3s, min-width 0.3s, max-width 0.3s;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
  gap: 8px;
}
.node-content {
  white-space: pre-wrap;
}
.node-image {
  border-radius: 4px;
  max-height: 120px;
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

.gap-xs {
  gap: 4px;
}
</style>
