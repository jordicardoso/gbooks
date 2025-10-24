<!-- src/components/NodeEditorPanel.vue -->
<template>
  <q-card class="node-editor-panel bg-grey-9 text-white no-shadow">
    <q-card-section class="row items-center q-pb-none">
      <div class="">{{ node?.id }}</div>
      <q-space />
      <q-btn icon="close" flat round dense @click="emit('close')" />
    </q-card-section>

    <q-card-section class="q-pt-md q-gutter-y-md scroll">
      <!-- Descripción -->
      <q-input
        v-model="editedDescription"
        label="Descripción del Pasaje"
        type="textarea"
        autogrow
        dark
        dense
      />

      <!-- Campo para Etiqueta -->
      <q-input
        v-model="editedTag"
        label="Etiqueta"
        placeholder="Ej: Evento, Lugar Clave"
        dark
        dense
        clearable
      />

      <!-- Selector de Tamaño -->
      <q-select
        v-model="editedSize"
        :options="sizeOptions"
        label="Tamaño del Nodo"
        dark
        dense
        emit-value
        map-options
      />

      <!-- Selector de Color -->
      <q-input v-model="editedColor" label="Color del Nodo" dark dense clearable>
        <template #append>
          <q-icon name="colorize" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-color v-model="editedColor" />
            </q-popup-proxy>
          </q-icon>
        </template>
        <template #prepend>
          <div :style="{ backgroundColor: editedColor, width: '16px', height: '16px', borderRadius: '50%' }"></div>
        </template>
      </q-input>

      <!-- Selector de Imagen -->
      <q-select
        v-model="editedImageId"
        :options="assetOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Imagen del Pasaje"
        dark
        dense
        clearable
      >
        <!-- ... (templates de q-select de imagen sin cambios) ... -->
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-img :src="scope.opt.src" style="width: 40px; height: 40px; border-radius: 4px;" fit="cover" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label caption class="text-grey-5">{{ scope.opt.category }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #selected-item="scope">
          <q-item v-if="scope.opt">
            <q-item-section avatar>
              <q-img :src="scope.opt.src" style="width: 30px; height: 30px; border-radius: 3px;" fit="cover" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
            </q-item-section>
          </q-item>
          <span v-else class="text-grey-6">Ninguna imagen seleccionada</span>
        </template>
      </q-select>

      <!-- Previsualización de Imagen -->
      <div v-if="currentImageUrl" class="q-mt-md text-center">
        <q-img :src="currentImageUrl" style="max-width: 100%; max-height: 200px; border-radius: 8px;" fit="contain" />
      </div>

    </q-card-section>

    <q-card-actions align="right" class="q-pa-md">
      <q-btn flat label="Cancelar" color="grey-5" @click="emit('close')" />
      <q-btn label="Guardar Cambios" color="primary" @click="saveChanges" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { BookNode } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';
import { storeToRefs } from 'pinia';

interface Props {
  node: BookNode | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'close']);

const assetsStore = useAssetsStore();
const { assets } = storeToRefs(assetsStore);

// Refs para los campos del formulario
const editedDescription = ref('');
const editedImageId = ref<string | null>(null);
const editedTag = ref('');
const editedColor = ref('');
const editedSize = ref<'small' | 'medium' | 'large'>('medium');

// Opciones para el selector de tamaño
const sizeOptions = [
  { label: 'Pequeño', value: 'small' },
  { label: 'Mediano', value: 'medium' },
  { label: 'Grande', value: 'large' },
];

const assetOptions = computed(() => assets.value.filter(asset => asset.type === 'image'));

const currentImageUrl = computed(() => {
  if (!editedImageId.value) return null;
  const asset = assetsStore.getAssetById(editedImageId.value);
  return asset ? asset.src : null;
});

// Sincronizar los datos del nodo con los campos del formulario
watch(() => props.node, (newNode) => {
  if (newNode) {
    editedDescription.value = newNode.description;
    editedImageId.value = newNode.imageId || null;
    editedTag.value = newNode.tag || '';
    editedColor.value = newNode.color || ''; // Default a string vacío
    editedSize.value = newNode.size || 'medium'; // Default a 'medium'
  } else {
    // Resetear
    editedDescription.value = '';
    editedImageId.value = null;
    editedTag.value = '';
    editedColor.value = '';
    editedSize.value = 'medium';
  }
}, { immediate: true });

function saveChanges() {
  if (props.node) {
    const updatedNodeData: Partial<BookNode> = {
      description: editedDescription.value,
      imageId: editedImageId.value,
      tag: editedTag.value || undefined, // Guardar undefined si está vacío
      color: editedColor.value || undefined, // Guardar undefined si está vacío
      size: editedSize.value,
    };
    emit('save', { nodeId: props.node.id, updates: updatedNodeData });
    emit('close');
  }
}
</script>

<style scoped>
.node-editor-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.q-card-section.scroll {
  flex-grow: 1;
  overflow-y: auto;
}
.q-card-actions {
  flex-shrink: 0;
}
</style>
