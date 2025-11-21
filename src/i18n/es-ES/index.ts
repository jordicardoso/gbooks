// src/i18n/es-ES/index.ts

export default {
  languages: {
    es: 'Español',
    ca: 'Catalán',
    en: 'Inglés',
    ru: 'Ruso',
  },
  // Textos de la interfaz principal de la biblioteca
  library: {
    title: 'Biblioteca',
    addBook: 'Añadir Libro',
    noBooks: 'No hay libros en la biblioteca. ¡Crea tu primer libro!',
    editTooltip: 'Editar',
    deleteTooltip: 'Eliminar',
    noDescription: 'Sin descripción.',
  },

  // Textos para notificaciones (pop-ups)
  notifications: {
    creatingBook: 'Creando libro...',
    bookCreatedSuccess: 'Libro "{bookName}" creado con éxito.',
    bookCreatedError: 'Hubo un error al crear el libro: {errorMessage}',
    savingChanges: 'Guardando cambios...',
    bookUpdatedSuccess: 'Libro actualizado con éxito.',
    bookUpdatedError: 'Error al actualizar: {errorMessage}',
    deletingBook: 'Eliminando libro...',
    bookDeletedSuccess: 'Libro eliminado con éxito.',
    bookDeletedError: 'Error al eliminar: {errorMessage}',
  },

  choices: {
    title: 'Opciones de Salida',
    addTooltip: 'Añadir Opción de Salida',
    noChoices: '(Sin opciones de salida. El nodo es un final.)',
    editTooltip: 'Editar',
    deleteTooltip: 'Eliminar',
    addDialog: {
      title: 'Elige un tipo de Opción',
      simple: 'Decisión Simple',
      conditional: 'Prueba Condicional (Stat/Item/Evento)',
      diceRoll: 'Tirada de Dados',
    },
    description: {
      simple: 'Directo a párrafo: {paragraph}',
      conditional: 'Si {subject} {operator} {value} → {success} | Si no → {failure}',
      diceRoll: 'Tirada de {dice} con {count} resultados.',
      unknown: 'Opción desconocida',
    },
  },

  // Textos para diálogos de confirmación
  dialogs: {
    deleteBook: {
      title: 'Confirmar eliminación',
      message:
        '¿Estás seguro de que quieres eliminar el libro "<strong>{bookName}</strong>"? Esta acción no se puede deshacer y borrará todos sus archivos.',
      okButton: 'Eliminar',
    },
    editChoice: {
      titleEdit: 'Editar Opción de Salida',
      titleNew: 'Nueva Opción de Salida',
      label: 'Texto de la opción (lo que ve el jugador)',
      labelRequired: 'El texto es obligatorio',
      destinationNode: 'Nodo de destino',
      destinationNodeRequired: 'Debes seleccionar un nodo de destino',
      noNodes: 'No hay nodos',
      createNewNode: '➡️ Crear nuevo nodo al guardar',
      outputConnectionPoint: 'Punto de conexión de salida',
      handles: {
        bottom: 'Abajo',
        right: 'Derecha',
        left: 'Izquierda',
        top: 'Arriba',
      },
      condition: 'Condición',
      stat: 'Stat',
      operator: 'Op.',
      value: 'Valor',
      onSuccess: 'Destino si se CUMPLE',
      onFailure: 'Destino si FALLA',
      diceToRoll: 'Dados a lanzar (ej: 1d6, 2d10+3)',
      possibleOutcomes: 'Resultados posibles',
      outcomeCondition: 'Si el resultado es {condition}',
      outcomeDestination: 'Va al nodo: {nodeLabel}',
      addOutcomesBelow: '(Añade resultados abajo)',
      conditionPlaceholder: 'Condición (ej: 1-3, 4, 5-6)',
      buttons: {
        cancel: 'Cancelar',
        save: 'Guardar',
      },
      newNode: 'Nuevo nodo',
    },
  },
  actionEditors: {
    diceRoll: {
      descriptionLabel: 'Descripción de la tirada',
      diceLabel: 'Dados a tirar',
      dicePlaceholder: 'Ej: 1d6, 2d10+3',
      outcomesTitle: 'Resultados Posibles',
      addOutcomeButton: 'Añadir Resultado',
      noOutcomes: 'Añade al menos un resultado.',
      outcomeLabel: 'Resultado para [{range}]',
      newOutcomeDescription: 'Nuevo resultado',
    }
  },
  actionsEditor: {
    title: 'Acciones al Entrar al Nodo',
    addActionTooltip: 'Añadir una nueva acción',
    noActions: 'No hay acciones definidas para este nodo.',
    noNestedActions: 'Sin acciones',
    successActionsTitle: 'Si se CUMPLE, hacer:',
    failureActionsTitle: 'Si FALLA, hacer:',
    removeConditionButton: 'Eliminar Condición',
    condition: {
      title: 'Condición',
      sourceLabel: 'Tipo',
      subjectLabelStat: 'Estadística a comprobar',
      subjectLabelFlag: 'Evento a comprobar', // <-- CAMBIO
      valueLabel: 'Valor',
      sources: {
        stat: 'Estadística',
        flag: 'Evento', // <-- CAMBIO
      },
    },
    dialog: {
      title: 'Elige un tipo de Acción',
      conditional: 'Acción Condicional (Si... entonces...)',
      modifyStat: 'Modificar Estadística',
      setFlag: 'Establecer Evento', // <-- CAMBIO
    },
    dialogs: {
      modifyStat: {
        title: 'Modificar Estadística',
        message: 'Define la estadística, la operación y el valor.',
      },
      setFlag: {
        title: 'Establecer Evento', // <-- CAMBIO
        message:
          'Introduce el nombre del evento (ej: "puerta_abierta"). Se establecerá a "true".',
      },
    },
    descriptions: {
      modifyStat: 'Estadística: {stat} {operation} {value}',
      setFlag: 'Evento: {flag} = {value}', // <-- CAMBIO
      conditional: 'SI ({subject} {operator} {value}) ENTONCES...',
      unknown: 'Acción desconocida',
    },
  },
  assetsPage: {
    title: 'Gestor de Assets',
    addAsset: 'Añadir Asset',
    searchPlaceholder: 'Buscar por nombre...',
    categoryLabel: 'Categoría',
    typeLabel: 'Tipo',
    dateAdded: 'Añadido',
    noBookSelected: 'Selecciona un libro para gestionar sus assets.',
    noAssetsFound: 'No se encontraron assets con los filtros actuales.',
    notifications: {
      noBookError: 'Error: No hay libro seleccionado.',
      saving: 'Guardando asset...',
      savedSuccess: 'Asset "{assetName}" añadido correctamente.',
      saveFailed: 'No se pudo guardar el asset.',
      savedError: 'Error al añadir el asset.',
      updating: 'Actualizando asset...',
      updatedSuccess: 'Asset "{assetName}" actualizado correctamente.',
      updatedError: 'Error al actualizar el asset.',
      deleting: 'Eliminando asset...',
      deletedSuccess: 'Asset "{assetName}" eliminado.',
      deletedError: 'Error al eliminar el asset.',
    },
    dialogs: {
      deleteAsset: {
        title: 'Confirmar eliminación',
        message:
          '¿Estás seguro de que quieres eliminar el asset "<b>{assetName}</b>"? Esta acción no se puede deshacer.',
        okButton: 'Eliminar',
        cancelButton: 'Cancelar',
      },
    },
  },
  addAssetDialog: {
    title: 'Añadir Nuevo Asset',
    fileLabel: 'Seleccionar archivo',
    fileRequired: 'Debes seleccionar un archivo',
    nameLabel: 'Nombre del Asset',
    nameRequired: 'El nombre es requerido',
    categoryLabel: 'Categoría',
    categoryRequired: 'La categoría es requerida',
    cancelButton: 'Cancelar',
    submitButton: 'Añadir Asset',
  },
  editAssetDialog: {
    title: 'Editar Asset',
    nameLabel: 'Nombre del Asset',
    nameRequired: 'El nombre es requerido',
    categoryLabel: 'Categoría',
    categoryRequired: 'La categoría es requerida',
    cancelButton: 'Cancelar',
    submitButton: 'Guardar Cambios',
  },
  bookGraph: {
    contextMenu: {
      addStory: 'Añadir Párrafo',
      addLocation: 'Añadir Localización',
      addEnd: 'Añadir Final',
    },
  },
  bookPage: {
    // Generales y de la barra de herramientas
    editingTitle: 'Editando',
    unsavedChanges: 'Sin guardar',
    loadingBook: 'Cargando libro...',
    saveButton: 'Guardar',
    saving: 'Guardando...',
    saveSuccess: '¡Guardado con éxito!',
    saveError: 'Error al guardar los cambios',

    // Pestañas
    tabs: {
      design: 'Diseño',
      assets: 'Assets',
      metadata: 'Metadatos',
      characterSheet: 'Ficha de Personaje',
      maps: 'Mapas',
      preview: 'Preview',
      testing: 'Testing & Build',
    },

    // Panel de Metadatos
    meta: {
      titleLabel: 'Título del libro',
      authorLabel: 'Autor',
      descriptionLabel: 'Descripción',
      coverImageLabel: 'Imagen de portada',
      noImageAssets: 'No hay imágenes en los assets.',
      coverPreviewTitle: 'Vista previa de la portada:',
      noCoverSelected: 'Sin imagen de portada seleccionada',
    },
    filters: {
      filterByType: 'Filtrar por Tipo',
      filterByTag: 'Filtrar por Etiqueta',
      clearFilters: 'Limpiar filtros',
      types: {
        start: 'Inicio',
        story: 'Párrafo',
        end: 'Final',
        location: 'Localización',
      },
    },

    // Mensajes para cuando no se encuentra un libro
    bookNotFound: 'Libro no encontrado',
    returnToLibrary: 'Volver a la Biblioteca',
    nodes: {
      startNodeTitle: 'Inicio',
      storyNodeTitle: 'Pasaje',
      noText: 'Sin texto',
      imageLoadError: 'No se pudo cargar la imagen',
    },
  },
  characterSheet: {
    // Textos para CharacterSheetEditor.vue (la vista principal)
    editor: {
      title: 'Editor de Ficha de Personaje',
      designButton: 'Diseñar Ficha',
      designTooltip: 'Añadir/quitar secciones (Estadísticas, Inventario...)',
      create: {
        title: 'Este libro aún no tiene una ficha de personaje.',
        subtitle: 'Crea una para empezar a definir las estadísticas y el inventario.',
        button: 'Crear Ficha de Personaje',
      },
      warnings: {
        statNotFound: 'Intento de aplicar efecto a una estadística no existente: "{statName}"',
      },
    },
    // Textos para SheetDesigner.vue (el diálogo)
    designer: {
      title: 'Diseñador de Ficha',
      subtitle: 'Añade, elimina y reordena las secciones de tu ficha.',
      currentSections: 'Secciones Actuales',
      noSections: '(No hay secciones. Haz clic en "Añadir Sección" para empezar.)',
      addSection: 'Añadir Sección',
      saveChanges: 'Guardar Cambios',
      cancel: 'Cancelar',
      close: 'Cerrar',
      addDialog: {
        title: 'Elige un tipo de sección',
        templates: {
          stats: {
            label: 'Bloque de Estadísticas',
            description: 'Valores numéricos (ej: Vida, Fuerza, Maná).',
          },
          itemSlots: {
            label: 'Equipo (con Ranuras)',
            description: 'Para equipar objetos en ranuras como "Cabeza", "Manos".',
          },
          itemList: {
            label: 'Inventario (Lista)',
            description: 'Una lista simple para objetos, consumibles, etc.',
          },
          events: {
            label: 'Cronología de Eventos',
            description: 'Una lista de sucesos importantes en la historia.',
          },
        },
      },
      promptTitle: {
        title: 'Añadir "{sectionLabel}"',
        message:
          'Introduce un título para esta sección (ej: Atributos, Equipo del Héroe, Mochila).',
      },
      errors: {
        uniqueKey: 'Error al generar clave única. Inténtalo de nuevo.',
      },
      sectionTypes: {
        slots: 'Equipo (Ranuras)',
        list: 'Inventario (Lista)',
        stats: 'Estadísticas',
        events: 'Cronología de Eventos',
        unknown: 'Tipo: {type}',
      },
    },
    // Textos para StatsSection.vue
    statsSection: {
      addTooltip: 'Añadir estadística',
      noStats: "(No hay estadísticas. Haz clic en '+' para añadir una.)",
      editTooltip: 'Editar Rango (min/max)',
      progressTooltip: '{current} / {max}',
      rangeLabel: 'Rango: {min} ↔ {max}',
      dialog: {
        titleEdit: 'Editar Estadística',
        titleNew: 'Nueva Estadística',
        nameLabel: 'Nombre',
        nameRequired: 'El nombre es obligatorio',
        nameExists: 'La estadística ya existe',
        maxLabel: 'Valor Máximo',
        numberRequired: 'Debe ser un número',
        minLabel: 'Valor Mínimo (opcional)',
        minPlaceholder: 'Por defecto: 0',
        save: 'Guardar',
        add: 'Añadir',
      },
      confirmDelete: {
        title: 'Confirmar',
        message: '¿Estás seguro de que quieres eliminar la estadística "{statName}"?',
      },
    },

    // Textos para ItemSection.vue
    itemSection: {
      addSlotTooltip: 'Añadir ranura de equipo',
      addItemTooltip: 'Añadir objeto',
      noSlots: "(No hay ranuras de equipo. Haz clic en '+' para añadir una.)",
      noItems: "(Vacío. Haz clic en '+' para añadir un objeto.)",
      emptySlot: 'Vacío',
      editTooltip: 'Editar',
      equipTooltip: 'Equipar',
      removeSlotTooltip: 'Eliminar ranura',
      useTooltip: 'Usar / Consumir',
      removeItemTooltip: 'Eliminar',
      dialog: {
        newSlotTitle: 'Nueva Ranura de Equipo',
        newSlotMessage: 'Nombre de la ranura (ej: Cabeza, Manos).',
        confirmRemoveSlotTitle: 'Confirmar',
        confirmRemoveSlotMessage: '¿Eliminar la ranura "{slotName}"?',
        confirmRemoveItemTitle: 'Confirmar',
        confirmRemoveItemMessage: '¿Eliminar "{itemName}"?',
      },
    },

    // Textos para EventsSection.vue
    eventsSection: {
      addTooltip: 'Añadir hito de evento',
      noEvents: "(No hay hitos. Haz clic en '+' para añadir uno.)",
      editTooltip: 'Editar',
      removeTooltip: 'Eliminar',
      dialog: {
        newTitle: 'Nuevo Hito',
        newMessage:
          'Introduce un nombre para este hito (ej: "La Cueva del Dragón fue encontrada").',
        editTitle: 'Editar Hito',
        editMessage: 'Cambia el nombre del hito:',
        confirmRemoveTitle: 'Confirmar',
        confirmRemoveMessage: '¿Estás seguro de que quieres eliminar este hito?',
      },
    },

    // Textos para EditItemDialog.vue
    editItemDialog: {
      titleEdit: 'Editar Objeto en "{slotName}"',
      titleEquip: 'Equipar Objeto en "{slotName}"',
      nameLabel: 'Nombre del Objeto',
      nameRequired: 'El nombre es obligatorio',
      descriptionLabel: 'Descripción (opcional)',
      effectsTitle: 'Efectos',
      noEffects: '(Sin efectos)',
      targetStatLabel: 'Stat afectada',
      targetStatRequired: 'Selecciona una stat',
      valueLabel: 'Valor',
      valuePlaceholder: 'ej: 10, -5',
      addEffectTooltip: 'Añadir efecto',
      save: 'Guardar',
      cancel: 'Cancelar',
    },
  },
  bookPreview: {
    title: 'Vista Previa del Libro',
    subtitle:
      'Genera una vista previa en PDF de tu libro. El contenido se ordenará por el número de párrafo.',
    generateButton: 'Generar PDF',
    placeholder: 'Haz clic en "Generar PDF" para ver la previsualización.',
    generating: 'Generando PDF, esto puede tardar un momento...',
    notifications: {
      noActiveBook: 'No hay un libro activo para generar el PDF.',
      generationError: 'Ocurrió un error al generar el PDF.',
    },
    pdfContent: {
      unknownAuthor: 'Autor Desconocido',
      untitled: 'Sin Título',
      noDescription: '(Sin descripción)',
      pageNumbering: 'Página {currentPage} de {totalPages}',
    },
  },
  bookMap: {
    drawerTitle: 'Localizaciones',
    unplacedLabel: 'Sin Posicionar',
    allPlaced: 'Todas las localizaciones están en su sitio.',
    selectMapLabel: 'Seleccionar Mapa General',
    noMapSelected: 'Selecciona un mapa para empezar.',
    dragDropHint: 'Arrastra localizaciones aquí',
  },
  buildPage: {
    title: 'Construcción',
  },
  helpPage: {
    title: 'Ayuda',
  },
  indexPage: {
    title: 'Página de Inicio',
  },
  testingPage: {
    title: 'Página de Testing',
    content: 'Este es el contenido de la pestaña de Testing.',
    futureTools: 'Aquí podrás añadir tus herramientas o pruebas en el futuro.',
  },
  errorNotFound: {
    errorMessage: 'Vaya. Nada por aquí...',
    goHome: 'Ir al Inicio',
  },
};
