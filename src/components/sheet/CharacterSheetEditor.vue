<!-- src/components/sheet/CharacterSheetEditor.vue -->
<template>
  <q-card class="bg-grey-9 text-white column no-wrap fit">
  <div v-if="bookStore.id" class="q-gutter-y-lg">
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

  <div v-else class="text-center text-grey-5 q-mt-xl">
    <q-icon name="error_outline" size="4rem" />
    <p class="text-h6">No se ha cargado ningún libro.</p>
    <q-btn label="Volver a la Biblioteca" color="primary" :to="{ name: 'library' }" />
  </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, shallowRef, nextTick } from 'vue';
import { debounce } from 'quasar';
import { useBookStore, type Meta, type CharacterSheet } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';

import StatsSection from 'src/components/sheet/StatsSection.vue';
import EquipmentSection from 'src/components/sheet/EquipmentSection.vue';
import ItemListSection from 'src/components/sheet/ItemListSection.vue';

const bookStore = useBookStore();
const { meta, characterSheet, characterSheetSchema } = storeToRefs(bookStore);

const editableMeta = ref<Meta>({ title: '', version: '' });
const editableSheet = ref<Partial<CharacterSheet>>({});
const isInitialized = ref(false); // Flag para evitar el guardado automático al cargar

const componentMap = shallowRef({
  stats: StatsSection,
  equipment: EquipmentSection,
  itemList: ItemListSection,
});

// Copia los datos del store al estado local editable cuando el libro cambia
watch(
  [meta, characterSheet],
  ([newMeta, newSheet]) => {
    isInitialized.value = false; // Desactiva el auto-guardado mientras se carga
    if (newMeta) {
      editableMeta.value = JSON.parse(JSON.stringify(newMeta));
    }
    if (newSheet) {
      editableSheet.value = JSON.parse(JSON.stringify(newSheet));
    }
    void nextTick(() => {
      isInitialized.value = true; // Reactiva el auto-guardado después de la carga inicial
    });
  },
  { immediate: true, deep: true }
);

// Función que actualiza el store, con un retardo para no hacerlo en cada pulsación
const debouncedUpdateStore = debounce(() => {
  bookStore.setMeta(editableMeta.value);
  bookStore.setCharacterSheet(editableSheet.value as CharacterSheet);
  console.log('Cambios de la ficha aplicados al store. Listos para guardar.');
}, 750);

// Observador que detecta cambios del usuario y llama a la función de guardado en el store
watch(
  [editableMeta, editableSheet],
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
</script>
