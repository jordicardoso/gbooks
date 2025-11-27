<!-- src/components/ActionsEditor.vue -->
<template>
  <div class="q-mt-md">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">{{ $t('actionsEditor.title') }}</div>
      <q-space />
      <q-btn flat round dense icon="add" @click="isAddActionDialogOpen = true" color="positive">
        <q-tooltip>{{ $t('actionsEditor.addActionTooltip') }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Lista principal de acciones -->
    <q-list v-if="localActions.length > 0" dark separator bordered class="rounded-borders">
      <template v-for="(action, index) in localActions" :key="action.id">
        <!-- CASO 1: Acción Condicional (Panel Expandible) -->
        <q-expansion-item
          v-if="action.type === 'conditional'"
          :label="getActionDescription(action)"
          header-class="bg-blue-grey-8 text-white"
          expand-icon-class="text-white"
        >
          <q-card class="bg-grey-9">
            <q-card-section>
              <!-- Editor de la Condición -->
              <div class="text-caption text-grey-5 q-mb-xs">
                {{ $t('actionsEditor.condition.title') }}
              </div>
              <div class="row q-col-gutter-sm items-center bg-grey-10 q-pa-sm rounded-borders">
                <div class="col-4">
                  <q-select
                    v-model="action.condition.source"
                    :options="conditionSourceOptions"
                    :label="$t('actionsEditor.condition.sourceLabel')"
                    filled
                    dark
                    dense
                    emit-value
                    map-options
                    @update:model-value="onConditionSourceChange(action.condition)"
                  />
                </div>

                <div class="col">
                  <!-- Opción para STATS -->
                  <q-select
                    v-if="action.condition.source === 'stat'"
                    v-model="action.condition.subject"
                    :options="availableStats"
                    :label="$t('actionsEditor.condition.subjectLabelStat')"
                    filled
                    dark
                    dense
                    :rules="[(val) => !!val || 'Selecciona una estadística']"
                  />
                  <!-- Opción para EVENTOS (Flags) -->
                  <q-select
                    v-else-if="action.condition.source === 'flag'"
                    v-model="action.condition.subject"
                    :options="availableEvents"
                    :label="$t('actionsEditor.condition.subjectLabelFlag')"
                    filled
                    dark
                    dense
                    use-input
                    option-value="id"
                    option-label="name"
                    emit-value
                    map-options
                    @new-value="createEvent"
                  />
                </div>

                <div v-if="action.condition.source !== 'flag'" class="col-2">
                  <q-select
                    v-model="action.condition.operator"
                    :options="['==', '!=', '>', '>=', '<', '<=']"
                    :label="$t('actionsEditor.condition.operatorLabel')"
                    filled
                    dark
                    dense
                  />
                </div>
                <div :class="action.condition.source === 'flag' ? 'col-5' : 'col-3'">
                  <q-select
                    v-if="action.condition.source === 'flag'"
                    v-model="action.condition.value"
                    :options="[
                      { label: $t('actionsEditor.condition.valueTrue'), value: true },
                      { label: $t('actionsEditor.condition.valueFalse'), value: false },
                    ]"
                    :label="$t('actionsEditor.condition.valueLabel')"
                    filled
                    dark
                    dense
                    emit-value
                    map-options
                  />
                  <q-input
                    v-else
                    v-model="action.condition.value as string | number"
                    :label="$t('actionsEditor.condition.valueLabel')"
                    filled
                    dark
                    dense
                    type="number"
                  />
                </div>
              </div>

              <!-- ... -->

              function onConditionSourceChange(condition: ActionCondition) { if (condition.source
              === 'stat') { condition.subject = props.availableStats[0] || ''; // Reset operator to
              default for stats if needed, or leave as is } else { // 'flag' condition.subject =
              props.availableEvents[0]?.id || ''; condition.operator = '=='; // Enforce '==' for
              flags } }

              <!-- Sub-lista: Acciones si se CUMPLE -->
              <div class="q-mt-md">
                <div class="row items-center">
                  <div class="text-positive">{{ $t('actionsEditor.successActionsTitle') }}</div>
                  <q-space />
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="add"
                    color="positive"
                    @click="promptAddNestedAction(action, 'success')"
                  />
                </div>
                <q-list v-if="action.successActions.length" dense separator dark class="q-mt-xs">
                  <q-item
                    v-for="(subAction, subIndex) in action.successActions"
                    :key="subAction.id"
                    dense
                  >
                    <q-item-section>
                      <q-item-label class="text-caption">{{
                        getActionDescription(subAction)
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center no-wrap">
                        <q-btn
                          flat
                          round
                          dense
                          size="xs"
                          icon="edit"
                          @click="editNestedAction(action, 'success', subIndex)"
                        >
                          <q-tooltip>{{ $t('actionsEditor.editActionTooltip') }}</q-tooltip>
                        </q-btn>
                        <q-btn
                          flat
                          round
                          dense
                          size="xs"
                          icon="delete"
                          color="negative"
                          @click="removeNestedAction(action, 'success', subIndex)"
                        >
                          <q-tooltip>{{ $t('actionsEditor.deleteActionTooltip') }}</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-grey-7 text-center text-caption q-pa-xs">
                  ({{ $t('actionsEditor.noNestedActions') }})
                </div>
              </div>

              <!-- Sub-lista: Acciones si FALLA -->
              <div class="q-mt-md">
                <div class="row items-center">
                  <div class="text-negative">{{ $t('actionsEditor.failureActionsTitle') }}</div>
                  <q-space />
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="add"
                    color="negative"
                    @click="promptAddNestedAction(action, 'failure')"
                  />
                </div>
                <q-list v-if="action.failureActions.length" dense separator dark class="q-mt-xs">
                  <q-item
                    v-for="(subAction, subIndex) in action.failureActions"
                    :key="subAction.id"
                    dense
                  >
                    <q-item-section>
                      <q-item-label class="text-caption">{{
                        getActionDescription(subAction)
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center no-wrap">
                        <q-btn
                          flat
                          round
                          dense
                          size="xs"
                          icon="edit"
                          @click="editNestedAction(action, 'failure', subIndex)"
                        >
                          <q-tooltip>{{ $t('actionsEditor.editActionTooltip') }}</q-tooltip>
                        </q-btn>
                        <q-btn
                          flat
                          round
                          dense
                          size="xs"
                          icon="delete"
                          color="negative"
                          @click="removeNestedAction(action, 'failure', subIndex)"
                        >
                          <q-tooltip>{{ $t('actionsEditor.deleteActionTooltip') }}</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-grey-7 text-center text-caption q-pa-xs">
                  ({{ $t('actionsEditor.noNestedActions') }})
                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                flat
                dense
                :label="$t('actionsEditor.removeConditionButton')"
                color="negative"
                @click="removeAction(index)"
              />
            </q-card-actions>
          </q-card>
        </q-expansion-item>

        <!-- CASO 2: Acción Simple (Elemento de lista normal) -->
        <q-item v-else>
          <q-item-section>
            <q-item-label>{{ getActionDescription(action) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center no-wrap">
              <q-btn flat round dense icon="edit" @click="editAction(action, index)">
                <q-tooltip>{{ $t('actionsEditor.editActionTooltip') }}</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="delete" color="negative" @click="removeAction(index)">
                <q-tooltip>{{ $t('actionsEditor.deleteActionTooltip') }}</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </template>
    </q-list>
    <div v-else class="text-grey-6 text-center q-pa-sm">({{ $t('actionsEditor.noActions') }})</div>

    <!-- Diálogo para elegir el tipo de acción -->
    <q-dialog v-model="isAddActionDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('actionsEditor.dialog.title') }}</div>
        </q-card-section>
        <q-list dark separator>
          <q-item clickable v-ripple @click="promptAddAction('conditional')">
            <q-item-section avatar><q-icon name="rule" /></q-item-section>
            <q-item-section>{{ $t('actionsEditor.dialog.conditional') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptAddAction('modifyStat')">
            <q-item-section avatar><q-icon name="trending_up" /></q-item-section>
            <q-item-section>{{ $t('actionsEditor.dialog.modifyStat') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptAddAction('setFlag')">
            <q-item-section avatar><q-icon name="flag" /></q-item-section>
            <q-item-section>{{ $t('actionsEditor.dialog.setFlag') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptAddAction('addItem')">
            <q-item-section avatar><q-icon name="backpack" /></q-item-section>
            <q-item-section>{{ $t('actionsEditor.dialog.addItem') }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Diálogo Custom para Set Flag -->
    <q-dialog v-model="isSetFlagDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('actionsEditor.dialogs.setFlag.title') }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-input
            v-model="newFlagName"
            :label="$t('actionsEditor.createEventDialog.promptLabel')"
            dark
            filled
            autofocus
          />
          <q-input
            v-model="newFlagId"
            :label="$t('actionsEditor.dialogs.setFlag.idLabel')"
            dark
            filled
            :hint="$t('actionsEditor.dialogs.setFlag.idHint')"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('actionsEditor.buttons.cancel')" color="grey-5" v-close-popup />
          <q-btn
            flat
            :label="$t('actionsEditor.buttons.save')"
            color="primary"
            @click="saveSetFlagAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo Custom para Modify Stat -->
    <q-dialog v-model="isModifyStatDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('actionsEditor.dialogs.modifyStat.title') }}</div>
          <div class="text-caption text-grey-5">
            {{ $t('actionsEditor.dialogs.modifyStat.message') }}
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-select
            v-model="newStatName"
            :options="availableStats"
            :label="$t('actionsEditor.dialogs.modifyStat.statLabel')"
            dark
            filled
            autofocus
          />
          <q-input
            v-model="newStatOperation"
            :label="$t('actionsEditor.dialogs.modifyStat.operationLabel')"
            dark
            filled
            :hint="$t('actionsEditor.dialogs.modifyStat.operationHint')"
            placeholder="-10"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('actionsEditor.buttons.cancel')" color="grey-5" v-close-popup />
          <q-btn
            flat
            :label="$t('actionsEditor.buttons.save')"
            color="primary"
            @click="saveModifyStatAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo Custom para Add Item -->
    <q-dialog v-model="isAddItemDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 500px">
        <q-card-section>
          <div class="text-h6">{{ $t('actionsEditor.dialogs.addItem.title') }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-select
            v-model="newItemSection"
            :options="availableSections"
            :label="$t('actionsEditor.dialogs.addItem.sectionLabel')"
            dark
            filled
            emit-value
            map-options
          />
          <q-input
            v-model="newItemName"
            :label="$t('actionsEditor.dialogs.addItem.nameLabel')"
            dark
            filled
          />
          <q-input
            v-model="newItemDescription"
            :label="$t('actionsEditor.dialogs.addItem.descriptionLabel')"
            dark
            filled
            type="textarea"
            rows="2"
          />

          <!-- Modifiers List -->
          <div>
            <div class="row items-center q-mb-xs">
              <div class="text-subtitle2">
                {{ $t('actionsEditor.dialogs.addItem.modifiersTitle') }}
              </div>
              <q-space />
              <q-btn flat round dense icon="add" size="sm" color="positive" @click="addModifier" />
            </div>
            <q-list dark bordered separator dense>
              <q-item v-for="(mod, idx) in newItemModifiers" :key="idx">
                <q-item-section>
                  <div class="row q-col-gutter-xs">
                    <div class="col-7">
                      <q-select
                        v-model="mod.target"
                        :options="availableStats"
                        :label="$t('actionsEditor.dialogs.addItem.modifierStat')"
                        dark
                        filled
                        dense
                      />
                    </div>
                    <div class="col-5">
                      <q-input
                        v-model.number="mod.value"
                        type="number"
                        :label="$t('actionsEditor.dialogs.addItem.modifierValue')"
                        dark
                        filled
                        dense
                      />
                    </div>
                  </div>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeModifier(idx)"
                  />
                </q-item-section>
              </q-item>
              <div
                v-if="newItemModifiers.length === 0"
                class="text-caption text-grey-5 q-pa-sm text-center"
              >
                {{ $t('actionsEditor.dialogs.addItem.noModifiers') }}
              </div>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('actionsEditor.buttons.cancel')" color="grey-5" v-close-popup />
          <q-btn
            flat
            :label="$t('actionsEditor.buttons.save')"
            color="primary"
            @click="saveAddItemAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar, uid } from 'quasar';
import { useI18n } from 'vue-i18n';
import type {
  AnyAction,
  ModifyStatAction,
  SetFlagAction,
  ConditionalAction,
  ActionCondition,
  BookEvent,
  AddItemAction,
} from 'src/stores/types';

const props = defineProps<{
  actions: AnyAction[];
  availableStats: string[];
  availableEvents: BookEvent[];
  availableSections: { label: string; value: string }[];
}>();

const emit = defineEmits(['update:actions', 'create-event']);

const $q = useQuasar();
const { t } = useI18n();

const localActions = ref<AnyAction[]>([]);
const isAddActionDialogOpen = ref(false);

// State for Custom Set Flag Dialog
const isSetFlagDialogOpen = ref(false);
const newFlagName = ref('');
const newFlagId = ref('');
const pendingFlagContext = ref<{
  parentAction?: ConditionalAction;
  listType?: 'success' | 'failure';
} | null>(null);

// State for Custom Modify Stat Dialog
const isModifyStatDialogOpen = ref(false);
const newStatName = ref('');
const newStatOperation = ref('');

// State for editing actions
const editingActionIndex = ref<number | null>(null);
const editingNestedContext = ref<{
  parentAction: ConditionalAction;
  listType: 'success' | 'failure';
  index: number;
} | null>(null);

// State for Add Item Dialog
const isAddItemDialogOpen = ref(false);
const newItemName = ref('');
const newItemDescription = ref('');
const newItemSection = ref('');
const newItemModifiers = ref<{ target: string; value: number }[]>([]);

function addModifier() {
  newItemModifiers.value.push({ target: props.availableStats[0] || '', value: 0 });
}

function removeModifier(index: number) {
  newItemModifiers.value.splice(index, 1);
}

function openAddItemDialog() {
  newItemName.value = '';
  newItemDescription.value = '';
  newItemSection.value = props.availableSections[0]?.value || '';
  newItemModifiers.value = [];
  isAddItemDialogOpen.value = true;
}

// Auto-generate ID from Name
watch(newFlagName, (val) => {
  // Only auto-update if the ID matches the previous slugified name (or is empty),
  // to avoid overwriting manual edits.
  // For simplicity, we'll just always update if the user hasn't manually focused/edited the ID field?
  // Or simpler: just always update it unless we track "dirty" state.
  // Let's just update it.
  newFlagId.value = val.trim().replace(/\s+/g, '_').toLowerCase();
});

const conditionSourceOptions = computed(() => [
  { label: t('actionsEditor.condition.sources.stat'), value: 'stat' },
  { label: t('actionsEditor.condition.sources.flag'), value: 'flag' },
]);

function onConditionSourceChange(condition: ActionCondition) {
  if (condition.source === 'stat') {
    condition.subject = props.availableStats[0] || '';
  } else {
    // 'flag'
    condition.subject = props.availableEvents[0]?.id || '';
    condition.operator = '==';
  }
}

function createEvent(
  inputValue: string,
  doneFn: (item?: BookEvent, mode?: 'add-unique' | 'add') => void,
) {
  const newEventName = inputValue.trim();
  if (!newEventName) {
    doneFn();
    return;
  }

  $q.dialog({
    title: t('actionsEditor.createEventDialog.title'),
    message: t('actionsEditor.createEventDialog.message', { eventName: newEventName }),
    prompt: {
      model: newEventName.replace(/\s+/g, '_').toLowerCase(),
      label: t('actionsEditor.createEventDialog.promptLabel'),
      isValid: (val) => /^[a-zA-Z0-9_]+$/.test(val) && val.length > 0,
    },
    dark: true,
    cancel: true,
    persistent: true,
  })
    .onOk((eventId) => {
      const newEvent = { id: eventId, name: newEventName, initialValue: false }; // Added initialValue
      emit('create-event', newEvent);
      doneFn(newEvent.id, 'add-unique');
    })
    .onCancel(() => {
      doneFn();
    });
}

watch(
  () => props.actions,
  (newActions) => {
    localActions.value = JSON.parse(JSON.stringify(newActions || []));
  },
  { deep: true, immediate: true },
);

function emitUpdate() {
  emit('update:actions', localActions.value);
}

function removeAction(index: number) {
  localActions.value.splice(index, 1);
  emitUpdate();
}

function openSetFlagDialog(parentAction?: ConditionalAction, listType?: 'success' | 'failure') {
  newFlagName.value = '';
  newFlagId.value = '';
  if (parentAction) {
    if (listType) {
      pendingFlagContext.value = { parentAction, listType };
    } else {
      pendingFlagContext.value = { parentAction };
    }
  } else {
    pendingFlagContext.value = null;
  }
  isSetFlagDialogOpen.value = true;
}

function openModifyStatDialog() {
  newStatName.value = props.availableStats[0] || '';
  newStatOperation.value = '';
  isModifyStatDialogOpen.value = true;
}

function saveModifyStatAction() {
  if (!newStatName.value || !newStatOperation.value) return;

  // Parse the operation string (e.g., "-10", "+5", "10")
  const operationStr = newStatOperation.value.trim();
  let operation: 'add' | 'subtract' | 'set' = 'add';
  let value = 0;

  if (operationStr.startsWith('+')) {
    operation = 'add';
    value = parseInt(operationStr.substring(1), 10);
  } else if (operationStr.startsWith('-')) {
    operation = 'subtract';
    value = Math.abs(parseInt(operationStr, 10));
  } else {
    // If no sign, treat as absolute set
    operation = 'set';
    value = parseInt(operationStr, 10);
  }

  if (isNaN(value)) return;

  const actionData: ModifyStatAction = {
    id: uid(),
    type: 'modifyStat',
    stat: newStatName.value,
    operation,
    value,
  };

  if (editingActionIndex.value !== null) {
    // Editing existing action
    actionData.id = localActions.value[editingActionIndex.value]!.id;
    localActions.value[editingActionIndex.value] = actionData;
    editingActionIndex.value = null;
  } else {
    // Adding new action
    localActions.value.push(actionData);
  }

  emitUpdate();
  isModifyStatDialogOpen.value = false;
  newStatName.value = '';
  newStatOperation.value = '';
}

function saveSetFlagAction() {
  if (!newFlagId.value || !newFlagName.value) return;

  const id = newFlagId.value;
  const name = newFlagName.value;

  // Check if event exists
  const exists = props.availableEvents.some((e) => e.id === id);
  if (!exists) {
    emit('create-event', { id, name, initialValue: false });
  }

  const actionData: SetFlagAction = {
    id: uid(),
    type: 'setFlag',
    flag: id,
    value: true,
  };

  if (editingNestedContext.value) {
    // Editing nested action
    const { parentAction, listType, index } = editingNestedContext.value;
    actionData.id = (
      listType === 'success'
        ? parentAction.successActions[index]
        : parentAction.failureActions[index]
    ).id;

    if (listType === 'success') {
      parentAction.successActions[index] = actionData;
    } else {
      parentAction.failureActions[index] = actionData;
    }
    editingNestedContext.value = null;
  } else if (editingActionIndex.value !== null) {
    // Editing main action
    actionData.id = localActions.value[editingActionIndex.value]!.id;
    localActions.value[editingActionIndex.value] = actionData;
    editingActionIndex.value = null;
  } else if (pendingFlagContext.value && pendingFlagContext.value.parentAction) {
    // Adding new nested action
    const { parentAction, listType } = pendingFlagContext.value;
    if (listType === 'success') {
      parentAction.successActions.push(actionData);
    } else if (listType === 'failure') {
      parentAction.failureActions.push(actionData);
    }
  } else {
    // Adding new main action
    localActions.value.push(actionData);
  }

  emitUpdate();
  isSetFlagDialogOpen.value = false;
  newFlagName.value = '';
  newFlagId.value = '';
}

function saveAddItemAction() {
  if (!newItemName.value || !newItemSection.value) return;

  const actionData: AddItemAction = {
    id: uid(),
    type: 'addItem',
    section: newItemSection.value,
    item: {
      id: uid(),
      name: newItemName.value,
      description: newItemDescription.value,
      effects: newItemModifiers.value.map((m) => ({ target: m.target, value: m.value })),
    },
  };

  if (editingActionIndex.value !== null) {
    // Editing existing action
    actionData.id = localActions.value[editingActionIndex.value]!.id;
    localActions.value[editingActionIndex.value] = actionData;
    editingActionIndex.value = null;
  } else {
    // Adding new action
    localActions.value.push(actionData);
  }

  emitUpdate();
  isAddItemDialogOpen.value = false;
}

function promptAddAction(type: 'modifyStat' | 'setFlag' | 'conditional' | 'addItem') {
  isAddActionDialogOpen.value = false;

  if (type === 'conditional') {
    const newAction: ConditionalAction = {
      id: uid(),
      type: 'conditional',
      condition: {
        source: 'stat',
        subject: props.availableStats[0] || 'vida',
        operator: '<',
        value: 10,
      },
      successActions: [],
      failureActions: [],
    };
    localActions.value.push(newAction);
    emitUpdate();
  } else if (type === 'modifyStat') {
    openModifyStatDialog();
  } else if (type === 'setFlag') {
    openSetFlagDialog();
  } else if (type === 'addItem') {
    openAddItemDialog();
  }
}

function promptAddNestedAction(parentAction: ConditionalAction, listType: 'success' | 'failure') {
  editingActionIndex.value = null;
  editingNestedContext.value = null;
  openSetFlagDialog(parentAction, listType);
}

function editAction(action: AnyAction, index: number) {
  editingActionIndex.value = index;
  editingNestedContext.value = null;

  if (action.type === 'modifyStat') {
    newStatName.value = action.stat;
    // Reconstruct the operation string
    if (action.operation === 'add') {
      newStatOperation.value = `+${action.value}`;
    } else if (action.operation === 'subtract') {
      newStatOperation.value = `-${action.value}`;
    } else {
      newStatOperation.value = String(action.value);
    }
    isModifyStatDialogOpen.value = true;
  } else if (action.type === 'setFlag') {
    const event = props.availableEvents.find((e) => e.id === action.flag);
    newFlagName.value = event?.name || action.flag;
    newFlagId.value = action.flag;
    isSetFlagDialogOpen.value = true;
  } else if (action.type === 'addItem') {
    newItemName.value = action.item.name;
    newItemDescription.value = action.item.description || '';
    newItemSection.value = action.section;
    newItemModifiers.value = (action.item.effects || []).map((e) => ({
      target: e.target,
      value: e.value,
    }));
    isAddItemDialogOpen.value = true;
  }
}

function editNestedAction(
  parentAction: ConditionalAction,
  listType: 'success' | 'failure',
  index: number,
) {
  const action =
    listType === 'success'
      ? parentAction.successActions[index]
      : parentAction.failureActions[index];

  if (!action) return;

  editingActionIndex.value = null;
  editingNestedContext.value = { parentAction, listType, index };

  if (action.type === 'setFlag') {
    const event = props.availableEvents.find((e) => e.id === action.flag);
    newFlagName.value = event?.name || action.flag;
    newFlagId.value = action.flag;
    isSetFlagDialogOpen.value = true;
  } else if (action.type === 'addItem') {
    newItemName.value = action.item.name;
    newItemDescription.value = action.item.description || '';
    newItemSection.value = action.section;
    newItemModifiers.value = (action.item.effects || []).map((e) => ({
      target: e.target,
      value: e.value,
    }));
    isAddItemDialogOpen.value = true;
  }
}

function removeNestedAction(
  parentAction: ConditionalAction,
  listType: 'success' | 'failure',
  index: number,
) {
  if (listType === 'success') {
    parentAction.successActions.splice(index, 1);
  } else {
    parentAction.failureActions.splice(index, 1);
  }
  emitUpdate();
}

function getActionDescription(action: AnyAction): string {
  switch (action.type) {
    case 'modifyStat':
      return t('actionsEditor.descriptions.modifyStat', {
        stat: action.stat,
        operation: action.operation,
        value: action.value,
      });
    case 'setFlag': {
      const eventName =
        props.availableEvents.find((e) => e.id === action.flag)?.name || action.flag;
      return t('actionsEditor.descriptions.setFlag', {
        flag: eventName,
        value: String(action.value),
      });
    }
    case 'addItem':
      return t('actionsEditor.descriptions.addItem', {
        item: action.item.name,
        section: action.section,
      });
    case 'conditional': {
      let subjectName = action.condition.subject;
      if (action.condition.source === 'flag') {
        subjectName =
          props.availableEvents.find((e) => e.id === action.condition.subject)?.name ||
          action.condition.subject;
      }
      return t('actionsEditor.descriptions.conditional', {
        subject: subjectName,
        operator: action.condition.operator,
        value: action.condition.value,
      });
    }
    default:
      return t('actionsEditor.descriptions.unknown');
  }
}
</script>
