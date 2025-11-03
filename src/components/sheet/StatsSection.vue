<!-- src/components/sheet/StatsSection.vue -->
<template>
  <q-card class="bg-grey-9">
    <q-card-section class="row items-center">
      <q-icon v-if="icon" :name="icon" class="q-mr-sm" size="sm" />
      <div class="text-h6">{{ title }}</div>
      <q-space />
      <!-- Botón para añadir una nueva estadística -->
      <q-btn
        flat
        round
        dense
        icon="add"
        @click="promptAddStat"
        color="positive"
      >
        <q-tooltip>Añadir estadística</q-tooltip>
      </q-btn>
    </q-card-section>
    <q-card-section class="q-gutter-y-sm">
      <div v-if="Object.keys(localData).length > 0">
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
          :min="0"
        />
        <span class="q-mx-sm">/</span>
        <q-input
          v-model.number="stat.max"
          type="number"
          dark
          dense
          class="stat-input"
          @update:model-value="emitUpdate"
          :min="0"
        />
        <q-btn
          flat
          round
          dense
          icon="delete"
          size="sm"
          @click="confirmRemoveStat(String(key))"
          color="negative"
          class="q-ml-sm"
        />
      </div>
      </div>
      <div v-else class="text-grey-6 text-center q-pa-md">
        (No hay estadísticas definidas. Haz clic en el botón '+' para añadir una.)
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { CharacterSheet } from 'src/stores/book-store';

const props = defineProps<{
  title: string;
  icon?: string;
  data?: CharacterSheet['stats'];
}>();

const emit = defineEmits(['update:data']);
const $q = useQuasar();

const localData = ref<CharacterSheet['stats']>(
  JSON.parse(JSON.stringify(props.data || {}))
);

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

function promptAddStat() {
  $q.dialog({
    title: 'Nueva Estadística',
    message: 'Introduce el nombre para la nueva estadística (ej: Fuerza, Destreza, Magia).',
    prompt: {
      model: '',
      type: 'text',
      isValid: (val) => val.length > 0 && !localData.value[val.toLowerCase()],
    },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk((statName: string) => {
    const key = statName.toLowerCase().trim();
    if (key) {
      // Añadimos la nueva estadística con valores por defecto
      localData.value[key] = { current: 10, max: 10 };
      // Notificamos al padre del cambio
      emitUpdate();
    }
  });
}
</script>

<style lang="scss" scoped>
.stat-row {
  display: grid;
  grid-template-columns: 100px 1fr 60px 20px 60px auto;
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
