// src/components/models.ts

/**
 * Define la estructura de un libro dentro de la biblioteca.
 */
export interface Book {
  id: string;
  name: string;
  description: string;
  jsonFile: string;
  image?: string;
}
