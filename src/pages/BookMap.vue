<!-- src/pages/BookMap.vue (REDISEÑADO) -->
<template>
  <!-- Usamos QPage para integrar un panel lateral (drawer) -->
  <q-page class="row no-wrap">
    <!-- Panel lateral con localizaciones sin posicionar -->
    <q-drawer
      show-if-above
      :width="250"
      bordered
      class="bg-grey-9 text-white column"
    >
      <q-toolbar class="bg-grey-10">
        <q-toolbar-title>Localizaciones</q-toolbar-title>
      </q-toolbar>
      <q-scroll-area class="col">
        <q-list dark separator>
          <q-item-label header>Sin Posicionar</q-item-label>
          <q-item
            v-for="loc in unplacedLocations"
            :key="loc.id"
            clickable
            v-ripple
            draggable="true"
            @dragstart="handleDragStart($event, loc.id)"
            class="draggable-item"
          >
            <q-item-section avatar>
              <q-icon name="location_on" :style="{ color: loc.data.color || '#795548' }" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ loc.label }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="!unplacedLocations.length">
            <q-item-section class="text-grey-6 text-center">
              Todas las localizaciones están en su sitio.
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Área principal del mapa -->
    <div class="col column q-pa-md">
      <div class="col-auto">
        <q-select
          v-model="currentMapId"
          :options="mapAssetOptions"
          label="Seleccionar Mapa General"
          dark dense clearable emit-value map-options
          class="q-mb-md"
        />
      </div>

      <div
        class="col map-container bg-grey-10"
        @dragover.prevent
        @drop="handleDrop"
      >
        <q-img
          v-if="currentMapUrl"
          :src="currentMapUrl"
          fit="contain"
          class="map-image"
        />
        <div v-else class="fit flex flex-center text-grey-6">
          <q-icon name="map" size="4rem" />
          <p class="q-mt-md">Selecciona un mapa para empezar.</p>
        </div>

        <!-- Renderizar nodos ya posicionados en este mapa -->
        <MapNode
          v-for="loc in placedLocations"
          :key="loc.id"
          :node="loc"
          @click="handleLocationClick(loc)"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAssetsStore } from 'stores/assets-store';
import { useNodesStore } from 'stores/nodes-store';
import { storeToRefs } from 'pinia';
import MapNode from 'src/components/MapNode.vue'; // <-- ¡Nuevo componente!
import type { BookNode } from 'src/stores/types';

const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();

const { assets } = storeToRefs(assetsStore);
const { nodes } = storeToRefs(nodesStore);

// ID del mapa que se está mostrando actualmente
const currentMapId = ref<string | null>(null);

// Opciones para el selector de mapas
const mapAssetOptions = computed(() =>
  assets.value
    .filter(asset => asset.category === 'map' && asset.type === 'image')
    .map(asset => ({ label: asset.name, value: asset.id }))
);

// URL del mapa actual
const currentMapUrl = computed(() => {
  if (!currentMapId.value) return null;
  const asset = assetsStore.getAssetById(currentMapId.value);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

// Filtra las localizaciones que aún no tienen posición en un mapa
const unplacedLocations = computed(() =>
  nodes.value.filter(n => n.type === 'location' && !n.data.mapPosition)
);

// Filtra las localizaciones que SÍ tienen posición y pertenecen al mapa actual
const placedLocations = computed(() =>
  nodes.value.filter(n =>
    n.type === 'location' &&
    n.data.mapPosition &&
    n.data.mapId === currentMapId.value
  )
);

function handleDragStart(event: DragEvent, nodeId: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', nodeId);
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleDrop(event: DragEvent) {
  if (!event.dataTransfer || !currentMapId.value) return;

  const nodeId = event.dataTransfer.getData('text/plain');
  const mapContainer = event.currentTarget as HTMLElement;
  const rect = mapContainer.getBoundingClientRect();

  // Calcula la posición en porcentaje para que sea responsive
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  // Llama a la nueva acción del store
  nodesStore.setNodeMapPosition(nodeId, currentMapId.value, { x, y });
}

function handleLocationClick(locationNode: BookNode) {
  // Futuro: Si el nodo tiene un targetMapId, cambiar currentMapId a ese valor
  if (locationNode.data.targetMapId) {
    console.log(`Navegar al mapa: ${locationNode.data.targetMapId}`);
    currentMapId.value = locationNode.data.targetMapId;
  } else {
    console.log(`Clic en localización: ${locationNode.label}`);
    // Aquí podrías abrir un panel de edición para la localización, por ejemplo.
  }
}
</script>

<style lang="scss" scoped>
.draggable-item {
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
}
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}
.map-image {
  width: 100%;
  height: 100%;
}
</style>
