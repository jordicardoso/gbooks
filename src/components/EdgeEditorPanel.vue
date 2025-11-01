<!-- src/components/EdgeEditorPanel.vue -->
<template>
  <q-card class="node-editor-panel bg-grey-9 text-white no-shadow column no-wrap">
    <q-toolbar class="bg-grey-10">
      <q-toolbar-title class="text-subtitle1">
        Editar Conector
      </q-toolbar-title>
      <q-btn flat round dense icon="close" @click="emit('close')" />
    </q-toolbar>

    <q-card-section class="col q-pt-md q-gutter-y-md scroll">
      <q-input
        v-model="editedLabel"
        label="Etiqueta visible en el grafo"
        placeholder="Ej: Ir a la cueva"
        hint="Este texto se verá sobre la línea del conector."
        dark
        dense
        clearable
      />

      <q-input
        v-model="editedDescription"
        label="Descripción / Texto de la decisión"
        placeholder="Ej: Decides rodear la montaña..."
        type="textarea"
        autogrow
        dark
        dense
      />

      <!-- SECCIÓN DE ACCIONES -->
      <div class="q-mt-lg">
        <div class="row items-center justify-between">
          <p class="text-subtitle2 text-grey-5 q-mb-sm">Acciones</p>
          <q-btn-dropdown
            dense
            flat
            color="primary"
            label="Añadir Acción"
            icon="add"
          >
            <q-list dense>
              <q-item clickable v-close-popup @click="addAction('diceRoll')">
                <q-item-section avatar><q-icon name="casino" /></q-item-section>
                <q-item-section>Tirada de Dados</q-item-section>
              </q-item>
              <!-- Aquí añadirías más tipos de acción -->
            </q-list>
          </q-btn-dropdown>
        </div>

        <!-- Lista de bloques de acción -->
        <q-list separator dark class="rounded-borders">
          <div v-if="!editedActions.length" class="text-center text-grey-6 q-pa-md">
            No hay acciones definidas para este conector.
          </div>
          <q-expansion-item
            v-for="(action, index) in editedActions"
            :key="action.id"
            :label="`Acción: ${action.type}`"
            dark
            header-class="bg-blue-grey-10"
            class="action-block"
          >
            <template #header>
              <q-item-section>
                <q-item-label>{{ action.type === 'diceRoll' ? 'Tirada de Dados' : action.type }}</q-item-label>
                <q-item-label caption lines="1">{{ action.description }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" @click.stop="removeAction(index)" />
              </q-item-section>
            </template>

            <q-card class="bg-grey-9">
              <q-card-section>
                <!-- Renderizado condicional del editor correcto -->
                <ActionDiceRollEditor v-if="action.type === 'diceRoll'" :action="action" />
                <!-- <ActionModifyStatEditor v-if="action.type === 'modifyStat'" :action="action" /> -->
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>

    </q-card-section>

    <q-card-actions align="right" class="q-pa-md">
      <q-btn flat label="Cancelar" color="grey-5" @click="emit('close')" />
      <q-btn label="Guardar Cambios" color="primary" @click="saveChanges" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { BookEdge, AnyAction, DiceRollAction } from 'src/stores/types';
import { uid } from 'quasar';
import ActionDiceRollEditor from 'components/ActionDiceRollEditor.vue';

interface Props {
  edge: BookEdge | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'close']);

const editedLabel = ref('');
const editedDescription = ref('');
const editedActions = ref<AnyAction[]>([]);

function saveChanges() {
  if (props.edge) {
    const updates = {
      label: editedLabel.value || undefined, // Si está vacío, lo quitamos
      data: {
        description: editedDescription.value || undefined,
        actions: editedActions.value.length > 0 ? editedActions.value : undefined,
      }
    };

    emit('save', {
      edgeId: props.edge.id,
      updates: updates,
    });
    emit('close');
  }
}

// --- EDGE ACTIONS ---
function resetAndLoadEdge(edge: BookEdge | null) {
  if (edge) {
    editedLabel.value = edge.label || '';
    editedDescription.value = edge.data?.description || '';
    // Hacemos una copia profunda para no mutar el store directamente
    editedActions.value = edge.data?.actions ? JSON.parse(JSON.stringify(edge.data.actions)) : [];
  } else {
    editedLabel.value = '';
    editedDescription.value = '';
    editedActions.value = [];
  }
}

// [!code focus:14]
function addAction(type: 'diceRoll' /* | 'modifyStat' etc. */) {
  let newAction: AnyAction;
  if (type === 'diceRoll') {
    newAction = {
      id: uid(),
      type: 'diceRoll',
      dice: '1d6',
      description: 'Nueva tirada de dados',
      outcomes: []
    } as DiceRollAction;
  } else {
    // Lógica para otros tipos de acción
    return;
  }
  editedActions.value.push(newAction);
}

function removeAction(index: number) {
  editedActions.value.splice(index, 1);
}

watch(() => props.edge, resetAndLoadEdge, { immediate: true, deep: true });
</script>

<style scoped>
/* Puedes reusar los estilos de NodeEditorPanel.vue */
.node-editor-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
