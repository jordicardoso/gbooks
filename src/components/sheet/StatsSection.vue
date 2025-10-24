<!-- src/components/sheet/StatsSection.vue -->
<template>
  <q-card class="bg-grey-9">
    <q-card-section>
      <div class="text-h6">{{ title }}</div>
    </q-card-section>
    <q-card-section class="q-gutter-y-sm">
      <div v-for="(stat, key) in localData" :key="key" class="stat-row">
        <div class="text-subtitle1 text-capitalize q-mr-md stat-label">
          {{ key }}
        </div>
        <q-linear-progress
          :value="stat.max > 0 ? stat.current / stat.max : 0"
          color="cyan"
          class="q-mt-xs stat-bar"
          rounded
        />
        <q-input
          v-model.number="stat.current"
          type="number"
          dark
          dense
          class="stat-input"
          @update:model-value="emitUpdate"
        />
        <span class="q-mx-sm">/</span>
        <q-input
          v-model.number="stat.max"
          type="number"
          dark
          dense
          class="stat-input"
          @update:model-value="emitUpdate"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { CharacterSheet } from 'src/stores/book-store';

const props = defineProps<{
  title: string;
  data?: CharacterSheet['stats']; // <-- Prop opcional
}>();

const emit = defineEmits(['update:data']);

// --- CORRECCIÓN: Inicialización segura ---
// Si props.data no existe, usamos un objeto vacío para evitar el error de JSON.parse
const localData = ref<CharacterSheet['stats']>(
  JSON.parse(JSON.stringify(props.data || {}))
);

// Observamos cambios externos en las props para actualizar la copia local
watch(
  () => props.data,
  (newData) => {
    localData.value = JSON.parse(JSON.stringify(newData || {}));
  },
  { deep: true }
);

function emitUpdate() {
  emit('update:data', localData.value);
}
</script>

<style lang="scss" scoped>
.stat-row {
  display: grid;
  grid-template-columns: 100px 1fr 60px 20px 60px;
  align-items: center;
  gap: 8px;
}
.stat-label {
  font-weight: 500;
}
.stat-bar {
  min-width: 100px;
}
.stat-input {
  .q-field__control {
    height: 32px;
  }
}
</style>
