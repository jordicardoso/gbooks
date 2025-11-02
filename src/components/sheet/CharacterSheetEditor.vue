<!-- src/components/sheet/CharacterSheetEditor.vue -->
<template>
  <q-card class="bg-grey-9 text-white column no-wrap fit">
    <!-- El v-if ahora comprueba el schema, que es más fiable -->
    <div v-if="characterSheetSchema?.layout.length" class="q-gutter-y-lg q-pa-md">
      <!-- CABECERA CON EL NUEVO BOTÓN -->
      <div class="row items-center q-mb-md">
        <div class="text-h5">Editor de Ficha</div>
        <q-space />
        <q-btn
          label="Diseñar Ficha"
          icon="design_services"
          flat
          @click="isDesignerOpen = true"
        >
          <q-tooltip>Añadir/quitar secciones (Estadísticas, Inventario...)</q-tooltip>
        </q-btn>
      </div>

      <!-- Renderizado de las secciones -->
      <div class="q-gutter-y-lg">
        <!-- Iteramos sobre el schema, que es reactivo -->
        <div v-for="section in characterSheetSchema.layout" :key="section.dataKey">
          <!-- El v-if asegura que solo renderizamos si tenemos el componente y los datos -->
          <component
            v-if="componentMap[section.type] && editableSheet[section.dataKey] !== undefined"
            :is="componentMap[section.type]"
            :title="section.title"
            :icon="section.icon"
            :data="editableSheet[section.dataKey]"
            @update:data="updateSectionData(section.dataKey, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Estado inicial cuando no hay ficha -->
    <div v-else class="text-center text-grey-5 q-pa-xl column items-center justify-center fit">
      <q-icon name="person_add" size="4rem" />
      <p class="q-mt-md text-body1">Este libro aún no tiene una ficha de personaje.</p>
      <p class="text-caption">Crea una para empezar a definir las estadísticas y el inventario.</p>
      <q-btn
        label="Crear Ficha de Personaje"
        color="primary"
        @click="createSheet"
        :loading="bookStore.isLoading"
      />
    </div>

    <!-- El diálogo del diseñador -->
    <q-dialog v-model="isDesignerOpen" persistent>
      <SheetDesigner @close="isDesignerOpen = false" />
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, shallowRef, nextTick, type Component } from 'vue';
import { debounce } from 'quasar';
import { useBookStore, type CharacterSheet } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';

// --- CAMBIO 1: Descomentar las importaciones ---
import StatsSection from 'src/components/sheet/StatsSection.vue';
import SheetDesigner from 'src/components/sheet/SheetDesigner.vue';
import EquipmentSection from 'src/components/sheet/EquipmentSection.vue';
import ItemListSection from 'src/components/sheet/ItemListSection.vue';

const bookStore = useBookStore();
// storeToRefs mantiene la reactividad de las propiedades del store
const { characterSheet, characterSheetSchema } = storeToRefs(bookStore);

const isDesignerOpen = ref(false);
const editableSheet = ref<Partial<CharacterSheet>>({});
const isInitialized = ref(false);

// --- CAMBIO 2: Añadir los componentes al mapa ---
const componentMap = shallowRef<Record<string, Component>>({
  stats: StatsSection,
  equipment: EquipmentSection,
  itemList: ItemListSection,
});

// Este watch es el corazón de la reactividad. ¡Ya lo tenías bien!
// Sincroniza la copia local (editableSheet) cuando la ficha del store cambia.
watch(characterSheet, (newSheet) => {
    // Reseteamos el flag para evitar que el otro watch se dispare prematuramente
    isInitialized.value = false;

    if (newSheet) {
      // Creamos una copia profunda para la edición local
      editableSheet.value = JSON.parse(JSON.stringify(newSheet));
    } else {
      editableSheet.value = {};
    }

    // Usamos nextTick para asegurar que el DOM se ha actualizado antes de
    // reactivar el guardado automático.
    void nextTick(() => {
      isInitialized.value = true;
    });
  },
  { immediate: true, deep: true }
);

// Guardado automático con debounce cuando se edita la ficha localmente
const debouncedUpdateStore = debounce(() => {
  if (bookStore.activeBook && isInitialized.value) {
    bookStore.setCharacterSheet(editableSheet.value as CharacterSheet);
  }
}, 750);

// Este watch dispara el guardado automático
watch(
  editableSheet,
  () => {
    if (isInitialized.value) {
      debouncedUpdateStore();
    }
  },
  { deep: true }
);

// Actualiza una porción de nuestra copia local
function updateSectionData(key: keyof CharacterSheet, newData: any) {
  if (editableSheet.value) {
    (editableSheet.value as any)[key] = newData;
  }
}

// Llama a la acción del store para crear la ficha inicial
function createSheet() {
  bookStore.createInitialCharacterSheet();
}
</script>
