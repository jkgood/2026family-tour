import type { DishItem } from './tripData';

// 點菜頁面「放在最前面」的分類分頁（依此順序排列，其後才是「全部」與其他分類）
// 已移除「招牌菜」tab，招牌品項改散入各分類並以 note 標註
export const PINNED_CATEGORIES: string[] = ['合菜'];

// 額外菜色（目前 1101 午餐已全部整合進 tripData.ts，此處留空避免重複）
export const EXTRA_DISHES: { [dateKey: string]: DishItem[] } = {
  '1101_lunch': []
};

// 餐廳資訊卡下方的補充說明
export const EXTRA_MEAL_NOTES: { [dateKey: string]: string } = {
  '1101_lunch':
    '★ 為招牌菜，標有「需預訂」者須事先電話預訂。合菜套餐另有「★客製化菜單」，價格另計，請洽店家：037-876482。'
};

// 切換到某一餐時預設停留的分頁：有放在最前面的分類就停在第一個，否則是「全部」
export function getDefaultCategory(dateKey: string): string {
  const cats = (EXTRA_DISHES[dateKey] || []).map((d) => d.category);
  const first = PINNED_CATEGORIES.find((c) => cats.includes(c));
  // 1101 午餐合菜已在 tripData，直接預設合菜
  if (dateKey === '1101_lunch') return '合菜';
  return first || '全部';
}
