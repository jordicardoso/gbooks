<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-grey-10">
        <q-toolbar-title>
          Gbooks Editor
        </q-toolbar-title>

        <!-- Selector de Idioma -->
        <q-select
          v-model="locale"
          :options="localeOptions"
          dense
          borderless
          emit-value
          map-options
          options-dense
          dark
          color="white"
          style="min-width: 120px;"
        >
          <!-- Esto muestra el icono del mundo y el label del idioma seleccionado -->
          <template #prepend>
            <q-icon name="language" color="white" class="q-mr-sm" />
          </template>
        </q-select>

      </q-toolbar>
    </q-header>

    <q-page-container class="bg-dark">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'; // 1. Importamos 'onMounted'
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from 'src/stores/library-store'; // 2. Importamos el store

// --- INICIALIZACIÓN DE STORES ---
const libraryStore = useLibraryStore();

// 3. onMounted se ejecuta una sola vez cuando el layout está listo.
// Es el lugar perfecto y más seguro para cargar datos iniciales desde Electron.
onMounted(() => {
  libraryStore.initializeLibrary();
});


// --- LÓGICA DE INTERNACIONALIZACIÓN (i18n) ---
const { locale } = useI18n({ useScope: 'global' });

const localeOptions = [
  { value: 'es-ES', label: 'Español' },
  { value: 'en-US', label: 'English' },
  { value: 'ca-ES', label: 'Català' },
  { value: 'ru-RU', label: 'Русский' },
];

watch(locale, (newLocale) => {
  console.log(`Idioma cambiado a: ${newLocale}, guardando en localStorage.`);
  localStorage.setItem('user-locale', newLocale);
});
</script>
