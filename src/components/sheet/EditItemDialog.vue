<!-- src/components/sheet/EditItemDialog.vue (NUEVO FICHERO) -->
<template>
  <!-- Usamos v-model para controlar la visibilidad desde el padre -->
  <q-dialog :model-value="modelValue" @update:model-value="hide" persistent>
    <q-card class="bg-grey-10 text-white" style="width: 500px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">{{ formTitle }}</div>
      </q-card-section>

      <q-separator dark />

      <!-- Formulario de edición del objeto -->
      <q-card-section class="q-gutter-y-md">
        <q-input
          v-model="editableItem.name"
          label="Nombre del Objeto"
          filled
          dark
          autofocus
          :rules="[(val) => (val && val.length > 0) || 'El nombre es obligatorio']"
          lazy-rules
        />
        <q-input
          v-model="editableItem.description"
          label="Descripción (opcional)"
          type="textarea"
          filled
          dark
          autogrow
        />
      </q-card-section>

      <q-separator dark />

      <!-- Sección para gestionar los efectos -->
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">Efectos</div>

        <!-- Lista de efectos existentes -->
        <q-list v-if="editableItem.effects.length > 0" dark separator dense>
          <q-item v-for="(effect, index) in editableItem.effects" :key="index">
            <q-item-section>
              <q-item-label>{{ effect.target }}</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label :class="effect.value >= 0 ? 'text-positive' : 'text-negative'">
                {{ effect.value > 0 ? '+' : '' }}{{ effect.value }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                size="sm"
                @click="removeEffect(index)"
              />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-6 text-center q-py-sm">(Sin efectos)</div>

        <!-- Formulario para añadir un nuevo efecto -->
        <div class="row q-mt-md q-col-gutter-sm items-stretch stretch">
          <div class="col">
            <q-select
              v-model="newEffect.target"
              :options="availableStats"
              label="Stat afectada"
              filled
              dark
              dense
              emit-value
              map-options
              :rules="[val => !!val || 'Selecciona una stat']"
            />
          </div>
          <div class="col-4">
            <q-input
              v-model.number="newEffect.value"
              label="Valor"
              type="number"
              filled
              dark
              dense
              placeholder="ej: 10, -5"
            />
          </div>
          <div class="col-auto">
            <q-btn
              icon="add"
              color="positive"
              @click="addEffect"
              :disable="!newEffect.target"
              round
              dense
            >
              <q-tooltip>Añadir efecto</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator dark />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="hide" />
        <q-btn
          color="primary"
          label="Guardar"
          @click="onSave"
          :disable="!editableItem.name"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Item, ItemEffect } from 'src/stores/types';

const props = defineProps<{
  modelValue: boolean; // Para el v-model
  item: Item | null;
  slotName: string;
  availableStats: string[];
}>();

const emit = defineEmits(['update:modelValue', 'save']);

// --- Estado Interno ---
const editableItem = ref<Omit<Item, 'id'>>({ name: '', description: '', effects: [] });
const newEffect = ref<ItemEffect>({ target: '', value: 0 });

const formTitle = computed(() =>
  props.item ? `Editar Objeto en "${props.slotName}"` : `Equipar Objeto en "${props.slotName}"`
);

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      editableItem.value = JSON.parse(JSON.stringify(newItem));
    } else {
      // Si no hay item, reseteamos el formulario para crear uno nuevo
      editableItem.value = { name: '', description: '', effects: [] };
    }
    // Reseteamos el formulario de nuevo efecto
    newEffect.value = { target: '', value: 0 };
  },
  { deep: true }
);

// --- Lógica de los Efectos ---
function addEffect() {
  if (!newEffect.value.target.trim()) return;
  editableItem.value.effects.push({ ...newEffect.value });
  // Reseteamos para el siguiente
  newEffect.value = { target: '', value: 0 };
}

function removeEffect(index: number) {
  editableItem.value.effects.splice(index, 1);
}

// --- Control del Diálogo ---
function hide() {
  emit('update:modelValue', false);
}

function onSave() {
  if (!editableItem.value.name) return; // Doble chequeo por si se salta la regla del input
  emit('save', editableItem.value);
  hide();
}
</script>
