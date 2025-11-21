<!-- src/pages/AssetsPage.vue -->
<template>
  <q-page padding class="text-white">
    <!-- 1. Cabecera con título y botón de añadir -->
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">{{ $t('assetsPage.title') }}</div>
      <q-btn
        color="primary"
        icon="add"
        :label="$t('assetsPage.addAsset')"
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
            :label="$t('assetsPage.searchPlaceholder')"
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
            :label="$t('assetsPage.categoryLabel')"
            dark
            dense
            clearable
            standout="bg-grey-8"
            :disable="!bookId"
          />
        </div>

        <!-- Filtro por tipo -->
        <div class="col-6 col-md-3">
          <q-select
            v-model="typeFilter"
            :options="['image']"
            :label="$t('assetsPage.typeLabel')"
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
          <!-- La imagen ahora es clicable y muestra un tooltip -->
          <q-img
            :src="assetsStore.getAssetUrl(asset.filename)"
            :ratio="16 / 9"
            class="cursor-pointer"
            @click="openPreview(asset)"
          >
            <q-tooltip>Ampliar imagen</q-tooltip>
            <div
              class="absolute-bottom-right text-subtitle2 q-pa-xs bg-primary"
              style="border-top-left-radius: 3px"
            >
              {{ asset.category }}
            </div>
          </q-img>

          <q-card-section>
            <div class="text-h6 ellipsis" :title="asset.name">{{ asset.name }}</div>
            <div class="text-caption text-grey-5">
              {{ $t('assetsPage.dateAdded') }}:
              {{ new Date(asset.creationDate).toLocaleDateString() }}
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
      <div v-if="!bookId">{{ $t('assetsPage.noBookSelected') }}</div>
      <div v-else>{{ $t('assetsPage.noAssetsFound') }}</div>
    </div>

    <!-- Diálogo para añadir assets -->
    <add-asset-dialog v-model="isAddDialogOpen" @submit="handleAssetSubmit" />

    <!-- Diálogo para editar assets -->
    <edit-asset-dialog
      v-if="editingAsset"
      v-model="isEditDialogOpen"
      :asset="editingAsset"
      @submit="handleAssetUpdate"
      @update:modelValue="handleDialogClose"
    />

    <!-- Diálogo para previsualizar la imagen -->
    <q-dialog v-model="isPreviewOpen" maximized>
      <q-card class="bg-transparent no-shadow flex flex-center" @click="isPreviewOpen = false">
        <q-img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          fit="contain"
          style="max-width: 90vw; max-height: 90vh; border-radius: 4px"
          class="cursor-pointer"
        />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { type BookAsset } from 'src/stores/types';
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
const { t } = useI18n();
const assetsStore = useAssetsStore();
const { assets } = storeToRefs(assetsStore);

// --- STATE PARA FILTROS ---
const searchTerm = ref('');
const categoryFilter = ref<string | null>(null);
const typeFilter = ref<BookAsset['type'] | null>('image');

// --- STATE PARA DIÁLOGOS ---
const isAddDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingAsset = ref<BookAsset | null>(null);

// --- State para la previsualización de imagen ---
const isPreviewOpen = ref(false);
const previewImageUrl = ref<string | null>(null);

const categoryOptions = ['General', 'Personaje', 'Mapa', 'Objecto'];

const filteredAssets = computed(() => {
  if (!assets.value || assets.value.length === 0) return [];

  let filtered = assets.value;

  // Aplicar filtros
  if (searchTerm.value) {
    const lowerCaseSearch = searchTerm.value.toLowerCase();
    filtered = filtered.filter((asset) => asset.name.toLowerCase().includes(lowerCaseSearch));
  }

  if (categoryFilter.value) {
    filtered = filtered.filter((asset) => asset.category === categoryFilter.value);
  }

  if (typeFilter.value) {
    filtered = filtered.filter((asset) => asset.type === typeFilter.value);
  }

  // [CAMBIO] Ordenar los resultados para mostrar los más nuevos primero.
  // Se crea una copia con [...filtered] para no mutar el estado original.
  return [...filtered].sort(
    (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime(),
  );
});

// --- ACCIONES DE LA UI ---
const openAddDialog = () => {
  isAddDialogOpen.value = true;
};

const openEditDialog = (asset: BookAsset) => {
  editingAsset.value = { ...asset };
  isEditDialogOpen.value = true;
};

// --- Acción para abrir la previsualización ---
const openPreview = (asset: BookAsset) => {
  previewImageUrl.value = assetsStore.getAssetUrl(asset.filename);
  isPreviewOpen.value = true;
};

const handleDialogClose = (isOpen: boolean) => {
  if (!isOpen) {
    editingAsset.value = null;
  }
};

const handleAssetSubmit = async (data: { file: File; name: string; category: string }) => {
  if (!props.bookId) {
    $q.notify({ message: t('assetsPage.notifications.noBookError'), color: 'negative' });
    return;
  }
  $q.loading.show({ message: t('assetsPage.notifications.saving') });
  try {
    const newAsset = await assetsStore.addAsset(data.file, data.name, data.category);
    if (newAsset) {
      isAddDialogOpen.value = false;
      $q.notify({
        message: t('assetsPage.notifications.savedSuccess', { assetName: data.name }),
        color: 'positive',
        icon: 'check_circle',
      });
    } else {
      throw new Error(t('assetsPage.notifications.saveFailed'));
    }
  } catch (error) {
    console.error(error);
    $q.notify({
      message: t('assetsPage.notifications.savedError'),
      color: 'negative',
      icon: 'error',
    });
  } finally {
    $q.loading.hide();
  }
};

const handleAssetUpdate = async (data: { id: string; name: string; category: string }) => {
  $q.loading.show({ message: t('assetsPage.notifications.updating') });
  try {
    await assetsStore.updateAsset(data.id, {
      name: data.name,
      category: data.category,
    });
    isEditDialogOpen.value = false;
    $q.notify({
      message: t('assetsPage.notifications.updatedSuccess', { assetName: data.name }),
      color: 'positive',
      icon: 'check_circle',
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      message: t('assetsPage.notifications.updatedError'),
      color: 'negative',
      icon: 'error',
    });
  } finally {
    $q.loading.hide();
  }
};

const confirmDelete = (asset: BookAsset) => {
  $q.dialog({
    title: t('assetsPage.dialogs.deleteAsset.title'),
    message: t('assetsPage.dialogs.deleteAsset.message', { assetName: asset.name }),
    html: true,
    persistent: true,
    dark: true,
    ok: { color: 'negative', label: t('assetsPage.dialogs.deleteAsset.okButton') },
    cancel: { flat: true, label: t('assetsPage.dialogs.deleteAsset.cancelButton') },
  }).onOk(() => {
    void (async () => {
      $q.loading.show({ message: t('assetsPage.notifications.deleting') });
      try {
        await assetsStore.deleteAsset(asset.id);
        $q.notify({
          message: t('assetsPage.notifications.deletedSuccess', { assetName: asset.name }),
          color: 'positive',
          icon: 'check_circle',
        });
      } catch (error) {
        $q.notify({
          message: (error as Error).message || t('assetsPage.notifications.deletedError'),
          color: 'negative',
          icon: 'error',
        });
      } finally {
        $q.loading.hide();
      }
    })();
  });
};
</script>

<style lang="scss" scoped>
.asset-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;

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
