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
}
