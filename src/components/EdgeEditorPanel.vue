<!-- src/components/EdgeEditorPanel.vue (CORREGIDO) -->
<template>
  <q-card v-if="edge" class="node-editor-panel bg-grey-9 text-white no-shadow column no-wrap">
    <q-toolbar class="bg-grey-10">
      <q-toolbar-title class="text-subtitle1">
        Editar Conexión
      </q-toolbar-title>
      <q-space />
      <q-btn flat round dense icon="close" @click="emit('close')" />
    </q-toolbar>

    <q-card-section class="col q-pt-md q-gutter-y-md scroll">
      <q-input
        v-model="editedLabel"
        label="Etiqueta visible en el grafo"
        placeholder="Ej: Ir a la cueva"
        hint="Este texto se verá sobre la línea de la conexión."
        dark
        dense
        clearable
        autofocus
      />

      <!-- SECCIÓN DE ACCIONES -->
      <div class="q-mt-lg">
        <div class="row items-center justify-between q-mb-sm">
          <p class="text-subtitle2 text-grey-5 q-mb-none">Acciones al Cruzar</p>
          <q-btn-dropdown
            dense
            flat
            color="primary"
            label="Añadir Acción"
            icon="add"
            size="sm"
          >
            <q-list dense dark>
              <q-item clickable v-close-popup @click="addAction('diceRoll')">
                <q-item-section avatar><q-icon name="casino" /></q-item-section>
                <q-item-section>Tirada de Dados</q-item-section>
              </q-item>
              <!-- Aquí añadirías más tipos de acción en el futuro -->
            </q-list>
          </q-btn-dropdown>
        </div>

        <!-- Lista de bloques de acción -->
        <q-list v-if="editedActions.length > 0" separator dark class="rounded-borders">
          <q-expansion-item
            v-for="(action, index) in editedActions"
            :key="action.id"
            dark
            header-class="bg-blue-grey-10"
          >
            <template #header>
              <q-item-section>
                <q-item-label>{{ getActionTitle(action) }}</q-item-label>
                <q-item-label caption lines="1">{{ action.description || 'Sin descripción' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" @click.stop="removeAction(index)" />
              </q-item-section>
            </template>

            <q-card class="bg-grey-9">
              <q-card-section>
                <!-- Renderizado condicional del editor correcto -->
                <ActionDiceRollEditor v-if="action.type === 'diceRoll'" :action="action" @update:action="updateAction(index, $event)" />
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
        <div v-else class="text-center text-grey-6 q-pa-md">
          No hay acciones definidas para esta conexión.
        </div>
      </div>

    </q-card-section>

    <!-- [LA CLAVE] Acciones del pie de página con el botón de eliminar -->
    <q-card-actions align="right" class="q-pa-md">
      <q-btn
        flat
        label="Eliminar"
        color="negative"
        @click="confirmDeleteEdge"
      />
      <q-space />
      <q-btn flat label="Cancelar" color="grey-5" @click="emit('close')" />
      <q-btn label="Guardar Cambios" color="primary" @click="saveChanges" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar'; // [1. AÑADIDO] Importar Quasar para diálogos
import type { BookEdge, AnyAction, DiceRollAction } from 'src/stores/types';
import { uid } from 'quasar';
import ActionDiceRollEditor from 'components/ActionDiceRollEditor.vue';

interface Props {
  edge: BookEdge | null;
}

const props = defineProps<Props>();
// [2. AÑADIDO] Añadimos 'delete' a los eventos que el componente puede emitir
const emit = defineEmits(['save', 'close', 'delete']);

const $q = useQuasar(); // [3. AÑADIDO] Inicializar Quasar
const editedLabel = ref('');
const editedActions = ref<AnyAction[]>([]);

watch(() => props.edge, (newEdge) => {
  if (newEdge) {
    editedLabel.value = newEdge.label || '';
    editedActions.value = newEdge.data?.actions ? JSON.parse(JSON.stringify(newEdge.data.actions)) : [];
  } else {
    editedLabel.value = '';
    editedActions.value = [];
  }
}, { immediate: true, deep: true });

function getActionTitle(action: AnyAction): string {
  switch (action.type) {
    case 'diceRoll':
      return `Tirada de Dados (${(action as DiceRollAction).dice})`;
    default:
      return `Acción: ${action.type}`;
  }
}

function addAction(type: 'diceRoll') {
  const newAction: DiceRollAction = {
    id: uid(),
    type: 'diceRoll',
    dice: '1d6',
    description: 'Tirada para determinar el resultado.',
    outcomes: []
  };
  editedActions.value.push(newAction);
}

function removeAction(index: number) {
  editedActions.value.splice(index, 1);
}

function updateAction(index: number, updatedAction: AnyAction) {
  if (editedActions.value[index]) {
    editedActions.value[index] = updatedAction;
  }
}

function saveChanges() {
  if (props.edge) {
    const dataPayload: Record<string, any> = {};
    if (editedActions.value.length > 0) {
      dataPayload.actions = editedActions.value;
    }

    const updates = {
      label: editedLabel.value || undefined,
      data: Object.keys(dataPayload).length > 0 ? dataPayload : undefined,
    };

    emit('save', {
      edgeId: props.edge.id,
      updates: updates,
    });
    emit('close');
  }
}

// [4. AÑADIDO] Función que muestra un diálogo de confirmación y emite el evento 'delete'
function confirmDeleteEdge() {
  if (!props.edge) return;
  $q.dialog({
    title: 'Confirmar Eliminación',
    message: '¿Estás seguro de que quieres eliminar esta conexión?',
    dark: true,
    cancel: true,
    persistent: true,
    ok: { label: 'Eliminar', color: 'negative', flat: false },
    cancel: { label: 'Cancelar', flat: true }
  }).onOk(() => {
    if (props.edge) {
      emit('delete', props.edge.id);
    }
  });
}
</script>

<style scoped>
.node-editor-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
