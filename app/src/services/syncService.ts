import { OrderItem, getOrders, saveOrders } from '../store/orderStore';

const STORAGE_SYNC_CONFIG_KEY = 'family_trip_sync_config_v1';
const STORAGE_SYNC_ENABLED_KEY = 'family_trip_sync_enabled_v1';

// 預設的 Firebase Realtime Database 網址。
// 可在 Vercel 的環境變數設定 VITE_FIREBASE_DB_URL，或直接填在下方引號內。
// 例如：https://xxxx-default-rtdb.asia-southeast1.firebasedatabase.app
const DEFAULT_FIREBASE_URL: string =
  ((import.meta.env.VITE_FIREBASE_DB_URL as string | undefined) || '').trim();

const DEFAULT_ROOM_KEY = '2026-family-tour';

export interface SyncConfig {
  firebaseDatabaseUrl?: string; // e.g. https://xxxx-default-rtdb.firebaseio.com/
  roomKey: string; // e.g. 2026-family-tour
}

export function getSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_SYNC_CONFIG_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as SyncConfig;
      return {
        // 本機沒填網址時，自動套用預設網址
        firebaseDatabaseUrl: saved.firebaseDatabaseUrl || DEFAULT_FIREBASE_URL,
        roomKey: saved.roomKey || DEFAULT_ROOM_KEY
      };
    }
  } catch {
    // ignore
  }
  return {
    firebaseDatabaseUrl: DEFAULT_FIREBASE_URL,
    roomKey: DEFAULT_ROOM_KEY
  };
}

export function saveSyncConfig(cfg: SyncConfig): void {
  try {
    localStorage.setItem(STORAGE_SYNC_CONFIG_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event('sync_config_changed'));
  } catch (err) {
    console.error('Failed to save sync config', err);
  }
}

// 預設啟用雲端同步；只有使用者手動關閉過才會是 false
export function isCloudSyncEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_SYNC_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setCloudSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('sync_config_changed'));
  } catch (err) {
    console.error('Failed to toggle sync', err);
  }
}

// 產生 LINE 點餐分享碼 (輕量字串，家人可貼至 LINE 群組)
export function exportOrdersShareCode(userName?: string): string {
  const allOrders = getOrders();
  const targetOrders = userName ? allOrders.filter((o) => o.userName === userName) : allOrders;
  if (targetOrders.length === 0) return '';

  const payload = {
    v: 1,
    u: userName || 'ALL',
    t: Date.now(),
    items: targetOrders.map((o) => ({
      m: o.mealKey,
      u: o.userName,
      i: o.itemId,
      n: o.itemName,
      p: o.price,
      q: o.quantity,
      d: o.details || ''
    }))
  };

  const json = JSON.stringify(payload);
  // Base64 編碼，支援中文 UTF-8
  const b64 = btoa(encodeURIComponent(json));
  return `TOUR2026:${b64}`;
}

// 匯入並合併點餐碼
export function importOrdersShareCode(code: string): { success: boolean; count: number; user: string; message: string } {
  try {
    const trimmed = code.trim();
    const prefix = 'TOUR2026:';
    const rawCode = trimmed.includes(prefix) ? trimmed.split(prefix)[1] : trimmed;
    const jsonStr = decodeURIComponent(atob(rawCode));
    const data = JSON.parse(jsonStr);

    if (!data.items || !Array.isArray(data.items)) {
      return { success: false, count: 0, user: '', message: '點餐碼格式不正確' };
    }

    const currentOrders = getOrders();
    let importedCount = 0;

    data.items.forEach((item: any) => {
      // 尋找相同餐別、相同成員、相同餐點的項目進行合併或新增
      const existing = currentOrders.find(
        (o) =>
          o.mealKey === item.m &&
          o.userName === item.u &&
          o.itemId === item.i &&
          (o.details || '') === (item.d || '')
      );

      if (existing) {
        existing.quantity = Math.max(existing.quantity, item.q);
      } else {
        currentOrders.push({
          id: 'ord_imp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
          mealKey: item.m,
          userName: item.u,
          itemId: item.i,
          itemName: item.n,
          price: item.p,
          quantity: item.q,
          details: item.d || undefined,
          timestamp: Date.now()
        });
      }
      importedCount++;
    });

    saveOrders(currentOrders);
    return {
      success: true,
      count: importedCount,
      user: data.u === 'ALL' ? '全體' : data.u,
      message: `成功合併 ${data.u === 'ALL' ? '全體' : data.u} 的 ${importedCount} 項點餐！`
    };
  } catch (err) {
    return { success: false, count: 0, user: '', message: '解析點餐碼失敗，請確認代碼是否完整' };
  }
}

// 雲端即時同步（若設定了 Firebase Database URL 則使用 REST SSE / polling 實時雙向更新）
let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startCloudSyncLoop(): () => void {
  const syncWithCloud = async () => {
    if (!isCloudSyncEnabled()) return;
    const cfg = getSyncConfig();
    if (!cfg.firebaseDatabaseUrl) return;

    const base = cfg.firebaseDatabaseUrl.replace(/\/$/, '');
    const url = `${base}/tours/${encodeURIComponent(cfg.roomKey)}/orders.json`;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const remoteOrders: OrderItem[] | null = await res.json();
      if (Array.isArray(remoteOrders)) {
        // 合併或覆蓋
        const local = getOrders();
        // 簡單比較長度或時間戳
        if (JSON.stringify(remoteOrders) !== JSON.stringify(local)) {
          saveOrders(remoteOrders);
        }
      }
    } catch {
      // 離線靜默處理
    }
  };

  syncWithCloud();
  pollTimer = setInterval(syncWithCloud, 6000);

  return () => {
    if (pollTimer) clearInterval(pollTimer);
  };
}

// 將當前訂單主動推送到雲端
export async function pushOrdersToCloud(orders: OrderItem[]): Promise<boolean> {
  if (!isCloudSyncEnabled()) return false;
  const cfg = getSyncConfig();
  if (!cfg.firebaseDatabaseUrl) return false;

  const base = cfg.firebaseDatabaseUrl.replace(/\/$/, '');
  const url = `${base}/tours/${encodeURIComponent(cfg.roomKey)}/orders.json`;

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
    return res.ok;
  } catch {
    return false;
  }
}
