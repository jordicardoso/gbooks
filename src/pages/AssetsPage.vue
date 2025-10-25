<!-- src/pages/AssetsPage.vue -->
<template>
  <q-page padding class="text-white">
    <!-- 1. Cabecera con título y botón de añadir -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Gestor de Assets</div>
      <!-- CORRECTED: The comment is removed from inside the tag -->
      <q-btn
        color="primary"
        icon="add"
        label="Añadir Asset"
        dense
        @click="openAddDialog"
        :disable="!bookId"
      />
    </div>

    <!-- 2. Barra de filtros y búsqueda -->
    <q-card class="bg-grey-9 q-mb-sm">
      <q-card-section class="row q-col-gutter-md items-end q-pa-sm">
        <!-- Buscador por nombre -->
        <div class="col-6 col-md-4">
          <q-input
            v-model="searchTerm"
            label="Buscar por nombre..."
            dark
            dense
            clearable
            standout="bg-grey-8"
            :disable="!bookId"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Filtro por categoría -->
        <div class="col-3 col-md-3">
          <q-select
            v-model="categoryFilter"
            :options="categoryOptions"
            label="Categoría"
            dark
            dense
            clearable
            standout="bg-grey-8"
            :disable="!bookId"
          />
        </div>

        <!-- Filtro por tipo -->
        <div class="col-3 col-md-3">
          <q-select
            v-model="typeFilter"
            :options="['image']"
            label="Tipo"
            dark
            dense
            clearable
            standout="bg-grey-8"
            :disable="!bookId"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- 3. Grid de assets -->
    <div v-if="bookId && filteredAssets.length > 0" class="row q-col-gutter-md">
      <div
        v-for="asset in filteredAssets"
        :key="asset.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="asset-card bg-grey-10">
          <q-img :src="assetsStore.getAssetUrl(asset.filename)" :ratio="16 / 9">
            <div class="absolute-bottom-right text-subtitle2 q-pa-xs bg-primary" style="border-top-left-radius: 3px;">
              {{ asset.category }}
            </div>
          </q-img>

          <q-card-section>
            <div class="text-h6 ellipsis">{{ asset.name }}</div>
            <div class="text-caption text-grey-5">
              Añadido: {{ new Date(asset.creationDate).toLocaleDateString() }}
            </div>
          </q-card-section>

          <q-separator dark />

          <q-card-actions align="right">
            <q-btn flat round color="primary" icon="edit" @click="openEditDialog(asset)" />
            <q-btn flat round color="negative" icon="delete" @click="confirmDelete(asset)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- 4. Mensaje cuando no hay assets -->
    <div v-else class="text-center text-h6 text-grey-6 q-mt-xl">
      <q-icon name="image_search" size="3em" class="q-mb-sm" />
      <div v-if="!bookId">Selecciona un libro para gestionar sus assets.</div>
      <div v-else>No se encontraron assets para este libro con los filtros actuales.</div>
    </div>

    <!-- Diálogo para añadir assets (existente) -->
    <add-asset-dialog
      v-model="isAddDialogOpen"
      @submit="handleAssetSubmit"
    />

    <!-- Diálogo para editar assets -->
    <edit-asset-dialog
      v-model="isEditDialogOpen"
      :asset="editingAsset"
      @submit="handleAssetUpdate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAssetsStore, Asset } from 'src/stores/assets-store';
import { storeToRefs } from 'pinia';
import AddAssetDialog from 'src/components/AddAssetDialog.vue';
import EditAssetDialog from 'src/components/EditAssetDialog.vue';

// --- PROPS ---
const props = defineProps<{
  bookId: string | null; // Recibe el ID del libro como prop
}>();

const $q = useQuasar();
const assetsStore = useAssetsStore();

const { assets } = storeToRefs(assetsStore);
const categoryOptions = computed(() => assetsStore.getUniqueCategories);

// --- State para filtros ---
const searchTerm = ref('');
const categoryFilter = ref<string | null>(null);
const typeFilter = ref<Asset['type'] | null>('image');

