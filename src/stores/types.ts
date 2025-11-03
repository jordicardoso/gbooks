// src/stores/types.ts

import type { Node, Edge, ViewPort as VueFlowViewport } from '@vue-flow/core';

// --- TIPOS DE ASSETS ---
export interface BookAsset {
  id: string;
  name: string;
  category: string;
  type: 'image';
  filename: string;
  creationDate: string;
}

export interface EdgeActionCondition {
  type: 'dice' | 'stat' | 'flag'; // Tipo de condición
  expression: string; // Ej: "1d6 > 3", "strength > 10", "has_found_key"
  successTargetNodeId: string;
  failureTargetNodeId: string;
}

export interface EdgeAction {
  id: string;
  description: string; // "Exploras la cueva..."
  condition?: EdgeActionCondition; // Si es una acción condicional
  directTargetNodeId?: string; // Si es una acción directa (sin condición)
}

export interface BookEdge extends Edge {
  label?: string;
  data?: {
    description?: string;
    actions?: EdgeAction[];
  };
}

export interface BookNode extends Node {
  label: string;
  description: string;
  imageId?: string;
  tags?: string[];
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface BookMeta {
  title: string;
  description: string;
  author: string;
  imageId?: string;
}

export interface BookVariable {
  id: string;
  name:string;
  initialValue: string | number | boolean;
}

// --- ESTRUCTURA DEL FICHERO JSON ---
// Esta es la "fuente de la verdad" que se guarda en disco.
export interface BookData {
  meta: BookMeta;
  nodes: BookNode[];
  edges: BookEdge[];
  assets: BookAsset[];
  variables: BookVariable[];
  viewport: ViewPort;
  characterSheetSchema: CharacterSheetSchema | null;
  characterSheet: CharacterSheet | null;
}

// --- TIPOS DE ACCIONES BÁSICAS ---
export type ModifyOperation = 'add' | 'subtract' | 'set';

export interface ModifyStatAction {
  id: string;
  type: 'modifyStat';
  stat: string; // ej: 'health', 'mana'
  operation: ModifyOperation;
  value: number;
}

export interface ModifyInventoryAction {
  id: string;
  type: 'modifyInventory';
  operation: 'add' | 'remove';
  item: string; // ej: 'llave_oxidada'
  quantity: number;
}

export interface SetFlagAction {
  id: string;
  type: 'setFlag';
  flag: string; // ej: 'ha_hablado_con_el_rey'
  value: boolean;
}

// --- TIPOS DE ACCIONES COMPLEJAS (CON RESULTADOS) ---

// Un "Resultado" de una tirada de dados
export interface DiceRollOutcome {
  id: string;
  range: String; // ej: [1, 1] o [2, 4]
  description: string;
  targetNodeId: string; // Nodo al que se dirige si este resultado ocurre
  actions?: AnyAction[]; // Acciones adicionales que se ejecutan (ej: perder un objeto)
}

// La acción principal de "Tirada de Dados"
export interface DiceRollAction {
  id:string;
  type: 'diceRoll';
  dice: string; // ej: "1d6", "2d10+3"
  description: string;
  outcomes: DiceRollOutcome[];
}

// --- UNIÓN DE TODOS LOS TIPOS DE ACCIÓN ---
// Esto nos permite tener un array de acciones de diferentes tipos
export type AnyAction = ModifyStatAction | ModifyInventoryAction | SetFlagAction | DiceRollAction;


// --- ACTUALIZAMOS BookEdge ---
export interface BookEdge extends Edge {
  label?: string;
  data?: {
    description?: string;
    // Ahora usamos nuestro nuevo tipo
    actions?: AnyAction[];
  };
}

/**
 * Define la estructura de una sección en el layout de la ficha.
 */
export interface CharacterSheetSectionSchema {
  type: 'stats' | 'equipment' | 'itemList' | 'enfermedades'; // Tipo de componente a renderizar
  title: string; // Título de la sección (ej: "Atributos Principales")
  icon?: string; // Icono opcional
  dataKey: keyof CharacterSheet; // Clave en el objeto CharacterSheet donde se guardan los datos
}

/**
 * Define el layout de la ficha de personaje. Es el "molde".
 */
export interface CharacterSheetSchema {
  layout: CharacterSheetSectionSchema[];
}

export interface ItemEffect {
  target: string;
  value: number;
}

export interface EquippedItem {
  name: string;
  description?: string;
  effects: ItemEffect[];
}

// Asegúrate de que CharacterSheet usa este tipo
export interface CharacterSheet {
  stats: { [key: string]: { current: number; max: number } };
  clothes: { [slot: string]: EquippedItem | null;};
  equipment: { [slot: string]: EquippedItem | null };
  tools: { [slot: string]: EquippedItem | null };
  aflictions: { [slot: string]: EquippedItem | null };
  events: { [slot: string]: String | null };
}

// Ahora añadimos la ficha y su schema a la estructura principal del libro.
export interface BookData {
  meta: BookMeta;
  nodes: BookNode[];
  edges: BookEdge[];
  assets: BookAsset[];
  variables: BookVariable[];
  viewport: ViewPort;
  characterSheetSchema?: CharacterSheetSchema; // Opcional para libros antiguos
  characterSheet?: CharacterSheet; // Opcional para libros antiguos
}
