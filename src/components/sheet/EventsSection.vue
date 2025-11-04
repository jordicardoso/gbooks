<!-- src/components/sheet/EventsSection.vue (DISEÑO COMPACTO) -->
<template>
  <q-card class="bg-grey-9">
    <q-card-section class="row items-center">
      <q-icon v-if="icon" :name="icon" class="q-mr-sm" size="sm" />
      <div class="text-h6">{{ title }}</div>
      <q-space />
      <q-btn flat round dense icon="add" @click="promptAddEvent" color="positive">
        <q-tooltip>Añadir hito de evento</q-tooltip>
      </q-btn>
    </q-card-section>

    <q-card-section v-if="localData.length === 0" class="text-grey-6 text-center q-pa-md">
      (No hay hitos. Haz clic en '+' para añadir uno.)
    </q-card-section>

    <!-- === INICIO DEL NUEVO DISEÑO COMPACTO === -->
    <div v-else class="row q-gutter-sm q-pa-md">
      <!-- Ya no usamos el sistema de columnas, dejamos que las cajas fluyan -->
      <div
        v-for="(event, index) in localData"
        :key="event.id"
        class="event-box"
        :class="{ 'event-happened': event.happened }"
        @click="toggleEvent(index)"
      >
        <q-tooltip :delay="300">
          {{ event.name }}
        </q-tooltip>

        <!-- El ID centrado -->
        <span class="event-id">
          {{ event.id.toUpperCase() }}
        </span>

        <!-- Los botones de acción que aparecen al pasar el ratón -->
        <div class="event-actions">
          <q-btn
            flat dense round
            icon="edit"
            size="xs"
            @click.stop="promptEditEvent(index)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>
          <q-btn
            flat dense round
            icon="delete"
            color="negative"
            size="xs"
            @click.stop="confirmRemoveEvent(index)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
    <!-- === FIN DEL NUEVO DISEÑO COMPACTO === -->
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { Event } from 'src/stores/types';

// El script no necesita cambios, la lógica sigue siendo la misma.
const props = defineProps<{
  title: string;
  icon?: string;
  data: Event[];
}>();

const emit = defineEmits(['update:data']);
const $q = useQuasar();

const localData = ref<Event[]>(JSON.parse(JSON.stringify(props.data || [])));

watch(() => props.data, (newData) => {
  localData.value = JSON.parse(JSON.stringify(newData || []));
}, { deep: true });

function emitUpdate() {
  emit('update:data', localData.value);
}

function generateNextEventId(): string {
  const maxNumber = localData.value.reduce((max, event) => {
    if (event.id.startsWith('E')) {
      const currentNum = parseInt(event.id.substring(1), 10);
      if (!isNaN(currentNum)) {
        return Math.max(max, currentNum);
      }
    }
    return max;
  }, 0);

  const nextNumber = maxNumber + 1;
  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `E${paddedNumber}`;
}

function toggleEvent(index: number) {
  localData.value[index].happened = !localData.value[index].happened;
  emitUpdate();
}

function promptAddEvent() {
  $q.dialog({
    title: 'Nuevo Hito',
    message: 'Introduce un nombre para este hito (ej: "La Cueva del Dragón fue encontrada").',
    prompt: { model: '', type: 'text', isValid: val => val.length > 0 },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk((name: string) => {
    if (name) {
      localData.value.push({
        id: generateNextEventId(),
        name,
        happened: false,
      });
      emitUpdate();
    }
  });
}

function promptEditEvent(index: number) {
  const event = localData.value[index];
  $q.dialog({
    title: 'Editar Hito',
    message: 'Cambia el nombre del hito:',
    prompt: { model: event.name, type: 'text', isValid: val => val.length > 0 },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk((newName: string) => {
    if (newName) {
      event.name = newName;
      emitUpdate();
    }
  });
}

function confirmRemoveEvent(index: number) {
  $q.dialog({
    title: 'Confirmar',
    message: '¿Estás seguro de que quieres eliminar este hito?',
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    localData.value.splice(index, 1);
    emitUpdate();
  });
}
</script>

<style lang="scss" scoped>
.event-box {
  position: relative;
  width: 80px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: var(--q-color-grey-8);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden; // Esencial para la animación de los botones

  .event-id {
    font-size: 1.1rem;
    font-weight: bold;
    color: white;
    transition: color 0.3s ease;
  }

  &.event-happened {
    border-color: var(--q-primary);
    .event-id {
      color: var(--q-primary);
    }
  }

  .event-actions {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 0 2px;
    // Animación: empieza fuera de la caja y se desliza hacia adentro
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.2s ease-in-out;
  }

  &:hover .event-actions {
    transform: translateX(0);
    opacity: 1;
  }

  // Al pasar el ratón, el ID se desplaza para dejar sitio a los botones
  &:hover .event-id {
    transform: translateX(-10px);
  }
}
</style>
