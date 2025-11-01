<!-- src/components/OutcomeEditor.vue -->
<template>
  <div class="q-gutter-y-md">
    <div class="row q-gutter-x-sm">
      <q-input
        v-model="outcome.range"
        label="Rango"
        placeholder="Ej: 1, 2-4, >5"
        dark
        dense
        class="col"
        hint="El motor interpretará el rango."
      />
      <q-select
        v-model="outcome.targetNodeId"
        :options="nodeOptions"
        label="Nodo de Destino"
        emit-value
        map-options
        dark
        dense
        class="col-8"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              No hay otros nodos en el libro.
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <q-input
      v-model="outcome.description"
      label="Descripción del Resultado"
      type="textarea"
      autogrow
      dark
      dense
    />

    <!-- Placeholder para acciones anidadas -->
    <div class="q-mt-md">
      <p class="text-caption text-grey-5 q-mb-xs">Acciones Adicionales</p>
      <div class="bg-grey-8 q-pa-sm rounded-borders text-center text-grey-6 text-caption">
        <q-icon name="add" size="xs" /> Añadir acción (ej: perder objeto)
      </div>
    </div>

    <div class="row justify-end q-mt-sm">
      <q-btn
        dense
        flat
        color="negative"
        label="Eliminar Resultado"
        icon="delete"
        @click="emit('delete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNodesStore } from 'src/stores/nodes-store';
import type { DiceRollOutcome } from 'src/stores/types';

const props = defineProps<{
  outcome: DiceRollOutcome;
}>();

const emit = defineEmits(['delete']);

const nodesStore = useNodesStore();

// Creamos una lista de opciones para el QSelect con todos los nodos del libro.
const nodeOptions = computed(() => {
  return nodesStore.nodes.map(node => ({
    label: `${node.label} (ID: ...${node.id.slice(-4)})`,
    value: node.id,
  }));
});
</script>
