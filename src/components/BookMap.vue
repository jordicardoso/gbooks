<!-- src/components/BookMap.vue -->
<template>
  <!-- Este q-card ahora es una columna flexible que ocupa todo el espacio disponible -->
  <q-card class="bg-grey-9 text-white column no-wrap fit">
    <q-card-section>
      <div class="text-h6">Mapa del Libro</div>
      <div class="text-subtitle2 text-grey-5">Selecciona un mapa de tus assets para asociarlo a este libro.</div>
    </q-card-section>

    <q-card-section>
      <q-select
        v-model="selectedMapId"
        :options="mapAssetOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Seleccionar Mapa"
        dark
        dense
        clearable
        @update:model-value="updateBookMap"
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-img :src="scope.opt.src" style="width: 40px; height: 40px; border-radius: 4px;" fit="cover" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label caption class="text-grey-5">{{ scope.opt.category }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              No hay mapas en los assets. Añade imágenes con la categoría 'map'.
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-card-section>

    <q-separator dark inset />

    <!-- Esta sección ahora usa "col" para crecer y llenar el espacio restante -->
    <q-card-section class="col map-display-section">
      <div v-if="currentMapUrl" class="map-container" @contextmenu.prevent="handleContextMenu">
        <q-img
          :src="currentMapUrl"
          fit="contain"
          class="map-image"
        />
        <q-menu context-menu>
          <q-list dense style="min-width: 150px">
            <q-item clickable v-close-popup @click="onAddNode">
              <q-item-section avatar>
                <q-icon name="add_location_alt" />
              </q-item-section>
              <q-item-section>Insertar Nodo</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
      <div v-else class="text-center text-grey-6 fit column items-center justify-center">
        <q-icon name="map" size="4rem" />
        <p class="q-mt-md">No hay ningún mapa seleccionado para este libro.</p>
        <p>Selecciona un mapa de la lista superior para asignarlo.</p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAssetsStore } from 'src/stores/assets-store';
import { useBookStore } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';

const $q = useQuasar();
const assetsStore = useAssetsStore();
const bookStore = useBookStore();

const { assets } = storeToRefs(assetsStore);
const { mapId } = storeToRefs(bookStore);

const selectedMapId = ref<string | null>(null);
const contextMenuCoords = ref({ x: 0, y: 0 });

// Filtrar assets para obtener solo los que son mapas
const mapAssetOptions = computed(() =>
  assets.value.filter(asset => asset.category === 'map' && asset.type === 'image')
);

// Obtener la URL del mapa actualmente seleccionado
const currentMapUrl = computed(() => {
  if (!selectedMapId.value) return null;
  const asset = assetsStore.getAssetById(selectedMapId.value);
  return asset ? asset.src : null;
});

// Sincronizar el ID del mapa del store con el estado local del componente
watch(mapId, (newId) => {
  selectedMapId.value = newId;
}, { immediate: true });

// Actualizar el store cuando el usuario cambia la selección
function updateBookMap(newMapId: string | null) {
  bookStore.setMapId(newMapId);
  $q.notify({
    message: 'Selección de mapa actualizada. No olvides guardar el libro.',
    color: 'info',
    icon: 'info',
  });
}

function handleContextMenu(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  contextMenuCoords.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function onAddNode() {
  const { x, y } = contextMenuCoords.value;
  $q.notify({
    message: `Añadir nodo en coordenadas: (${Math.round(x)}, ${Math.round(y)})`,
    color: 'primary',
    icon: 'add_circle_outline',
    caption: 'Funcionalidad en desarrollo.'
  });
  console.log('Intento de añadir un nodo en:', contextMenuCoords.value);
}

</script>

<style lang="scss" scoped>
.map-display-section {
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-container {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
}
.map-image {
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.2);
}
</style>
