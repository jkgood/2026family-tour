import type { DishItem } from './tripData';

// 犇牛牛火鍋 單點加點菜單（10/31 晚餐，現場補單用）
export const HOTPOT_EXTRAS: DishItem[] = [
  { id: 'hpx-1', name: '白蝦 (8隻)', price: 150, category: '單點' },
  { id: 'hpx-2', name: '板腱牛肉', price: 250, category: '單點' },
  { id: 'hpx-3', name: '雪花牛肉 (五花牛肉)', price: 280, category: '單點' },
  { id: 'hpx-4', name: '梅花豬肉', price: 200, category: '單點' },
  { id: 'hpx-5', name: '去骨雞腿肉', price: 200, category: '單點' },
  { id: 'hpx-6', name: '羊五花肉捲', price: 200, category: '單點' },
  { id: 'hpx-7', name: '鮭魚菲力', price: 280, category: '單點' },
  { id: 'hpx-8', name: '無骨牛小排', price: 420, category: '單點' },
  { id: 'hpx-9', name: '季節蔬菜盤', price: 150, category: '單點', isVegetarian: true },
  { id: 'hpx-10', name: '白飯', price: 20, category: '單點' },
  { id: 'hpx-11', name: '冬粉', price: 20, category: '單點' },
  { id: 'hpx-12', name: '王子麵', price: 20, category: '單點' },
  { id: 'hpx-13', name: '雞蛋', price: 20, category: '單點' }
];
