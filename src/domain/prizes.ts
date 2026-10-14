import type { Partner, Tier } from './types';

export const PARTNERS: Record<string, Partner> = {
  zerno: { id: 'zerno', name: 'Кофейня «Зерно»', category: 'Кофе', codePrefix: 'ZRN', url: 'https://partner-zerno.example/promo' },
  stranitsa: { id: 'stranitsa', name: 'Книги «Страница»', category: 'Книги', codePrefix: 'STR', url: 'https://partner-stranitsa.example/promo' },
  velogorod: { id: 'velogorod', name: 'Прокат «Велогород»', category: 'Транспорт', codePrefix: 'VLG', url: 'https://partner-velogorod.example/promo' },
  lab: { id: 'lab', name: 'Курсы «Лаборатория»', category: 'Обучение', codePrefix: 'LAB', url: 'https://partner-lab.example/promo' },
};

/** Сумма весов обязана равняться 1 (проверяется в тестах). Значения — гипотеза, см. BRD §7. */
export const TIERS: ReadonlyArray<{ tier: Tier; weight: number; label: string }> = [
  { tier: 'COMMON', weight: 0.55, label: 'Обычный приз' },
  { tier: 'UNCOMMON', weight: 0.28, label: 'Необычный приз' },
  { tier: 'RARE', weight: 0.13, label: 'Редкий приз' },
  { tier: 'EPIC', weight: 0.04, label: 'Эпический приз' },
];

export const OFFERS: Record<Tier, ReadonlyArray<{ partnerId: string; title: string }>> = {
  COMMON: [
    { partnerId: 'zerno', title: 'Скидка 5% на заказ' },
    { partnerId: 'stranitsa', title: 'Скидка 5% на книги' },
  ],
  UNCOMMON: [
    { partnerId: 'velogorod', title: 'Скидка 10% на прокат' },
    { partnerId: 'zerno', title: 'Скидка 10% на заказ' },
  ],
  RARE: [
    { partnerId: 'lab', title: 'Скидка 20% на курс' },
    { partnerId: 'zerno', title: 'Напиток в подарок' },
  ],
  EPIC: [
    { partnerId: 'lab', title: 'Скидка 30% на курс' },
    { partnerId: 'stranitsa', title: 'Книга до 500 ₽ в подарок' },
  ],
};

export const TIER_LABEL: Record<Tier, string> = Object.fromEntries(
  TIERS.map((t) => [t.tier, t.label]),
) as Record<Tier, string>;
