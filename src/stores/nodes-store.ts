// src/stores/nodes-store.ts

import { defineStore } from 'pinia';
// [1. LA CLAVE] Importamos MarkerType de Vue Flow
import { MarkerType, type Connection, type Viewport } from '@vue-flow/core';
import { uid } from 'quasar';
import { useBookStore } from './book-store';
import type { BookNode, BookEdge, AnyChoice, SimpleChoice } from './types';

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
      const processedNodes = nodes.map((node) => {
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
        void useBookStore().saveCurrentBook(true); // Guardado silencioso
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
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null,
        label: '',
        // [2. LA CLAVE] Añadimos la punta de flecha al final de la conexión.
        markerEnd: MarkerType.ArrowClosed,
        data: { actions: [] },
      };

      this.edges.push(newEdge);
      useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
    },

    /**
     * Crea un nuevo nodo en una posición específica.
     */
    createNode(options: { position: { x: number; y: number }; type: string }) {
      let label = 'Nuevo Párrafo';
      let color = '#455a64'; // Color por defecto para 'story'

      if (options.type === 'end') {
        label = 'Nuevo Final';
        color = '#d32f2f';
      } else if (options.type === 'location') {
        label = 'Nueva Localización';
        color = '#795548'; // Un color café para las localizaciones
      }

      const newNode: BookNode = {
        id: uid(),
        type: options.type,
        position: options.position,
        label: label,
        data: {
          ...(options.type !== 'location' ? { paragraphNumber: this.getNewParagraphNumber() } : {}),
          description: 'Escribe aquí el contenido...',
          color: color,
          tags: [],
          // Las propiedades del mapa se inicializan vacías
          mapId: null,
          mapPosition: null,
          targetMapId: null,
        },
      };
      this.nodes.push(newNode);
      useBookStore().setDirty();
    },

    setNodeMapPosition(nodeId: string, mapId: string, position: { x: number; y: number }) {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node && node.type === 'location') {
        node.data.mapId = mapId;
        node.data.mapPosition = position;
        useBookStore().setDirty();
        console.log(`Nodo de localización '${nodeId}' posicionado en el mapa '${mapId}'.`);
      } else {
        console.error(`No se pudo encontrar el nodo de localización con ID: ${nodeId}`);
      }
    },

    /**
     * Crea un nuevo nodo y lo conecta automáticamente a un nodo de origen.
     */
    /**
     * Crea un nuevo nodo y lo conecta automáticamente a un nodo de origen.
     */
    createNodeAndConnect(sourceNodeId: string, choice: AnyChoice, branchLabel?: string) {
      const sourceNode = this.nodes.find((n) => n.id === sourceNodeId);
      if (!sourceNode) return null;

      const position = { x: sourceNode.position.x, y: sourceNode.position.y };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dimensions = (sourceNode as any).dimensions;
      const offsetX = (dimensions?.width || 200) + 100;
      const offsetY = (dimensions?.height || 100) + 80;

      let targetHandle = 'left-target';
      const sourceHandle = (choice as SimpleChoice).sourceHandle || 'bottom-source';

      switch (sourceHandle) {
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

      // Adjust position based on branchLabel to avoid overlap
      if (branchLabel) {
        if (branchLabel === 'success' || branchLabel === 'true') {
          position.y -= 100;
        } else if (branchLabel === 'failure' || branchLabel === 'false') {
          position.y += 100;
        } else {
          // For other cases (like dice outcomes), try to hash the label to get an offset
          const hash = branchLabel.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
          position.y += (hash % 200) - 100;
        }
      }

      const newNode: BookNode = {
        id: uid(),
        label: branchLabel ? `Nuevo (${branchLabel})` : 'Nuevo Párrafo',
        position: position,
        data: {
          paragraphNumber: this.getNewParagraphNumber(),
          description: '',
          tags: [],
          color: '#455a64',
        },
      };
      this.nodes.push(newNode);

      // Esta llamada ya marcará el libro como "sucio" y creará la flecha.
      this.addConnection({
        source: sourceNodeId,
        sourceHandle: sourceHandle,
        target: newNode.id,
        targetHandle: targetHandle,
      });

      return newNode;
    },

    applyFilters(filters: { types: string[]; tags: string[] }) {
      const { types, tags } = filters;
      const hasTypeFilter = types.length > 0;
      const hasTagFilter = tags.length > 0;

      // Si no hay filtros, mostramos todos los nodos y terminamos.
      if (!hasTypeFilter && !hasTagFilter) {
        this.nodes.forEach((node) => (node.hidden = false));
        return;
      }

      this.nodes.forEach((node) => {
        // El nodo debe cumplir con el filtro de tipo (si está activo)
        const typeMatch = !hasTypeFilter || types.includes(node.type as string);

        // El nodo debe tener al menos una de las etiquetas seleccionadas (si el filtro está activo)
        const tagMatch =
          !hasTagFilter || (node.data.tags?.some((tag) => tags.includes(tag)) ?? false);

        // El nodo se oculta si NO cumple con ambas condiciones (typeMatch Y tagMatch)
        node.hidden = !(typeMatch && tagMatch);
      });
    },

    /**
     * Actualiza las propiedades de un nodo existente.
     */
    updateNode(nodeId: string, updates: Partial<Omit<BookNode, 'id' | 'position'>>) {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Actualiza las dimensiones de un nodo (ancho y alto).
     */
    updateNodeDimensions(nodeId: string, width: number, height: number) {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node) {
        if (!node.data) node.data = {};
        node.data.width = width;
        node.data.height = height;
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Actualiza las propiedades de una arista (conexión) existente.
     */
    updateEdge(edgeId: string, updates: Partial<Omit<BookEdge, 'id'>>) {
      const edge = this.edges.find((e) => e.id === edgeId);
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
        (edge) => edge.source === sourceNodeId && edge.target === targetNodeId,
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
      const index = this.edges.findIndex((edge) => edge.id === edgeId);
      if (index !== -1) {
        this.edges.splice(index, 1);
        useBookStore().setDirty(); // ¡IMPORTANTE! Marca que hay cambios.
      }
    },

    /**
     * Elimina un nodo y todas sus conexiones asociadas.
     */
    deleteNode(nodeIdToDelete: string) {
      const nodeIndex = this.nodes.findIndex((n) => n.id === nodeIdToDelete);
      if (nodeIndex === -1) return;

      // 1. Elimina el nodo.
      this.nodes.splice(nodeIndex, 1);

      // 2. Elimina las aristas conectadas a ese nodo.
      this.edges = this.edges.filter(
        (edge) => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete,
      );

      // 3. Limpia las conexiones rotas en las 'choices' de otros nodos.
      this.nodes.forEach((node) => {
        if (!node.data.choices?.length) return;
        node.data.choices.forEach((choice: AnyChoice) => {
          if (choice.type === 'simple' && choice.targetNodeId === nodeIdToDelete) {
            choice.targetNodeId = '';
          } else if (choice.type === 'conditional') {
            const condChoice = choice;
            if (condChoice.successTargetNodeId === nodeIdToDelete)
              condChoice.successTargetNodeId = '';
            if (condChoice.failureTargetNodeId === nodeIdToDelete)
              condChoice.failureTargetNodeId = '';
          } else if (choice.type === 'diceRoll') {
            const diceChoice = choice;
            diceChoice.outcomes.forEach((outcome) => {
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
      // 1. Recolecta todos los números de párrafo existentes que sean válidos (números positivos).
      const existingNumbers = this.nodes
        .map((n) => n.data?.paragraphNumber)
        .filter((n): n is number => typeof n === 'number' && !isNaN(n) && n > 0);

      // 2. Crea un Set para una búsqueda de existencia muy eficiente (O(1)).
      const numberSet = new Set(existingNumbers);

      // 3. Empieza a buscar desde el 1 en adelante.
      let nextNumber = 1;
      while (numberSet.has(nextNumber)) {
        nextNumber++;
      }

      // 4. Devuelve el primer número que no se encontró en el Set.
      return nextNumber;
    },
  },
});
