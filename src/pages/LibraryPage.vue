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
        @click="isAddBookDialogOpen = true"
      />
    </div>

    <!-- Mensaje si no hay libros -->
    <div
      v-if="!libraryStore.isInitialized || libraryStore.books.length === 0"
      class="text-center text-grey-5 q-mt-xl"
    >
      <q-spinner-dots color="primary" size="40px" v-if="!libraryStore.isInitialized" />
      <div v-else>
        <q-icon name="sentiment_dissatisfied" size="4rem" />
        <p class="text-h6">No hay libros en la biblioteca. ¡Crea tu primer libro!</p>
      </div>
    </div>

    <!-- Grid de libros -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="book in libraryStore.books"
        :key="book.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="bg-grey-9 text-white column">
          <!-- Hacemos que la imagen y la sección de texto sean clickables -->
          <div class="cursor-pointer col" @click="openBook(book.id)">
            <q-img
              :src="book.image || 'https://cdn.quasar.dev/img/material.png'"
              :ratio="16/9"
            >
              <div class="absolute-bottom text-subtitle1 text-center">
                {{ book.name }}
              </div>
            </q-img>
            <q-card-section>
              <p class="text-caption text-grey-5 ellipsis-3-lines">
                {{ book.description || 'Sin descripción.' }}
              </p>
            </q-card-section>
          </div>

          <!-- SECCIÓN DE ACCIONES CON LOS NUEVOS BOTONES -->
          <q-space />
          <q-card-actions align="right" class="q-pt-none">
            <q-btn
              flat
              round
              dense
              icon="edit"
              @click="onEditBook(book)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click="onDeleteBook(book)"
            >
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Diálogos -->
    <add-book-dialog
      v-model="isAddBookDialogOpen"
      @submit="handleBookSubmit"
    />
    <edit-book-dialog
      v-model="isEditDialogOpen"
      :initial-data="editingBook"
      @submit="handleBookUpdate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useLibraryStore } from 'src/stores/library-store';
import type { Book } from 'src/components/models';
import AddBookDialog from 'src/components/AddBookDialog.vue';
import EditBookDialog from 'src/components/EditBookDialog.vue'; // Importar el nuevo diálogo

const libraryStore = useLibraryStore();
const router = useRouter();
const $q = useQuasar();

// State para los diálogos
const isAddBookDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingBook = ref<Book | null>(null);

// --- Lógica para CREAR un libro (sin cambios) ---
async function handleBookSubmit(data: { name: string; description: string }) {
  $q.loading.show({ message: 'Creando libro...' });
  try {
    await libraryStore.addBook(data);
    $q.notify({
      color: 'positive',
      message: `Libro "${data.name}" creado con éxito.`,
    });
  } catch (error) {
    const err = error as Error;
    $q.notify({
      color: 'negative',
      message: `Hubo un error al crear el libro: ${err.message}`,
    });
  } finally {
    $q.loading.hide();
  }
}

// --- NUEVA Lógica para EDITAR un libro ---
function onEditBook(book: Book) {
  editingBook.value = book;
  isEditDialogOpen.value = true;
}

async function handleBookUpdate(data: { name: string; description: string }) {
  if (!editingBook.value) return;

  $q.loading.show({ message: 'Guardando cambios...' });
  try {
    await libraryStore.updateBook(editingBook.value.id, data);
    $q.notify({
      color: 'positive',
      message: 'Libro actualizado con éxito.',
    });
  } catch (error) {
    const err = error as Error;
    $q.notify({
      color: 'negative',
      message: `Error al actualizar: ${err.message}`,
    });
  } finally {
    $q.loading.hide();
    editingBook.value = null;
  }
}

// --- NUEVA Lógica para ELIMINAR un libro ---
function onDeleteBook(book: Book) {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de que quieres eliminar el libro "<strong>${book.name}</strong>"? Esta acción no se puede deshacer y borrará todos sus archivos.`,
    html: true,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Eliminar',
      color: 'negative',
    },
  }).onOk(async () => {
    $q.loading.show({ message: 'Eliminando libro...' });
    try {
      await libraryStore.removeBook(book.id);
      $q.notify({
        color: 'positive',
        message: 'Libro eliminado con éxito.',
      });
    } catch (error) {
      const err = error as Error;
      $q.notify({
        color: 'negative',
        message: `Error al eliminar: ${err.message}`,
      });
    } finally {
      $q.loading.hide();
    }
  });
}

function openBook(bookId: string) {
  void router.push({ name: 'book-editor', params: { id: bookId } });
  console.log('Abrir libro con ID:', bookId);
}
</script>

<style scoped>
.ellipsis-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 50px; /* Ajusta según el tamaño de tu fuente */
}
/* Para que la tarjeta ocupe todo el alto y los botones se alineen abajo */
.column {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
