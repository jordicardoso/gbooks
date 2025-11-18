// src/i18n/ru-RU/index.ts

export default {
  // Тексты основного интерфейса библиотеки
  library: {
    title: 'Библиотека',
    addBook: 'Добавить книгу',
    noBooks: 'В библиотеке нет книг. Создайте свою первую книгу!',
    editTooltip: 'Редактировать',
    deleteTooltip: 'Удалить',
    noDescription: 'Без описания.',
  },

  // Тексты для уведомлений (pop-ups)
  notifications: {
    creatingBook: 'Создание книги...',
    bookCreatedSuccess: 'Книга "{bookName}" успешно создана.',
    bookCreatedError: 'Ошибка при создании книги: {errorMessage}',
    savingChanges: 'Сохранение изменений...',
    bookUpdatedSuccess: 'Книга успешно обновлена.',
    bookUpdatedError: 'Ошибка обновления: {errorMessage}',
    deletingBook: 'Удаление книги...',
    bookDeletedSuccess: 'Книга успешно удалена.',
    bookDeletedError: 'Ошибка удаления: {errorMessage}',
  },

  choices: {
    title: 'Варианты выбора',
    addTooltip: 'Добавить вариант выбора',
    noChoices: '(Нет вариантов выбора. Этот узел - концовка.)',
    editTooltip: 'Редактировать',
    deleteTooltip: 'Удалить',
    addDialog: {
      title: 'Выберите тип варианта',
      simple: 'Простой выбор',
      conditional: 'Проверка условия (Характеристика/Предмет/Событие)',
      diceRoll: 'Бросок кубиков',
    },
    description: {
      simple: 'Напрямую к параграфу: {paragraph}',
      conditional: 'Если {subject} {operator} {value} → {success} | Иначе → {failure}',
      diceRoll: 'Бросок {dice} с {count} исходами.',
      unknown: 'Неизвестный вариант',
    },
  },

  // Тексты для диалогов подтверждения
  dialogs: {
    deleteBook: {
      title: 'Подтвердить удаление',
      message:
        'Вы уверены, что хотите удалить книгу "<strong>{bookName}</strong>"? Это действие необратимо и удалит все ее файлы.',
      okButton: 'Удалить',
    },
  },
  assetsPage: {
    title: 'Менеджер ассетов',
    addAsset: 'Добавить ассет',
    searchPlaceholder: 'Поиск по названию...',
    categoryLabel: 'Категория',
    typeLabel: 'Тип',
    dateAdded: 'Дата добавления',
    noBookSelected: 'Выберите книгу для управления ее ассетами.',
    noAssetsFound: 'Ассеты с текущими фильтрами не найдены.',
    notifications: {
      noBookError: 'Ошибка: Книга не выбрана.',
      saving: 'Сохранение ассета...',
      savedSuccess: 'Ассет "{assetName}" успешно добавлен.',
      saveFailed: 'Не удалось сохранить ассет.',
      savedError: 'Ошибка при добавлении ассета.',
      updating: 'Обновление ассета...',
      updatedSuccess: 'Ассет "{assetName}" успешно обновлен.',
      updatedError: 'Ошибка при обновлении ассета.',
      deleting: 'Удаление ассета...',
      deletedSuccess: 'Ассет "{assetName}" удален.',
      deletedError: 'Ошибка при удалении ассета.',
    },
    dialogs: {
      deleteAsset: {
        title: 'Подтвердить удаление',
        message:
          'Вы уверены, что хотите удалить ассет "<b>{assetName}</b>"? Это действие необратимо.',
        okButton: 'Удалить',
        cancelButton: 'Отмена',
      },
      editChoice: {
        titleEdit: 'Редактировать вариант выбора',
        titleNew: 'Новый вариант выбора',
        label: 'Текст варианта (что видит игрок)',
        labelRequired: 'Текст обязателен',
        destinationNode: 'Узел назначения',
        destinationNodeRequired: 'Вы должны выбрать узел назначения',
        noNodes: 'Нет узлов',
        createNewNode: '➡️ Создать новый узел при сохранении',
        outputConnectionPoint: 'Точка исходящего соединения',
        handles: {
          bottom: 'Низ',
          right: 'Справа',
          left: 'Слева',
          top: 'Верх',
        },
        condition: 'Условие',
        stat: 'Характеристика',
        operator: 'Оп.',
        value: 'Значение',
        onSuccess: 'Назначение при УСПЕХЕ',
        onFailure: 'Назначение при ПРОВАЛЕ',
        diceToRoll: 'Бросок кубиков (напр., 1d6, 2d10+3)',
        possibleOutcomes: 'Возможные исходы',
        outcomeCondition: 'Если результат {condition}',
        outcomeDestination: 'Переход к узлу: {nodeLabel}',
        addOutcomesBelow: '(Добавьте исходы ниже)',
        conditionPlaceholder: 'Условие (напр., 1-3, 4, 5-6)',
        buttons: {
          cancel: 'Отмена',
          save: 'Сохранить',
        },
        newNode: 'Новый узел',
      },
    },
  },
  bookPage: {
    // Общие и панель инструментов
    editingTitle: 'Редактирование',
    unsavedChanges: 'Не сохранено',
    loadingBook: 'Загрузка книги...',
    saveButton: 'Сохранить',
    saving: 'Сохранение...',
    saveSuccess: 'Успешно сохранено!',
    saveError: 'Ошибка сохранения изменений',

    // Вкладки
    tabs: {
      design: 'Дизайн',
      assets: 'Ассеты',
      metadata: 'Метаданные',
      characterSheet: 'Лист персонажа',
      maps: 'Карты',
      preview: 'Предпросмотр',
      testing: 'Тестирование и сборка',
    },

    // Панель метаданных
    meta: {
      titleLabel: 'Название книги',
      authorLabel: 'Автор',
      descriptionLabel: 'Описание',
      coverImageLabel: 'Изображение обложки',
      noImageAssets: 'Нет изображений в ассетах.',
      coverPreviewTitle: 'Предпросмотр обложки:',
      noCoverSelected: 'Изображение обложки не выбрано',
    },
    filters: {
      filterByType: 'Фильтр по типу',
      filterByTag: 'Фильтр по тегу',
      clearFilters: 'Очистить фильтры',
      types: {
        start: 'Начало',
        story: 'Фрагмент',
        end: 'Конец',
        location: 'Локация',
      },
    },

    // Сообщения, когда книга не найдена
    bookNotFound: 'Книга не найдена',
    returnToLibrary: 'Вернуться в библиотеку',
    nodes: {
      startNodeTitle: 'Начало',
      storyNodeTitle: 'Фрагмент',
      noText: 'Нет текста',
      imageLoadError: 'Не удалось загрузить изображение',
    },
  },
  characterSheet: {
    // Тексты для CharacterSheetEditor.vue (основной вид)
    editor: {
      title: 'Редактор листа персонажа',
      designButton: 'Дизайн листа',
      designTooltip: 'Добавить/удалить разделы (Характеристики, Инвентарь...)',
      create: {
        title: 'У этой книги еще нет листа персонажа.',
        subtitle: 'Создайте его, чтобы начать определять характеристики и инвентарь.',
        button: 'Создать лист персонажа',
      },
      warnings: {
        statNotFound: 'Попытка применить эффект к несуществующей характеристике: "{statName}"',
      },
    },
    // Тексты для SheetDesigner.vue (диалог)
    designer: {
      title: 'Дизайнер листа',
      subtitle: 'Добавляйте, удаляйте и изменяйте порядок разделов вашего листа.',
      currentSections: 'Текущие разделы',
      noSections: '(Нет разделов. Нажмите "Добавить раздел", чтобы начать.)',
      addSection: 'Добавить раздел',
      saveChanges: 'Сохранить изменения',
      cancel: 'Отмена',
      close: 'Закрыть',
      addDialog: {
        title: 'Выберите тип раздела',
        templates: {
          stats: {
            label: 'Блок характеристик',
            description: 'Числовые значения (напр., Здоровье, Сила, Мана).',
          },
          itemSlots: {
            label: 'Снаряжение (со слотами)',
            description: 'Для снаряжения предметов в слоты, такие как "Голова", "Руки".',
          },
          itemList: {
            label: 'Инвентарь (Список)',
            description: 'Простой список для предметов, расходников и т.д.',
          },
          events: {
            label: 'Хронология событий',
            description: 'Список важных событий в истории.',
          },
        },
      },
      promptTitle: {
        title: 'Добавить "{sectionLabel}"',
        message: 'Введите название для этого раздела (напр., Атрибуты, Снаряжение героя, Рюкзак).',
      },
      errors: {
        uniqueKey: 'Ошибка при генерации уникального ключа. Пожалуйста, попробуйте снова.',
      },
      sectionTypes: {
        slots: 'Снаряжение (Слоты)',
        list: 'Инвентарь (Список)',
        stats: 'Характеристики',
        events: 'Хронология событий',
        unknown: 'Тип: {type}',
      },
    },
    // Тексты для StatsSection.vue
    statsSection: {
      addTooltip: 'Добавить характеристику',
      noStats: "(Нет характеристик. Нажмите '+', чтобы добавить.)",
      editTooltip: 'Изменить диапазон (мин/макс)',
      progressTooltip: '{current} / {max}',
      rangeLabel: 'Диапазон: {min} ↔ {max}',
      dialog: {
        titleEdit: 'Изменить характеристику',
        titleNew: 'Новая характеристика',
        nameLabel: 'Название',
        nameRequired: 'Название обязательно',
        nameExists: 'Характеристика уже существует',
        maxLabel: 'Максимальное значение',
        numberRequired: 'Должно быть числом',
        minLabel: 'Минимальное значение (необязательно)',
        minPlaceholder: 'По умолчанию: 0',
        save: 'Сохранить',
        add: 'Добавить',
      },
      confirmDelete: {
        title: 'Подтвердить',
        message: 'Вы уверены, что хотите удалить характеристику "{statName}"?',
      },
    },

    // Тексты для ItemSection.vue
    itemSection: {
      addSlotTooltip: 'Добавить слот снаряжения',
      addItemTooltip: 'Добавить предмет',
      noSlots: "(Нет слотов снаряжения. Нажмите '+', чтобы добавить.)",
      noItems: "(Пусто. Нажмите '+', чтобы добавить предмет.)",
      emptySlot: 'Пусто',
      editTooltip: 'Изменить',
      equipTooltip: 'Надеть',
      removeSlotTooltip: 'Удалить слот',
      useTooltip: 'Использовать / Потребить',
      removeItemTooltip: 'Удалить',
      dialog: {
        newSlotTitle: 'Новый слот снаряжения',
        newSlotMessage: 'Название слота (напр., Голова, Руки).',
        confirmRemoveSlotTitle: 'Подтвердить',
        confirmRemoveSlotMessage: 'Удалить слот "{slotName}"?',
        confirmRemoveItemTitle: 'Подтвердить',
        confirmRemoveItemMessage: 'Удалить "{itemName}"?',
      },
    },

    // Тексты для EventsSection.vue
    eventsSection: {
      addTooltip: 'Добавить веху события',
      noEvents: "(Нет вех. Нажмите '+', чтобы добавить.)",
      editTooltip: 'Изменить',
      removeTooltip: 'Удалить',
      dialog: {
        newTitle: 'Новая веха',
        newMessage: 'Введите название для этой вехи (напр., "Найдена Пещера Дракона").',
        editTitle: 'Изменить веху',
        editMessage: 'Измените название вехи:',
        confirmRemoveTitle: 'Подтвердить',
        confirmRemoveMessage: 'Вы уверены, что хотите удалить эту веху?',
      },
    },

    // Тексты для EditItemDialog.vue
    editItemDialog: {
      titleEdit: 'Изменить предмет в "{slotName}"',
      titleEquip: 'Надеть предмет в "{slotName}"',
      nameLabel: 'Название предмета',
      nameRequired: 'Название обязательно',
      descriptionLabel: 'Описание (необязательно)',
      effectsTitle: 'Эффекты',
      noEffects: '(Нет эффектов)',
      targetStatLabel: 'Целевая характеристика',
      targetStatRequired: 'Выберите характеристику',
      valueLabel: 'Значение',
      valuePlaceholder: 'напр., 10, -5',
      addEffectTooltip: 'Добавить эффект',
      save: 'Сохранить',
      cancel: 'Отмена',
    },
  },
  bookPreview: {
    title: 'Предпросмотр книги',
    subtitle:
      'Создайте PDF-предпросмотр вашей книги. Содержимое будет отсортировано по номеру параграфа.',
    generateButton: 'Создать PDF',
    placeholder: 'Нажмите "Создать PDF", чтобы увидеть предпросмотр.',
    generating: 'Создание PDF, это может занять некоторое время...',
    notifications: {
      noActiveBook: 'Нет активной книги для создания PDF.',
      generationError: 'Произошла ошибка при создании PDF.',
    },
    pdfContent: {
      unknownAuthor: 'Неизвестный автор',
      untitled: 'Без названия',
      noDescription: '(Без описания)',
      pageNumbering: 'Страница {currentPage} из {totalPages}',
    },
  },
  bookMap: {
    drawerTitle: 'Локации',
    unplacedLabel: 'Не размещено',
    allPlaced: 'Все локации размещены.',
    selectMapLabel: 'Выберите общую карту',
    noMapSelected: 'Выберите карту, чтобы начать.',
    dragDropHint: 'Перетащите локации сюда',
  },
  buildPage: {
    title: 'Сборка',
  },
  helpPage: {
    title: 'Помощь',
  },
  indexPage: {
    title: 'Главная страница',
  },
  testingPage: {
    title: 'Страница тестирования',
    content: 'Это содержимое вкладки тестирования.',
    futureTools: 'Здесь вы сможете добавить свои инструменты или тесты в будущем.',
  },
  errorNotFound: {
    errorMessage: 'Упс. Здесь ничего нет...',
    goHome: 'На главную',
  },
};
