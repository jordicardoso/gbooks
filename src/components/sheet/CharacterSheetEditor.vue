<!-- src/components/sheet/CharacterSheetEditor.vue -->
<template>
  <q-card class="bg-grey-9 text-white column no-wrap fit">
    <!-- El v-if ahora comprueba el schema, que es más fiable -->
    <div v-if="characterSheetSchema?.layout.length" class="q-gutter-y-lg q-pa-md">
      <!-- CABECERA CON EL NUEVO BOTÓN -->
      <div class="row items-center q-mb-md">
        <div class="text-h5">Editor de Ficha de Personaje</div>
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
          <component
            v-if="componentMap[section.type] && editableSheet[section.dataKey] !== undefined"
            :is="componentMap[section.type]"
            :title="section.title"
            :icon="section.icon"
            :data="editableSheet[section.dataKey]"
            :available-stats="editableSheet.stats ? Object.keys(editableSheet.stats) : []"
            :mode="section.mode"
          @update:data="updateSectionData(section.dataKey, $event)"
          @apply-effects="handleApplyEffects"
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
import type { ItemEffect } from 'src/stores/types';

import StatsSection from 'src/components/sheet/StatsSection.vue';
import SheetDesigner from 'src/components/sheet/SheetDesigner.vue';
import ItemSection from 'src/components/sheet/ItemSection.vue';
import EventsSection from 'src/components/sheet/EventsSection.vue';

const bookStore = useBookStore();
const { characterSheet, characterSheetSchema } = storeToRefs(bookStore);

const isDesignerOpen = ref(false);
const editableSheet = ref<Partial<CharacterSheet>>({});
const isInitialized = ref(false);

const componentMap = shallowRef<Record<string, Component>>({
  stats: StatsSection,
  itemSection: ItemSection,
  events: EventsSection,
});

watch(characterSheet, (newSheet) => {
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
  if (bookStore.activeBook && isInitialized.value) {
    bookStore.setCharacterSheet(editableSheet.value as CharacterSheet);
  }
}, 750);

function handleApplyEffects(effects: ItemEffect[]) {
  if (!editableSheet.value || !editableSheet.value.stats) return;

  const stats = editableSheet.value.stats;

  effects.forEach(effect => {
    const targetStatKey = effect.target.toLowerCase();

    if (stats[targetStatKey]) {
      const stat = stats[targetStatKey];
      // Calculamos el nuevo valor
      let newValue = stat.current + effect.value;

      // Aseguramos que el valor no exceda el máximo ni sea menor que 0
      newValue = Math.max(0, Math.min(newValue, stat.max));

      stat.current = newValue;
    } else {
      console.warn(`Intento de aplicar efecto a una estadística no existente: "${effect.target}"`);
    }
  });
  // El watcher de 'editableSheet' se encargará de disparar el guardado automático.
}

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
