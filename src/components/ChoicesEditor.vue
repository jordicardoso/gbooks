<!-- src/components/ChoicesEditor.vue (CORREGIDO) -->
<template>
  <div class="q-mt-lg">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">{{ t('choices.title') }}</div>
      <q-space />
      <q-btn flat round dense icon="add" @click="isAddChoiceDialogOpen = true" color="positive">
        <q-tooltip>{{ t('choices.addTooltip') }}</q-tooltip>
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
          <div class="row items-center no-wrap">
            <q-btn flat round dense icon="edit" @click="openEditDialog(choice, index)">
              <q-tooltip>{{ t('choices.editTooltip') }}</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="delete" color="negative" @click="removeChoice(index)">
              <q-tooltip>{{ t('choices.deleteTooltip') }}</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-grey-6 text-center q-pa-sm">{{ t('choices.noChoices') }}</div>

    <!-- Diálogo para ELEGIR el tipo de opción -->
    <q-dialog v-model="isAddChoiceDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px">
        <q-card-section
          ><div class="text-h6">{{ t('choices.addDialog.title') }}</div></q-card-section
        >
        <q-list dark separator>
          <q-item clickable v-ripple @click="promptNewChoice('simple')">
            <q-item-section avatar><q-icon name="call_split" /></q-item-section>
            <q-item-section>{{ t('choices.addDialog.simple') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptNewChoice('conditional')">
            <q-item-section avatar><q-icon name="help_outline" /></q-item-section>
            <q-item-section>{{ t('choices.addDialog.conditional') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptNewChoice('diceRoll')">
            <q-item-section avatar><q-icon name="casino" /></q-item-section>
            <q-item-section>{{ t('choices.addDialog.diceRoll') }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Diálogo para EDITAR/CREAR la opción -->
    <EditChoiceDialog v-model="isEditDialogOpen" :choice="editingChoice" @save="handleSaveChoice" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { uid } from 'quasar';
import { useI18n } from 'vue-i18n'; // [1. AÑADIDO] Importar i18n
import { useNodesStore } from 'src/stores/nodes-store'; // [2. AÑADIDO] Importar el store de nodos
import { storeToRefs } from 'pinia'; // [3. AÑADIDO] Importar storeToRefs
import type { AnyChoice, SimpleChoice, ConditionalChoice, DiceRollChoice } from 'src/stores/types';
import EditChoiceDialog from './EditChoiceDialog.vue';

const props = defineProps<{ choices: AnyChoice[] }>();
const emit = defineEmits(['update:choices']);

// --- STORES E I18N ---
const { t } = useI18n(); // [4. AÑADIDO] Obtener la función de traducción
const nodesStore = useNodesStore(); // [5. AÑADIDO] Inicializar el store
const { nodes } = storeToRefs(nodesStore); // [6. AÑADIDO] Obtener el array de nodos de forma reactiva

// --- ESTADO LOCAL ---
const localChoices = ref<AnyChoice[]>([]);
const isAddChoiceDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const editingChoice = ref<AnyChoice | null>(null);
const editingChoiceIndex = ref<number | null>(null);

watch(
  () => props.choices,
  (newChoices) => {
    localChoices.value = JSON.parse(JSON.stringify(newChoices || []));
  },
  { deep: true, immediate: true },
);

function emitUpdate() {
  emit('update:choices', localChoices.value);
}

function removeChoice(index: number) {
  localChoices.value.splice(index, 1);
  emitUpdate();
}

function promptNewChoice(type: 'simple' | 'conditional' | 'diceRoll') {
  isAddChoiceDialogOpen.value = false;
  let newChoice: AnyChoice;

  if (type === 'simple') {
    newChoice = { id: uid(), type, label: '', targetNodeId: '' } as SimpleChoice;
  } else if (type === 'conditional') {
    newChoice = {
      id: uid(),
      type,
      label: '',
      condition: { id: uid(), type: 'stat', subject: '', operator: '>=', value: 10 },
      successTargetNodeId: '',
      failureTargetNodeId: '',
    } as ConditionalChoice;
  } else {
    // diceRoll
    newChoice = { id: uid(), type, label: '', dice: '1d6', outcomes: [] } as DiceRollChoice;
  }

  editingChoice.value = newChoice;
  editingChoiceIndex.value = null;
  isEditDialogOpen.value = true;
}

function openEditDialog(choice: AnyChoice, index: number) {
  editingChoice.value = JSON.parse(JSON.stringify(choice));
  editingChoiceIndex.value = index;
  isEditDialogOpen.value = true;
}

function handleSaveChoice(updatedChoice: AnyChoice) {
  if (editingChoiceIndex.value !== null) {
    localChoices.value.splice(editingChoiceIndex.value, 1, updatedChoice);
  } else {
    localChoices.value.push(updatedChoice);
  }
  emitUpdate();
  isEditDialogOpen.value = false;
}

function getChoiceIcon(type: AnyChoice['type']): string {
  const map = { simple: 'call_split', conditional: 'help_outline', diceRoll: 'casino' };
  return map[type];
}

function getChoiceDescription(choice: AnyChoice): string {
  const getParagraphLabel = (nodeId: string | undefined | null): string => {
    if (!nodeId) return '???';
    if (nodeId === '--CREATE-NEW--') return t('dialogs.editChoice.newNode');
    const node = nodes.value.find((n) => n.id === nodeId);
    // [MEJORA] Usamos el número de párrafo si existe, si no, el ID como fallback.
    return node ? `P.${node.data.paragraphNumber}` : nodeId.substring(0, 8) || '???';
  };

  switch (choice.type) {
    case 'simple': {
      const paragraphLabel = getParagraphLabel(choice.targetNodeId).replace('P.', '');
      return t('choices.description.simple', { paragraph: paragraphLabel });
    }

    case 'conditional': {
      const c = choice.condition;
      return t('choices.description.conditional', {
        subject: c.subject || '?',
        operator: c.operator,
        value: c.value,
        success: getParagraphLabel(choice.successTargetNodeId),
        failure: getParagraphLabel(choice.failureTargetNodeId),
      });
    }

    case 'diceRoll':
      return t('choices.description.diceRoll', {
        dice: choice.dice,
        count: choice.outcomes.length,
      });

    default:
      return t('choices.description.unknown');
  }
}
</script>
