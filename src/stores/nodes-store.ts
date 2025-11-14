// src/stores/nodes-store.ts

import { defineStore } from 'pinia';
// [1. LA CLAVE] Importamos MarkerType de Vue Flow
import { MarkerType, type Connection, type Viewport } from '@vue-flow/core';
import { uid } from 'quasar';
import { useBookStore } from './book-store';
import type { BookNode, BookEdge, AnyChoice } from './types';

export interface NodesState {
  nodes: BookNode[];
  edges: BookEdge[];
  viewport: Viewport;
}

// Timer para el autoguardado del viewport
let viewportSaveTimer: number | null = null;

export const useNodesStore = defineStore('nodes', {
  state: (): NodesState => ({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }),

  actions: {
    /**
     * Carga los elementos (nodos, aristas) y el viewport en el store.
     * Se usa al abrir un libro.
     */
    setElements(nodes: BookNode[], edges: BookEdge[], viewport?: Viewport) {
      // Procesa los nodos para aplicar las dimensiones guardadas como estilos CSS.
      const processedNodes = nodes.map(node => {
        if (node.type === 'story' || node.type === 'start' || node.type === 'end') {
          const style: Record<string, string> = {};
          if (node.data?.width) {
            style.width = `${node.data.width}px`;
          }
          if (node.data?.height) {
            style.height = `${node.data.height}px`;
          }
          if (Object.keys(style).length > 0) {
            return { ...node, style: { ...node.style, ...style } };
          }
        }
        return node;
      });

      this.nodes = processedNodes;
      this.edges = edges;
      this.viewport = viewport || { x: 0, y: 0, zoom: 1 };
    },

    /**
     * Limpia todos los elementos del store.
     */
    clearElements() {
      this.nodes = [];
      this.edges = [];
      this.viewport = { x: 0, y: 0, zoom: 1 };
    },

    /**
     * Actualiza la posición del viewport y la guarda con un retardo para no saturar.
     * Este es un caso especial que no marca el libro como "sucio".
     */
    updateViewport(newViewport: Viewport) {
      this.viewport = newViewport;

      if (viewportSaveTimer) {
        clearTimeout(viewportSaveTimer);
      }

      viewportSaveTimer = window.setTimeout(() => {
        useBookStore().saveCurrentBook(true); // Guardado silencioso
        viewportSaveTimer = null;
      }, 1000);
    },

    /**
     * Añade una nueva conexión (arista) al grafo.
     */
    addConnection(connection: Connection) {
      if (!connection.source || !connection.target) {
        console.error('Intento de crear una conexión inválida', connection);
        return;
      }

      const newEdge: BookEdge = {
        id: uid(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        label: '',
        // [2. LA CLAVE] Añadimos la punta de flecha al final de la conexión.
        markerEnd: MarkerType.ArrowClosed,
        data: { actions: [] }
      };

      this.edges.push(newEdge);
      useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
    },

    /**
     * Crea un nuevo nodo en una posición específica.
     */
    createNode(options: { position: { x: number; y: number }; type: string }) {
      if (options.type === 'start' && this.nodes.some(n => n.type === 'start')) {
        console.warn('Intento de crear un segundo nodo de inicio. Operación cancelada.');
        return;
      }

      const newNode: BookNode = {
        id: uid(),
        type: options.type,
        position: options.position,
        label: `Nuevo ${options.type === 'end' ? 'Final' : 'Párrafo'}`,
        data: {
          paragraphNumber: this.getNewParagraphNumber(),
          description: 'Escribe aquí el contenido...',
          color: options.type === 'end' ? '#d32f2f' : '#455a64',
          tags: [],
        }
      };
      this.nodes.push(newNode);
      useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
    },

    /**
     * Crea un nuevo nodo y lo conecta automáticamente a un nodo de origen.
     */
    async createNodeAndConnect(sourceNodeId: string, choice: AnyChoice) {
      const sourceNode = this.nodes.find(n => n.id === sourceNodeId);
      if (!sourceNode) return null;

      const position = { x: sourceNode.position.x, y: sourceNode.position.y };
      const offsetX = (sourceNode.dimensions?.width || 200) + 100;
      const offsetY = (sourceNode.dimensions?.height || 100) + 80;

      let targetHandle = 'left-target';
      switch (choice.sourceHandle) {
        case 'right-source':
          position.x += offsetX;
          targetHandle = 'left-target';
          break;
        case 'left-source':
          position.x -= offsetX;
          targetHandle = 'right-target';
          break;
        case 'top-source':
          position.y -= offsetY;
          targetHandle = 'bottom-target';
          break;
        default: // 'bottom-source'
          position.y += offsetY;
          targetHandle = 'top-target';
          break;
      }

      const newNode: BookNode = {
        id: uid(),
        label: 'Nuevo Párrafo',
        position: position,
        data: {
          type: 'story',
          paragraphNumber: this.getNewParagraphNumber(),
          description: '',
          tags: [],
          color: '#455a64',
        }
      };
      this.nodes.push(newNode);

      // Esta llamada ya marcará el libro como "sucio" y creará la flecha.
      this.addConnection({
        source: sourceNodeId,
        sourceHandle: choice.sourceHandle || 'bottom-source',
        target: newNode.id,
        targetHandle: targetHandle,
      });

      return newNode;
    },

    /**
     * Actualiza las propiedades de un nodo existente.
     */
    updateNode(nodeId: string, updates: Partial<Omit<BookNode, 'id' | 'position'>>) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Actualiza las dimensiones de un nodo (ancho y alto).
     */
    updateNodeDimensions(nodeId: string, width: number, height: number) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        if (!node.data) node.data = {} as any;
        node.data.width = width;
        node.data.height = height;
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Actualiza las propiedades de una arista (conexión) existente.
     */
    updateEdge(edgeId: string, updates: Partial<Omit<BookEdge, 'id'>>) {
      const edge = this.edges.find(e => e.id === edgeId);
      if (edge) {
        const { data: dataUpdates, ...otherUpdates } = updates;
        Object.assign(edge, otherUpdates);
        if (dataUpdates) {
          if (!edge.data) edge.data = {};
          Object.assign(edge.data, dataUpdates);
        }
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Actualiza el punto de conexión de origen de una arista.
     */
    updateEdgeSourceHandle(sourceNodeId: string, targetNodeId: string, newSourceHandle: string) {
      if (!sourceNodeId || !targetNodeId || !newSourceHandle) return;
      const edgeToUpdate = this.edges.find(
        (edge) => edge.source === sourceNodeId && edge.target === targetNodeId
      );
      if (edgeToUpdate && edgeToUpdate.sourceHandle !== newSourceHandle) {
        edgeToUpdate.sourceHandle = newSourceHandle;
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Elimina una arista (conexión) del grafo.
     */
    deleteEdge(edgeId: string) {
      const index = this.edges.findIndex(edge => edge.id === edgeId);
      if (index !== -1) {
        this.edges.splice(index, 1);
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Elimina un nodo y todas sus conexiones asociadas.
     */
    deleteNode(nodeIdToDelete: string) {
      const nodeIndex = this.nodes.findIndex(n => n.id === nodeIdToDelete);
      if (nodeIndex === -1) return;

      // 1. Elimina el nodo.
      this.nodes.splice(nodeIndex, 1);

      // 2. Elimina las aristas conectadas a ese nodo.
      this.edges = this.edges.filter(edge => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete);

      // 3. Limpia las conexiones rotas en las 'choices' de otros nodos.
      this.nodes.forEach(node => {
        if (!node.choices?.length) return;
        node.choices.forEach(choice => {
          if (choice.type === 'simple' && choice.targetNodeId === nodeIdToDelete) {
            choice.targetNodeId = '';
          } else if (choice.type === 'conditional') {
            if (choice.successTargetNodeId === nodeIdToDelete) choice.successTargetNodeId = '';
            if (choice.failureTargetNodeId === nodeIdToDelete) choice.failureTargetNodeId = '';
          } else if (choice.type === 'diceRoll') {
            choice.outcomes.forEach(outcome => {
              if (outcome.targetNodeId === nodeIdToDelete) outcome.targetNodeId = '';
            });
          }
        });
      });

      useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
    },

    /**
     * Helper para obtener un número de párrafo único y consecutivo.
     */
    getNewParagraphNumber(): number {
      const existingNumbers = this.nodes.map(n => n.data.paragraphNumber || 0);
      const maxNumber = Math.max(0, ...existingNumbers);
      return maxNumber + 1;
    },
  },
});
