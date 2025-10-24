<!-- src/components/sheet/ItemListSection.vue -->
<template>
  <q-card class="bg-grey-9 full-height">
    <q-card-section class="row items-center">
      <q-icon v-if="icon" :name="icon" class="q-mr-sm" size="sm" />
      <div class="text-h6">{{ title }}</div>
    </q-card-section>
    <q-list dark separator>
      <q-item v-for="(item, index) in data" :key="item.id || index">
        <q-item-section>
          <q-item-label>{{ item.name }}</q-item-label>
          <q-item-label v-if="item.description" caption class="text-grey-5">
            {{ item.description }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row items-center">
            <span v-if="item.quantity">x{{ item.quantity }}</span>
            <q-btn flat dense icon="edit_note" class="q-ml-sm" @click="editListItem(item, index)">
              <q-tooltip>Editar (Próximamente)</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
      <q-item v-if="!data || data.length === 0">
        <q-item-section class="text-grey-6 text-center">
          (Vacío)
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { InventoryItem, Affliction } from 'src/stores/book-store';

defineProps<{
  title: string;
  icon?: string;
  data: (InventoryItem | Affliction)[];
}>();

const $q = useQuasar();

function editListItem(item: unknown, index: number) {
  console.log('Editando item de lista:', index, item);
  $q.notify({ message: 'La edición detallada se implementará próximamente.' });
}
</script>
