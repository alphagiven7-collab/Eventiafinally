import type { DrinkCategory, DrinkItem } from '@/types';

export const DRINK_CATEGORIES: { id: DrinkCategory; label: string }[] = [
  { id: 'water', label: 'Eaux' },
  { id: 'juice-soda', label: 'Jus et sodas' },
  { id: 'cocktail', label: 'Cocktails' },
  { id: 'hot', label: 'Boissons chaudes' },
  { id: 'alcoholic', label: 'Boissons alcoolisées' },
  { id: 'other', label: 'Autres boissons' },
];

export function normalizeDrinkCategory(category?: string): DrinkCategory {
  return DRINK_CATEGORIES.find((item) => item.id === category)?.id || 'other';
}

export function groupDrinksByCategory(drinks: DrinkItem[]) {
  return DRINK_CATEGORIES.flatMap(({ id, label }) => {
    const items = drinks.filter((drink) => normalizeDrinkCategory(drink.category) === id);
    return items.length > 0 ? [{ id, label, drinks: items }] : [];
  });
}

export function partitionDrinksForMenu(drinks: DrinkItem[]) {
  const ordered = groupDrinksByCategory(drinks).flatMap((group) => group.drinks);
  return {
    visible: ordered.slice(0, 4),
    remaining: ordered.slice(4),
  };
}
