// src/router/routes.ts

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/IndexPage.vue'),
        meta: { showInMenu: false, name: 'Inicio' },
      },
      {
        path: 'library',
        name: 'library',
        component: () => import('pages/LibraryPage.vue'),
        meta: { showInMenu: true, name: 'Biblioteca' },
      },
      {
        path: 'book/:id',
        name: 'book-editor',
        component: () => import('pages/BookPage.vue'),
        meta: { showInMenu: false, name: 'Libro' },
      },
      {
        path: 'book/:id/character',
        name: 'character-sheet',
        component: () => import('pages/CharacterSheetPage.vue'),
        meta: { showInMenu: false, name: 'Assets' },
      },
      {
        path: 'assets',
        name: 'assets',
        component: () => import('pages/AssetsPage.vue'),
        meta: { showInMenu: false, name: 'Assets' },
      },
      {
        path: 'build',
        name: 'build',
        component: () => import('pages/BuildPage.vue'),
        meta: { icon: 'build', name: 'Constructor' },
      },
      {
        path: 'help',
        name: 'help',
        component: () => import('pages/HelpPage.vue'),
        meta: { icon: 'help', name: 'Ayuda' },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
