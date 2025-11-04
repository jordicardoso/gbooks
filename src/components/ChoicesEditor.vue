<!-- src/components/ChoicesEditor.vue -->
<template>
  <div class="q-mt-lg">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Opciones de Salida</div>
      <q-space />
      <q-btn flat round dense icon="add" @click="isAddChoiceDialogOpen = true" color="positive">
        <q-tooltip>Añadir Opción de Salida</q-tooltip>
      </q-btn>
    </div>

    <q-list v-if="localChoices.length > 0" dark separator bordered>
      <q-item v-for="(choice, index) in localChoices" :key="choice.id">
        <q-item-section avatar>
          <q-icon :name="getChoiceIcon(choice.type)" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ choice.label }}</q-item-label>
          <q-item-label caption>{{ getChoiceDescription(choice) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round dense icon="delete" color="negative" @click="removeChoice(index)" />
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-grey-6 text-center q-pa-sm">(Sin opciones de salida. El nodo es un final.)</div>

    <!-- Diálogo para elegir el tipo de opción -->
    <q-dialog v-model="isAddChoiceDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px;">
        <q-card-section><div class="text-h6">Elige un tipo de Opción</div></q-card-section>
        <q-list dark separator>
          <q-item clickable v-ripple @click="addChoice('simple')">
            <q-item-section avatar><q-icon name="call_split" /></q-item-section>
            <q-item-section>Decisión Simple</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="addChoice('conditional')">
            <q-item-section avatar><q-icon name="help_outline" /></q-item-section>
            <q-item-section>Prueba Condicional (Stat/Item/Evento)</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="addChoice('diceRoll')">
            <q-item-section avatar><q-icon name="casino" /></q-item-section>
            <q-item-section>Tirada de Dados</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { uid } from 'quasar';
import type { AnyChoice, SimpleChoice, ConditionalChoice, DiceRollChoice } from 'src/stores/types';

const props = defineProps<{ choices: AnyChoice[] }>();
const emit = defineEmits(['update:choices']);

const localChoices = ref<AnyChoice[]>(JSON.parse(JSON.stringify(props.choices || [])));
const isAddChoiceDialogOpen = ref(false);

watch(() => props.choices, (newChoices) => {
  localChoices.value = JSON.parse(JSON.stringify(newChoices || []));
}, { deep: true });

function emitUpdate() {
  emit('update:choices', localChoices.value);
}

function removeChoice(index: number) {
  localChoices.value.splice(index, 1);
  emitUpdate();
}

// Lógica para añadir nuevas opciones (simplificada, necesitaría diálogos más complejos)
function addChoice(type: 'simple' | 'conditional' | 'diceRoll') {
  isAddChoiceDialogOpen.value = false;
  let newChoice: AnyChoice;

  if (type === 'simple') {
    newChoice = { id: uid(), type, label: 'Nueva opción...', targetNodeId: '' } as SimpleChoice;
  } else if (type === 'conditional') {
    newChoice = {
      id: uid(),
      type,
      label: 'Prueba de habilidad...',
      condition: { id: uid(), type: 'stat', subject: 'fuerza', operator: '>=', value: 10 },
      successTargetNodeId: '',
      failureTargetNodeId: '',
    } as ConditionalChoice;
  } else { // diceRoll
    newChoice = {
      id: uid(),
      type,
      label: 'Tira los dados...',
      dice: '1d6',
      outcomes: [],
    } as DiceRollChoice;
  }
  localChoices.value.push(newChoice);
  emitUpdate();
}

// Funciones de ayuda para la UI
function getChoiceIcon(type: AnyChoice['type']): string {
  const map = { simple: 'call_split', conditional: 'help_outline', diceRoll: 'casino' };
  return map[type];
}

function getChoiceDescription(choice: AnyChoice): string {
  switch (choice.type) {
    case 'simple': return `Directo a nodo: ${choice.targetNodeId || '???'}`;
    case 'conditional':
      const c = choice.condition;
      return `Si ${c.subject} ${c.operator} ${c.value} -> ${choice.successTargetNodeId || '???'} | Si no -> ${choice.failureTargetNodeId || '???'}`;
    case 'diceRoll': return `Tirada de ${choice.dice} con ${choice.outcomes.length} resultados.`;
    default: return 'Opción desconocida';
  }
}
</script>
