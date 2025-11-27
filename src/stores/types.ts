// src/stores/types.ts

import type { Node, Edge } from '@vue-flow/core';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// --- TIPOS DE ASSETS ---
export interface BookAsset {
  id: string;
  name: string;
  category: string;
  type: 'image';
  filename: string;
  creationDate: string;
}

export type BookNodeType = 'start' | 'story' | 'end' | 'location';

export interface BookNodeData {
  paragraphNumber?: number;
  description?: string;
  imageId?: string;
  tags?: string[];
  color?: string;
  width?: number;
  height?: number;
  actions?: AnyAction[];
  choices?: AnyChoice[];
  mapId?: string | null;
  mapPosition?: { x: number; y: number } | null;
  targetMapId?: string | null;
}

export interface BookNode extends Node {
  label: string;
  data: BookNodeData;
}

export interface BookMeta {
  title: string;
  description: string;
  author: string;
  imageId?: string;
}

export interface BookEvent {
  id: string;
  name: string;
  initialValue: string | number | boolean;
}

// --- TIPOS DE ACCIONES ---
export type ModifyOperation = 'add' | 'subtract' | 'set';

export interface ModifyStatAction {
  id: string;
  type: 'modifyStat';
  stat: string;
  operation: ModifyOperation;
  value: number;
}

export interface ModifyInventoryAction {
  id: string;
  type: 'modifyInventory';
  operation: 'add' | 'remove';
  item: string;
  quantity: number;
}

export interface AddItemAction {
  id: string;
  type: 'addItem';
  section: string; // The dataKey of the section (e.g., 'inventory', 'equipment')
  item: Item;
}

export interface SetFlagAction {
  id: string;
  type: 'setFlag';
  flag: string;
  value: boolean | string | number;
}

export interface DiceRollOutcome {
  id: string;
  range: string;
  description: string;
  targetNodeId: string;
  actions?: AnyAction[];
}

export interface DiceRollAction {
  id: string;
  type: 'diceRoll';
  dice: string;
  description: string;
  outcomes: DiceRollOutcome[];
}

// [CORRECCIÓN] Renombrado para evitar conflicto con ChoiceCondition
export interface ActionCondition {
  source: 'stat' | 'flag';
  subject: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

export interface ConditionalAction {
  id: string;
  type: 'conditional';
  condition: ActionCondition; // Usamos el tipo renombrado
  successActions: AnyAction[];
  failureActions: AnyAction[];
}

// --- OPCIONES DE SALIDA (CHOICES) ---

export interface SimpleChoice {
  id: string;
  type: 'simple';
  label: string;
  targetNodeId: string;
  sourceHandle?: string;
}

export type ConditionType = 'stat' | 'item' | 'event';
export type ConditionOperator = '==' | '!=' | '>' | '>=' | '<' | '<=';

// [CORRECCIÓN] Renombrado para evitar conflicto con ActionCondition
export interface ChoiceCondition {
  id: string;
  type: ConditionType;
  subject: string;
  operator: ConditionOperator;
  value: number | boolean | string;
  sourceHandle?: string;
}

export interface ConditionalChoice {
  id: string;
  type: 'conditional';
  label: string;
  condition: ChoiceCondition; // Usamos el tipo renombrado
  successTargetNodeId: string;
  failureTargetNodeId: string;
  sourceHandle?: string;
}

export interface DiceOutcome {
  id: string;
  range: string;
  label: string;
  targetNodeId: string;
  sourceHandle?: string;
}

export interface DiceRollChoice {
  id: string;
  type: 'diceRoll';
  label: string;
  dice: string;
  outcomes: DiceOutcome[];
  sourceHandle?: string;
}

// --- SKILL CHECK TYPES ---

export interface ModifierTrigger {
  checkType: 'flag';
  targetId: string;
  operator: 'exists' | 'not_exists';
  value?: boolean;
}

export interface ModifierEffect {
  operation: 'add';
  value: number;
}

export interface ConditionalModifier {
  ruleId: string;
  trigger: ModifierTrigger;
  effect: ModifierEffect;
}

export interface SkillCheckConfig {
  baseDifficulty: number;
  skill: string;
  diceType: string;
  conditionalModifiers: ConditionalModifier[];
}

export interface SkillCheckChoice {
  id: string;
  type: 'skillCheck';
  label: string;
  successTargetNodeId: string;
  failureTargetNodeId: string;
  rollConfig: SkillCheckConfig;
  sourceHandle?: string;
  successText?: string;
  failureText?: string;
}

// --- TIPOS GLOBALES CONSOLIDADOS ---

// [CORRECCIÓN] Definición única y completa de AnyAction
export type AnyAction =
  | ModifyStatAction
  | ModifyInventoryAction
  | AddItemAction
  | SetFlagAction
  | DiceRollAction
  | ConditionalAction;

// Definición única de AnyChoice
export type AnyChoice = SimpleChoice | ConditionalChoice | DiceRollChoice | SkillCheckChoice;

// [CORRECCIÓN] Definición única y completa de BookEdge
export type BookEdge = Edge & {
  id: string;
  label?: string;
  data?: {
    description?: string;
    actions?: AnyAction[];
  };
};

// --- FICHA DE PERSONAJE ---

export interface Stat {
  current: number;
  max: number;
  min?: number;
}

export interface Event {
  id: string;
  name: string;
  happened: boolean;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  effects: ItemEffect[];
}

export interface ItemEffect {
  target: string;
  value: number;
}

export interface CharacterSheetSectionSchema {
  type: 'stats' | 'itemSection' | 'events';
  title: string;
  icon?: string;
  dataKey: string;
  mode?: 'slots' | 'list';
}

export interface CharacterSheetSchema {
  layout: CharacterSheetSectionSchema[];
}

export type CharacterSheet = {
  stats: { [key: string]: Stat };
} & {
  [key: string]: Record<string, Item | null> | Item[] | Event[] | undefined;
};

export interface BookData {
  meta: BookMeta;
  nodes: BookNode[];
  edges: BookEdge[];
  assets: BookAsset[];
  events: BookEvent[];
  viewport: Viewport;
  characterSheetSchema?: CharacterSheetSchema;
  characterSheet?: CharacterSheet;
}
