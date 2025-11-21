<!-- src/components/ActionDiceRollEditor.vue -->
<template>
  <div class="q-pa-sm q-gutter-y-sm">
    <q-input
      v-model="description"
      :label="$t('actionEditors.diceRoll.descriptionLabel')"
      dark
      dense
      autogrow
    />
    <q-input
      v-model="dice"
      :label="$t('actionEditors.diceRoll.diceLabel')"
      :placeholder="$t('actionEditors.diceRoll.dicePlaceholder')"
      dark
      dense
    />

    <!-- Sub-lista de Resultados (Outcomes) -->
    <div class="q-mt-md">
      <div class="row items-center justify-between">
        <p class="text-caption text-grey-5 q-mb-none">
          {{ $t('actionEditors.diceRoll.outcomesTitle') }}
        </p>
        <q-btn
          dense
          flat
          color="primary"
          :label="$t('actionEditors.diceRoll.addOutcomeButton')"
          icon="add"
          @click="addOutcome"
        />
      </div>
      <q-list separator dark class="q-mt-sm">
        <div
          v-if="!modelValue.outcomes.length"
          class="text-center text-grey-7 q-pa-sm text-caption"
        >
          {{ $t('actionEditors.diceRoll.noOutcomes') }}
        </div>
        <q-expansion-item
          v-for="(outcome, index) in modelValue.outcomes"
          :key="outcome.id"
          :label="t('actionEditors.diceRoll.outcomeLabel', { range: outcome.range || '?' })"
          dark
          header-class="bg-grey-8"
        >
          <q-card class="bg-grey-8">
            <q-card-section>
              <OutcomeEditor
                :model-value="outcome"
                @update:model-value="(val) => updateOutcome(index, val)"
                @delete="removeOutcome(index)"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { uid } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { DiceRollAction, DiceRollOutcome } from 'src/stores/types';
import OutcomeEditor from './OutcomeEditor.vue';

const { t } = useI18n();

const props = defineProps<{
  modelValue: DiceRollAction;
}>();

const emit = defineEmits(['update:modelValue']);

const description = computed({
  get: () => props.modelValue.description,
  set: (val) => emit('update:modelValue', { ...props.modelValue, description: val }),
});

const dice = computed({
  get: () => props.modelValue.dice,
  set: (val) => emit('update:modelValue', { ...props.modelValue, dice: val }),
});

function addOutcome() {
  const newOutcome: DiceRollOutcome = {
    id: uid(),
    range: '1',
    description: t('actionEditors.diceRoll.newOutcomeDescription'),
    targetNodeId: '',
    actions: [],
  };
  const newOutcomes = [...props.modelValue.outcomes, newOutcome];
  emit('update:modelValue', { ...props.modelValue, outcomes: newOutcomes });
}

function removeOutcome(index: number) {
  const newOutcomes = [...props.modelValue.outcomes];
  newOutcomes.splice(index, 1);
  emit('update:modelValue', { ...props.modelValue, outcomes: newOutcomes });
}

function updateOutcome(index: number, updatedOutcome: DiceRollOutcome) {
  const newOutcomes = [...props.modelValue.outcomes];
  newOutcomes[index] = updatedOutcome;
  emit('update:modelValue', { ...props.modelValue, outcomes: newOutcomes });
}
</script>
