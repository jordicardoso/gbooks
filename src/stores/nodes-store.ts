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

let viewportSaveTimer: number | null = null;

export const useNodesStore = defineStore('nodes', {
  state: (): NodesState => ({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }),

  actions: {
    init() {
      this.$subscribe((mutation) => {
        // 1. Ignoramos los cambios directos al viewport, ya que tienen su propio sistema de guardado.
        if (mutation.payload && 'viewport' in mutation.payload) {
          return;
        }

        // [LA CLAVE] Añadimos una guarda para asegurarnos de que 'events' es un array.
        // Las actualizaciones en bloque (como al cargar un libro) no tienen un array de eventos.
        if (Array.isArray(mutation.events)) {
          // 2. Ignoramos los cambios que son SOLO de posición (arrastrar nodos).
          const isJustPositionChange = mutation.events.every(
            (event) => (event as any).type === 'position'
          );
          if (isJustPositionChange) {
            // Si solo se está arrastrando un nodo, no marcamos como sucio.
            return;
          }
        }

        // Si el cambio es legítimo (crear nodo, cambiar texto, o una actualización en bloque), marcamos como sucio.
        useBookStore().setDirty();
      }, { detached: true });
    },

    setElements(nodes: BookNode[], edges: BookEdge[], viewport?: Viewport) {
      const processedNodes = nodes.map(node => {
        // Solo aplicamos esto a los nodos que pueden ser redimensionados.
        if (node.type === 'story' || node.type === 'start' || node.type === 'end') {
          const style: Record<string, string> = {};
          if (node.data?.width) {
            style.width = `${node.data.width}px`;
          }
          if (node.data?.height) {
            style.height = `${node.data.height}px`;
          }

          if (Object.keys(style).length > 0) {
            return {
              ...node,
              style: { ...node.style, ...style }
            };
          }
        }
        // Si el nodo no necesita cambios, lo devolvemos tal cual.
        return node;
      });

      this.nodes = processedNodes;
      this.edges = edges;
      this.viewport = viewport || { x: 0, y: 0, zoom: 1 };
    },

    clearElements() {
      this.nodes = [];
      this.edges = [];
      this.viewport = { x: 0, y: 0, zoom: 1 };
    },

    updateViewport(newViewport: Viewport) {
      // El payload ya es el objeto {x, y, zoom} que necesitamos
      this.viewport = newViewport;

      // Cancela cualquier guardado anterior que estuviera programado.
      if (viewportSaveTimer) {
        clearTimeout(viewportSaveTimer);
      }

      // Programa un nuevo guardado para dentro de 1 segundo.
      viewportSaveTimer = window.setTimeout(() => {
        useBookStore().saveCurrentBook(true);
        viewportSaveTimer = null;
      }, 1000);
    },


    addConnection(params: Connection) {
      if (params.source && params.target) {
        const sourceNode = this.nodes.find(n => n.id === params.source);
        const targetNode = this.nodes.find(n => n.id === params.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;

          // Si no se especifican handles, los calculamos
          if (!params.sourceHandle) {
            if (Math.abs(dx) > Math.abs(dy)) { // Es más horizontal
              params.sourceHandle = dx > 0 ? 'right-source' : 'left-source';
            } else { // Es más vertical
              params.sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
            }
          }
          if (!params.targetHandle) {
            if (Math.abs(dx) > Math.abs(dy)) { // Es más horizontal
              params.targetHandle = dx > 0 ? 'left-target' : 'right-target';
            } else { // Es más vertical
              params.targetHandle = dy > 0 ? 'top-target' : 'bottom-target';
            }
          }
        }

        const newEdge: BookEdge = { ...params, id: uid() };
        this.edges.push(newEdge);
      }
    },

    async createNodeAndConnect(sourceNodeId: string, choice: any) { // [CAMBIO 1] La firma ahora acepta el objeto 'choice'
      const sourceNode = this.nodes.find(n => n.id === sourceNodeId);
      if (!sourceNode) return null;

      const position = { x: sourceNode.position.x, y: sourceNode.position.y };
      // Usamos las dimensiones del nodo si existen, si no, un valor por defecto.
      const offsetX = (sourceNode.dimensions?.width || 200) + 100;
      const offsetY = (sourceNode.dimensions?.height || 100) + 80;

      // Esta lógica ahora calculará la posición correctamente
      switch (choice.sourceHandle) {
        case 'right-source':
          position.x += offsetX;
          break;
        case 'left-source':
          position.x -= offsetX;
          break;
        case 'top-source':
          position.y -= offsetY;
          break;
        default: // 'bottom-source' y cualquier otro caso
          position.y += offsetY;
          break;
      }

      const newNode: BookNode = {
        id: uid(),
        label: 'Nuevo Párrafo',
        position: position, // [CAMBIO 2] Usamos la posición calculada dinámicamente
        data: {
          type: 'story',
          paragraphNumber: this.getNewParagraphNumber(),
          description: '',
          tags: [],
          color: '#455a64',
        }
      };

      this.nodes.push(newNode);

      // Determinamos el handle de destino para que la conexión sea más natural
      let targetHandle = 'left-target';
      if (choice.sourceHandle === 'left-source') targetHandle = 'right-target';
      if (choice.sourceHandle === 'top-source') targetHandle = 'bottom-target';
      if (choice.sourceHandle === 'bottom-source') targetHandle = 'top-target';

      this.addConnection({
        source: sourceNodeId,
        sourceHandle: choice.sourceHandle || 'bottom-source',
        target: newNode.id,
        targetHandle: targetHandle,
      });

      return newNode;
    },

    /**
     * Helper para obtener un número de párrafo único.
     */
    getNewParagraphNumber(): number {
      const existingNumbers = this.nodes.map(n => n.data.paragraphNumber || 0);
      const maxNumber = Math.max(0, ...existingNumbers);
      return maxNumber + 1;
    },

    createNode(options: { position: { x: number; y: number }; type: string }) {
      // Previene la creación de un segundo nodo de inicio.
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
          // Asigna un color por defecto según el tipo
          color: options.type === 'end' ? '#d32f2f' : '#455a64',
          tags: [],
        }
      };
      this.nodes.push(newNode);
    },

    updateNode(nodeId: string, updates: Partial<Omit<BookNode, 'id' | 'position'>>) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
        //useBookStore().setDirty();
      }
    },

    updateNodeDimensions(nodeId: string, width: number, height: number) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        if (!node.data) {
          // Aseguramos que data exista, aunque no debería pasar con tu estructura
          node.data = {} as any;
        }
        node.data.width = width;
        node.data.height = height;
        //useBookStore().setDirty(); // Marcamos que hay cambios sin guardar
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
        //useBookStore().setDirty();
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
      //bookStore.setDirty();
    },
  },
});
