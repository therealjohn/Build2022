/**
 * Adaptive card data model bound to the card template.
 */
export interface CardData {
  title: string;
  issues: Issue[];
  notificationUrl: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}
