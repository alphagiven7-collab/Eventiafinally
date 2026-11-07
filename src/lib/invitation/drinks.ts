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
  const visible: DrinkItem[] = [];
  const shownCategories = new Set<DrinkCategory>();

  for (const drink of ordered) {
    const category = normalizeDrinkCategory(drink.category);
    if (shownCategories.has(category)) continue;
    visible.push(drink);
    shownCategories.add(category);
    if (visible.length === 4) break;
  }

  if (visible.length < 4) {
    for (const drink of ordered) {
      if (visible.some((shown) => shown.id === drink.id)) continue;
      visible.push(drink);
      if (visible.length === 4) break;
    }
  }

  const visibleIds = new Set(visible.map((drink) => drink.id));
  return {
    visible,
    remaining: ordered.filter((drink) => !visibleIds.has(drink.id)),
  };
}

export function groupDrinksIntoRows<T>(drinks: T[], columns = 2): T[][] {
  if (drinks.length <= 1) return drinks.length ? [drinks] : [];
  const firstRowSize = drinks.length % columns === 1 ? columns + 1 : columns;
  const rows: T[][] = [];
  let index = 0;
  while (index < drinks.length) {
    const size = index === 0 ? firstRowSize : columns;
    rows.push(drinks.slice(index, index + size));
    index += size;
  }
  return rows;
}
