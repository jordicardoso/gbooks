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

export interface SetFlagAction {
  id: string;
  type: 'setFlag';
  flag: string;
  value: boolean;
}

export interface DiceRollOutcome {
  id: string;
  range: String;
  description: string;
  targetNodeId: string;
  actions?: AnyAction[];
}

export interface DiceRollAction {
  id:string;
  type: 'diceRoll';
  dice: string;
  description: string;
  outcomes: DiceRollOutcome[];
}

export type AnyAction = ModifyStatAction | ModifyInventoryAction | SetFlagAction | DiceRollAction;

// --- TIPOS DE ARISTAS (Consolidado y mejorado) ---
export interface BookEdge extends Edge {
  label?: string;
  data?: {
    description?: string;
    actions?: AnyAction[];
  };
}

// Esto nos permite tener un array de acciones de diferentes tipos
export type AnyAction = ModifyStatAction | ModifyInventoryAction | SetFlagAction | DiceRollAction;


// --- ACTUALIZAMOS BookEdge ---
export interface BookEdge extends Edge {
  label?: string;
  data?: {
    description?: string;
    actions?: AnyAction[];
  };
}

/**
 * Representa una estadística individual.
 * Ahora incluye 'min' opcional para rangos como la temperatura.
 */
export interface Stat {
  current: number;
  max: number;
  min?: number; // ¡NUEVO!
}

/**
 * Representa un evento en la cronología del personaje.
 */
export interface Event {
  id: string;
  name: string;      // ANTES: description
  happened: boolean;
}

/**
 * Representa un objeto en el inventario o equipo.
 */
export interface Item {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  effects: ItemEffect[];
}

/**
 * Representa el efecto de un objeto (ej: "+10 a Fuerza").
 */
export interface ItemEffect {
  target: string;
  value: number;
}

/**
 * Define la estructura de una sección en el layout de la ficha.
 * - `dataKey` es ahora `string` para permitir claves dinámicas.
 * - `type` se alinea con los componentes existentes.
 */
export interface CharacterSheetSectionSchema {
  type: 'stats' | 'itemSection' | 'events';
  title: string;
  icon?: string;
  dataKey: string; // <-- CAMBIO CRUCIAL: de 'keyof CharacterSheet' a 'string'
  mode?: 'slots' | 'list'; // Para diferenciar inventario de equipo
}

/**
 * Define el layout de la ficha de personaje. Es el "molde".
 */
export interface CharacterSheetSchema {
  layout: CharacterSheetSectionSchema[];
}

export type CharacterSheet = {
  stats: { [key: string]: Stat };
} & {
  [key: string]:
    | Record<string, Item | null>  // Para equipo (ranuras/slots)
    | Item[]                       // Para inventario (lista de items)
    | Event[]                      // Para eventos (lista)
    | undefined;                   // Permite que existan claves que no sean secciones
};

// Ahora añadimos la ficha y su schema a la estructura principal del libro.
export interface BookData {
  meta: BookMeta;
  nodes: BookNode[];
  edges: BookEdge[];
  assets: BookAsset[];
  variables: BookVariable[];
  viewport: VueFlowViewport;
  characterSheetSchema?: CharacterSheetSchema; // Opcional para libros antiguos
  characterSheet?: CharacterSheet; // Opcional para libros antiguos
}
