<!-- src/pages/LibraryPage.vue -->
<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4 text-white">{{ $t('library.title') }}</div>
      <q-btn
        :label="$t('library.addBook')"
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
        <p class="text-h6">{{ $t('library.noBooks') }}</p>
      </div>
    </div>

    <!-- Grid de libros con el nuevo diseño -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="book in libraryStore.books"
        :key="book.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="bg-grey-9 text-white column">
          <q-img
            :src="coverImages.get(book.id) || 'https://cdn.quasar.dev/img/material.png'"
            :ratio="16 / 9"
            class="cursor-pointer"
            @click="openBook(book.id)"
          >
            <div class="absolute-top bg-transparent-gradient-top full-width">
              <div class="row items-center justify-between no-wrap q-pa-sm">
                <!-- Título a la izquierda -->
                <div class="text-h6 ellipsis col q-pr-sm">
                  {{ book.name }}
                </div>
                <!-- Botones a la derecha -->
                <div class="col-auto">
                  <q-btn flat round dense size="sm" icon="edit" @click.stop="onEditBook(book)">
                    <q-tooltip>{{ $t('library.editTooltip') }}</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="delete"
                    color="negative"
                    @click.stop="onDeleteBook(book)"
                  >
                    <q-tooltip>{{ $t('library.deleteTooltip') }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </q-img>
          <q-card-section>
            <p class="text-caption text-grey-5 ellipsis-3-lines">
              {{ book.description || $t('library.noDescription') }}
            </p>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Diálogos (sin cambios) -->
    <add-book-dialog v-model="isAddBookDialogOpen" @submit="handleBookSubmit" />
    <edit-book-dialog
      v-model="isEditDialogOpen"
      :initial-data="editingBook"
      @submit="handleBookUpdate"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from 'src/stores/library-store';
import type { Book } from 'src/components/models';
import AddBookDialog from 'src/components/AddBookDialog.vue';
import EditBookDialog from 'src/components/EditBookDialog.vue';

const libraryStore = useLibraryStore();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n(); // <-- 2. Obtener la función de traducción 't'

onMounted(() => {
  void libraryStore.initializeLibrary();
});

// State para los diálogos
const isAddBookDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingBook = ref<Book | null>(null);

// --- State para almacenar las URLs de las portadas (sin cambios) ---
const coverImages = ref(new Map<string, string>());

// --- Observador para cargar las portadas (sin cambios) ---
watch(
  () => libraryStore.books,
  async (books) => {
    if (!books || books.length === 0) {
      coverImages.value.clear();
      return;
    }

    const coverPromises = books.map(async (book) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coverInfo = await (window as any).electronAPI.getCoverInfo(book.id);
        if (coverInfo?.filename) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const imageUrl = await (window as any).electronAPI.getAssetPath(
            book.id,
            coverInfo.filename,
          );
          return { bookId: book.id, imageUrl };
        }
      } catch (error) {
        console.error(`No se pudo cargar la portada para el libro ${book.id}:`, error);
      }
      return { bookId: book.id, imageUrl: null };
    });

    const results = await Promise.all(coverPromises);

    const newImageMap = new Map<string, string>();
    for (const result of results) {
      if (result.imageUrl) {
        newImageMap.set(result.bookId, result.imageUrl);
      }
    }
    coverImages.value = newImageMap;
  },
  { immediate: true, deep: true },
);

// --- Lógica para CREAR un libro (modificada para i18n) ---
async function handleBookSubmit(data: { name: string; description: string }) {
  $q.loading.show({ message: t('notifications.creatingBook') });
  try {
    await libraryStore.addBook(data);
    $q.notify({
      color: 'positive',
      message: t('notifications.bookCreatedSuccess', { bookName: data.name }),
    });
  } catch (error) {
    const err = error as Error;
    $q.notify({
      color: 'negative',
      message: t('notifications.bookCreatedError', { errorMessage: err.message }),
    });
  } finally {
    $q.loading.hide();
  }
}

// --- Lógica para EDITAR un libro (modificada para i18n) ---
function onEditBook(book: Book) {
  editingBook.value = book;
  isEditDialogOpen.value = true;
}

async function handleBookUpdate(data: { name: string; description: string }) {
  if (!editingBook.value) return;

  $q.loading.show({ message: t('notifications.savingChanges') });
  try {
    await libraryStore.updateBook(editingBook.value.id, data);
    $q.notify({
      color: 'positive',
      message: t('notifications.bookUpdatedSuccess'),
    });
  } catch (error) {
    const err = error as Error;
    $q.notify({
      color: 'negative',
      message: t('notifications.bookUpdatedError', { errorMessage: err.message }),
    });
  } finally {
    $q.loading.hide();
    editingBook.value = null;
  }
}

// --- Lógica para ELIMINAR un libro (modificada para i18n) ---
function onDeleteBook(book: Book) {
  $q.dialog({
    title: t('dialogs.deleteBook.title'),
    message: t('dialogs.deleteBook.message', { bookName: book.name }),
    html: true,
    cancel: true,
    persistent: true,
    ok: {
      label: t('dialogs.deleteBook.okButton'),
      color: 'negative',
    },
  }).onOk(() => {
    void (async () => {
      $q.loading.show({ message: t('notifications.deletingBook') });
      try {
        await libraryStore.removeBook(book.id);
        $q.notify({
          color: 'positive',
          message: t('notifications.bookDeletedSuccess'),
        });
      } catch (error) {
        const err = error as Error;
        $q.notify({
          color: 'negative',
          message: t('notifications.bookDeletedError', { errorMessage: err.message }),
        });
      } finally {
        $q.loading.hide();
      }
    })();
  });
}

// --- Lógica para abrir un libro (sin cambios) ---
function openBook(bookId: string) {
  void router.push({ name: 'book-editor', params: { id: bookId } });
  console.log('Abrir libro con ID:', bookId);
}
</script>

<style scoped>
.ellipsis-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
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
