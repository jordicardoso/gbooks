<!-- src/pages/CharacterSheetPage.vue -->
<template>
  <!-- Usamos un div contenedor que solo se muestra si el libro está cargado -->
  <div v-if="bookStore.activeBook">
    <CharacterSheetEditor />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useBookStore } from 'src/stores/book-store';
import CharacterSheetEditor from 'src/components/sheet/CharacterSheetEditor.vue';

const router = useRouter();
const bookStore = useBookStore();
</script>
