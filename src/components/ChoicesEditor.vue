<!-- src/components/ChoicesEditor.vue (ACTUALIZADO) -->
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
          <!-- Contenedor para los botones de acción -->
          <div class="row items-center no-wrap">
            <q-btn flat round dense icon="edit" @click="openEditDialog(choice, index)">
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="delete" color="negative" @click="removeChoice(index)">
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-grey-6 text-center q-pa-sm">(Sin opciones de salida. El nodo es un final.)</div>

    <!-- Diálogo para ELEGIR el tipo de opción -->
    <q-dialog v-model="isAddChoiceDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px;">
        <q-card-section><div class="text-h6">Elige un tipo de Opción</div></q-card-section>
        <q-list dark separator>
          <q-item clickable v-ripple @click="promptNewChoice('simple')">
            <q-item-section avatar><q-icon name="call_split" /></q-item-section>
            <q-item-section>Decisión Simple</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptNewChoice('conditional')">
            <q-item-section avatar><q-icon name="help_outline" /></q-item-section>
            <q-item-section>Prueba Condicional (Stat/Item/Evento)</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptNewChoice('diceRoll')">
            <q-item-section avatar><q-icon name="casino" /></q-item-section>
            <q-item-section>Tirada de Dados</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Diálogo para EDITAR/CREAR la opción -->
    <EditChoiceDialog
      v-model="isEditDialogOpen"
      :choice="editingChoice"
      @save="handleSaveChoice"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { uid } from 'quasar';
import type { AnyChoice, SimpleChoice, ConditionalChoice, DiceRollChoice } from 'src/stores/types';
import EditChoiceDialog from './EditChoiceDialog.vue'; // Importamos el nuevo componente

const props = defineProps<{ choices: AnyChoice[] }>();
const emit = defineEmits(['update:choices']);

const localChoices = ref<AnyChoice[]>([]);
const isAddChoiceDialogOpen = ref(false);

// --- NUEVOS ESTADOS PARA LA EDICIÓN ---
const isEditDialogOpen = ref(false);
const editingChoice = ref<AnyChoice | null>(null);
const editingChoiceIndex = ref<number | null>(null); // null si es nuevo, index si es existente

watch(() => props.choices, (newChoices) => {
  localChoices.value = JSON.parse(JSON.stringify(newChoices || []));
}, { deep: true, immediate: true });

function emitUpdate() {
  emit('update:choices', localChoices.value);
}

function removeChoice(index: number) {
  localChoices.value.splice(index, 1);
  emitUpdate();
}

// --- NUEVAS FUNCIONES PARA EL DIÁLOGO DE EDICIÓN ---

// Abre el diálogo para crear una opción nueva del tipo seleccionado
function promptNewChoice(type: 'simple' | 'conditional' | 'diceRoll') {
  isAddChoiceDialogOpen.value = false;
  let newChoice: AnyChoice;

  if (type === 'simple') {
    newChoice = { id: uid(), type, label: '', targetNodeId: '' } as SimpleChoice;
  } else if (type === 'conditional') {
    newChoice = {
      id: uid(), type, label: '',
      condition: { id: uid(), type: 'stat', subject: '', operator: '>=', value: 10 },
      successTargetNodeId: '', failureTargetNodeId: '',
    } as ConditionalChoice;
  } else { // diceRoll
    newChoice = { id: uid(), type, label: '', dice: '1d6', outcomes: [] } as DiceRollChoice;
  }

  editingChoice.value = newChoice;
  editingChoiceIndex.value = null; // Indicamos que es un elemento nuevo
  isEditDialogOpen.value = true;
}

// Abre el diálogo para editar una opción existente
function openEditDialog(choice: AnyChoice, index: number) {
  editingChoice.value = JSON.parse(JSON.stringify(choice)); // Copia profunda para no mutar el original
  editingChoiceIndex.value = index;
  isEditDialogOpen.value = true;
}

// Se ejecuta cuando el diálogo de edición emite 'save'
function handleSaveChoice(updatedChoice: AnyChoice) {
  if (editingChoiceIndex.value !== null) {
    // Estamos editando una opción existente
    localChoices.value.splice(editingChoiceIndex.value, 1, updatedChoice);
  } else {
    // Estamos añadiendo una nueva opción
    localChoices.value.push(updatedChoice);
  }
  emitUpdate();
  isEditDialogOpen.value = false; // Cierra el diálogo
}


// Funciones de ayuda para la UI (sin cambios)
function getChoiceIcon(type: AnyChoice['type']): string {
  const map = { simple: 'call_split', conditional: 'help_outline', diceRoll: 'casino' };
  return map[type];
}

function getChoiceDescription(choice: AnyChoice): string {
  switch (choice.type) {
    case 'simple': return `Directo a nodo: ${choice.targetNodeId || '???'}`;
    case 'conditional':
      const c = choice.condition;
      return `Si ${c.subject || '?'} ${c.operator} ${c.value} -> ${choice.successTargetNodeId || '???'} | Si no -> ${choice.failureTargetNodeId || '???'}`;
    case 'diceRoll': return `Tirada de ${choice.dice} con ${choice.outcomes.length} resultados.`;
    default: return 'Opción desconocida';
  }
}
</script>
