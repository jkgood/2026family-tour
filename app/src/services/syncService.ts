import { OrderItem, getOrders, saveOrders } from '../store/orderStore';
import { MEALS_DATA } from '../data/tripData';

const STORAGE_SYNC_CONFIG_KEY = 'family_trip_sync_config_v1';
const STORAGE_SYNC_ENABLED_KEY = 'family_trip_sync_enabled_v1';

// Firebase 專案 familytour-3f6c5 的 Realtime Database。
// 資料庫所在地區不同，網址網域會不同，所以列出可能的網址，連線時自動偵測哪一個可用。
const DB_NAME = 'familytour-3f6c5-default-rtdb';
const CANDIDATE_URLS: string[] = [
  `https://${DB_NAME}.asia-southeast1.firebasedatabase.app`, // 新加坡
  `https://${DB_NAME}.firebaseio.com`, // 美國 (us-central1)
  `https://${DB_NAME}.europe-west1.firebasedatabase.app` // 比利時
];

// ---- 安全：網址、房間密鑰、資料內容驗證 ----

// 只允許 https 且網域為 Firebase Realtime Database，避免被誘導把訂單送到第三方
export function isSafeDbUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return false;
    if (u.username || u.password) return false;
    const h = u.hostname.toLowerCase();
    return h.endsWith('.firebaseio.com') || h.endsWith('.firebasedatabase.app');
  } catch {
    return false;
  }
}

const ROOM_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export function isValidRoomKey(key: string): boolean {
  return ROOM_KEY_PATTERN.test(key);
}

const MAX_ORDERS = 500;
const MAX_SHARE_CODE_LENGTH = 100_000;
const VALID_MEAL_KEYS = new Set<string>(MEALS_DATA.map((m) => m.dateKey));

function cleanStr(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s || s.length > max) return null;
  return s;
}

// 驗證並正規化訂單清單：不合法的項目直接丟棄，避免惡意/損壞資料造成當機或金額被竄改
export function sanitizeOrders(input: unknown): OrderItem[] {
  let list: unknown[] = [];
  if (Array.isArray(input)) {
    list = input;
  } else if (input && typeof input === 'object') {
    list = Object.values(input as Record<string, unknown>);
  }

  const result: OrderItem[] = [];
  const seenIds = new Set<string>();

  for (const raw of list) {
    if (result.length >= MAX_ORDERS) break;
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;

    const id = cleanStr(o.id, 64);
    const mealKey = cleanStr(o.mealKey, 32);
    const userName = cleanStr(o.userName, 40);
    const itemId = cleanStr(o.itemId, 64);
    const itemName = cleanStr(o.itemName, 100);
    if (!id || !mealKey || !userName || !itemId || !itemName) continue;
    if (!VALID_MEAL_KEYS.has(mealKey)) continue;
    if (seenIds.has(id)) continue;

    const price = o.price;
    const quantity = o.quantity;
    const timestamp = o.timestamp;
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 100000) continue;
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) continue;
    const ts = typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : Date.now();

    let details: string | undefined;
    if (o.details !== undefined && o.details !== null && o.details !== '') {
      const d = cleanStr(o.details, 300);
      if (!d) continue;
      details = d;
    }

    seenIds.add(id);
    result.push({ id, mealKey, userName, itemId, itemName, price, quantity, details, timestamp: ts });
  }
  return result;
}

// 也可在 Vercel 設定環境變數 VITE_FIREBASE_DB_URL 覆蓋預設網址（同樣需通過網址驗證）
const RAW_ENV_URL: string = ((import.meta.env.VITE_FIREBASE_DB_URL as string | undefined) || '').trim();
const ENV_URL: string = RAW_ENV_URL && isSafeDbUrl(RAW_ENV_URL) ? RAW_ENV_URL : '';
const DEFAULT_FIREBASE_URL: string = ENV_URL || CANDIDATE_URLS[0];

const DEFAULT_ROOM_KEY = '2026-family-tour';

export interface SyncConfig {
  firebaseDatabaseUrl?: string; // e.g. https://xxxx-default-rtdb.firebaseio.com/
  roomKey: string; // e.g. 2026-family-tour
}

