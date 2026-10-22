import { useState, useEffect } from 'react';
import { pushOrdersToCloud } from '../services/syncService';

export interface OrderItem {
  id: string; // unique order id
  mealKey: string; // '1031_lunch' | '1031_dinner' | '1101_lunch'
  userName: string;
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  details?: string; // e.g. "湯底: 鮮奶湯底 / 副食: 冬粉"
  timestamp: number;
}

const STORAGE_ORDERS_KEY = 'family_trip_orders_v1';
const STORAGE_USER_KEY = 'family_trip_current_user_v1';

export function getLocalUser(): string {
  const user = localStorage.getItem(STORAGE_USER_KEY) || '';
  if (!user || user === '阿明') {
    localStorage.setItem(STORAGE_USER_KEY, '五妹');
    return '五妹';
  }
  return user;
}

export function setLocalUser(name: string): void {
  const trimmed = name.trim() || '五妹';
  localStorage.setItem(STORAGE_USER_KEY, trimmed);
}

function getOrdersFromStorage(): OrderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) return [];
    const list: OrderItem[] = JSON.parse(raw);
    let changed = false;
    const migrated = list.map((item) => {
      if (item.userName === '阿明') {
        changed = true;
        return { ...item, userName: '五妹' };
      }
      return item;
    });
    if (changed) {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
}

// 全域記憶體狀態與訂閱清單，確保按下去「立即無延遲更新」
let globalOrders: OrderItem[] = getOrdersFromStorage();
const listeners = new Set<(orders: OrderItem[]) => void>();

function notify() {
  const snapshot = [...globalOrders];
  listeners.forEach((fn) => fn(snapshot));
  try {
    window.dispatchEvent(new Event('orders_updated'));
  } catch {
    // ignore
  }
}

export function getOrders(): OrderItem[] {
  // 深拷貝每筆訂單，避免呼叫端直接修改 globalOrders 內的物件
  return globalOrders.map((o) => ({ ...o }));
}

// pushToCloud=false 用於套用雲端資料時，避免把剛下載的資料又回寫雲端
export function saveOrders(orders: OrderItem[], pushToCloud = true): void {
  globalOrders = [...orders];
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(globalOrders));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
  notify();
  // 若有開啟雲端同步，非同步推送至雲端
  if (pushToCloud) {
    pushOrdersToCloud(globalOrders).catch(() => {});
  }
}

export function useOrders(): OrderItem[] {
  const [orders, setOrders] = useState<OrderItem[]>(() => [...globalOrders]);

  useEffect(() => {
    const handler = (newOrders: OrderItem[]) => {
      setOrders(newOrders);
    };
    listeners.add(handler);

    // 跨分頁監聽
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_ORDERS_KEY) {
        globalOrders = getOrdersFromStorage();
        notify();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return orders;
}

export function addOrder(item: Omit<OrderItem, 'id' | 'timestamp'>): void {
  const current = getOrders();
  const userName = item.userName || getLocalUser();

  const existingIdx = current.findIndex(
    (o) =>
      o.mealKey === item.mealKey &&
      o.userName === userName &&
      o.itemId === item.itemId &&
      (o.details || '') === (item.details || '')
  );

  if (existingIdx >= 0) {
    current[existingIdx].quantity += item.quantity;
  } else {
    current.push({
      ...item,
      userName,
      id: 'ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now()
    });
  }
  saveOrders(current);
}

export function updateOrderQty(id: string, delta: number): void {
  let current = getOrders();
  const target = current.find((o) => o.id === id);
  if (!target) return;

  target.quantity += delta;
  if (target.quantity <= 0) {
    current = current.filter((o) => o.id !== id);
  }
  saveOrders(current);
}

export function removeOrder(id: string): void {
  const current = getOrders().filter((o) => o.id !== id);
  saveOrders(current);
}

export function removeDishOrders(mealKey: string, itemId: string, details?: string): void {
  const current = getOrders().filter(
    (o) =>
      !(
        o.mealKey === mealKey &&
        o.itemId === itemId &&
        (details === undefined || (o.details || '') === details)
      )
  );
  saveOrders(current);
}

export function clearMealOrders(mealKey: string): void {
  const current = getOrders().filter((o) => o.mealKey !== mealKey);
  saveOrders(current);
}
