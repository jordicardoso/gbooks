// src/stores/types.ts

import type { Node, Edge, ViewPort } from '@vue-flow/core';

// --- TIPOS DE ASSETS ---
export interface BookAsset {
  id: string;
  name: string;
  category: string;
  type: 'image';
  filename: string;
  creationDate: string;
}

// --- TIPOS DEL LIBRO ---
export interface BookNodeData {
  description: string;
  imageId?: string;
  tag?: string[];
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export type BookNode = Node<BookNodeData>;
export type BookEdge = Edge<BookNodeData>;

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
  assets: Asset[]; // Ahora es un array de objetos Asset completos
  // characterSheets: CharacterSheet[]; // Ejemplo para el futuro
  // maps: MapData[]; // Ejemplo para el futuro
  variables: BookVariable[];
  viewport: ViewPort;
}
