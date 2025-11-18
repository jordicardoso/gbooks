<!-- src/components/ActionsEditor.vue -->
<template>
  <div class="q-mt-md">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle1">Acciones al Entrar al Nodo</div>
      <q-space />
      <q-btn flat round dense icon="add" @click="isAddActionDialogOpen = true" color="positive">
        <q-tooltip>Añadir Acción</q-tooltip>
      </q-btn>
    </div>
    <q-list v-if="localActions.length > 0" dark separator bordered>
      <q-item v-for="(action, index) in localActions" :key="action.id">
        <q-item-section>
          <q-item-label>{{ getActionDescription(action) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round dense icon="delete" color="negative" @click="removeAction(index)" />
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-grey-6 text-center q-pa-sm">(Sin acciones)</div>

    <!-- Diálogo para elegir el tipo de acción -->
    <q-dialog v-model="isAddActionDialogOpen">
      <q-card class="bg-grey-9 text-white" style="width: 400px;">
        <q-card-section>
          <div class="text-h6">Elige un tipo de Acción</div>
        </q-card-section>
        <q-list dark separator>
          <q-item clickable v-ripple @click="promptAddAction('modifyStat')">
            <q-item-section avatar><q-icon name="trending_up" /></q-item-section>
            <q-item-section>Modificar Estadística</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="promptAddAction('setFlag')">
            <q-item-section avatar><q-icon name="flag" /></q-item-section>
            <q-item-section>Establecer Variable (Flag)</q-item-section>
          </q-item>
          <!-- Añade aquí más tipos de acción (inventario, tirada de dados, etc.) -->
        </q-list>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar, uid } from 'quasar';
import type { AnyAction, ModifyStatAction, SetFlagAction } from 'src/stores/types';

const props = defineProps<{
  actions: AnyAction[];
}>();

const emit = defineEmits(['update:actions']);
const $q = useQuasar();

const localActions = ref<AnyAction[]>(JSON.parse(JSON.stringify(props.actions || [])));
const isAddActionDialogOpen = ref(false);

watch(() => props.actions, (newActions) => {
  localActions.value = JSON.parse(JSON.stringify(newActions || []));
}, { deep: true });

function emitUpdate() {
  emit('update:actions', localActions.value);
}

function removeAction(index: number) {
  localActions.value.splice(index, 1);
  emitUpdate();
}

// Lógica para añadir nuevas acciones
function promptAddAction(type: 'modifyStat' | 'setFlag') {
  isAddActionDialogOpen.value = false;

  if (type === 'modifyStat') {
    // Ejemplo: diálogo simple para añadir una acción de estadística
    $q.dialog({
      title: 'Modificar Estadística',
      message: 'Ej: "fuerza + 10" o "vida = 50"',
      prompt: { model: '' },
      dark: true,
      cancel: true,
    }).onOk(data => {
      // Aquí iría una lógica para parsear el string, por ahora un ejemplo:
      const newAction: ModifyStatAction = {
        id: uid(),
        type: 'modifyStat',
        stat: 'vida',
        operation: 'add',
        value: 10,
      };
      localActions.value.push(newAction);
      emitUpdate();
    });
  } else if (type === 'setFlag') {
    // [CAMBIO] Añadimos el diálogo para establecer una variable
    $q.dialog({
      title: 'Establecer Variable',
      message: 'Introduce el nombre del evento o variable (ej: "puerta_abierta" o "evento_101"). Se establecerá a "true".',
      prompt: {
        model: '',
        type: 'text',
      },
      dark: true,
      cancel: true,
    }).onOk(flagName => {
      // Solo añadimos la acción si el usuario introduce un nombre
      if (flagName && flagName.trim()) {
        const newAction: SetFlagAction = {
          id: uid(),
          type: 'setFlag',
          flag: flagName.trim(),
          value: true, // Por defecto, las flags se establecen a true
        };
        localActions.value.push(newAction);
        emitUpdate();
      }
    });
  }
}

// Función para mostrar una descripción legible de la acción
function getActionDescription(action: AnyAction): string {
  switch (action.type) {
    case 'modifyStat':
      return `Estadística: ${action.stat} ${action.operation} ${action.value}`;
    case 'setFlag':
      // [CAMBIO] Aseguramos que el valor booleano se muestre correctamente como string
      return `Variable: ${action.flag} = ${String(action.value)}`;
    // Añadir casos para otros tipos de acción
    default:
      return `Acción desconocida`;
  }
}
</script>
