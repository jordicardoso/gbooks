<!-- src/components/BookStoryNode.vue -->
<template>
  <div class="book-node" :class="{ 'is-selected': selected }" :style="nodeStyle">
    <div class="node-header">
      <div class="row items-center no-wrap">
        <q-icon name="menu_book" class="q-mr-xs" />
        <span class="text-weight-bold">{{
            label || t('bookPage.nodes.storyNodeTitle')
          }}</span>
      </div>
      <div
        v-if="tags && tags.length > 0"
        class="row items-center q-ml-sm gap-xs"
      >
        <q-chip
          v-for="tag in tags"
          :key="tag"
          :label="tag"
          color="black"
          text-color="white"
          dense
          size="sm"
          style="opacity: 0.7"
        />
      </div>
    </div>

    <!-- [MODIFICADO] La estructura interna del contenido no cambia -->
    <div class="node-content">
      <q-img v-if="imageUrl" :src="imageUrl" class="node-image" fit="cover" />
      <div class="node-text-content">
        {{ description || t('bookPage.nodes.noText') }}
      </div>
    </div>

    <Handle type="target" :position="Position.Top" />
    <Handle type="source" :position="Position.Bottom" />
    <NodeResizer :node-id="id" :min-width="150" :min-height="100" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { useAssetsStore } from 'src/stores/assets-store';
import NodeResizer from './NodeResizer.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  id: string;
  label?: string;
  description?: string;
  color?: string;
  tags?: string[];
  imageId?: string;
  data?: {
    width?: number;
    height?: number;
  };
  selected?: boolean;
}>();

const { t } = useI18n();
const assetsStore = useAssetsStore();

const imageUrl = computed(() => {
  if (!props.imageId) return null;
  const asset = assetsStore.getAssetById(props.imageId);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

// La lógica del script para el tamaño por defecto es correcta y se mantiene.
const nodeStyle = computed(() => {
  const style: Record<string, string> = {};
  style.backgroundColor = props.color || '#455a64';
  style.width = props.data?.width ? `${props.data.width}px` : '250px';
  style.height = props.data?.height ? `${props.data.height}px` : '180px';
  return style;
});
</script>

<style lang="scss" scoped>
.book-node {
  padding: 10px;
  border-radius: 8px;
  color: white;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  position: relative;
  transition: background-color 0.3s ease, box-shadow 0.2s ease,
  transform 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.is-selected {
  box-shadow: 0 0 0 2px var(--q-primary), 0 5px 15px rgba(0, 0, 0, 0.5);
  transform: scale(1.02);
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
  flex-shrink: 0;
}

.node-content {
  white-space: pre-wrap;
  word-break: break-word; // Ayuda a que el texto se rompa correctamente
  flex-grow: 1;
  overflow-y: auto; // <-- Esta es la clave. Mostrará scroll si el contenido es más grande que el contenedor.
}

.node-image {
  border-radius: 4px;
  max-height: 120px;
  margin-bottom: 5px;
}

/* [ELIMINADO] Se ha eliminado por completo la clase .node-content-truncated
   y se ha renombrado el div a .node-text-content para evitar confusión.
   Ya no se necesita el line-clamp. */
.node-text-content {
  /* No necesita estilos especiales, hereda el comportamiento del padre */
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
