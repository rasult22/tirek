const RANDOM_PLANT_NAMES = [
  "Зелёнка", "Листик", "Фикус", "Кактусик", "Росточек",
  "Бамбук", "Одуванчик", "Ромашка", "Солнышко", "Базилик",
  "Мята", "Лаванда", "Тюльпан", "Жасмин", "Клевер",
  "Пион", "Лотос", "Черёмуха", "Алоэ", "Берёзка",
];

export function getRandomPlantName(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return RANDOM_PLANT_NAMES[Math.abs(hash) % RANDOM_PLANT_NAMES.length]!;
}
