<!-- src/pages/BookPage.vue -->
<template>
  <q-page class="flex column no-wrap">
    <!-- Barra de herramientas superior -->
    <q-toolbar class="bg-grey-9 text-white">
      <q-btn flat round dense icon="arrow_back" @click="goBack" />
      <q-toolbar-title v-if="bookStore.activeBook">
        Editando: {{ bookStore.activeBook.meta.title }}
      </q-toolbar-title>
      <q-space />
      <q-spinner color="primary" v-if="bookStore.isLoading" />
      <q-badge v-if="bookStore.isDirty" color="amber" text-color="black" label="Sin guardar" />
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
      <q-tab name="design" label="Diseño" />
      <q-tab name="assets" label="Assets" /> <!-- Pestaña añadida -->
      <q-tab name="meta" label="Metadatos" />
      <q-tab name="character" label="Ficha de Personaje" />
      <q-tab name="maps" label="Mapas" />
      <q-tab name="preview" label="Preview"/>
      <q-tab name="testing" label="Testing & Build" />
    </q-tabs>

    <q-separator />

    <!-- Paneles de contenido para cada pestaña -->
    <q-tab-panels v-model="tab" animated keep-alive class="col bg-blue-grey-10">
      <!-- Panel de Diseño (Grafo) -->
      <q-tab-panel name="design" class="q-pa-none">
        <BookGraph
          v-if="bookStore.activeBook"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        />
      </q-tab-panel>

      <!-- Panel de Assets (Añadido) -->
      <q-tab-panel name="assets" class="q-pa-none">
        <!-- El componente se renderiza aquí, pasándole el ID del libro -->
        <AssetsPage v-if="props.id" :book-id="props.id" />
      </q-tab-panel>

      <!-- Panel de Metadatos -->
      <q-tab-panel name="meta">
        <div v-if="bookStore.activeBook" class="q-gutter-md">
          <q-input
            filled
            dark
            v-model="bookStore.activeBook.meta.title"
            label="Título del libro"
            @update:model-value="bookStore.setDirty()"
          />
          <q-input
            filled
            dark
            v-model="bookStore.activeBook.meta.author"
            label="Autor"
            @update:model-value="bookStore.setDirty()"
          />
          <q-input
            filled
            dark
            v-model="bookStore.activeBook.meta.description"
            label="Descripción"
            type="textarea"
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
            label="Imagen de portada"
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
                  No hay imágenes en los assets.
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div class="q-mt-lg">
            <p class="text-grey text-subtitle2">Vista previa de la portada:</p>
            <q-img
              v-if="coverImageUrl"
              :src="coverImageUrl"
              fit="contain"
              style="max-height: 400px; border-radius: 4px; background-color: rgba(0,0,0,0.2);"
            />
            <div v-else class="text-center text-grey-6 q-pa-xl bg-grey-9" style="border-radius: 4px;">
              <q-icon name="image" size="3rem" />
              <p class="q-mt-sm text-caption">Sin imagen de portada seleccionada</p>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Panel de Ficha de Personaje -->
      <q-tab-panel name="character" class="q-pa-none">
        <!-- El componente se renderiza aquí, pasándole el ID del libro -->
        <CharacterSheetPage v-if="props.id" :id="props.id" />
      </q-tab-panel>

      <!-- Panel de Mapas -->
      <q-tab-panel name="maps" class="q-pa-none">
        <!-- El componente se renderiza aquí, pasándole el ID del libro -->
        <BookMap v-if="props.id" :book-id="props.id" />
      </q-tab-panel>

      <q-tab-panel name="preview" class="q-pa-none column">
        <!-- El componente se renderiza aquí -->
        <BookPreview v-if="props.id" />
      </q-tab-panel>

      <!-- Panel de Testing -->
      <q-tab-panel name="testing" class="q-pa-none">
        <TestingPage /> <!-- El componente TestingPage se renderiza aquí -->
      </q-tab-panel>
    </q-tab-panels>

    <!-- Mensaje de carga general -->
    <div v-if="!bookStore.activeBook && bookStore.isLoading" class="absolute-center text-center">
      <q-spinner-dots color="primary" size="50px" />
      <div class="q-mt-md text-grey-5">Cargando libro...</div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue';
import { useRouter} from 'vue-router';
import { useBookStore } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

// Componentes para las pestañas
import BookGraph from 'src/components/BookGraph.vue';
import CharacterSheetPage from 'pages/CharacterSheetPage.vue';
import BookMap from 'src/components/BookMap.vue';
import AssetsPage from 'pages/AssetsPage.vue';
import TestingPage from 'pages/TestingPage.vue';
import BookPreview from 'src/components/BookPreview.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();
const bookStore = useBookStore();
const assetsStore = useAssetsStore();

const tab = ref('design'); // La pestaña inicial ahora es 'design'

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

// Carga el libro y los assets cuando el ID cambia
watch(() => props.id, (newBookId) => {
  if (newBookId) {
    bookStore.loadBookById(newBookId);
  } else {
    bookStore.clearBook();
  }
}, { immediate: true });

// Limpia los stores cuando el componente se destruye (al salir de la página)
onUnmounted(() => {
  if (bookStore.isDirty) {
    void bookStore.saveCurrentBook();
  }
  bookStore.clearBook();
});

function goBack() {
  router.push({ name: 'library' }); // Navega a la ruta de la biblioteca
}
</script>