// ---- 連線狀態（供畫面判斷是否顯示「同步失敗」）----
export type SyncStatus = 'unknown' | 'ok' | 'error';

let syncStatus: SyncStatus = 'unknown';
let failCount = 0;

// ---- 本機變更追蹤：避免輪詢用舊的雲端資料覆蓋尚未上傳的本機點餐 ----
let localVersion = 0; // 每次本機推送 +1
let syncedVersion = 0; // 最近一次確認成功上傳的版本
let inFlight = 0; // 進行中的推送數

function hasPendingLocalChanges(): boolean {
  return syncedVersion !== localVersion;
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

function setSyncStatus(next: SyncStatus): void {
  if (next === syncStatus) return;
  syncStatus = next;
  window.dispatchEvent(new Event('sync_status_changed'));
}

function markSuccess(): void {
  failCount = 0;
  setSyncStatus('ok');
}

// 連續失敗 2 次才判定為失敗，避免網路瞬間抖動就跳出提示
function markFailure(): void {
  failCount += 1;
  if (failCount >= 2) setSyncStatus('error');
}

export function getSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_SYNC_CONFIG_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as SyncConfig;
      const savedUrl = typeof saved.firebaseDatabaseUrl === 'string' ? saved.firebaseDatabaseUrl : '';
      const savedRoom = typeof saved.roomKey === 'string' ? saved.roomKey : '';
      return {
        // 本機沒填、或網址不合法時，自動套用預設網址
        firebaseDatabaseUrl: savedUrl && isSafeDbUrl(savedUrl) ? savedUrl : DEFAULT_FIREBASE_URL,
        roomKey: savedRoom && isValidRoomKey(savedRoom) ? savedRoom : DEFAULT_ROOM_KEY
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

// 回傳 null 表示儲存成功，否則回傳錯誤訊息
export function saveSyncConfig(cfg: SyncConfig): string | null {
  const url = (cfg.firebaseDatabaseUrl || '').trim();
  if (url && !isSafeDbUrl(url)) {
    return '資料庫網址必須是 https 開頭的 Firebase 網址（firebaseio.com 或 firebasedatabase.app）';
  }
  const room = (cfg.roomKey || '').trim();
  if (!isValidRoomKey(room)) {
    return '房間密鑰只能使用英數字、底線、連字號，長度 1–64 字';
  }
  try {
    localStorage.setItem(STORAGE_SYNC_CONFIG_KEY, JSON.stringify({ firebaseDatabaseUrl: url, roomKey: room }));
    resolvedBase = null;
    failCount = 0;
    window.dispatchEvent(new Event('sync_config_changed'));
    return null;
  } catch (err) {
    console.error('Failed to save sync config', err);
    return '儲存設定失敗';
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
    failCount = 0;
    window.dispatchEvent(new Event('sync_config_changed'));
  } catch (err) {
    console.error('Failed to toggle sync', err);
  }
}

// 找出實際可連線的資料庫網址（結果會快取，設定變更後重新偵測）
let resolvedBase: string | null = null;

async function resolveBaseUrl(): Promise<string | null> {
  if (resolvedBase) return resolvedBase;

  const cfg = getSyncConfig();
  const configured = (cfg.firebaseDatabaseUrl || '').trim().replace(/\/$/, '');
  if (!configured || !isSafeDbUrl(configured)) return null;

  // 使用者自訂了其他（已通過驗證的）Firebase 網址：直接使用，不做偵測
  if (!CANDIDATE_URLS.includes(configured) && configured !== ENV_URL.replace(/\/$/, '')) {
    resolvedBase = configured;
    return resolvedBase;
  }

  const candidates = Array.from(new Set([configured, ...CANDIDATE_URLS]));
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/.json?shallow=true`);
      if (res.ok) {
        resolvedBase = base;
        return resolvedBase;
      }
    } catch {
      // try next
    }
  }
  return null;
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

// 匯入並合併點餐碼（所有欄位皆經驗證，不信任貼上的內容）
export function importOrdersShareCode(code: string): { success: boolean; count: number; user: string; message: string } {
  const fail = (message: string) => ({ success: false, count: 0, user: '', message });
  try {
    const trimmed = code.trim();
    if (trimmed.length > MAX_SHARE_CODE_LENGTH) return fail('點餐碼過長，已拒絕匯入');

    const prefix = 'TOUR2026:';
    const rawCode = trimmed.includes(prefix) ? trimmed.split(prefix)[1] : trimmed;
    const jsonStr = decodeURIComponent(atob(rawCode));
    const data = JSON.parse(jsonStr);

    if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
      return fail('點餐碼格式不正確');
    }

    // 轉成標準訂單格式後統一驗證
    const candidates = (data.items as unknown[])
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((item, idx) => ({
        id: 'ord_imp_' + Date.now().toString(36) + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
        mealKey: item.m,
        userName: item.u,
        itemId: item.i,
        itemName: item.n,
        price: item.p,
        quantity: item.q,
        details: item.d || undefined,
        timestamp: Date.now()
      }));
    const incoming = sanitizeOrders(candidates);

    if (incoming.length === 0) return fail('點餐碼內沒有有效的點餐項目');

    const currentOrders = getOrders();
    let importedCount = 0;

    for (const item of incoming) {
      // 尋找相同餐別、相同成員、相同餐點的項目進行合併或新增
      const existing = currentOrders.find(
        (o) =>
          o.mealKey === item.mealKey &&
          o.userName === item.userName &&
          o.itemId === item.itemId &&
          (o.details || '') === (item.details || '')
      );

      if (existing) {
        existing.quantity = Math.max(existing.quantity, item.quantity);
      } else {
        if (currentOrders.length >= MAX_ORDERS) break;
        currentOrders.push(item);
      }
      importedCount++;
    }

    saveOrders(currentOrders);
    const who = typeof data.u === 'string' && data.u !== 'ALL' ? data.u.slice(0, 40) : '全體';
    return {
      success: true,
      count: importedCount,
      user: who,
      message: `成功合併 ${who} 的 ${importedCount} 項點餐！`
    };
  } catch {
    return fail('解析點餐碼失敗，請確認代碼是否完整');
  }
}

// 雲端即時同步（若設定了 Firebase Database URL 則使用 REST polling 雙向更新）
let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startCloudSyncLoop(): () => void {
  const syncWithCloud = async () => {
    if (!isCloudSyncEnabled()) return;
    const cfg = getSyncConfig();
    if (!cfg.firebaseDatabaseUrl) return;

    // 本機有尚未上傳的變更：先重試上傳，不要用雲端舊資料覆蓋
    if (hasPendingLocalChanges()) {
      if (inFlight === 0) await pushOrdersToCloud(getOrders());
      return;
    }

    const base = await resolveBaseUrl();
    if (!base) {
      markFailure();
      return;
    }
    const url = `${base}/tours/${encodeURIComponent(cfg.roomKey)}/orders.json`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        markFailure();
        return;
      }
      const remoteRaw: unknown = await res.json();
      markSuccess();
      // 抓取期間若使用者又有新操作，這份雲端資料已過期，直接丟棄
      if (hasPendingLocalChanges() || inFlight > 0) return;
      if (remoteRaw !== null && remoteRaw !== undefined) {
        // 雲端資料不可信：先驗證與正規化再套用
        const remoteOrders = sanitizeOrders(remoteRaw);
        const local = getOrders();
        if (JSON.stringify(remoteOrders) !== JSON.stringify(local)) {
          // 套用雲端資料，不回寫雲端
          saveOrders(remoteOrders, false);
        }
      }
    } catch {
      // 離線：計入失敗次數
      markFailure();
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

  const version = ++localVersion;
  inFlight += 1;
  try {
    const base = await resolveBaseUrl();
    if (!base) {
      markFailure();
      return false;
    }
    const url = `${base}/tours/${encodeURIComponent(cfg.roomKey)}/orders.json`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
    if (res.ok) {
      markSuccess();
      // 只有最新一次推送成功才算全部同步完成
      if (version === localVersion) syncedVersion = version;
    } else {
      markFailure();
    }
    return res.ok;
  } catch {
    markFailure();
    return false;
  } finally {
    inFlight -= 1;
  }
}
