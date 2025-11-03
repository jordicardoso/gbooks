<!-- src/components/sheet/EquipmentSection.vue (MODIFICADO) -->
<template>
  <q-card class="bg-grey-9">
    <q-card-section class="row items-center">
      <q-icon v-if="icon" :name="icon" class="q-mr-sm" size="sm" />
      <div class="text-h6">{{ title }}</div>
      <q-space />
      <q-btn
        flat
        round
        dense
        icon="add"
        @click="promptAddSlot"
        color="positive"
      >
        <q-tooltip>Añadir ranura de equipo (ej: Cabeza, Torso...)</q-tooltip>
      </q-btn>
    </q-card-section>

    <q-card-section v-if="Object.keys(localData).length === 0" class="text-grey-6 text-center q-pa-md">
      (No hay ranuras de equipo definidas. Haz clic en el botón '+' para añadir una.)
    </q-card-section>

    <q-list v-else dark separator>
      <q-item v-for="(item, slot) in localData" :key="slot">
        <q-item-section>
          <q-item-label class="text-capitalize">{{ slot }}</q-item-label>
          <q-item-label caption :class="item ? 'text-white' : 'text-grey-5'">
            {{ item ? item.name : 'Vacío' }}
          </q-item-label>
          <!-- [!code ++] Mostramos la descripción si existe -->
          <q-item-label v-if="item?.description" caption class="text-grey-4 q-mt-xs" style="white-space: pre-wrap;">
            {{ item.description }}
          </q-item-label>
          <q-item-label v-if="item && item.effects.length" caption class="text-cyan q-mt-xs">
            <span v-for="(effect, i) in item.effects" :key="i" class="q-mr-sm">
              {{ effect.target }}: {{ effect.value > 0 ? '+' : '' }}{{ effect.value }}
            </span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row">
            <!-- [!code focus] El botón ahora llama a la nueva función `openEditDialog` -->
            <q-btn flat dense icon="edit_note" @click="openEditDialog(String(slot))">
              <q-tooltip>{{ item ? 'Editar' : 'Equipar' }} objeto</q-tooltip>
            </q-btn>
            <q-btn flat dense icon="delete" color="negative" @click="confirmRemoveSlot(String(slot))">
              <q-tooltip>Eliminar ranura</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- [!code focus:10] Aquí integramos el nuevo componente de diálogo -->
    <EditItemDialog
      v-model="isDialogOpen"
      :item="editingSlot ? localData[editingSlot] : null"
      :slot-name="editingSlot || ''"
      @save="handleItemSave"
      :available-stats="props.availableStats"
    />
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
// [!code focus:2] Importamos los componentes y tipos necesarios
import type { CharacterSheet, EquippedItem } from 'src/stores/types';
import EditItemDialog from './EditItemDialog.vue';

const props = defineProps<{
  title: string;
  icon?: string;
  data: CharacterSheet['equipment'];
  availableStats?: string[];
}>();

const emit = defineEmits(['update:data']);
const $q = useQuasar();

const localData = ref<CharacterSheet['equipment']>(
  JSON.parse(JSON.stringify(props.data || {}))
);

// [!code focus:4] Estado para controlar el diálogo
const isDialogOpen = ref(false);
const editingSlot = ref<string | null>(null);

watch(() => props.data, (newData) => {
    localData.value = JSON.parse(JSON.stringify(newData || {}));
  }, { deep: true }
);

function emitUpdate() {
  emit('update:data', localData.value);
}

function promptAddSlot() {
  $q.dialog({
    title: 'Nueva Ranura de Equipo',
    message: 'Introduce el nombre para la ranura (ej: Cabeza, Manos, Amuleto).',
    prompt: {
      model: '',
      type: 'text',
      isValid: (val) => val.length > 0 && !localData.value[val.toLowerCase()],
    },
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk((slotName: string) => {
    const key = slotName.toLowerCase().trim();
    if (key) {
      localData.value[key] = null;
      emitUpdate();
    }
  });
}

function confirmRemoveSlot(slot: string) {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Estás seguro de que quieres eliminar la ranura "${slot}"? El objeto equipado en ella se perderá.`,
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    delete localData.value[slot];
    emitUpdate();
  });
}

// [!code focus:15]
// 1. La vieja función `editItem` se reemplaza por estas dos:
// `openEditDialog` simplemente prepara el estado y abre el diálogo.
function openEditDialog(slot: string) {
  editingSlot.value = slot;
  isDialogOpen.value = true;
}

// `handleItemSave` se activa cuando el diálogo emite el evento 'save'.
function handleItemSave(savedItem: EquippedItem) {
  if (editingSlot.value) {
    localData.value[editingSlot.value] = savedItem;
    emitUpdate();
  }
  // Reseteamos para la próxima vez
  editingSlot.value = null;
}
</script>
