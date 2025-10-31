// src/stores/nodes-store.ts

import { defineStore } from 'pinia';
import { applyNodeChanges, applyEdgeChanges } from '@vue-flow/core';
import type { Connection, NodeChange, EdgeChange, Viewport } from '@vue-flow/core';
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
    init() {
      this.$subscribe((mutation) => {
        if (mutation.type === 'patch object' && mutation.payload.viewport) {
          return;
        }
        console.log('[LOG nodes-store] Store ha cambiado:', {
          type: mutation.type,
          storeId: mutation.storeId,
          payload: mutation.payload,
        });
      });
      console.log('[LOG nodes-store] Store inicializado y suscrito a cambios.');
      useBookStore().setDirty();
    },
    setElements(nodes: BookNode[], edges: BookEdge[], viewport?: Viewport) {
      console.log('[LOG nodes-store] setElements llamado con:', { numNodes: nodes.length, numEdges: edges.length, viewport });
      this.nodes = nodes;
      this.edges = edges;
      this.viewport = viewport || { x: 0, y: 0, zoom: 1 };
    },
    clearElements() {
      this.nodes = [];
      this.edges = [];
      this.viewport = { x: 0, y: 0, zoom: 1 };
    },

    updateViewport(viewport: Viewport) {
      console.log('[LOG nodes-store] 2. Actualizando viewport en el store.', viewport);
      this.viewport = viewport;
      useBookStore().setDirty();
    },

    addConnection(params: Connection) {
      if (params.source && params.target) {
        const newEdge: BookEdge = { ...params, id: uid() };
        this.edges.push(newEdge);
        useBookStore().setDirty();
      }
    },

    createNode(options: { position: { x: number; y: number }; type: string }) {
      const { position, type } = options;
      let newNode: BookNode;

      const baseNode = {
        id: uid(),
        label: `Nuevo Nodo`,
        data: {
          description: '',
          imageId: null,
          tags: [],
          size: 'medium' as const,
        }
      };

      switch (type) {
        case 'start':
          newNode = { ...baseNode, type: 'start', color: '#388e3c' };
          break;
        case 'end':
          newNode = { ...baseNode, type: 'end', color: '#c62828' };
          break;
        default:
          newNode = { ...baseNode, type: 'story', color: '#455a64' };
          break;
      }

      this.nodes.push(newNode);
      useBookStore().setDirty();
    },

    updateNode(nodeId: string, updates: Partial<Omit<BookNode, 'id' | 'position'>>) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
        useBookStore().setDirty();
      }
    },
  },
});
