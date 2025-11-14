<!-- src/pages/BookPage.vue -->
<template>
  <q-page class="fit column no-wrap">
    <!-- Barra de herramientas superior -->
    <q-toolbar class="bg-grey-9 text-white">
      <q-btn flat round dense icon="arrow_back" @click="goBack" />
      <q-toolbar-title v-if="bookStore.activeBook">
        {{ $t('bookPage.editingTitle') }}: {{ bookStore.activeBook.meta.title }}
      </q-toolbar-title>
      <q-space />
      <q-spinner color="primary" v-if="bookStore.isLoading" />
      <q-badge v-if="bookStore.isDirty" color="amber" text-color="black" :label="$t('bookPage.unsavedChanges')" class="q-mr-sm" />
    </q-toolbar>

    <!-- Pestañas de navegación -->
    <q-tabs
      v-model="tab"
      dense
      class="text-grey bg-grey-10"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="design" :label="$t('bookPage.tabs.design')" />
      <q-tab name="assets" :label="$t('bookPage.tabs.assets')" />
      <q-tab name="meta" :label="$t('bookPage.tabs.metadata')" />
      <q-tab name="character" :label="$t('bookPage.tabs.characterSheet')" />
      <q-tab name="maps" :label="$t('bookPage.tabs.maps')" />
      <q-tab name="preview" :label="$t('bookPage.tabs.preview')"/>
      <q-tab name="testing" :label="$t('bookPage.tabs.testing')" />
    </q-tabs>

    <q-separator />

    <!-- Paneles de contenido para cada pestaña -->
    <q-tab-panels v-model="tab" animated keep-alive class="fit col bg-blue-grey-10">
      <!-- Panel de Diseño (Grafo) -->
      <q-tab-panel name="design" class="q-pa-none">
        <BookGraph
          v-if="bookStore.activeBook"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        />
      </q-tab-panel>

      <!-- Panel de Assets -->
      <q-tab-panel name="assets" class="q-pa-none">
        <AssetsPage v-if="props.id" :book-id="props.id" />
      </q-tab-panel>

      <!-- Panel de Metadatos -->
      <q-tab-panel name="meta">
        <div v-if="bookStore.activeBook" class="q-gutter-md">
          <q-input
            filled
            dark
            v-model="bookStore.activeBook.meta.title"
            :label="$t('bookPage.meta.titleLabel')"
            @update:model-value="bookStore.setDirty()"
          />
          <q-input
            filled
            dark
            v-model="bookStore.activeBook.meta.author"
            :label="$t('bookPage.meta.authorLabel')"
            type="textarea"
            autogrow
            @update:model-value="bookStore.setDirty()"
          />
          <q-input
            filled
            dark
            v-model="bookStore.activeBook.meta.description"
            :label="$t('bookPage.meta.descriptionLabel')"
            type="textarea"
            autogrow
            @update:model-value="bookStore.setDirty()"
          />
          <q-select
            filled
            dark
            v-model="bookStore.activeBook.meta.imageId"
            :options="imageAssetOptions"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            :label="$t('bookPage.meta.coverImageLabel')"
            clearable
            @update:model-value="bookStore.setDirty()"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-img :src="scope.opt.src" style="width: 50px; height: 50px;" fit="cover" />
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
                  {{ $t('bookPage.meta.noImageAssets') }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div class="q-mt-lg">
            <p class="text-grey text-subtitle2">{{ $t('bookPage.meta.coverPreviewTitle') }}</p>
            <q-img
              v-if="coverImageUrl"
              :src="coverImageUrl"
              fit="contain"
              style="max-height: 400px; border-radius: 4px; background-color: rgba(0,0,0,0.2);"
            />
            <div v-else class="text-center text-grey-6 q-pa-xl bg-grey-9" style="border-radius: 4px;">
              <q-icon name="image" size="3rem" />
              <p class="q-mt-sm text-caption">{{ $t('bookPage.meta.noCoverSelected') }}</p>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Otros paneles... -->
      <q-tab-panel name="character" class="q-pa-none">
        <CharacterSheetPage v-if="props.id" :id="props.id" />
      </q-tab-panel>
      <q-tab-panel name="maps" class="q-pa-none">
        <BookMap v-if="props.id" :book-id="props.id" />
      </q-tab-panel>
      <q-tab-panel name="preview" class="fit col q-pa-none column" style="flex: 1; min-height: 0;">
        <BookPreview v-if="props.id" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"/>
      </q-tab-panel>
      <q-tab-panel name="testing" class="q-pa-none">
        <TestingPage />
      </q-tab-panel>
    </q-tab-panels>

    <!-- Mensaje de carga general -->
    <div v-if="!bookStore.activeBook && bookStore.isLoading" class="absolute-center text-center">
      <q-spinner-dots color="primary" size="50px" />
      <div class="q-mt-md text-grey-5">{{ $t('bookPage.loadingBook') }}</div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue';
import { useRouter} from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useBookStore } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';
import { useNodesStore } from 'src/stores/nodes-store';

// Componentes para las pestañas
import BookGraph from 'src/components/BookGraph.vue';
import CharacterSheetPage from 'pages/CharacterSheetPage.vue';
import BookMap from 'pages/BookMap.vue';
import AssetsPage from 'pages/AssetsPage.vue';
import TestingPage from 'pages/TestingPage.vue';
import BookPreview from 'pages/BookPreview.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();
const bookStore = useBookStore();
const assetsStore = useAssetsStore();
const nodesStore = useNodesStore();


const tab = ref('design');
const isSaving = ref(false);

const imageAssetOptions = computed(() =>
  assetsStore.assets
    .filter(asset => asset.type === 'image')
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      src: assetsStore.getAssetUrl(asset.filename)
    }))
);

const coverImageUrl = computed(() => {
  if (!bookStore.activeBook?.meta.imageId) return null;
  const asset = assetsStore.getAssetById(bookStore.activeBook.meta.imageId);
  return asset ? assetsStore.getAssetUrl(asset.filename) : null;
});

// [LA CLAVE] Se ha eliminado la llamada a nodesStore.init()
watch(() => props.id, (newBookId) => {
  if (newBookId) {
    // Ahora solo cargamos el libro. El book-store se encargará de poblar el nodes-store.
    bookStore.loadBookById(newBookId);
  } else {
    bookStore.clearBook();
  }
}, { immediate: true });

onUnmounted(() => {
  if (bookStore.isDirty) {
    // Guardar automáticamente al salir si hay cambios
    void saveBook();
  }
  bookStore.clearBook();
});

async function saveBook() {
  isSaving.value = true;
  try {
    await bookStore.saveCurrentBook();
    $q.notify({
      type: 'positive',
      message: t('bookPage.saveSuccess'),
      timeout: 1500,
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('bookPage.saveError'),
    });
  } finally {
    isSaving.value = false;
  }
}

function goBack() {
  router.push({ name: 'library' });
}
</script>
