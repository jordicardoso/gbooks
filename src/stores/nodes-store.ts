// src/stores/nodes-store.ts

import { defineStore } from 'pinia';
import { uid } from 'quasar';
import { useBookStore } from './book-store';
import { type BookNode, type Edge, type Viewport } from './types';

export interface NodesState {
  nodes: BookNode[];
  edges: Edge[];
  viewport: Viewport;
}

export const useNodesStore = defineStore('nodes', {
  state: (): NodesState => ({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }),

  actions: {
    setElements(nodes: BookNode[], edges: Edge[], viewport?: Viewport) {
      this.nodes = nodes;
      this.edges = edges;
      this.viewport = viewport || { x: 0, y: 0, zoom: 1 };
    },

    clearElements() {
      this.nodes = [];
      this.edges = [];
      this.viewport = { x: 0, y: 0, zoom: 1 };
    },

    createNode(payload: { position: { x: number; y: number }; type: string }) {
      if (payload.type === 'start' && this.nodes.some(n => n.type === 'start')) {
        console.warn('Intento de crear un segundo nodo inicial. Operación cancelada.');
        return;
      }

      const newNode: BookNode = {
        id: uid(),
        type: payload.type,
        position: payload.position,
        label: `Nuevo Nodo ${this.nodes.length + 1}`,
        data: { description: 'Nuevo nodo de historia...' },
      };

      this.nodes.push(newNode);
      useBookStore().setDirty();
    },

    // --- ACCIONES NUEVAS/ACTUALIZADAS ---
    updateNodes(nodes: BookNode[]) {
      this.nodes = nodes;
      useBookStore().setDirty();
    },

    updateEdges(edges: Edge[]) {
      this.edges = edges;
      useBookStore().setDirty();
    },

    updateNodeData(nodeId: string, data: Partial<BookNode['data']>) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        node.data = { ...node.data, ...data };
        useBookStore().setDirty();
      }
    },

    updateViewport(viewport: Viewport) {
      this.viewport = viewport;
      useBookStore().setDirty();
    }
  },
});
