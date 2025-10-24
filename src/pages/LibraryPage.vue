<!-- src/pages/LibraryPage.vue -->
<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4 text-white">Biblioteca</div>
      <q-btn
        label="Añadir Libro"
        color="primary"
        icon="add"
        dense
      />
    </div>

    <!-- Mensaje si no hay libros -->
    <div
      v-if="libraryStore.books.length === 0"
      class="text-center text-grey-5 q-mt-xl"
    >
      <q-icon name="sentiment_dissatisfied" size="4rem" />
      <p class="text-h6">No hay libros en la biblioteca. ¡Añade uno!</p>
    </div>

    <!-- Contenedor de la cuadrícula de tarjetas ultra-compactas -->
    <div v-else class="row q-col-gutter-sm">
      <!-- 1. Columnas más densas para pantallas medianas y grandes -->
      <div
        v-for="book in libraryStore.books"
        :key="book.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <!-- 2. Tarjeta con layout horizontal -->
        <q-card
          class="bg-grey-9 text-white cursor-pointer"
          flat
          bordered
          @click="openBook(book.id)"
        >
          <div class="row no-wrap items-center">
            <!-- Columna de la Imagen (tamaño fijo) -->
            <div class="col-auto">
              <q-img
                :src="book.image"
                :ratio="1"
                width="70px"
                height="70px"
              >
                <template v-slot:error>
                  <div
                    class="absolute-full flex flex-center bg-negative text-white text-caption text-center"
                  >
                    Error
                  </div>
                </template>
              </q-img>
            </div>

            <!-- Columna de Información y Acciones -->
            <div class="col q-pa-sm">
              <div class="text-caption text-weight-bold ellipsis">
                {{ book.name }}
                <q-tooltip>{{ book.name }}</q-tooltip>
              </div>
              <div class="text-caption text-grey-5 ellipsis q-mb-xs">
                {{ book.jsonFile }}
              </div>

              <!-- 3. Acciones integradas y más pequeñas -->
              <div class="row items-center justify-end">
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="edit"
                  size="xs"
                  @click.stop="editBook(book.id)"
                />
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  size="xs"
                  @click.stop="libraryStore.removeBook(book.id)"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLibraryStore } from 'src/stores/library-store';

const libraryStore = useLibraryStore();
const router = useRouter();

function openBook(bookId: string) {
  // CORREGIDO: Se usa 'void' para la promesa flotante
  void router.push({ name: 'book-editor', params: { id: bookId } });
}

function editBook(bookId: string) {
  // CORREGIDO: Se usa 'void' para la promesa flotante
  void router.push({ name: 'book-editor', params: { id: bookId } });
}

onMounted(() => {
  if (libraryStore.books.length === 0) {
    libraryStore.loadSampleData();
  }
});
</script>
