<!-- src/components/BookStartNode.vue -->
<template>
  <!-- El div principal ahora reacciona a la prop 'selected' para cambiar su estilo -->
  <div class="book-node" :class="{ 'is-selected': selected }" :style="nodeStyle">
    <!-- Cabecera con icono y título -->
    <div class="node-header">
      <div class="row items-center no-wrap">
        <q-icon name="play_arrow" class="q-mr-xs" />
        <span class="text-weight-bold">{{ label || 'Inicio' }}</span>
      </div>
      <!-- Muestra las etiquetas si existen -->
      <div v-if="tags && tags.length > 0" class="row items-center q-ml-sm gap-xs">
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

    <!-- Muestra la imagen si está definida -->
    <q-img
      v-if="imageUrl"
      :src="imageUrl"
      fit="cover"
      class="node-image"
      ratio="1.77"
    >
      <template #error>
        <div class="absolute-full flex flex-center bg-negative text-white">
          No se pudo cargar la imagen
        </div>
      </template>
    </q-img>

    <!-- Muestra la descripción (truncada para no ocupar mucho espacio) -->
    <div class="node-content q-mt-xs node-content-truncated">
      {{ description || 'Sin texto' }}
    </div>

    <!-- Handle para crear conexiones de salida -->
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { useAssetsStore } from 'src/stores/assets-store';

const props = defineProps<{
  label?: string;
  description?: string;
  color?: string;
  tags?: string[];
  imageId?: string;
  selected?: boolean;
}>();

const assetsStore = useAssetsStore();

// Propiedad computada para obtener la URL completa de la imagen a partir de su ID.
const imageUrl = computed(() => {
  if (!props.imageId) return null;
  const asset = assetsStore.getAssetById(props.imageId);
  // Usa el protocolo personalizado para cargar la imagen de forma segura.
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

// Propiedad computada para generar el estilo del nodo, principalmente el color de fondo.
const nodeStyle = computed(() => {
  const style: Record<string, string> = {};
  // Usa el color de la prop, o un color verde por defecto si no se ha especificado.
  style.backgroundColor = props.color || '#388e3c';
  return style;
});
</script>

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
  overflow: hidden; // Asegura que el contenido no se salga de los bordes redondeados
}

// Estilo que se aplica cuando la prop 'selected' es true
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
}

.node-content {
  white-space: pre-wrap;
}

.node-image {
  border-radius: 4px;
  max-height: 120px;
  margin-top: 5px;
}

// Estilo para truncar la descripción a un máximo de 3 líneas.
.node-content-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

// Estilo para los puntos de conexión (handles) de Vue Flow.
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
