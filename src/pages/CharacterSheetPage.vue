<!-- src/pages/CharacterSheetPage.vue -->
<template>
  <q-page class="q-pa-md bg-blue-grey-10 text-white">
    <div class="row items-center q-mb-md">
      <q-btn icon="arrow_back" flat round dense @click="router.back()" class="q-mr-sm" />
      <div class="text-h6">
        Ficha de Personaje: {{ bookStore.meta.title || 'Sin título' }}
      </div>
    </div>

    <CharacterSheetEditor />

  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useBookStore } from 'src/stores/book-store';
import CharacterSheetEditor from 'src/components/sheet/CharacterSheetEditor.vue';

const router = useRouter();
const bookStore = useBookStore();
</script>
