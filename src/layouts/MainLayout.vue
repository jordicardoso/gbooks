<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh lpr lFf">
    <!-- 1. Cabecera con fondo gris oscuro y texto blanco -->
    <q-header bordered v-if="isHeaderVisible" class="bg-grey-9 text-white">
      <!-- Barra de Título Superior -->
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">
          GameBooks design & test
        </q-toolbar-title>

        <q-space />

        <q-btn
          flat
          round
          @click="toggleDarkMode"
          :icon="darkModeIcon"
        />
      </q-toolbar>

      <!-- Barra de Navegación con Pestañas -->
      <q-tabs
        align="left"
        dense
        class="custom-tabs-minimal"
        active-color="primary"
        indicator-color="primary"
      >
        <q-route-tab
          v-for="route in menuRoutes"
          :key="route.path"
          :to="route.path"
          :label="route.name"
          exact
          dense
          no-caps
        />
      </q-tabs>
    </q-header>

    <!-- 3. Contenedor de página con fondo azul marino -->
    <q-page-container class="bg-blue-grey-10 overflow-hidden">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAssetsStore } from 'src/stores/assets-store'; // 1. Importar el store de assets

const router = useRouter();
const $q = useQuasar();
const assetsStore = useAssetsStore(); // 2. Instanciar el store

// --- Lógica para el modo oscuro (sin cambios) ---
const darkModeIcon = computed(() => ($q.dark.isActive ? 'light_mode' : 'dark_mode'));
function toggleDarkMode() {
  $q.dark.toggle();
  localStorage.setItem('darkMode', String($q.dark.isActive));
}

onMounted(async () => { // 3. Hacer el hook asíncrono
  const darkModeIsActive = localStorage.getItem('darkMode') === 'true';
  $q.dark.set(darkModeIsActive);

  // 4. Llamar a la acción para cargar los assets al iniciar
  await assetsStore.loadAssets();
});

// --- Lógica para las rutas del menú (ACTUALIZADA) ---
const menuRoutes = computed(() => {
  const mainLayoutRoute = router.options.routes.find(r => r.path === '/');
  const children = mainLayoutRoute?.children || [];

  // 3. Filtramos las rutas para mostrar solo las que deben estar en el menú
  return children.filter(route => route.meta?.showInMenu !== false);
});

// --- Lógica para controlar la visibilidad de la cabecera (sin cambios) ---
const isHeaderVisible = ref(true);
</script>

<style lang="scss">
/* 4. Estilos ajustados para el menú sobre fondo oscuro */
.custom-tabs-minimal {
  .q-tab {
    min-height: 32px;
    padding: 0 12px;
  }

  .q-tab__label {
    font-size: 0.8rem;
    font-weight: 500;
    /* Opacidad para pestañas inactivas para que no destaquen tanto */
    opacity: 0.7;
  }

  /* La pestaña activa recupera la opacidad y gana peso para destacar */
  .q-tab--active .q-tab__label {
    opacity: 1;
    font-weight: 700;
  }
}
</style>
