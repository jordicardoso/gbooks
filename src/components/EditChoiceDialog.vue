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
            :label="t('editChoiceDialog.optionLabel')"
            filled
            dark
            autofocus
            :rules="[(val) => (val && val.length > 0) || t('editChoiceDialog.optionLabelRequired')]"
            lazy-rules
          />

          <!-- === CAMPOS PARA DECISIÓN SIMPLE === -->
          <div v-if="editableChoice.type === 'simple'">
            <q-select
              v-model="editableChoice.targetNodeId"
              :options="nodeOptions"
              :label="t('editChoiceDialog.targetNodeLabel')"
              filled
              dark
              emit-value
              map-options
              use-input
              :rules="[(val) => !!val || t('editChoiceDialog.targetNodeRequired')]"
              lazy-rules
            >
              <template #no-option>
                <q-item
                  ><q-item-section class="text-grey">{{
                    t('editChoiceDialog.noNodes')
                  }}</q-item-section></q-item
                >
              </template>
            </q-select>
            <q-select
              v-model="editableChoice.sourceHandle"
              :options="sourceHandleOptions"
              :label="t('editChoiceDialog.sourceHandleLabel')"
              filled
              dark
              emit-value
              map-options
              class="q-mt-md"
            />
          </div>

          <!-- === CAMPOS PARA PRUEBA CONDICIONAL === -->
          <div v-if="editableChoice.type === 'conditional'" class="q-gutter-y-md">
            <div class="text-subtitle2 q-mt-md">{{ t('editChoiceDialog.conditionTitle') }}</div>
            <div class="row q-col-gutter-sm items-center">
              <div class="col">
                <q-select
                  v-model="editableChoice.condition.subject"
                  :options="availableStats"
                  :label="t('editChoiceDialog.statLabel')"
                  filled
                  dark
                  dense
                />
              </div>
              <div class="col-3">
                <q-select
                  v-model="editableChoice.condition.operator"
                  :options="['==', '!=', '>', '>=', '<', '<=']"
                  :label="t('editChoiceDialog.operatorLabel')"
                  filled
                  dark
                  dense
                />
              </div>
              <div class="col-3">
                <q-input
                  v-model.number="editableChoice.condition.value"
                  type="number"
                  :label="t('editChoiceDialog.valueLabel')"
                  filled
                  dark
                  dense
                />
              </div>
            </div>
            <q-select
              v-model="editableChoice.successTargetNodeId"
              :options="nodeOptions"
              :label="t('editChoiceDialog.successTargetLabel')"
              filled
              dark
              emit-value
              map-options
              use-input
            />
            <q-select
              v-model="editableChoice.failureTargetNodeId"
              :options="nodeOptions"
              :label="t('editChoiceDialog.failureTargetLabel')"
              filled
              dark
              emit-value
              map-options
              use-input
            />
          </div>

          <!-- === CAMPOS PARA TIRADA DE DADOS === -->
          <div v-if="editableChoice.type === 'diceRoll'" class="q-gutter-y-md">
            <q-input
              v-model="editableChoice.dice"
              :label="t('editChoiceDialog.diceLabel')"
              filled
              dark
            />
            <div class="text-subtitle2 q-mt-md">{{ t('editChoiceDialog.outcomesTitle') }}</div>
            <q-list dark separator bordered>
              <q-item v-for="(outcome, index) in editableChoice.outcomes" :key="index">
                <q-item-section>
                  <q-item-label>{{
                    t('editChoiceDialog.outcomeCondition', { condition: outcome.range })
                  }}</q-item-label>
                  <q-item-label caption>{{
                    t('editChoiceDialog.outcomeTarget', {
                      target: getNodeLabel(outcome.targetNodeId),
                    })
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    @click="removeOutcome(index)"
                  />
                </q-item-section>
              </q-item>
              <q-item v-if="!editableChoice.outcomes.length"
                ><q-item-section class="text-grey text-center">{{
                  t('editChoiceDialog.noOutcomes')
                }}</q-item-section></q-item
              >
            </q-list>
            <div class="row q-col-gutter-sm items-center q-mt-sm bg-grey-9 q-pa-sm rounded-borders">
              <div class="col-4">
                <q-input
                  v-model="newOutcome.range"
                  :label="t('editChoiceDialog.newOutcomeCondition')"
                  dense
                  dark
                  filled
                />
              </div>
              <div class="col">
                <q-select
                  v-model="newOutcome.targetNodeId"
                  :options="nodeOptions"
                  :label="t('editChoiceDialog.targetNodeLabel')"
                  dense
                  dark
                  filled
                  emit-value
                  map-options
                  use-input
                />
              </div>
              <div class="col-auto">
                <q-btn
                  icon="add"
                  color="positive"
                  round
                  dense
                  @click="addOutcome"
                  :disable="!newOutcome.range || !newOutcome.targetNodeId"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator dark />

        <q-card-actions align="right">
          <q-btn flat :label="t('editChoiceDialog.cancelButton')" @click="hide" />
          <q-btn
            type="submit"
            color="primary"
            :label="t('editChoiceDialog.saveButton')"
            :disable="!editableChoice || !editableChoice.label"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNodesStore } from 'src/stores/nodes-store';
import { useBookStore } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';
import { uid } from 'quasar';
import type { AnyChoice } from 'src/stores/types';

const props = defineProps<{
  modelValue: boolean;
  choice: AnyChoice | null;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

const { t } = useI18n();

// --- STORES ---
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

// --- ESTADO LOCAL ---
const editableChoice = ref<AnyChoice | null>(null);
const newOutcome = ref<{ range: string; targetNodeId: string }>({ range: '', targetNodeId: '' });

// --- COMPUTED PROPS ---
const formTitle = computed(() =>
  props.choice?.label ? t('editChoiceDialog.editTitle') : t('editChoiceDialog.newTitle'),
);

const nodeOptions = computed(() => {
  const options = nodes.value.map((node) => ({
    label: `${node.data.paragraphNumber} - ${node.label}`,
    value: node.id,
  }));
  options.unshift({ label: t('editChoiceDialog.createNewNode'), value: '--CREATE-NEW--' });
  return options;
});

const sourceHandleOptions = computed(() => [
  { label: t('editChoiceDialog.sourceHandles.bottom'), value: 'bottom-source' },
  { label: t('editChoiceDialog.sourceHandles.right'), value: 'right-source' },
  { label: t('editChoiceDialog.sourceHandles.left'), value: 'left-source' },
  { label: t('editChoiceDialog.sourceHandles.top'), value: 'top-source' },
]);

const availableStats = computed(() => {
  if (!activeBook.value?.characterSheet?.stats) return [];
  return Object.keys(activeBook.value.characterSheet.stats);
});

// --- WATCHERS ---
watch(
  () => props.choice,
  (newChoice) => {
    if (newChoice) {
      editableChoice.value = JSON.parse(JSON.stringify(newChoice));
      if (editableChoice.value && !editableChoice.value.sourceHandle) {
        editableChoice.value.sourceHandle = 'bottom-source';
      }
    } else {
      editableChoice.value = null;
    }
  },
  { deep: true, immediate: true },
);

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
  if (nodeId === '--CREATE-NEW--') return t('editChoiceDialog.newNode');
  const node = nodes.value.find((n) => n.id === nodeId);
  return node ? `${node.data.paragraphNumber} - ${node.label}` : '???';
}

// Métodos para Tirada de Dados
function addOutcome() {
  if (
    !editableChoice.value ||
    editableChoice.value.type !== 'diceRoll' ||
    !newOutcome.value.range ||
    !newOutcome.value.targetNodeId
  )
    return;

  editableChoice.value.outcomes.push({
    id: uid(),
    range: newOutcome.value.range,
    label: newOutcome.value.range, // Using range as label for now
    targetNodeId: newOutcome.value.targetNodeId,
  });
  newOutcome.value = { range: '', targetNodeId: '' };
}

function removeOutcome(index: number) {
  if (!editableChoice.value || editableChoice.value.type !== 'diceRoll') return;
  editableChoice.value.outcomes.splice(index, 1);
}
</script>
