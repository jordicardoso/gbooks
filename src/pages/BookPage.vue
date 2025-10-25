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
      <q-tab name="testing" label="Testing & Build" />
    </q-tabs>

    <q-separator />

    <!-- Paneles de contenido para cada pestaña -->
    <q-tab-panels v-model="tab" animated class="col bg-blue-grey-10">
      <!-- Panel de Diseño (Grafo) -->
      <q-tab-panel name="design" class="q-pa-none">
        <BookGraph
          v-if="bookStore.activeBook"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        />
      </q-tab-panel>

      <!-- Panel de Assets (Añadido) -->
      <q-tab-panel name="assets" class="q-pa-md">
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
        </div>
      </q-tab-panel>

      <!-- Panel de Ficha de Personaje -->
      <q-tab-panel name="character" class="q-pa-md">
        <!-- El componente se renderiza aquí, pasándole el ID del libro -->
        <CharacterSheetPage v-if="props.id" :id="props.id" />
      </q-tab-panel>

      <!-- Panel de Mapas -->
      <q-tab-panel name="maps" class="q-pa-md">
        <!-- El componente se renderiza aquí, pasándole el ID del libro -->
        <BookMap v-if="props.id" :book-id="props.id" />
      </q-tab-panel>

      <!-- Panel de Testing -->
      <q-tab-panel name="testing" class="q-pa-md">
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
import { ref, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBookStore } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';

// Componentes para las pestañas
import BookGraph from 'src/components/BookGraph.vue';
import CharacterSheetPage from 'pages/CharacterSheetPage.vue';
import BookMap from 'src/components/BookMap.vue';
import AssetsPage from 'pages/AssetsPage.vue';
import TestingPage from 'pages/TestingPage.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();
const bookStore = useBookStore();
const assetsStore = useAssetsStore();

const tab = ref('design'); // La pestaña inicial ahora es 'design'

// Carga el libro y los assets cuando el ID cambia
watch(
  () => props.id,
  async (newId) => {
    if (newId) {
      await bookStore.loadBookById(newId);
      await assetsStore.loadAssets(newId);
    }
  },
  { immediate: true }
);

// Limpia los stores cuando el componente se destruye (al salir de la página)
onUnmounted(() => {
  // Opcional: auto-guardar al salir
  if (bookStore.isDirty) {
    void bookStore.saveCurrentBook();
  }
  bookStore.clearBook();
  assetsStore.clearAssets();
});

function goBack() {
  router.push({ name: 'library' }); // Navega a la ruta de la biblioteca
}
</script>
