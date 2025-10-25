<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh lpr lFf">
    <q-page-container class="bg-blue-grey-10 overflow-hidden">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLibraryStore } from 'src/stores/library-store';

const router = useRouter();
const $q = useQuasar();
const libraryStore = useLibraryStore();

const darkModeIcon = computed(() => ($q.dark.isActive ? 'light_mode' : 'dark_mode'));
function toggleDarkMode() {
  $q.dark.toggle();
  localStorage.setItem('darkMode', String($q.dark.isActive));
}

onMounted(async () => {
  const darkModeIsActive = localStorage.getItem('darkMode') === 'true';
  $q.dark.set(darkModeIsActive);

  await libraryStore.initializeLibrary();
});

const menuRoutes = computed(() => {
  const mainLayoutRoute = router.options.routes.find(r => r.path === '/');
  const children = mainLayoutRoute?.children || [];

  return children.filter(route => route.meta?.showInMenu !== false);
});

const isHeaderVisible = ref(true);
</script>

<style lang="scss">
/* Estilos sin cambios */
.custom-tabs-minimal {
  .q-tab {
    min-height: 32px;
    padding: 0 12px;
  }

  .q-tab__label {
    font-size: 0.8rem;
    font-weight: 500;
    opacity: 0.7;
  }

  .q-tab--active .q-tab__label {
    opacity: 1;
    font-weight: 700;
  }
}
</style>
