<!-- src/pages/BookPage.vue -->
<template>
  <q-page class="fit column no-wrap">
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
      <q-tab-panel name="design" class="q-pa-none fit column no-wrap">
        <q-toolbar class="bg-grey-10 text-white q-px-md q-py-xs col-auto">
          <q-select
            v-model="filterNodeTypes"
            :options="nodeTypeOptions"
            label="Filtrar por Tipo"
            multiple
            dense
            dark
            clearable
            borderless
            emit-value
            map-options
            options-dense
            style="min-width: 200px"
            class="q-mr-md"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-select
            v-model="filterTags"
            :options="allAvailableTags"
            label="Filtrar por Etiqueta"
            multiple
            dense
            dark
            clearable
            borderless
            use-chips
            options-dense
            style="min-width: 250px"
          />

          <q-space />

          <q-btn
            v-if="isFilterActive"
            flat
            round
            dense
            icon="close"
            @click="clearFilters"
            title="Limpiar filtros"
          />
        </q-toolbar>

        <BookGraph
          ref="bookGraphRef"
          v-if="bookStore.activeBook"
          style="position: absolute; top: 48px; width: 100%; height: 95%;"
        />
      </q-tab-panel>
      <q-tab-panel name="assets" class="q-pa-none">
        <AssetsPage v-if="props.id" :book-id="props.id" />
      </q-tab-panel>
      <q-tab-panel name="meta">
      </q-tab-panel>
      <q-tab-panel name="character" class="q-pa-none">
        <CharacterSheetPage v-if="props.id" :id="props.id" />
      </q-tab-panel>

      <!-- Panel de Mapas -->
      <q-tab-panel name="maps" class="q-pa-none">
        <BookMap ref="bookMapRef" v-if="props.id" :book-id="props.id"/>
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

const bookGraphRef = ref<InstanceType<typeof BookGraph> | null>(null);
const bookMapRef = ref<InstanceType<typeof BookMap> | null>(null);

const filterNodeTypes = ref<string[]>([]);
const filterTags = ref<string[]>([]);

const nodeTypeOptions = [
  { label: 'Inicio', value: 'start' },
  { label: 'Párrafo', value: 'story' },
  { label: 'Final', value: 'end' },
  { label: 'Localización', value: 'location' },
];

const allAvailableTags = computed(() => {
  const tags = new Set<string>();
  nodesStore.nodes.forEach(node => {
    node.data?.tags?.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
});

const isFilterActive = computed(() => filterNodeTypes.value.length > 0 || filterTags.value.length > 0);

function clearFilters() {
  filterNodeTypes.value = [];
  filterTags.value = [];
}

watch([filterNodeTypes, filterTags], ([types, tags]) => {
  nodesStore.applyFilters({ types, tags });
}, { deep: true });

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

watch(tab, (newTab, oldTab) => {
  if (newTab !== 'design' && oldTab === 'design') {
    bookGraphRef.value?.clearSelection();
  }

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
  nodesStore.applyFilters({ types: [], tags: [] });
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