// --- State para diálogos ---
const isAddDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingAsset = ref<Asset | null>(null);

// --- Lógica de carga y filtrado ---

// Cargar assets cuando el bookId cambie
watch(() => props.bookId, (newBookId) => {
  if (newBookId) {
    assetsStore.loadAssets(newBookId);
  } else {
    assets.value = []; // Limpiar assets si no hay libro seleccionado
  }
}, { immediate: true }); // Cargar assets al montar si ya hay bookId

const filteredAssets = computed(() => {
  let filtered = assets.value;

  if (searchTerm.value) {
    const lowerCaseSearch = searchTerm.value.toLowerCase();
    filtered = filtered.filter(asset =>
      asset.name.toLowerCase().includes(lowerCaseSearch)
    );
  }

  if (categoryFilter.value) {
    filtered = filtered.filter(asset => asset.category === categoryFilter.value);
  }

  if (typeFilter.value) {
    filtered = filtered.filter(asset => asset.type === typeFilter.value);
  }

  return filtered;
});

// --- Acciones de la UI ---
const openAddDialog = () => {
  isAddDialogOpen.value = true;
};

const openEditDialog = (asset: Asset) => {
  editingAsset.value = asset;
  isEditDialogOpen.value = true;
};

const handleAssetSubmit = async (data: { file: File; name: string; category: string }) => {
  if (!props.bookId) {
    $q.notify({ message: 'Error: No hay libro seleccionado para añadir assets.', color: 'negative' });
    return;
  }
  $q.loading.show({ message: 'Guardando asset...' });
  try {
    const success = await assetsStore.addAsset(props.bookId, data.file, data.name, data.category); // <-- PASAMOS bookId
    if (success) {
      isAddDialogOpen.value = false;
      $q.notify({
        message: `Asset "${data.name}" añadido correctamente.`,
        color: 'positive',
        icon: 'check_circle',
      });
    } else {
      throw new Error('No se pudo guardar el asset en el proceso principal.');
    }
  } catch (error) {
    console.error(error);
    $q.notify({
      message: 'Error al añadir el asset.',
      color: 'negative',
      icon: 'error',
    });
  } finally {
    $q.loading.hide();
  }
};

const handleAssetUpdate = (data: { id: string; name: string; category: string }) => {
  if (!props.bookId) {
    $q.notify({ message: 'Error: No hay libro seleccionado para actualizar assets.', color: 'negative' });
    return;
  }
  const success = assetsStore.updateAsset(props.bookId, data.id, { // <-- PASAMOS bookId
    name: data.name,
    category: data.category,
  });

  if (success) {
    isEditDialogOpen.value = false; // Cierra el diálogo
    $q.notify({
      message: `Asset "${data.name}" actualizado correctamente.`,
      color: 'positive',
      icon: 'check_circle',
    });
  } else {
    $q.notify({
      message: 'Error al actualizar el asset.',
      color: 'negative',
      icon: 'error',
    });
  }
};

const confirmDelete = (asset: Asset) => {
  // El bookId ya no es necesario aquí, el store lo gestiona
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de que quieres eliminar el asset "<b>${asset.name}</b>"? Esta acción no se puede deshacer.`,
    html: true,
    cancel: true,
    persistent: true,
    dark: true,
    ok: { color: 'negative', label: 'Eliminar' },
    cancel: { flat: true, label: 'Cancelar' },
  }).onOk(async () => {
    try {
      // --- CORRECCIÓN AQUÍ ---
      // 1. Se usa el nombre correcto: deleteAsset
      // 2. Se pasa solo el argumento necesario: asset.id
      await assetsStore.deleteAsset(asset.id);
      $q.notify({
        message: `Asset "${asset.name}" eliminado.`,
        color: 'positive',
        icon: 'check_circle',
      });
    } catch (error) {
      $q.notify({
        message: (error as Error).message || 'Error al eliminar el asset.',
        color: 'negative',
        icon: 'error',
      });
    }
  });
};
</script>

<style lang="scss" scoped>
.asset-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  }
}
</style>
