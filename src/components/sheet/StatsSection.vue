<!-- src/components/sheet/StatsSection.vue -->
<template>
  <q-card class="bg-grey-9">
    <q-card-section class="row items-center">
      <q-icon v-if="icon" :name="icon" class="q-mr-sm" size="sm" />
      <div class="text-h6">{{ title }}</div>
      <q-space />
      <q-btn flat round dense icon="add" @click="openStatDialog(null)" color="positive">
        <q-tooltip>{{ t('characterSheet.statsSection.addTooltip') }}</q-tooltip>
      </q-btn>
    </q-card-section>

    <q-card-section v-if="Object.keys(localData).length === 0" class="text-grey-6 text-center q-pa-md">
      {{ t('characterSheet.statsSection.noStats') }}
    </q-card-section>

    <q-list v-else dark separator>
      <q-item v-for="(stat, key) in localData" :key="key" class="q-py-md">
        <q-item-section>
          <div class="row items-center no-wrap">
            <div class="col">
              <q-item-label class="text-capitalize text-body1">{{ key }}</q-item-label>
            </div>
            <div class="col-auto row items-center no-wrap q-gutter-x-sm">
              <q-input
                v-model.number="stat.current"
                type="number"
                dark dense filled
                style="width: 80px"
                class="text-center"
                @update:model-value="validateStat(stat)"
              />
              <q-btn flat round dense icon="edit" @click="openStatDialog(String(key))">
                <q-tooltip>{{ t('characterSheet.statsSection.editTooltip') }}</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="delete" color="negative" @click="confirmRemoveStat(String(key))" />
            </div>
          </div>

          <div class="q-mt-sm">
            <q-linear-progress
              :value="getStatProgress(stat)"
              dark rounded
              color="primary"
              size="10px"
            >
              <q-tooltip>
                {{ t('characterSheet.statsSection.progressTooltip', { current: stat.current, max: stat.max }) }}
              </q-tooltip>
            </q-linear-progress>
            <q-item-label caption class="text-grey-5 q-mt-xs text-right">
              {{ t('characterSheet.statsSection.rangeLabel', { min: stat.min ?? 0, max: stat.max }) }}
            </q-item-label>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <q-dialog v-model="isStatDialogOpen" persistent>
      <q-card class="bg-grey-10 text-white" style="width: 400px">
        <q-card-section>
          <div class="text-h6">{{ dialogTitle }}</div>
        </q-card-section>
        <q-form @submit.prevent="saveStat">
          <q-card-section class="q-gutter-y-md">
            <q-input
              v-model="statForm.name"
              :label="t('characterSheet.statsSection.dialog.nameLabel')"
              filled dark autofocus
              :readonly="!!editingStatKey"
              :rules="[
                val => !!val || t('characterSheet.statsSection.dialog.nameRequired'),
                val => !!editingStatKey || !localData[val.toLowerCase()] || t('characterSheet.statsSection.dialog.nameExists')
              ]"
              lazy-rules
            />
            <q-input
              v-model.number="statForm.max"
              :label="t('characterSheet.statsSection.dialog.maxLabel')"
              type="number"
              filled dark
              :rules="[val => typeof val === 'number' || t('characterSheet.statsSection.dialog.numberRequired')]"
              lazy-rules
            />
            <q-input
              v-model.number="statForm.min"
              :label="t('characterSheet.statsSection.dialog.minLabel')"
              type="number"
              filled dark
              :placeholder="t('characterSheet.statsSection.dialog.minPlaceholder')"
            />
          </q-card-section>
          <q-separator dark />
          <q-card-actions align="right">
            <q-btn flat :label="t('characterSheet.designer.cancel')" v-close-popup />
            <q-btn type="submit" color="primary" :label="dialogButtonLabel" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Stat } from 'src/stores/types';

const props = defineProps<{
  title: string;
  icon?: string;
  data: { [key: string]: Stat };
}>();

const emit = defineEmits(['update:data']);
const $q = useQuasar();
const { t } = useI18n();

const localData = ref<{ [key: string]: Stat }>(JSON.parse(JSON.stringify(props.data || {})));
const isStatDialogOpen = ref(false);
const editingStatKey = ref<string | null>(null);
const statForm = ref({ name: '', max: 100, min: 0 });

const dialogTitle = computed(() => editingStatKey.value ? t('characterSheet.statsSection.dialog.titleEdit') : t('characterSheet.statsSection.dialog.titleNew'));
const dialogButtonLabel = computed(() => editingStatKey.value ? t('characterSheet.statsSection.dialog.save') : t('characterSheet.statsSection.dialog.add'));

watch(() => props.data, (newData) => {
  localData.value = JSON.parse(JSON.stringify(newData || {}));
}, { deep: true });

function emitUpdate() {
  emit('update:data', localData.value);
}

function getStatProgress(stat: Stat): number {
  const min = stat.min ?? 0;
  const range = stat.max - min;
  if (range <= 0) {
    return stat.current >= stat.max ? 1 : 0;
  }
  const progress = stat.current - min;
  return Math.max(0, Math.min(1, progress / range));
}

function validateStat(stat: Stat) {
  const min = stat.min ?? 0;
  if (stat.max < min) stat.max = min;
  if (stat.current < min) stat.current = min;
  if (stat.current > stat.max) stat.current = stat.max;
  emitUpdate();
}

function openStatDialog(key: string | null = null) {
  editingStatKey.value = key;
  if (key && localData.value[key]) {
    const stat = localData.value[key];
    statForm.value = {
      name: key,
      max: stat.max,
      min: stat.min ?? 0,
    };
  } else {
    statForm.value = { name: '', max: 100, min: 0 };
  }
  isStatDialogOpen.value = true;
}

function saveStat() {
  const name = statForm.value.name.trim().toLowerCase();
  if (!name) return;

  if (editingStatKey.value) {
    const key = editingStatKey.value;
    localData.value[key].max = statForm.value.max;
    localData.value[key].min = statForm.value.min;
    validateStat(localData.value[key]);
  } else {
    if (localData.value[name]) return;
    localData.value[name] = {
      current: statForm.value.max,
      max: statForm.value.max,
      min: statForm.value.min,
    };
  }

  isStatDialogOpen.value = false;
  emitUpdate();
}

function confirmRemoveStat(key: string) {
  $q.dialog({
    title: t('characterSheet.statsSection.confirmDelete.title'),
    message: t('characterSheet.statsSection.confirmDelete.message', { statName: key }),
    dark: true,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    delete localData.value[key];
    emitUpdate();
  });
}
</script>
