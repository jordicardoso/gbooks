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

      <!-- Aquí iría el editor avanzado para las acciones -->
      <div class="q-mt-lg">
        <p class="text-subtitle2 text-grey-5">Acciones (Próximamente)</p>
        <div class="bg-grey-8 q-pa-md rounded-borders text-center text-grey-6">
          <q-icon name="construction" size="sm" />
          <p class="q-mt-sm text-caption">El editor de acciones condicionales se añadirá aquí.</p>
        </div>
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
import type { BookEdge } from 'src/stores/types';

interface Props {
  edge: BookEdge | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'close']);

const editedLabel = ref('');
const editedDescription = ref('');
// const editedActions = ref<EdgeAction[]>([]); // Para el futuro

function resetAndLoadEdge(edge: BookEdge | null) {
  if (edge) {
    editedLabel.value = edge.label || '';
    editedDescription.value = edge.data?.description || '';
    // editedActions.value = edge.data?.actions ? JSON.parse(JSON.stringify(edge.data.actions)) : [];
  } else {
    editedLabel.value = '';
    editedDescription.value = '';
    // editedActions.value = [];
  }
}

function saveChanges() {
  if (props.edge) {
    const updates = {
      label: editedLabel.value || undefined, // Si está vacío, lo quitamos
      data: {
        description: editedDescription.value || undefined,
        // actions: editedActions.value, // Para el futuro
      }
    };

    emit('save', {
      edgeId: props.edge.id,
      updates: updates,
    });
    emit('close');
  }
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
