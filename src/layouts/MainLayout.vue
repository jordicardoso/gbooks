<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-grey-9">
      <q-toolbar>
        <template v-if="isBookEditorPage">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            @click="goBackToLibrary"
            :title="$t('bookPage.backToLibrary')"
          />
          <q-toolbar-title class="ellipsis">
            {{ bookStore.activeBook?.meta.title || 'Cargando...' }}
          </q-toolbar-title>
          <q-space />
          <q-btn
            flat
            :label="$t('bookPage.save')"
            icon="save"
            @click="saveBook"
            :disable="!bookStore.isDirty || isSaving"
            :loading="isSaving"
          />
        </template>

        <!-- B. Barra de herramientas por defecto para el resto de la app -->
        <template v-else>
          <q-toolbar-title>
            G-Books
          </q-toolbar-title>
        </template>

        <LanguageSwitcher />

      </q-toolbar>
    </q-header>

    <q-page-container class="bg-grey-8">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useBookStore } from 'src/stores/book-store';
import LanguageSwitcher from 'src/components/LanguageSwitcher.vue';

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const bookStore = useBookStore();

const isSaving = ref(false);

// Computada para saber si estamos en la página del editor de libros
const isBookEditorPage = computed(() => route.name === 'book-editor');

// Función para volver a la biblioteca
function goBackToLibrary() {
  // Aquí podrías añadir una confirmación si hay cambios sin guardar
  router.push({ name: 'library' });
}

// Función para guardar el libro (lógica movida desde BookPage.vue)
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
</script>
