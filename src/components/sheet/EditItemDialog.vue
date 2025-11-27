<!-- src/components/sheet/EditItemDialog.vue -->
<template>
  <q-dialog :model-value="modelValue" @update:model-value="hide" persistent>
    <q-card class="bg-grey-10 text-white" style="width: 500px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">{{ formTitle }}</div>
      </q-card-section>

      <q-separator dark />

      <q-card-section class="q-gutter-y-md">
        <q-input
          v-model="editableItem.name"
          :label="t('characterSheet.editItemDialog.nameLabel')"
          filled
          dark
          autofocus
          :rules="[
            (val) => (val && val.length > 0) || t('characterSheet.editItemDialog.nameRequired'),
          ]"
          lazy-rules
        />
        <q-input
          v-model="editableItem.description"
          :label="t('characterSheet.editItemDialog.descriptionLabel')"
          type="textarea"
          filled
          dark
          autogrow
        />
      </q-card-section>

      <q-separator dark />

      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">
          {{ t('characterSheet.editItemDialog.effectsTitle') }}
        </div>

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
              <div class="row items-center no-wrap">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  size="sm"
                  @click="editEffect(index)"
                >
                  <q-tooltip>{{ t('characterSheet.editItemDialog.editEffectTooltip') }}</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  @click="removeEffect(index)"
                >
                  <q-tooltip>{{
                    t('characterSheet.editItemDialog.deleteEffectTooltip')
                  }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey-6 text-center q-py-sm">
          {{ t('characterSheet.editItemDialog.noEffects') }}
        </div>

        <div class="row q-mt-md q-col-gutter-sm items-stretch stretch">
          <div class="col">
            <q-select
              v-model="newEffect.target"
              :options="availableStats"
              :label="t('characterSheet.editItemDialog.targetStatLabel')"
              filled
              dark
              dense
              emit-value
              map-options
              :rules="[(val) => !!val || t('characterSheet.editItemDialog.targetStatRequired')]"
            />
          </div>
          <div class="col-4">
            <q-input
              v-model.number="newEffect.value"
              :label="t('characterSheet.editItemDialog.valueLabel')"
              type="number"
              filled
              dark
              dense
              :placeholder="t('characterSheet.editItemDialog.valuePlaceholder')"
            />
          </div>
          <div class="col-auto">
            <q-btn
              v-if="editingEffectIndex === null"
              icon="add"
              color="positive"
              @click="addEffect"
              :disable="!newEffect.target"
              round
              dense
            >
              <q-tooltip>{{ t('characterSheet.editItemDialog.addEffectTooltip') }}</q-tooltip>
            </q-btn>
            <template v-else>
              <q-btn
                icon="check"
                color="positive"
                @click="addEffect"
                :disable="!newEffect.target"
                round
                dense
                class="q-mr-xs"
              >
                <q-tooltip>{{ t('characterSheet.editItemDialog.updateEffectTooltip') }}</q-tooltip>
              </q-btn>
              <q-btn icon="close" color="grey-7" @click="cancelEditEffect" round dense>
                <q-tooltip>{{ t('characterSheet.editItemDialog.cancelEditTooltip') }}</q-tooltip>
              </q-btn>
            </template>
          </div>
        </div>
      </q-card-section>

      <q-separator dark />

      <q-card-actions align="right">
        <q-btn flat :label="t('characterSheet.editItemDialog.cancel')" @click="hide" />
        <q-btn
          color="primary"
          :label="t('characterSheet.editItemDialog.save')"
          @click="onSave"
          :disable="!editableItem.name"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Item, ItemEffect } from 'src/stores/types';

const props = defineProps<{
  modelValue: boolean;
  item: Item | null;
  slotName: string;
  availableStats: string[];
}>();

const emit = defineEmits(['update:modelValue', 'save']);
const { t } = useI18n();

const editableItem = ref<Omit<Item, 'id'>>({ name: '', description: '', effects: [] });
const newEffect = ref<ItemEffect>({ target: '', value: 0 });
const editingEffectIndex = ref<number | null>(null);

const formTitle = computed(() =>
  props.item
    ? t('characterSheet.editItemDialog.titleEdit', { slotName: props.slotName })
    : t('characterSheet.editItemDialog.titleEquip', { slotName: props.slotName }),
);

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      editableItem.value = JSON.parse(JSON.stringify(newItem));
    } else {
      editableItem.value = { name: '', description: '', effects: [] };
    }
    newEffect.value = { target: '', value: 0 };
    editingEffectIndex.value = null;
  },
  { deep: true },
);

function addEffect() {
  if (!newEffect.value.target.trim()) return;

  if (editingEffectIndex.value !== null) {
    // Update existing effect
    editableItem.value.effects[editingEffectIndex.value] = { ...newEffect.value };
    editingEffectIndex.value = null;
  } else {
    // Add new effect
    editableItem.value.effects.push({ ...newEffect.value });
  }

  newEffect.value = { target: '', value: 0 };
}

function editEffect(index: number) {
  newEffect.value = { ...editableItem.value.effects[index] };
  editingEffectIndex.value = index;
}

function cancelEditEffect() {
  newEffect.value = { target: '', value: 0 };
  editingEffectIndex.value = null;
}

function removeEffect(index: number) {
  editableItem.value.effects.splice(index, 1);
  // If we were editing this effect, clear the editing state
  if (editingEffectIndex.value === index) {
    newEffect.value = { target: '', value: 0 };
    editingEffectIndex.value = null;
  } else if (editingEffectIndex.value !== null && editingEffectIndex.value > index) {
    // Adjust the editing index if we removed an effect before it
    editingEffectIndex.value--;
  }
}

function hide() {
  emit('update:modelValue', false);
  // Reset editing state when closing
  newEffect.value = { target: '', value: 0 };
  editingEffectIndex.value = null;
}

function onSave() {
  if (!editableItem.value.name) return;
  emit('save', editableItem.value);
  hide();
}
</script>
