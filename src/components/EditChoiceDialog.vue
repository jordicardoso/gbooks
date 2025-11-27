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
          <!-- Campo común para la etiqueta de la opción -->
          <div class="q-pa-none">
            <p class="text-caption text-grey-5 q-mb-xs">{{ t('editChoiceDialog.optionLabel') }}</p>
            <q-editor
              v-model="editableChoice.label"
              dark
              :toolbar="toolbarOptions"
              min-height="5rem"
              content-class="bg-grey-9"
              toolbar-bg="grey-10"
            />
          </div>

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

            <!-- Selector de tipo de condición -->
            <q-select
              v-model="editableChoice.condition.type"
              :options="conditionTypeOptions"
              :label="t('editChoiceDialog.conditionTypeLabel')"
              filled
              dark
              emit-value
              map-options
              @update:model-value="onConditionTypeChange"
            />

            <!-- Campos para condición de ESTADÍSTICA -->
            <div
              v-if="editableChoice.condition.type === 'stat'"
              class="row q-col-gutter-sm items-center"
            >
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
                  v-model.number="editableChoice.condition.value as number"
                  type="number"
                  :label="t('editChoiceDialog.valueLabel')"
                  filled
                  dark
                  dense
                />
              </div>
            </div>

            <!-- Campos para condición de EVENTO -->
            <div
              v-if="editableChoice.condition.type === 'event'"
              class="row q-col-gutter-sm items-center"
            >
              <div class="col">
                <q-select
                  v-model="editableChoice.condition.subject"
                  :options="availableEvents"
                  :label="t('editChoiceDialog.eventLabel')"
                  filled
                  dark
                  dense
                  emit-value
                  map-options
                  option-value="id"
                  option-label="name"
                />
              </div>
              <div class="col-auto">
                <q-select
                  v-model="editableChoice.condition.value"
                  :options="[
                    { label: t('editChoiceDialog.eventActive'), value: true },
                    { label: t('editChoiceDialog.eventInactive'), value: false },
                  ]"
                  :label="t('editChoiceDialog.eventStateLabel')"
                  filled
                  dark
                  dense
                  emit-value
                  map-options
                  style="min-width: 150px"
                />
              </div>
            </div>

            <!-- Campos para condición de INVENTARIO -->
            <div
              v-if="editableChoice.condition.type === 'item'"
              class="row q-col-gutter-sm items-center"
            >
              <div class="col">
                <q-input
                  v-model="editableChoice.condition.subject"
                  :label="t('editChoiceDialog.itemLabel')"
                  filled
                  dark
                  dense
                  :hint="t('editChoiceDialog.itemHint')"
                />
              </div>
              <div class="col-auto">
                <q-select
                  v-model="editableChoice.condition.value"
                  :options="[
                    { label: t('editChoiceDialog.itemExists'), value: true },
                    { label: t('editChoiceDialog.itemNotExists'), value: false },
                  ]"
                  :label="t('editChoiceDialog.itemStateLabel')"
                  filled
                  dark
                  dense
                  emit-value
                  map-options
                  style="min-width: 150px"
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

          <!-- === CAMPOS PARA SKILL CHECK === -->
          <div v-if="editableChoice.type === 'skillCheck'" class="q-gutter-y-md">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="editableChoice.rollConfig.skill"
                  :label="t('editChoiceDialog.skillCheck.skillLabel')"
                  filled
                  dark
                />
              </div>
              <div class="col-3">
                <q-input
                  v-model.number="editableChoice.rollConfig.baseDifficulty"
                  type="number"
                  :label="t('editChoiceDialog.skillCheck.difficultyLabel')"
                  filled
                  dark
                />
              </div>
              <div class="col-3">
                <q-input
                  v-model="editableChoice.rollConfig.diceType"
                  :label="t('editChoiceDialog.skillCheck.diceTypeLabel')"
                  filled
                  dark
                />
              </div>
            </div>

            <q-input
              v-model="editableChoice.successText"
              :label="t('editChoiceDialog.skillCheck.successTextLabel')"
              filled
              dark
              type="textarea"
              autogrow
            />

            <q-input
              v-model="editableChoice.failureText"
              :label="t('editChoiceDialog.skillCheck.failureTextLabel')"
              filled
              dark
              type="textarea"
              autogrow
            />

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

            <!-- MODIFICADORES -->
            <div class="text-subtitle2 q-mt-md">
              {{ t('editChoiceDialog.skillCheck.modifiersTitle') }}
            </div>
            <q-list dark separator bordered>
              <q-item
                v-for="(mod, index) in editableChoice.rollConfig.conditionalModifiers"
                :key="mod.ruleId"
              >
                <q-item-section>
                  <q-item-label>{{ mod.ruleId }}</q-item-label>
                  <q-item-label caption>
                    {{
                      t('editChoiceDialog.skillCheck.modifierDesc', {
                        trigger: `${mod.trigger.targetId} (${mod.trigger.operator})`,
                        operator: '→',
                        operation: mod.effect.operation,
                        value: mod.effect.value,
                      })
                    }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    @click="removeModifier(index)"
                  />
                </q-item-section>
              </q-item>
              <q-item v-if="!editableChoice.rollConfig.conditionalModifiers.length">
                <q-item-section class="text-grey text-center">
                  {{ t('editChoiceDialog.skillCheck.noModifiers') }}
                </q-item-section>
              </q-item>
            </q-list>
            <div class="row justify-end q-mt-sm">
              <q-btn
                :label="t('editChoiceDialog.skillCheck.addModifier')"
                color="secondary"
                size="sm"
                icon="add"
                @click="openModifierDialog"
              />
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

    <!-- DIALOGO PARA EDITAR MODIFICADOR -->
    <q-dialog v-model="isModifierDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px">
        <q-card-section>
          <div class="text-h6">{{ t('editChoiceDialog.skillCheck.dialog.title') }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-y-sm">
          <q-input
            v-model="newModifier.ruleId"
            label="Rule ID"
            filled
            dark
            dense
            hint="Unique ID for this rule"
          />
          <q-select
            v-model="newModifier.trigger.targetId"
            :options="availableEvents"
            :label="t('editChoiceDialog.skillCheck.dialog.targetId')"
            filled
            dark
            dense
            emit-value
            map-options
            option-value="id"
            option-label="name"
          />
          <q-select
            v-model="newModifier.trigger.operator"
            :options="['exists', 'not_exists']"
            :label="t('editChoiceDialog.skillCheck.dialog.operator')"
            filled
            dark
            dense
          />
          <div class="row q-col-gutter-sm">
            <div class="col">
              <q-select
                v-model="newModifier.effect.operation"
                :options="['add']"
                :label="t('editChoiceDialog.skillCheck.dialog.operation')"
                filled
                dark
                dense
                readonly
              />
            </div>
            <div class="col">
              <q-input
                v-model.number="newModifier.effect.value"
                type="number"
                :label="t('editChoiceDialog.skillCheck.dialog.value')"
                filled
                dark
                dense
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            :label="t('editChoiceDialog.skillCheck.dialog.save')"
            @click="saveModifier"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNodesStore } from 'src/stores/nodes-store';
import { useBookStore } from 'src/stores/book-store';
import { storeToRefs } from 'pinia';
import { uid, useQuasar } from 'quasar';
import type { AnyChoice, ConditionalModifier } from 'src/stores/types';

const props = defineProps<{
  modelValue: boolean;
  choice: AnyChoice | null;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

const $q = useQuasar();
const { t } = useI18n();

// --- STORES ---
const nodesStore = useNodesStore();
const bookStore = useBookStore();
const { nodes } = storeToRefs(nodesStore);
const { activeBook } = storeToRefs(bookStore);

// --- ESTADO LOCAL ---
const editableChoice = ref<AnyChoice | null>(null);
const newOutcome = ref<{ range: string; targetNodeId: string }>({ range: '', targetNodeId: '' });

// Modifier Dialog State
const isModifierDialogOpen = ref(false);
const newModifier = ref<ConditionalModifier>({
  ruleId: '',
  trigger: { checkType: 'flag', targetId: '', operator: 'exists', value: true },
  effect: { operation: 'add', value: 0 },
});

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['hr', 'link'],
  ['unordered', 'ordered'],
  [
    {
      label: $q.lang.editor.align,
      icon: $q.iconSet.editor.align,
      fixedLabel: true,
      list: 'only-icons',
      options: ['left', 'center', 'right', 'justify'],
    },
  ],
  ['removeFormat'],
];

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

const availableEvents = computed(() => {
  return activeBook.value?.events || [];
});

const conditionTypeOptions = computed(() => [
  { label: t('editChoiceDialog.conditionTypes.stat'), value: 'stat' },
  { label: t('editChoiceDialog.conditionTypes.event'), value: 'event' },
  { label: t('editChoiceDialog.conditionTypes.item'), value: 'item' },
]);

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

function onConditionTypeChange(newType: 'stat' | 'event' | 'item') {
  if (!editableChoice.value || editableChoice.value.type !== 'conditional') return;

  // Reset condition values based on type
  if (newType === 'stat') {
    editableChoice.value.condition.subject = availableStats.value[0] || '';
    editableChoice.value.condition.operator = '>=';
    editableChoice.value.condition.value = 10;
  } else if (newType === 'event') {
    editableChoice.value.condition.subject = availableEvents.value[0]?.id || '';
    editableChoice.value.condition.operator = '==';
    editableChoice.value.condition.value = true;
  } else if (newType === 'item') {
    editableChoice.value.condition.subject = '';
    editableChoice.value.condition.operator = '==';
    editableChoice.value.condition.value = true;
  }
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

// Métodos para Skill Check Modifiers
function openModifierDialog() {
  newModifier.value = {
    ruleId: `mod_${uid()}`,
    trigger: {
      checkType: 'flag',
      targetId: availableEvents.value[0]?.id || '',
      operator: 'exists',
      value: true,
    },
    effect: { operation: 'add', value: 1 },
  };
  isModifierDialogOpen.value = true;
}

function saveModifier() {
  if (
    !editableChoice.value ||
    editableChoice.value.type !== 'skillCheck' ||
    !newModifier.value.trigger.targetId
  )
    return;

  editableChoice.value.rollConfig.conditionalModifiers.push({
    ...newModifier.value,
    ruleId: newModifier.value.ruleId || `mod_${uid()}`,
  });
  isModifierDialogOpen.value = false;
}

function removeModifier(index: number) {
  if (!editableChoice.value || editableChoice.value.type !== 'skillCheck') return;
  editableChoice.value.rollConfig.conditionalModifiers.splice(index, 1);
}
</script>
