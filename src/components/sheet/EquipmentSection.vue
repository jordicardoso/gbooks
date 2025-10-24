<!-- src/components/sheet/EquipmentSection.vue -->
<template>
  <q-card class="bg-grey-9">
    <q-card-section class="row items-center">
      <q-icon v-if="icon" :name="icon" class="q-mr-sm" size="sm" />
      <div class="text-h6">{{ title }}</div>
    </q-card-section>
    <q-list dark separator>
      <q-item v-for="(item, slot) in data" :key="slot">
        <q-item-section>
          <q-item-label class="text-capitalize">{{ slot }}</q-item-label>
          <q-item-label caption class="text-grey-5">
            {{ item ? item.name : 'Vacío' }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat dense icon="edit_note" @click="editItem(item, slot)">
            <q-tooltip>Editar Equipo (Próximamente)</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { CharacterSheet, EquippedItem } from 'src/stores/book-store';

defineProps<{
  title: string;
  icon?: string;
  data: CharacterSheet['equipment'];
}>();

const $q = useQuasar();

function editItem(item: EquippedItem | null, slot: string) {
  console.log('Editando:', slot, item);
  $q.notify({ message: 'La edición detallada se implementará próximamente.' });
}
</script>
