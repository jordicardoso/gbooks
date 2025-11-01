<!-- src/components/sheet/CharacterSheetEditor.vue -->
<template>
  <q-card class="bg-grey-9 text-white column no-wrap fit">
    <div v-if="characterSheetSchema?.layout" class="q-gutter-y-lg q-pa-md">
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
        <div v-for="(section, index) in characterSheetSchema.layout" :key="index">
          <component
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
      <!-- El botón ahora llama a una acción para crear la ficha -->
      <q-btn
        label="Crear Ficha de Personaje"
        color="primary"
        @click="createSheet"
        :loading="bookStore.isLoading"
      />
    </div>

    <q-dialog v-model="isDesignerOpen" persistent>
      <SheetDesigner @close="isDesignerOpen = false" />
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, shallowRef, nextTick } from 'vue';
import { debounce } from 'quasar';
import { useBookStore, type CharacterSheet } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';

import StatsSection from 'src/components/sheet/StatsSection.vue';
import SheetDesigner from 'src/components/sheet/SheetDesigner.vue';
//import EquipmentSection from 'src/components/sheet/EquipmentSection.vue';
//import ItemListSection from 'src/components/sheet/ItemListSection.vue';

const bookStore = useBookStore();
const { characterSheet, characterSheetSchema } = storeToRefs(bookStore);

const isDesignerOpen = ref(false);
const editableSheet = ref<Partial<CharacterSheet>>({});
const isInitialized = ref(false);

const componentMap = shallowRef({
  stats: StatsSection,
  //equipment: EquipmentSection,
  //itemList: ItemListSection,
});

watch(characterSheet,(newSheet) => {
    isInitialized.value = false;

    if (newSheet) {
      editableSheet.value = JSON.parse(JSON.stringify(newSheet));
    } else {
      editableSheet.value = {};
    }

    void nextTick(() => {
      isInitialized.value = true;
    });
  },
  { immediate: true, deep: true }
);

const debouncedUpdateStore = debounce(() => {
  if (bookStore.activeBook) {
    bookStore.setCharacterSheet(editableSheet.value as CharacterSheet);
    console.log('Cambios de la ficha aplicados al store. Listos para guardar.');
  }
}, 750);

watch(
  editableSheet,
  () => {
    if (isInitialized.value) {
      debouncedUpdateStore();
    }
  },
  { deep: true }
);

function updateSectionData(key: keyof CharacterSheet, newData: any) {
  if (editableSheet.value) {
    (editableSheet.value[key] as any) = newData;
  }
}

function createSheet() {
  bookStore.createInitialCharacterSheet();
}
</script>
