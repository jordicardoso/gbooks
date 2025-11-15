<!-- src/components/BookStartNode.vue (CORREGIDO) -->
<template>
  <div class="book-node" :class="{ 'is-selected': selected }" :style="nodeStyle">
    <div class="node-header">
      <div class="row items-center no-wrap">
        <span
          v-if="paragraphNumber"
          class="paragraph-number q-mr-sm"
        >
          #{{ paragraphNumber }}
        </span>
        <q-icon name="play_arrow" class="q-mr-xs" />
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

    <div class="node-content">
      <div
        class="node-text-content"
        v-html="description || t('bookPage.nodes.noText')"
      ></div>
    </div>

    <!-- [LA CLAVE] Añadimos el 'id' que faltaba para que las conexiones se guarden bien -->
    <Handle type="source" :position="Position.Bottom" id="bottom-source" />

    <NodeResizer :node-id="id" :min-width="150" :min-height="100" @resize-end="onResizeEnd"/>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { useAssetsStore } from 'src/stores/assets-store';
import { useI18n } from 'vue-i18n';
import NodeResizer from './NodeResizer.vue';
import { useNodesStore } from 'src/stores/nodes-store';

const props = defineProps<{
  id: string;
  paragraphNumber?: number;
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
const nodesStore = useNodesStore();

const imageUrl = computed(() => {
  if (!props.imageId) return null;
  const asset = assetsStore.getAssetById(props.imageId);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

const nodeStyle = computed(() => {
  const style: Record<string, string> = {};

  if (imageUrl.value) {
    style.backgroundImage = `url('${imageUrl.value}')`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  } else {
    // Si no hay imagen, usamos el color de fondo por defecto para el nodo de inicio.
    style.backgroundColor = '#38761d';
  }

  return style;
});

function onResizeEnd(payload: { width: number; height: number }) {
  nodesStore.updateNodeDimensions(props.id, payload.width, payload.height);
}
</script>

<style lang="scss" scoped>
.book-node {
  width: 100%;
  height: 100%;
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
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: inherit;
    z-index: 1;
    transition: background-color 0.3s ease;
  }
}

.is-selected {
  box-shadow: 0 0 0 2px var(--q-primary), 0 5px 15px rgba(0, 0, 0, 0.5);
  transform: scale(1.02);
}

.node-header,
.node-content {
  position: relative;
  z-index: 2;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
  flex-shrink: 0;
}

.node-content {
  white-space: pre-wrap;
  word-break: break-word;
  flex-grow: 1;
  overflow-y: auto;
  min-height: 0;
}

.node-image {
  border-radius: 4px;
  max-height: 60px;
  margin-bottom: 5px;
}

.node-text-content {
}

.vue-flow__handle {
  width: 10px;
  height: 10px;
  background: var(--q-primary);
  border: 1px solid white;
  z-index: 10;
}
</style>
