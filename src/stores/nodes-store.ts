// src/stores/nodes-store.ts

import { defineStore } from 'pinia';
import { uid } from 'quasar';
import { useBookStore } from './book-store';
import type { BookNode, BookEdge, BookData, Viewport } from './types';

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
    setBookData(data: BookData) {
      this.nodes = data.nodes || [];
      this.edges = data.edges || [];
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
        data: { description: 'Nuevo nodo de historia...' },
      };

      this.nodes.push(newNode);
      useBookStore().setDirty();
    },

    updateNode(nodeId: string, updates: { label?: string; data?: Partial<BookNode['data']> }) {
      const nodeIndex = this.nodes.findIndex((n) => n.id === nodeId);

      if (nodeIndex > -1) {
        const oldNode = this.nodes[nodeIndex];

        // 1. Creamos un objeto de nodo completamente nuevo
        const newNode: BookNode = {
          ...oldNode, // Copiamos todas las propiedades antiguas
          // 2. Sobrescribimos las que han cambiado
          label: updates.label ?? oldNode.label, // Si `updates.label` es undefined, mantenemos el antiguo
          data: {
            ...oldNode.data, // Copiamos los datos antiguos
            ...(updates.data || {}), // Sobrescribimos con los nuevos datos
          },
        };

        // 3. Reemplazamos el objeto antiguo por el nuevo en el array.
        // ¡Esta es la operación que dispara la reactividad de Vue!
        this.nodes[nodeIndex] = newNode;

        // 4. Notificamos que hay cambios para guardar
        useBookStore().setDirty();
      }
    },

    updateNodes(nodes: BookNode[]) {
      this.nodes = nodes;
      useBookStore().setDirty();
    },

    updateEdges(edges: BookEdge[]) {
      this.edges = edges;
      useBookStore().setDirty();
    },

    updateViewport(viewport: Viewport) {
      this.viewport = viewport;
      useBookStore().setDirty();
    }
  },
});
