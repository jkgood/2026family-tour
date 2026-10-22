import type { DishItem } from './tripData';

// 點菜頁面「放在最前面」的分類分頁（依此順序排列，其後才是「全部」與其他分類）
export const PINNED_CATEGORIES: string[] = ['招牌菜', '合菜'];

// 蒸烹派客家美食餐廳（11/01 午餐）新版菜單：招牌菜 ＆ 合菜套餐
// 會與 tripData.ts 裡原有的菜色合併顯示
export const EXTRA_DISHES: { [dateKey: string]: DishItem[] } = {
  '1101_lunch': [
    // ★ 招牌菜（主廚推薦，需預訂）
    { id: 'zpp-s1', name: '客味香酥鴨', price: 900, category: '招牌菜', note: '招牌・需預訂' },
    { id: 'zpp-s2', name: '蒸烹芋香鴨 (小)', price: 300, category: '招牌菜', note: '招牌・需預訂' },
    { id: 'zpp-s3', name: '蒸烹芋香鴨 (大)', price: 600, category: '招牌菜', note: '招牌・需預訂' },
    { id: 'zpp-s4', name: '家傳回味魚 (小)', price: 300, category: '招牌菜', note: '招牌・需預訂' },
    { id: 'zpp-s5', name: '家傳回味魚 (大)', price: 600, category: '招牌菜', note: '招牌・需預訂' },

    // 合菜套餐
    { id: 'zpp-c1', name: '三菜一湯', price: 800, category: '合菜' },
    { id: 'zpp-c2', name: '五菜一湯', price: 1500, category: '合菜' },
    { id: 'zpp-c3', name: '六菜一湯', price: 2000, category: '合菜' },
    { id: 'zpp-c4', name: '七菜一湯', price: 2500, category: '合菜' },
    { id: 'zpp-c5', name: '八菜一湯', price: 3200, category: '合菜' },
    { id: 'zpp-c6', name: '九菜一湯', price: 4000, category: '合菜' }
  ]
};

// 餐廳資訊卡下方的補充說明
export const EXTRA_MEAL_NOTES: { [dateKey: string]: string } = {
  '1101_lunch':
    '★ 招牌菜為主廚推薦，需提前預訂。合菜套餐另有「★客製化菜單」，價格另計，請洽店家：037-876482。'
};

// 切換到某一餐時預設停留的分頁：有放在最前面的分類就停在第一個，否則是「全部」
export function getDefaultCategory(dateKey: string): string {
  const cats = (EXTRA_DISHES[dateKey] || []).map((d) => d.category);
  const first = PINNED_CATEGORIES.find((c) => cats.includes(c));
  return first || '全部';
}
