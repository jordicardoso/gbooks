// src/i18n/ca-ES/index.ts

export default {
  // Textos de la interfície principal de la biblioteca
  library: {
    title: 'Biblioteca',
    addBook: 'Afegir Llibre',
    noBooks: 'No hi ha llibres a la biblioteca. Crea el teu primer llibre!',
    editTooltip: 'Editar',
    deleteTooltip: 'Eliminar',
    noDescription: 'Sense descripció.',
  },

  // Textos per a notificacions (pop-ups)
  notifications: {
    creatingBook: 'Creant llibre...',
    bookCreatedSuccess: 'Llibre "{bookName}" creat amb èxit.',
    bookCreatedError: 'Hi ha hagut un error en crear el llibre: {errorMessage}',
    savingChanges: 'Desant canvis...',
    bookUpdatedSuccess: 'Llibre actualitzat amb èxit.',
    bookUpdatedError: 'Error en actualitzar: {errorMessage}',
    deletingBook: 'Eliminant llibre...',
    bookDeletedSuccess: 'Llibre eliminat amb èxit.',
    bookDeletedError: 'Error en eliminar: {errorMessage}',
  },

  choices: {
    title: 'Opcions de Sortida',
    addTooltip: 'Afegir Opció de Sortida',
    noChoices: '(Sense opcions de sortida. El node és un final.)',
    editTooltip: 'Editar',
    deleteTooltip: 'Eliminar',
    addDialog: {
      title: "Tria un tipus d'Opció",
      simple: 'Decisió Simple',
      conditional: 'Prova Condicional (Estadística/Objecte/Esdeveniment)',
      diceRoll: 'Llançament de Daus',
    },
    description: {
      simple: 'Directe al paràgraf: {paragraph}',
      conditional: 'Si {subject} {operator} {value} → {success} | Si no → {failure}',
      diceRoll: 'Llançament de {dice} amb {count} resultats.',
      unknown: 'Opció desconeguda',
    },
  },

  // Textos per a diàlegs de confirmació
  dialogs: {
    deleteBook: {
      title: 'Confirmar eliminació',
      message:
        'Estàs segur que vols eliminar el llibre "<strong>{bookName}</strong>"? Aquesta acció no es pot desfer i esborrarà tots els seus fitxers.',
      okButton: 'Eliminar',
    },
    editChoice: {
      titleEdit: 'Editar Opció de Sortida',
      titleNew: 'Nova Opció de Sortida',
      label: "Text de l'opció (el que veu el jugador)",
      labelRequired: 'El text és obligatori',
      destinationNode: 'Node de destinació',
      destinationNodeRequired: 'Has de seleccionar un node de destinació',
      noNodes: 'No hi ha nodes',
      createNewNode: '➡️ Crear nou node en desar',
      outputConnectionPoint: 'Punt de connexió de sortida',
      handles: {
        bottom: 'A baix',
        right: 'Dreta',
        left: 'Esquerra',
        top: 'A dalt',
      },
      condition: 'Condició',
      stat: 'Estadística',
      operator: 'Op.',
      value: 'Valor',
      onSuccess: 'Destinació si es COMPLEIX',
      onFailure: 'Destinació si FALLA',
      diceToRoll: 'Daus a llançar (ex: 1d6, 2d10+3)',
      possibleOutcomes: 'Resultats possibles',
      outcomeCondition: 'Si el resultat és {condition}',
      outcomeDestination: 'Va al node: {nodeLabel}',
      addOutcomesBelow: '(Afegeix resultats a sota)',
      conditionPlaceholder: 'Condició (ex: 1-3, 4, 5-6)',
      buttons: {
        cancel: 'Cancel·lar',
        save: 'Desar',
      },
      newNode: 'Node nou',
    },
  },
  assetsPage: {
    title: "Gestor d'Assets",
    addAsset: 'Afegir Asset',
    searchPlaceholder: 'Cercar per nom...',
    categoryLabel: 'Categoria',
    typeLabel: 'Tipus',
    dateAdded: 'Afegit',
    noBookSelected: 'Selecciona un llibre per gestionar els seus assets.',
    noAssetsFound: "No s'han trobat assets amb els filtres actuals.",
    notifications: {
      noBookError: 'Error: No hi ha cap llibre seleccionat.',
      saving: 'Desant asset...',
      savedSuccess: 'Asset "{assetName}" afegit correctament.',
      saveFailed: "No s'ha pogut desar l'asset.",
      savedError: "Error en afegir l'asset.",
      updating: 'Actualitzant asset...',
      updatedSuccess: 'Asset "{assetName}" actualitzat correctament.',
      updatedError: "Error en actualitzar l'asset.",
      deleting: 'Eliminant asset...',
      deletedSuccess: 'Asset "{assetName}" eliminat.',
      deletedError: "Error en eliminar l'asset.",
    },
    dialogs: {
      deleteAsset: {
        title: 'Confirmar eliminació',
        message:
          'Estàs segur que vols eliminar l\'asset "<b>{assetName}</b>"? Aquesta acció no es pot desfer.',
        okButton: 'Eliminar',
        cancelButton: 'Cancel·lar',
      },
    },
  },
  bookPage: {
    // Generals i de la barra d'eines
    editingTitle: 'Editant',
    unsavedChanges: 'Sense desar',
    loadingBook: 'Carregant llibre...',
    saveButton: 'Desar',
    saving: 'Desant...',
    saveSuccess: 'Desat amb èxit!',
    saveError: 'Error en desar els canvis',

    // Pestanyes
    tabs: {
      design: 'Disseny',
      assets: 'Assets',
      metadata: 'Metadades',
      characterSheet: 'Fitxa de Personatge',
      maps: 'Mapes',
      preview: 'Previsualització',
      testing: 'Proves i Compilació',
    },

    // Panell de Metadades
    meta: {
      titleLabel: 'Títol del llibre',
      authorLabel: 'Autor',
      descriptionLabel: 'Descripció',
      coverImageLabel: 'Imatge de portada',
      noImageAssets: 'No hi ha imatges als assets.',
      coverPreviewTitle: 'Vista prèvia de la portada:',
      noCoverSelected: 'Sense imatge de portada seleccionada',
    },
    filters: {
      filterByType: 'Filtrar per Tipus',
      filterByTag: 'Filtrar per Etiqueta',
      clearFilters: 'Netejar filtres',
      types: {
        start: 'Inici',
        story: 'Paràgraf',
        end: 'Final',
        location: 'Localització',
      },
    },

    // Missatges per quan no es troba un llibre
    bookNotFound: 'Llibre no trobat',
    returnToLibrary: 'tornar a la Biblioteca',
    nodes: {
      startNodeTitle: 'Inici',
      storyNodeTitle: 'Pasatge',
      noText: 'Sense texte',
      imageLoadError: 'No es pot carregar la imatge',
    },
  },
  characterSheet: {
    // Textos per a CharacterSheetEditor.vue (la vista principal)
    editor: {
      title: 'Editor de Fitxa de Personatge',
      designButton: 'Dissenyar Fitxa',
      designTooltip: 'Afegir/eliminar seccions (Estadístiques, Inventari...)',
      create: {
        title: 'Aquest llibre encara no té una fitxa de personatge.',
        subtitle: "Crea'n una per començar a definir les estadístiques i l'inventari.",
        button: 'Crear Fitxa de Personatge',
      },
      warnings: {
        statNotFound: 'Intent d\'aplicar efecte a una estadística no existent: "{statName}"',
      },
    },
    // Textos per a SheetDesigner.vue (el diàleg)
    designer: {
      title: 'Dissenyador de Fitxa',
      subtitle: 'Afegeix, elimina i reordena les seccions de la teva fitxa.',
      currentSections: 'Seccions Actuals',
      noSections: '(No hi ha seccions. Fes clic a "Afegir Secció" per començar.)',
      addSection: 'Afegir Secció',
      saveChanges: 'Desar Canvis',
      cancel: 'Cancel·lar',
      close: 'Tancar',
      addDialog: {
        title: 'Tria un tipus de secció',
        templates: {
          stats: {
            label: "Bloc d'Estadístiques",
            description: 'Valors numèrics (ex: Vida, Força, Mana).',
          },
          itemSlots: {
            label: 'Equip (amb Ranures)',
            description: 'Per equipar objectes en ranures com "Cap", "Mans".',
          },
          itemList: {
            label: 'Inventari (Llista)',
            description: 'Una llista simple per a objectes, consumibles, etc.',
          },
          events: {
            label: "Cronologia d'Esdeveniments",
            description: 'Una llista de successos importants a la història.',
          },
        },
      },
      promptTitle: {
        title: 'Afegir "{sectionLabel}"',
        message:
          "Introdueix un títol per a aquesta secció (ex: Atributs, Equip de l'Heroi, Motxilla).",
      },
      errors: {
        uniqueKey: 'Error en generar la clau única. Intenta-ho de nou.',
      },
      sectionTypes: {
        slots: 'Equip (Ranures)',
        list: 'Inventari (Llista)',
        stats: 'Estadístiques',
        events: "Cronologia d'Esdeveniments",
        unknown: 'Tipus: {type}',
      },
    },
    // Textos per a StatsSection.vue
    statsSection: {
      addTooltip: 'Afegir estadística',
      noStats: "(No hi ha estadístiques. Fes clic a '+' per afegir-ne.)",
      editTooltip: 'Editar Rang (min/max)',
      progressTooltip: '{current} / {max}',
      rangeLabel: 'Rang: {min} ↔ {max}',
      dialog: {
        titleEdit: 'Editar Estadística',
        titleNew: 'Nova Estadística',
        nameLabel: 'Nom',
        nameRequired: 'El nom és obligatori',
        nameExists: "L'estadística ja existeix",
        maxLabel: 'Valor Màxim',
        numberRequired: 'Ha de ser un número',
        minLabel: 'Valor Mínim (opcional)',
        minPlaceholder: 'Per defecte: 0',
        save: 'Desar',
        add: 'Afegir',
      },
      confirmDelete: {
        title: 'Confirmar',
        message: 'Estàs segur que vols eliminar l\'estadística "{statName}"?',
      },
    },

    // Textos per a ItemSection.vue
    itemSection: {
      addSlotTooltip: "Afegir ranura d'equip",
      addItemTooltip: 'Afegir objecte',
      noSlots: "(No hi ha ranures d'equip. Fes clic a '+' per afegir-ne.)",
      noItems: "(Buit. Fes clic a '+' per afegir un objecte.)",
      emptySlot: 'Buit',
      editTooltip: 'Editar',
      equipTooltip: 'Equipar',
      removeSlotTooltip: 'Eliminar ranura',
      useTooltip: 'Usar / Consumir',
      removeItemTooltip: 'Eliminar',
      dialog: {
        newSlotTitle: "Nova Ranura d'Equip",
        newSlotMessage: 'Nom de la ranura (ex: Cap, Mans).',
        confirmRemoveSlotTitle: 'Confirmar',
        confirmRemoveSlotMessage: 'Vols eliminar la ranura "{slotName}"?',
        confirmRemoveItemTitle: 'Confirmar',
        confirmRemoveItemMessage: 'Vols eliminar "{itemName}"?',
      },
    },

    // Textos per a EventsSection.vue
    eventsSection: {
      addTooltip: "Afegir fita d'esdeveniment",
      noEvents: "(No hi ha fites. Fes clic a '+' per afegir-ne.)",
      editTooltip: 'Editar',
      removeTooltip: 'Eliminar',
      dialog: {
        newTitle: 'Nova Fita',
        newMessage:
          'Introdueix un nom per a aquesta fita (ex: "La Cova del Drac ha estat trobada").',
        editTitle: 'Editar Fita',
        editMessage: 'Canvia el nom de la fita:',
        confirmRemoveTitle: 'Confirmar',
        confirmRemoveMessage: 'Estàs segur que vols eliminar aquesta fita?',
      },
    },

    // Textos per a EditItemDialog.vue
    editItemDialog: {
      titleEdit: 'Editar Objecte a "{slotName}"',
      titleEquip: 'Equipar Objecte a "{slotName}"',
      nameLabel: "Nom de l'Objecte",
      nameRequired: 'El nom és obligatori',
      descriptionLabel: 'Descripció (opcional)',
      effectsTitle: 'Efectes',
      noEffects: '(Sense efectes)',
      targetStatLabel: 'Stat afectada',
      targetStatRequired: 'Selecciona una stat',
      valueLabel: 'Valor',
      valuePlaceholder: 'ex: 10, -5',
      addEffectTooltip: 'Afegir efecte',
      save: 'Desar',
      cancel: 'Cancel·lar',
    },
  },
  bookPreview: {
    title: 'Vista Prèvia del Llibre',
    subtitle:
      "Genera una vista prèvia en PDF del teu llibre. El contingut s'ordenarà pel número de paràgraf.",
    generateButton: 'Generar PDF',
    placeholder: 'Fes clic a "Generar PDF" per veure la previsualització.',
    generating: 'Generant PDF, això pot trigar un moment...',
    notifications: {
      noActiveBook: 'No hi ha un llibre actiu per generar el PDF.',
      generationError: 'Hi ha hagut un error en generar el PDF.',
    },
    pdfContent: {
      unknownAuthor: 'Autor Desconegut',
      untitled: 'Sense Títol',
      noDescription: '(Sense descripció)',
      pageNumbering: 'Pàgina {currentPage} de {totalPages}',
    },
  },
  bookMap: {
    drawerTitle: 'Localitzacions',
    unplacedLabel: 'Sense Posicionar',
    allPlaced: 'Totes les localitzacions estan al seu lloc.',
    selectMapLabel: 'Seleccionar Mapa General',
    noMapSelected: 'Selecciona un mapa per començar.',
    dragDropHint: 'Arrossega localitzacions aquí',
  },
  buildPage: {
    title: 'Construcció',
  },
  helpPage: {
    title: 'Ajuda',
  },
  indexPage: {
    title: "Pàgina d'Inici",
  },
  testingPage: {
    title: 'Pàgina de Testing',
    content: 'Aquest és el contingut de la pestanya de Testing.',
    futureTools: 'Aquí podràs afegir les teves eines o proves en el futur.',
  },
  errorNotFound: {
    errorMessage: 'Vaja. Res per aquí...',
    goHome: "Anar a l'Inici",
  },
};
