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

export interface BookNode extends Node {
  label: string;
  description: string;
  imageId?: string;
  tags?: string[];
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export type BookEdge = Edge;

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
  assets: Asset[];
  variables: BookVariable[];
  viewport: ViewPort;
}
