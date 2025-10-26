<!-- src/components/NodeEditorPanel.vue -->
<template>
  <q-card class="node-editor-panel bg-grey-9 text-white no-shadow column no-wrap">
    <q-card-section class="col q-pt-md q-gutter-y-md scroll">
      <!-- 3. CAMPO AÑADIDO: Input para editar el nombre (label) -->

        <q-input
        v-model="editedLabel"
        label="Nombre del Nodo"
        dark
        dense
        clearable
        />

      <q-select
        v-model="editedTags"
        label="Etiquetas"
        dark
        dense
        multiple
        use-chips
        use-input
        hide-dropdown-icon
        new-value-mode="add-unique"
        :options="allTagsOptions"
        @new-value="createTag"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              Escribe para añadir una nueva etiqueta
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input
        v-model="editedColor"
        label="Color del Nodo"
        dark
        dense
        clearable
        readonly
        class="color-input"
      >
        <!-- Muestra un círculo con el color actual -->
        <template #prepend>
          <q-icon name="circle" :style="{ color: editedColor || '#455a64' }" />
        </template>

        <!-- Icono que abre el popup con el selector de color -->
        <template #append>
          <q-icon name="colorize" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-color
                v-model="editedColor"
                dark
                no-header
                no-footer
                default-view="palette"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <q-select
        v-model="editedImageId"
        :options="imageAssetOptions"
        option-value="id"
        option-label="name"
        emit-value
        map-options
        label="Imagen del Nodo"
        dark
        dense
        clearable
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-img :src="scope.opt.src" fit="cover" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label caption class="text-grey-5">{{ scope.opt.category }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <!-- Mensaje si no hay imágenes -->
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              No hay imágenes en los assets.
            </q-item-section>
          </q-item>
        </template>
      </q-select>

      <!-- Previsualización de la imagen seleccionada -->
      <div class="image-preview-container">
        <q-img
          v-if="currentImageUrl"
          :src="currentImageUrl"
          fit="contain"
          style="max-height: 400px; border-radius: 4px;"
        />
        <div v-else class="text-center text-grey-6 q-pa-md">
          <q-icon name="image" size="2rem" />
          <p class="q-mt-sm text-caption">Sin imagen seleccionada</p>
        </div>
      </div>
      <div class="q-pa-none node-content">
        <q-input
          v-model="editedDescription"
          label="TEXTO"
          type="textarea"
          autogrow
          dark
          dense
          borderless
        />
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
import { BookNode, useBookStore } from 'src/stores/book-store';
import { useAssetsStore } from 'src/stores/assets-store';
import { storeToRefs } from 'pinia';

interface Props {
  node: BookNode | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['save', 'close']);

const assetsStore = useAssetsStore();
const { assets } = storeToRefs(assetsStore);
const bookStore = useBookStore();

// Refs para los campos del formulario
const editedLabel = ref(''); // 3. Ref para el nombre del nodo
const editedDescription = ref('');
const editedImageId = ref<string | null>(null);
const editedTags = ref<string[]>([]);
const editedColor = ref('');
const editedSize = ref<'small' | 'medium' | 'large'>('medium');

// --- LÓGICA PARA LAS ETIQUETAS ---
// Opciones para el q-select, se inicializa vacío y se llena dinámicamente
const allTagsOptions = ref<string[]>([]);

// Propiedad computada que obtiene TODAS las etiquetas únicas de todo el libro
const allBookTags = computed(() => {
  if (!bookStore.activeBook) return [];
  const all = bookStore.activeBook.chapters.flatMap(node => node.data.tag || []);
  // Usamos Set para obtener valores únicos
  return [...new Set(all)];
});

// Función para crear una nueva etiqueta y añadirla a las opciones
function createTag(inputValue: string, doneFn: (item: string, mode: 'add-unique') => void) {
  const newTag = inputValue.trim();
  if (newTag && !allTagsOptions.value.includes(newTag)) {
    allTagsOptions.value.push(newTag);
  }
  doneFn(newTag, 'add-unique');
}

// Filtra los assets para obtener solo imágenes y prepara las opciones para el q-select
const imageAssetOptions = computed(() =>
  assets.value
    .filter(asset => asset.type === 'image')
    .map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      // Usamos el getter del store para generar la URL correcta que Electron entiende
      src: assetsStore.getAssetUrl(asset.filename)
    }))
);

// Obtiene la URL de la imagen actualmente seleccionada para la previsualización
const currentImageUrl = computed(() => {
  if (!editedImageId.value) return null;
  // Buscamos la opción ya procesada para no recalcular la URL
  const selectedOption = imageAssetOptions.value.find(opt => opt.id === editedImageId.value);
  return selectedOption ? selectedOption.src : null;
});

// Sincronizar los datos del nodo con los campos del formulario
watch(() => props.node, (newNode) => {
  if (newNode) {
    editedLabel.value = newNode.label || ''; // 3. Sincronizar el label
    editedDescription.value = newNode.data.description; // Corregido para usar `data`
    editedImageId.value = newNode.data.imageId || null;
    editedTags.value = newNode.data.tag || [];
    editedColor.value = newNode.data.color || '';
    editedSize.value = newNode.data.size || 'medium';
    allTagsOptions.value = [...allBookTags.value];

  } else {
    // Resetear
    editedLabel.value = '';
    editedDescription.value = '';
    editedImageId.value = null;
    editedTags.value = [];
    editedColor.value = '';
    editedSize.value = 'medium';
  }
}, { immediate: true, deep: true }); // Usar deep: true para reaccionar a cambios en `data`

function saveChanges() {
  if (props.node) {
    // Los datos personalizados van dentro de `data`
    const updatedData: Partial<BookNode['data']> = {
      description: editedDescription.value,
      imageId: editedImageId.value,
      tag: editedTags.value.length > 0 ? editedTags.value : undefined,
      color: editedColor.value || undefined,
      size: editedSize.value,
    };

    // El `label` es una propiedad de primer nivel del nodo
    const updatedNodeShell: Partial<BookNode> = {
      label: editedLabel.value,
    };

    // Emitimos un solo evento con todos los cambios
    emit('save', {
      nodeId: props.node.id,
      updates: {
        ...updatedNodeShell,
        data: {
          ...props.node.data, // Mantenemos los datos existentes
          ...updatedData,     // Sobrescribimos con los cambios
        }
      }
    });
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

.node-content {
  white-space: pre-wrap;
  width: 100%;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>
