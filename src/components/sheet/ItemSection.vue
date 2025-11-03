<!-- src/components/sheet/ItemSection.vue (NUEVO Y UNIFICADO) -->
<template>
  <q-card class="bg-grey-9">
    <q-card-section class="row items-center">
      <q-icon v-if="icon" :name="icon" class="q-mr-sm" size="sm" />
      <div class="text-h6">{{ title }}</div>
      <q-space />
      <!-- Botón de añadir cambia según el modo -->
      <q-btn
        v-if="mode === 'slots'"
        flat round dense icon="add" @click="promptAddSlot" color="positive"
      >
        <q-tooltip>Añadir ranura de equipo</q-tooltip>
      </q-btn>
      <q-btn
        v-if="mode === 'list'"
        flat round dense icon="add" @click="openEditDialog(null)" color="positive"
      >
        <q-tooltip>Añadir objeto</q-tooltip>
      </q-btn>
    </q-card-section>

    <!-- === RENDERIZADO PARA MODO 'SLOTS' (EQUIPO) === -->
    <div v-if="mode === 'slots'">
      <q-card-section v-if="Object.keys(localData).length === 0" class="text-grey-6 text-center q-pa-md">
        (No hay ranuras de equipo. Haz clic en '+' para añadir una.)
      </q-card-section>
      <q-list v-else dark separator>
        <q-item v-for="(item, slot) in (localData as Record<string, Item | null>)" :key="slot">
          <q-item-section>
            <q-item-label class="text-capitalize">{{ slot }}</q-item-label>
            <q-item-label caption :class="item ? 'text-white' : 'text-grey-5'">
              {{ item ? item.name : 'Vacío' }}
            </q-item-label>
            <q-item-label v-if="item?.description" caption class="text-grey-4 q-mt-xs" style="white-space: pre-wrap;">
              {{ item.description }}
            </q-item-label>
            <q-item-label v-if="item?.effects?.length" caption class="text-cyan q-mt-xs">
              <span v-for="(effect, i) in item.effects" :key="i" class="q-mr-sm">
                {{ effect.target }}: {{ effect.value > 0 ? '+' : '' }}{{ effect.value }}
              </span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat dense icon="edit_note" @click="openEditDialog(item, String(slot))">
              <q-tooltip>{{ item ? 'Editar' : 'Equipar' }}</q-tooltip>
            </q-btn>
            <q-btn flat dense icon="delete" color="negative" @click="confirmRemoveSlot(String(slot))">
              <q-tooltip>Eliminar ranura</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- === RENDERIZADO PARA MODO 'LIST' (INVENTARIO) === -->
    <div v-if="mode === 'list'">
      <q-card-section v-if="(localData as Item[]).length === 0" class="text-grey-6 text-center q-pa-md">
        (Vacío. Haz clic en '+' para añadir un objeto.)
      </q-card-section>
      <q-list v-else dark separator>
        <q-item v-for="(item, index) in (localData as Item[])" :key="item.id">
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
            <q-item-label v-if="item.description" caption class="text-grey-4" style="white-space: pre-wrap;">
              {{ item.description }}
            </q-item-label>
            <q-item-label v-if="item.effects.length" caption class="text-cyan q-mt-xs">
              <span v-for="(effect, i) in item.effects" :key="i" class="q-mr-sm">
                {{ effect.target }}: {{ effect.value > 0 ? '+' : '' }}{{ effect.value }}
              </span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center no-wrap">
              <span v-if="item.quantity" class="text-h6 q-mr-sm">x{{ item.quantity }}</span>
              <q-btn v-if="item.effects.length > 0" flat dense icon="local_drink" color="primary" @click="useItem(item, index)">
                <q-tooltip>Usar / Consumir</q-tooltip>
              </q-btn>
              <q-btn flat dense icon="edit_note" @click="openEditDialog(item, index)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn flat dense icon="delete" color="negative" @click="confirmRemoveItem(index)">
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- El mismo diálogo de edición sirve para ambos modos -->
    <EditItemDialog
      v-model="isDialogOpen"
      :item="editingItem"
      :slot-name="dialogTitle"
      :available-stats="availableStats"
      @save="handleItemSave"
    />
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar, uid } from 'quasar';
import type { Item, ItemEffect } from 'src/stores/types';
import EditItemDialog from './EditItemDialog.vue'; // Reutilizamos el diálogo

