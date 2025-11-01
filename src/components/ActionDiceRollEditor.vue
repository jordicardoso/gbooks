<!-- src/components/ActionDiceRollEditor.vue -->
<template>
  <div class="q-pa-sm q-gutter-y-sm">
    <q-input
      v-model="action.description"
      label="Descripción de la tirada"
      dark dense autogrow
    />
    <q-input
      v-model="action.dice"
      label="Dados a tirar"
      placeholder="Ej: 1d6, 2d10+3"
      dark dense
    />

    <!-- Sub-lista de Resultados (Outcomes) -->
    <div class="q-mt-md">
      <div class="row items-center justify-between">
        <p class="text-caption text-grey-5 q-mb-none">Resultados Posibles</p>
        <q-btn dense flat color="primary" label="Añadir Resultado" icon="add" @click="addOutcome" />
      </div>
      <q-list separator dark class="q-mt-sm">
        <div v-if="!action.outcomes.length" class="text-center text-grey-7 q-pa-sm text-caption">
          Añade al menos un resultado.
        </div>
        <q-expansion-item
          v-for="(outcome, index) in action.outcomes"
          :key="outcome.id"
          :label="`Resultado para [${outcome.range || '?'}]`"
          dark
          header-class="bg-grey-8"
        >
          <q-card class="bg-grey-8">
            <q-card-section>
              <OutcomeEditor :outcome="outcome" @delete="removeOutcome(index)" />
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { uid } from 'quasar';
import type { DiceRollAction, DiceRollOutcome } from 'src/stores/types';
import OutcomeEditor from './OutcomeEditor.vue';

const props = defineProps<{
  action: DiceRollAction;
}>();

function addOutcome() {
  const newOutcome: DiceRollOutcome = {
    id: uid(),
    range: '1',
    description: 'Nuevo resultado',
    targetNodeId: '',
    actions: []
  };
  props.action.outcomes.push(newOutcome);
}

function removeOutcome(index: number) {
  props.action.outcomes.splice(index, 1);
}
</script>
