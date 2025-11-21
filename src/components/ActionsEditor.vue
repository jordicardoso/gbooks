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
              <div class="text-caption text-grey-5 q-mb-xs">{{ $t('actionsEditor.condition.title') }}</div>
              <div class="row q-col-gutter-sm items-center bg-grey-10 q-pa-sm rounded-borders">
                <div class="col-4">
                  <q-select
                    v-model="action.condition.source"
                    :options="conditionSourceOptions"
                    :label="$t('actionsEditor.condition.sourceLabel')"
                    filled dark dense emit-value map-options
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
                    filled dark dense
                    :rules="[val => !!val || 'Selecciona una estadística']"
                  />
                  <!-- Opción para EVENTOS (Flags) -->
                  <q-select
                    v-else-if="action.condition.source === 'flag'"
                    v-model="action.condition.subject"
                    :options="availableEvents"
                    :label="$t('actionsEditor.condition.subjectLabelFlag')"
                    filled dark dense use-input
                    option-value="id"
                    option-label="name"
                    emit-value
                    map-options
                    @new-value="createEvent"
                  />
                </div>

                <div class="col-2">
                  <q-select v-model="action.condition.operator" :options="['==', '!=', '>', '>=', '<', '<=']" label="Op." filled dark dense />
                </div>
                <div class="col-3">
                  <q-input v-model="action.condition.value" :label="$t('actionsEditor.condition.valueLabel')" filled dark dense />
                </div>
              </div>

              <!-- Sub-lista: Acciones si se CUMPLE -->
              <div class="q-mt-md">
                <div class="row items-center">
                  <div class="text-positive">{{ $t('actionsEditor.successActionsTitle') }}</div>
                  <q-space />
                  <q-btn flat round dense size="sm" icon="add" color="positive" @click="promptAddNestedAction(action, 'success')" />
                </div>
                <q-list v-if="action.successActions.length" dense separator dark class="q-mt-xs">
                  <q-item v-for="(subAction, subIndex) in action.successActions" :key="subAction.id" dense>
                    <q-item-section>
                      <q-item-label class="text-caption">{{ getActionDescription(subAction) }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn flat round dense size="xs" icon="delete" color="negative" @click="removeNestedAction(action, 'success', subIndex)" />
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-grey-7 text-center text-caption q-pa-xs">({{ $t('actionsEditor.noNestedActions') }})</div>
              </div>

              <!-- Sub-lista: Acciones si FALLA -->
              <div class="q-mt-md">
                <div class="row items-center">
                  <div class="text-negative">{{ $t('actionsEditor.failureActionsTitle') }}</div>
                  <q-space />
                  <q-btn flat round dense size="sm" icon="add" color="negative" @click="promptAddNestedAction(action, 'failure')" />
                </div>
                <q-list v-if="action.failureActions.length" dense separator dark class="q-mt-xs">
                  <q-item v-for="(subAction, subIndex) in action.failureActions" :key="subAction.id" dense>
                    <q-item-section>
                      <q-item-label class="text-caption">{{ getActionDescription(subAction) }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn flat round dense size="xs" icon="delete" color="negative" @click="removeNestedAction(action, 'failure', subIndex)" />
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-grey-7 text-center text-caption q-pa-xs">({{ $t('actionsEditor.noNestedActions') }})</div>
              </div>

            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat dense :label="$t('actionsEditor.removeConditionButton')" color="negative" @click="removeAction(index)" />
            </q-card-actions>
          </q-card>
        </q-expansion-item>

        <!-- CASO 2: Acción Simple (Elemento de lista normal) -->
        <q-item v-else>
          <q-item-section>
            <q-item-label>{{ getActionDescription(action) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="delete" color="negative" @click="removeAction(index)" />
          </q-item-section>
        </q-item>

      </template>
    </q-list>
    <div v-else class="text-grey-6 text-center q-pa-sm">({{ $t('actionsEditor.noActions') }})</div>

    <!-- Diálogo para elegir el tipo de acción -->
    <q-dialog v-model="isAddActionDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px;">
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
        </q-list>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar, uid } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { AnyAction, ModifyStatAction, SetFlagAction, ConditionalAction, ActionCondition, BookEvent } from 'src/stores/types';

const props = defineProps<{
  actions: AnyAction[];
  availableStats: string[];
  availableEvents: BookEvent[];
}>();

const emit = defineEmits(['update:actions', 'create-event']);

const $q = useQuasar();
const { t } = useI18n();

const localActions = ref<AnyAction[]>([]);
const isAddActionDialogOpen = ref(false);

const conditionSourceOptions = computed(() => [
  { label: t('actionsEditor.condition.sources.stat'), value: 'stat' },
  { label: t('actionsEditor.condition.sources.flag'), value: 'flag' },
]);

function onConditionSourceChange(condition: ActionCondition) {
  if (condition.source === 'stat') {
    condition.subject = props.availableStats[0] || '';
  } else { // 'flag'
    condition.subject = props.availableEvents[0]?.id || '';
  }
}

function createEvent(inputValue: string, doneFn: (item?: any, mode?: 'add-unique' | 'add') => void) {
  const newEventName = inputValue.trim();
  if (!newEventName) {
    doneFn();
    return;
  }

  $q.dialog({
    title: 'Crear Nuevo Evento',
    message: `Estás creando un nuevo evento con la descripción: "${newEventName}". Por favor, introduce un código único para identificarlo (sin espacios ni caracteres especiales).`,
    prompt: {
      model: newEventName.replace(/\s+/g, '_').toLowerCase(),
      label: 'Código del Evento (ID)',
      isValid: val => /^[a-zA-Z0-9_]+$/.test(val) && val.length > 0,
    },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk(eventId => {
    const newEvent = { id: eventId, name: newEventName };
    emit('create-event', newEvent);
    doneFn(newEvent.id, 'add-unique');
  }).onCancel(() => {
    doneFn();
  });
}

watch(() => props.actions, (newActions) => {
  localActions.value = JSON.parse(JSON.stringify(newActions || []));
}, { deep: true, immediate: true });

function emitUpdate() {
  emit('update:actions', localActions.value);
}

function removeAction(index: number) {
  localActions.value.splice(index, 1);
  emitUpdate();
}

function promptAddAction(type: 'modifyStat' | 'setFlag' | 'conditional') {
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
    $q.dialog({
      title: t('actionsEditor.dialogs.modifyStat.title'),
      message: t('actionsEditor.dialogs.modifyStat.message'),
      prompt: { model: '' },
      dark: true,
      cancel: true,
    }).onOk(data => {
      const newAction: ModifyStatAction = {
        id: uid(), type: 'modifyStat', stat: 'vida', operation: 'add', value: 10,
      };
      localActions.value.push(newAction);
      emitUpdate();
    });
  } else if (type === 'setFlag') {
    $q.dialog({
      title: t('actionsEditor.dialogs.setFlag.title'),
      message: t('actionsEditor.dialogs.setFlag.message'),
      prompt: { model: '', type: 'text' },
      dark: true,
      cancel: true,
    }).onOk(flagName => {
      if (flagName && flagName.trim()) {
        const newAction: SetFlagAction = {
          id: uid(), type: 'setFlag', flag: flagName.trim(), value: true,
        };
        localActions.value.push(newAction);
        emitUpdate();
      }
    });
  }
}

function promptAddNestedAction(parentAction: ConditionalAction, listType: 'success' | 'failure') {
  $q.dialog({
    title: t('actionsEditor.dialogs.setFlag.title'),
    message: t('actionsEditor.dialogs.setFlag.message'),
    prompt: { model: '', type: 'text' },
    dark: true,
    cancel: true,
  }).onOk(flagName => {
    if (flagName && flagName.trim()) {
      const newAction: SetFlagAction = {
        id: uid(), type: 'setFlag', flag: flagName.trim(), value: true,
      };
      if (listType === 'success') {
        parentAction.successActions.push(newAction);
      } else {
        parentAction.failureActions.push(newAction);
      }
      emitUpdate();
    }
  });
}

function removeNestedAction(parentAction: ConditionalAction, listType: 'success' | 'failure', index: number) {
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
      return t('actionsEditor.descriptions.modifyStat', { stat: action.stat, operation: action.operation, value: action.value });
    case 'setFlag':
      const eventName = props.availableEvents.find(e => e.id === action.flag)?.name || action.flag;
      return t('actionsEditor.descriptions.setFlag', { flag: eventName, value: String(action.value) });
    case 'conditional':
      let subjectName = action.condition.subject;
      if (action.condition.source === 'flag') {
        subjectName = props.availableEvents.find(e => e.id === action.condition.subject)?.name || action.condition.subject;
      }
      return t('actionsEditor.descriptions.conditional', {
        subject: subjectName,
        operator: action.condition.operator,
        value: action.condition.value
      });
    default:
      return t('actionsEditor.descriptions.unknown');
  }
}
</script>
