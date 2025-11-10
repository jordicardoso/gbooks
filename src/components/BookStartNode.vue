<!-- src/components/BookStartNode.vue -->
<template>
  <div class="book-node" :class="{ 'is-selected': selected }" :style="nodeStyle">
    <div class="node-header">
      <div class="row items-center no-wrap">
        <q-icon name="play_arrow" class="q-mr-xs" />
        <span class="text-weight-bold">{{
            label || t('bookPage.nodes.startNodeTitle')
          }}</span>
      </div>
    </div>

    <div class="node-content">
      <q-img v-if="imageUrl" :src="imageUrl" class="node-image" fit="cover">
        <template #error>
          <div
            class="absolute-full flex flex-center bg-negative text-white text-center"
            style="font-size: 0.75rem; line-height: 1.2"
          >
            {{ t('bookPage.nodes.imageLoadError') }}
          </div>
        </template>
      </q-img>
      <div class="node-content-truncated">
        {{ description || t('bookPage.nodes.noText') }}
      </div>
    </div>

    <!-- El nodo de inicio solo tiene un punto de salida (source) -->
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { useAssetsStore } from 'src/stores/assets-store';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  id: string;
  label?: string;
  description?: string;
  imageId?: string;
  selected?: boolean;
}>();

const { t } = useI18n();
const assetsStore = useAssetsStore();

const imageUrl = computed(() => {
  if (!props.imageId) return null;
  const asset = assetsStore.getAssetById(props.imageId);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

const nodeStyle = computed(() => {
  return {
    // Un color verde distintivo para el nodo de inicio
    backgroundColor: '#38761d',
  };
});
</script>

<style lang="scss" scoped>
/* Estilos unificados con BookStoryNode */
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
  /* Tamaño fijo para el nodo de inicio, no es redimensionable */
  width: 200px;
  height: 150px;
}

/* Estilo para el nodo seleccionado */
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
  flex-shrink: 0; /* Evita que el header se encoja */
}

.node-content {
  white-space: pre-wrap;
  flex-grow: 1; /* Ocupa el espacio restante */
  overflow: hidden; /* Oculta el desbordamiento de texto */
}

.node-image {
  border-radius: 4px;
  max-height: 60px; /* Altura ajustada para el tamaño fijo del nodo */
  margin-bottom: 5px;
}

.node-content-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 2 líneas es suficiente para el nodo de inicio */
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
