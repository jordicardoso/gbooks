// src/stores/nodes-store.ts

import { defineStore } from 'pinia';
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

        useBookStore().setDirty();
      }, { detached: true }); // 'detached: true' es una buena práctica para que la suscripción sobreviva a los cambios de pestaña.

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

    updateViewport(viewport: Viewport) {
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
      if (options.type === 'start' && this.nodes.some(n => n.type === 'start')) {
        console.warn('Intento de crear un segundo nodo inicial. Operación cancelada.');
        return;
      }

      const existingParagraphNumbers = this.nodes.map(n => n.data.paragraphNumber || 0);
      const maxParagraphNumber = Math.max(0, ...existingParagraphNumbers);
      const newParagraphNumber = maxParagraphNumber + 1;

      // Esta implementación ya es correcta y ahora coincide con el tipo BookNode actualizado.
      const newNode: BookNode = {
        id: uid(),
        type: options.type,
        position: options.position,
        label: `Nuevo Nodo ${this.nodes.length + 1}`,
        data: {
          paragraphNumber: newParagraphNumber,
          description: 'Escribe aquí el párrafo...',
          color: options.type === 'start' ? '#388e3c' : (options.type === 'end' ? '#d32f2f' : '#455a64'),
          tags: [],
          size: 'medium'
        }
      };

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

    updateEdge(edgeId: string, updates: Partial<Omit<BookEdge, 'id'>>) {
      const edge = this.edges.find(e => e.id === edgeId);
      if (edge) {
        // Hacemos una fusión inteligente para no sobreescribir el objeto `data` completo.
        const { data: dataUpdates, ...otherUpdates } = updates;

        // Aplicamos cambios de nivel superior (como 'label')
        Object.assign(edge, otherUpdates);

        // Si hay actualizaciones en 'data', las fusionamos.
        if (dataUpdates) {
          if (!edge.data) edge.data = {}; // Nos aseguramos de que `data` exista
          Object.assign(edge.data, dataUpdates);
        }

        useBookStore().setDirty();
      }
    },

    deleteNode(nodeIdToDelete: string) {
      const nodeIndex = this.nodes.findIndex(n => n.id === nodeIdToDelete);

      if (nodeIndex === -1) {
        console.warn(`[NodesStore] Nodo con id ${nodeIdToDelete} no encontrado para eliminar.`);
        return;
      }

      // 1. Eliminamos el nodo del array principal.
      this.nodes.splice(nodeIndex, 1);

      // 2. [LA LÍNEA QUE FALTABA] Eliminamos las aristas conectadas a ese nodo.
      this.edges = this.edges.filter(edge => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete);

      // 3. Limpiamos las conexiones rotas en las 'choices' de otros nodos.
      this.nodes.forEach(node => {
        if (!node.choices?.length) return;

        node.choices = node.choices.filter(choice => {
          if (choice.type === 'simple' && choice.targetNodeId === nodeIdToDelete) {
            return false;
          }
          return true;
        });

        node.choices.forEach(choice => {
          if (choice.type === 'conditional') {
            if (choice.successTargetNodeId === nodeIdToDelete) {
              choice.successTargetNodeId = '';
            }
            if (choice.failureTargetNodeId === nodeIdToDelete) {
              choice.failureTargetNodeId = '';
            }
          } else if (choice.type === 'diceRoll') {
            choice.outcomes.forEach(outcome => {
              if (outcome.targetNodeId === nodeIdToDelete) {
                outcome.targetNodeId = '';
              }
            });
          }
        });
      });

      // 4. Marcamos el libro como modificado.
      const bookStore = useBookStore();
      bookStore.setDirty();
    },
  },
});
