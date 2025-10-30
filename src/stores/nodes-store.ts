// src/stores/nodes-store.ts

import { defineStore } from 'pinia';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@vue-flow/core';
import type { Node, Edge, Connection, NodeChange, EdgeChange, Viewport } from '@vue-flow/core';
import { uid } from 'quasar';
import { useBookStore } from './book-store';
import type { BookNode, BookEdge } from './types';

export interface NodesState {
  nodes: BookNode[];
  edges: BookEdge[];
  viewport: Viewport;
}

export const useNodesStore = defineStore('nodes', {
  state: (): NodesState => ({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }),

  actions: {
    applyNodeChanges(changes: NodeChange[]) {
      this.nodes = applyNodeChanges(changes, this.nodes);
      useBookStore().setDirty();
    },
    applyEdgeChanges(changes: EdgeChange[]) {
      this.edges = applyEdgeChanges(changes, this.edges);
      useBookStore().setDirty();
    },

    addConnection(connection: Connection) {
      this.edges = addEdge(connection, this.edges);
      useBookStore().setDirty();
    },

    setElements(nodes: BookNode[], edges: BookEdge[], viewport?: Viewport) {
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
        description: 'Escribe aquí el párrafo...',
        color: payload.type === 'start' ? '#388e3c' : (payload.type === 'end' ? '#d32f2f' : '#455a64'),
        tags: [],
        size: 'medium'
      };

      this.nodes.push(newNode);
      useBookStore().setDirty();
    },

    updateNode(nodeId: string, updates: Partial<Omit<BookNode, 'id' | 'position'>>) {
      const nodeIndex = this.nodes.findIndex((n) => n.id === nodeId);

      if (nodeIndex > -1) {
        // [CORRECCIÓN FINAL] La lógica de actualización ahora es mucho más simple.
        this.nodes[nodeIndex] = {
          ...this.nodes[nodeIndex],
          ...updates,
        };

        useBookStore().setDirty();
      }
    },

    updateViewport(viewport: Viewport) {
      this.viewport = viewport;
      useBookStore().setDirty();
    },
  },
});
