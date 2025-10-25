<!-- src/components/ContextMenu.vue (ACTUALIZADO) -->
<template>
  <div
    v-if="show && items.length > 0"
    class="context-menu"
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    @click.stop
    @contextmenu.prevent
  >
    <q-list dense dark bordered separator class="bg-grey-9 rounded-borders shadow-5">
      <!-- Usamos v-for para renderizar los items dinámicamente -->
      <q-item
        v-for="item in items"
        :key="item.action"
        clickable
        v-ripple
        @click="emitAction(item.action)"
      >
        <q-item-section v-if="item.icon" avatar>
          <q-icon :name="item.icon" :color="item.color || 'primary'" />
        </q-item-section>
        <q-item-section>{{ item.label }}</q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

// Definimos la estructura de un item del menú
export interface MenuItem {
  action: string;
  label: string;
  icon?: string;
  color?: string;
}

// El componente ahora espera un array de 'items'
defineProps<{
  show: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
}>();

const emit = defineEmits(['close', 'action']);

const emitAction = (action: string) => {
  emit('action', action);
  emit('close');
};

const handleClickOutside = () => {
  emit('close');
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('contextmenu', handleClickOutside, { capture: true });
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('contextmenu', handleClickOutside, { capture: true });
});
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 220px;
}
</style>