const props = defineProps<{
  title: string;
  icon?: string;
  mode: 'slots' | 'list';
  data: Record<string, Item | null> | Item[];
  availableStats: string[];
}>();

const emit = defineEmits(['update:data', 'apply-effects']);
const $q = useQuasar();

const localData = ref(JSON.parse(JSON.stringify(props.data || (props.mode === 'slots' ? {} : []))));

watch(() => props.data, (newData) => {
  localData.value = JSON.parse(JSON.stringify(newData || (props.mode === 'slots' ? {} : [])));
}, { deep: true });

function emitUpdate() {
  emit('update:data', localData.value);
}

// --- Lógica de Edición (común) ---
const isDialogOpen = ref(false);
const editingItem = ref<Item | null>(null);
const editingKey = ref<string | number | null>(null); // Puede ser un 'slot' (string) o un 'index' (number)

const dialogTitle = computed(() => {
  if (props.mode === 'slots') {
    return typeof editingKey.value === 'string' ? editingKey.value : props.title;
  }
  return props.title;
});

function openEditDialog(item: Item | null, key: string | number | null = null) {
  editingItem.value = item;
  editingKey.value = key;
  isDialogOpen.value = true;
}

function handleItemSave(savedItemData: Omit<Item, 'id'>) {
  if (props.mode === 'slots' && typeof editingKey.value === 'string') {
    const data = localData.value as Record<string, Item | null>;
    data[editingKey.value] = { ...savedItemData, id: savedItemData.id || uid() };
  }
  else if (props.mode === 'list') {
    const data = localData.value as Item[];
    if (editingKey.value !== null && typeof editingKey.value === 'number') { // Editando
      data[editingKey.value] = { ...data[editingKey.value], ...savedItemData };
    } else { // Creando
      data.push({ ...savedItemData, id: uid(), quantity: savedItemData.quantity || 1 });
    }
  }
  emitUpdate();
}

// --- Lógica específica de MODO 'SLOTS' ---
function promptAddSlot() {
  $q.dialog({
    title: 'Nueva Ranura de Equipo', message: 'Nombre de la ranura (ej: Cabeza, Manos).',
    prompt: { model: '', type: 'text', isValid: (val) => val.length > 0 && !localData.value[val.toLowerCase()] },
    dark: true, cancel: true, persistent: true,
  }).onOk((slotName: string) => {
    const key = slotName.toLowerCase().trim();
    if (key) {
      (localData.value as Record<string, Item | null>)[key] = null;
      emitUpdate();
    }
  });
}

function confirmRemoveSlot(slot: string) {
  $q.dialog({
    title: 'Confirmar', message: `¿Eliminar la ranura "${slot}"?`,
    dark: true, cancel: true, persistent: true,
  }).onOk(() => {
    delete (localData.value as Record<string, Item | null>)[slot];
    emitUpdate();
  });
}

// --- Lógica específica de MODO 'LIST' ---
function useItem(item: Item, index: number) {
  emit('apply-effects', item.effects);
  const data = localData.value as Item[];
  const currentQuantity = item.quantity || 1;
  if (currentQuantity <= 1) {
    data.splice(index, 1);
  } else {
    data[index].quantity = currentQuantity - 1;
  }
  emitUpdate();
}

function confirmRemoveItem(index: number) {
  const data = localData.value as Item[];
  $q.dialog({
    title: 'Confirmar', message: `¿Eliminar "${data[index].name}"?`,
    dark: true, cancel: true, persistent: true,
  }).onOk(() => {
    data.splice(index, 1);
    emitUpdate();
  });
}
</script>
