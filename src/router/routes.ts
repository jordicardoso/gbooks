// src/router/routes.ts

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'library',
        component: () => import('pages/LibraryPage.vue'),
        meta: { name: 'Biblioteca' },
      },
      {
        path: 'book/:id',
        name: 'book-editor',
        component: () => import('pages/BookPage.vue'),
        meta: { name: 'Libro' },
        props: true,
      },
      {
        path: 'book/:id/character',
        name: 'character-sheet',
        component: () => import('pages/CharacterSheetPage.vue'),
        meta: { name: 'Assets' },
      },
      {
        path: 'assets',
        name: 'assets',
        component: () => import('pages/AssetsPage.vue'),
        meta: { name: 'Assets' },
      },
      {
        path: 'build',
        name: 'build',
        component: () => import('pages/BuildPage.vue'),
        meta: { name: 'Constructor' },
      },
      {
        path: 'help',
        name: 'help',
        component: () => import('pages/HelpPage.vue'),
        meta: { name: 'Ayuda' },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
