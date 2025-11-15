<!-- src/pages/BookPage.vue (CORREGIDO) -->
<template>
  <q-page class="fit column no-wrap">
    <!-- ... (barra de herramientas y pestañas no cambian) ... -->
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

    <q-tab-panels v-model="tab" animated keep-alive class="fit col bg-blue-grey-10">
      <!-- Panel de Diseño (Grafo) -->
      <q-tab-panel name="design" class="q-pa-none">
        <!-- Añadimos una referencia (ref) al componente -->
        <BookGraph
          ref="bookGraphRef"
          v-if="bookStore.activeBook"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        />
      </q-tab-panel>

      <!-- ... (otros paneles como assets, meta, character) ... -->
      <q-tab-panel name="assets" class="q-pa-none">
        <AssetsPage v-if="props.id" :book-id="props.id" />
      </q-tab-panel>
      <q-tab-panel name="meta">
        <!-- ... -->
      </q-tab-panel>
      <q-tab-panel name="character" class="q-pa-none">
        <CharacterSheetPage v-if="props.id" :id="props.id" />
      </q-tab-panel>

      <!-- Panel de Mapas -->
      <q-tab-panel name="maps" class="q-pa-none">
        <!-- [1. AÑADIDO] Añadimos una referencia (ref) al componente -->
        <BookMap
          ref="bookMapRef"
          v-if="props.id"
          :book-id="props.id"
        />
      </q-tab-panel>

      <!-- ... (resto de paneles) ... -->
      <q-tab-panel name="preview" class="fit col q-pa-none column" style="flex: 1; min-height: 0;">
        <BookPreview v-if="props.id" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"/>
      </q-tab-panel>
      <q-tab-panel name="testing" class="q-pa-none">
        <TestingPage />
      </q-tab-panel>
    </q-tab-panels>

    <!-- ... (resto del template) ... -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue';
import { useRouter} from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useBookStore } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

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

const tab = ref('design');
const isSaving = ref(false);

// [2. AÑADIDO] Creamos las referencias para apuntar a los componentes hijos
const bookGraphRef = ref<InstanceType<typeof BookGraph> | null>(null);
const bookMapRef = ref<InstanceType<typeof BookMap> | null>(null);

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

watch(() => props.id, (newBookId) => {
  if (newBookId) {
    bookStore.loadBookById(newBookId);
  } else {
    bookStore.clearBook();
  }
}, { immediate: true });

// [3. LA CLAVE] Observamos la variable 'tab' para controlar los paneles
watch(tab, (newTab, oldTab) => {
  // Lógica para el panel de edición del grafo
  if (newTab !== 'design' && oldTab === 'design') {
    bookGraphRef.value?.clearSelection();
  }

  // Lógica para el panel lateral de mapas
  if (newTab === 'maps') {
    bookMapRef.value?.openDrawer();
  } else if (oldTab === 'maps') {
    bookMapRef.value?.closeDrawer();
  }
});

onUnmounted(() => {
  if (bookStore.isDirty) {
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
