<!-- src/pages/AssetsPage.vue -->
<template>
  <q-page padding class="text-white">
    <!-- 1. Cabecera con título y botón de añadir -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Gestor de Assets</div>
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
        <div class="col-12 col-sm-6 col-md-4">
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
        <div class="col-6 col-md-3">
          <q-select
            v-model="categoryFilter"
            :options="categoryOptions"
            label="Categoría"
            dark
            dense
            clearable
            standout="bg-grey-8"
            :disable="!bookId || categoryOptions.length === 0"
          />
        </div>

        <!-- Filtro por tipo -->
        <div class="col-6 col-md-3">
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
            <div class="text-h6 ellipsis" :title="asset.name">{{ asset.name }}</div>
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

    <!-- 4. Mensaje cuando no hay assets o libro seleccionado -->
    <div v-else class="text-center text-h6 text-grey-6 q-mt-xl">
      <q-icon name="image_search" size="3em" class="q-mb-sm" />
      <div v-if="!bookId">Selecciona un libro para gestionar sus assets.</div>
      <div v-else>No se encontraron assets con los filtros actuales.</div>
    </div>

    <!-- Diálogo para añadir assets -->
    <add-asset-dialog
      v-model="isAddDialogOpen"
      @submit="handleAssetSubmit"
    />

    <!-- Diálogo para editar assets -->
    <edit-asset-dialog
      v-if="editingAsset"
      v-model="isEditDialogOpen"
      :asset="editingAsset"
      @submit="handleAssetUpdate"
      @update:modelValue="handleDialogClose"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { type Asset } from 'src/stores/types';
import { useAssetsStore } from 'src/stores/assets-store';
import { storeToRefs } from 'pinia';
import AddAssetDialog from 'src/components/AddAssetDialog.vue';
import EditAssetDialog from 'src/components/EditAssetDialog.vue';

// --- PROPS ---
const props = defineProps<{
  bookId: string | null;
}>();

// --- INICIALIZACIÓN ---
const $q = useQuasar();
const assetsStore = useAssetsStore();
const { assets } = storeToRefs(assetsStore);

// --- STATE PARA FILTROS ---
const searchTerm = ref('');
const categoryFilter = ref<string | null>(null);
const typeFilter = ref<Asset['type'] | null>('image');

// --- STATE PARA DIÁLOGOS ---
const isAddDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingAsset = ref<Asset | null>(null);

const categoryOptions = computed(() => {
  // A small improvement: check for length to be more explicit
  if (!assets.value || assets.value.length === 0) return [];
  const categories = assets.value.map(asset => asset.category);
  return [...new Set(categories)];
});

const filteredAssets = computed(() => {
  if (!assets.value || assets.value.length === 0) return [];
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

// --- ACCIONES DE LA UI ---
const openAddDialog = () => {
  isAddDialogOpen.value = true;
};

const openEditDialog = (asset: Asset) => {
  editingAsset.value = { ...asset }; // Copiar el asset para evitar mutaciones directas
  isEditDialogOpen.value = true;
};

const handleDialogClose = (isOpen: boolean) => {
  if (!isOpen) {
    editingAsset.value = null;
  }
};

const handleAssetSubmit = async (data: { file: File; name: string; category: string }) => {
  if (!props.bookId) {
    $q.notify({ message: 'Error: No hay libro seleccionado.', color: 'negative' });
    return;
  }
  $q.loading.show({ message: 'Guardando asset...' });
  try {
    const newAsset = await assetsStore.addAsset(data.file, data.name, data.category);
    if (newAsset) {
      isAddDialogOpen.value = false;
      $q.notify({
        message: `Asset "${data.name}" añadido correctamente.`,
        color: 'positive',
        icon: 'check_circle',
      });
    } else {
      throw new Error('No se pudo guardar el asset.');
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

const handleAssetUpdate = async (data: { id: string; name: string; category: string }) => {
  $q.loading.show({ message: 'Actualizando asset...' });
  try {
    // Asumimos que `updateAsset` existirá en el store y será async
    await assetsStore.updateAsset(data.id, {
      name: data.name,
      category: data.category,
    });
    isEditDialogOpen.value = false;
    $q.notify({
      message: `Asset "${data.name}" actualizado correctamente.`,
      color: 'positive',
      icon: 'check_circle',
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      message: 'Error al actualizar el asset.',
      color: 'negative',
      icon: 'error',
    });
  } finally {
    $q.loading.hide();
  }
};

const confirmDelete = (asset: Asset) => {
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
    $q.loading.show({ message: 'Eliminando asset...' });
    try {
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
    } finally {
      $q.loading.hide();
    }
  });
};
</script>

<style lang="scss" scoped>
.asset-card {
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
