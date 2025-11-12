<!-- src/components/EditChoiceDialog.vue (NUEVO FICHERO) -->
<template>
  <q-dialog :model-value="modelValue" @update:model-value="hide" persistent>
    <q-card class="bg-grey-10 text-white" style="width: 600px; max-width: 90vw">
      <q-form @submit.prevent="onSave">
        <q-card-section>
          <div class="text-h6">{{ formTitle }}</div>
        </q-card-section>

        <q-separator dark />

        <q-card-section v-if="editableChoice" class="q-gutter-y-md">
          <!-- Campo común para la etiqueta de la opción -->
          <q-input
            v-model="editableChoice.label"
            label="Texto de la opción (lo que ve el jugador)"
            filled
            dark
            autofocus
            :rules="[(val) => (val && val.length > 0) || 'El texto es obligatorio']"
            lazy-rules
          />

          <!-- === CAMPOS PARA DECISIÓN SIMPLE === -->
          <div v-if="editableChoice.type === 'simple'">
            <q-select
              v-model="editableChoice.targetNodeId"
              :options="nodeOptions"
              label="Nodo de destino"
              filled dark emit-value map-options use-input
              :rules="[val => !!val || 'Debes seleccionar un nodo de destino']"
              lazy-rules
            >
              <template #no-option>
                <q-item><q-item-section class="text-grey">No hay nodos</q-item-section></q-item>
              </template>
            </q-select>
            <q-select
              v-model="editableChoice.sourceHandle"
              :options="sourceHandleOptions"
              label="Punto de conexión de salida"
              filled dark emit-value map-options
              class="q-mt-md"
            />
          </div>

          <!-- === CAMPOS PARA PRUEBA CONDICIONAL === -->
          <div v-if="editableChoice.type === 'conditional'" class="q-gutter-y-md">
            <div class="text-subtitle2 q-mt-md">Condición</div>
            <div class="row q-col-gutter-sm items-center">
              <div class="col">
                <q-select v-model="editableChoice.condition.subject" :options="availableStats" label="Stat" filled dark dense />
              </div>
              <div class="col-3">
                <q-select v-model="editableChoice.condition.operator" :options="['==', '!=', '>', '>=', '<', '<=']" label="Op." filled dark dense />
              </div>
              <div class="col-3">
                <q-input v-model.number="editableChoice.condition.value" type="number" label="Valor" filled dark dense />
              </div>
            </div>
            <q-select v-model="editableChoice.successTargetNodeId" :options="nodeOptions" label="Destino si se CUMPLE" filled dark emit-value map-options use-input />
            <q-select v-model="editableChoice.failureTargetNodeId" :options="nodeOptions" label="Destino si FALLA" filled dark emit-value map-options use-input />
          </div>

          <!-- === CAMPOS PARA TIRADA DE DADOS === -->
          <div v-if="editableChoice.type === 'diceRoll'" class="q-gutter-y-md">
            <q-input v-model="editableChoice.dice" label="Dados a lanzar (ej: 1d6, 2d10+3)" filled dark />
            <div class="text-subtitle2 q-mt-md">Resultados posibles</div>
            <q-list dark separator bordered>
              <q-item v-for="(outcome, index) in editableChoice.outcomes" :key="index">
                <q-item-section>
                  <q-item-label>Si el resultado es {{ outcome.condition }}</q-item-label>
                  <q-item-label caption>Va al nodo: {{ getNodeLabel(outcome.targetNodeId) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense icon="delete" color="negative" @click="removeOutcome(index)" />
                </q-item-section>
              </q-item>
              <q-item v-if="!editableChoice.outcomes.length"><q-item-section class="text-grey text-center">(Añade resultados abajo)</q-item-section></q-item>
            </q-list>
            <div class="row q-col-gutter-sm items-center q-mt-sm bg-grey-9 q-pa-sm rounded-borders">
              <div class="col-4"><q-input v-model="newOutcome.condition" label="Condición (ej: 1-3, 4, 5-6)" dense dark filled/></div>
              <div class="col"><q-select v-model="newOutcome.targetNodeId" :options="nodeOptions" label="Nodo de destino" dense dark filled emit-value map-options use-input/></div>
              <div class="col-auto"><q-btn icon="add" color="positive" round dense @click="addOutcome" :disable="!newOutcome.condition || !newOutcome.targetNodeId" /></div>
            </div>
          </div>

        </q-card-section>

        <q-separator dark />

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="hide" />
          <q-btn type="submit" color="primary" label="Guardar" :disable="!editableChoice || !editableChoice.label" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useNodesStore } from 'src/stores/nodes-store';
import { useBookStore } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';
import type { AnyChoice, DiceRollOutcome } from 'src/stores/types';

const props = defineProps<{
  modelValue: boolean;
  choice: AnyChoice | null;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

// --- STORES ---
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

// --- ESTADO LOCAL ---
const editableChoice = ref<AnyChoice | null>(null);
const newOutcome = ref<{ condition: string; targetNodeId: string }>({ condition: '', targetNodeId: '' });

// --- COMPUTED PROPS ---
const formTitle = computed(() => props.choice?.label ? 'Editar Opción de Salida' : 'Nueva Opción de Salida');

const nodeOptions = computed(() => {
  const options = nodes.value.map(node => ({
    label: `${node.data.paragraphNumber} - ${node.label}`,
    value: node.id
  }));
  options.unshift({ label: '➡️ Crear nuevo nodo al guardar', value: '--CREATE-NEW--' });
  return options;
});

const sourceHandleOptions = [
  { label: 'Abajo', value: 'bottom-source' },
  { label: 'Derecha', value: 'right-source' },
  { label: 'Izquierda', value: 'left-source' },
  { label: 'Arriba', value: 'top-source' },
];

const availableStats = computed(() => {
  if (!activeBook.value?.sheet.stats) return [];
  return Object.keys(activeBook.value.sheet.stats);
});

// --- WATCHERS ---
watch(() => props.choice, (newChoice) => {
  if (newChoice) {
    editableChoice.value = JSON.parse(JSON.stringify(newChoice));
    if (!editableChoice.value.sourceHandle) {
      editableChoice.value.sourceHandle = 'bottom-source';
    }
  } else {
    editableChoice.value = null;
  }
}, { deep: true, immediate: true });

// --- MÉTODOS ---
function hide() {
  emit('update:modelValue', false);
}

function onSave() {
  if (editableChoice.value) {
    emit('save', editableChoice.value);
    hide();
  }
}

function getNodeLabel(nodeId: string): string {
  if (nodeId === '--CREATE-NEW--') return 'Nuevo nodo';
  const node = nodes.value.find(n => n.id === nodeId);
  return node ? `${node.data.paragraphNumber} - ${node.label}` : '???';
}

// Métodos para Tirada de Dados
function addOutcome() {
  if (!editableChoice.value || editableChoice.value.type !== 'diceRoll' || !newOutcome.value.condition || !newOutcome.value.targetNodeId) return;
  editableChoice.value.outcomes.push({ ...newOutcome.value });
  newOutcome.value = { condition: '', targetNodeId: '' };
}

function removeOutcome(index: number) {
  if (!editableChoice.value || editableChoice.value.type !== 'diceRoll') return;
  editableChoice.value.outcomes.splice(index, 1);
}
</script>
