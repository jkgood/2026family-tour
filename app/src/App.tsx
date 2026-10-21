import React, { useState, useEffect } from 'react';
import { Calendar, Utensils, PieChart, UserCheck, MapPin, Cloud, Share2, Type } from 'lucide-react';
import { ItineraryView } from './components/ItineraryView';
import { OrderView } from './components/OrderView';
import { StatsView } from './components/StatsView';
import { UserSelectorModal } from './components/UserSelectorModal';
import { SyncModal } from './components/SyncModal';
import { ShareAppModal } from './components/ShareAppModal';
import { ToastContainer } from './components/Toast';
import { getLocalUser, setLocalUser } from './store/orderStore';
import { useFontMode, getFontLevel } from './store/settingStore';
import { isCloudSyncEnabled, startCloudSyncLoop, getSyncStatus, SyncStatus } from './services/syncService';

export function App() {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'order' | 'stats'>('itinerary');
  const [currentUser, setCurrentUser] = useState<string>(() => getLocalUser());
  const [userModalOpen, setUserModalOpen] = useState(() => !getLocalUser());
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isCloudSync, setIsCloudSync] = useState(() => isCloudSyncEnabled());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => getSyncStatus());
  const [fontMode, toggleFontMode] = useFontMode();
  const [selectedMealKey, setSelectedMealKey] = useState<string>('1031_lunch');

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'family_trip_current_user_v1') {
        setCurrentUser(getLocalUser());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 監聽雲端同步設定與連線狀態
  useEffect(() => {
    const checkSync = () => setIsCloudSync(isCloudSyncEnabled());
    const checkStatus = () => setSyncStatus(getSyncStatus());
    window.addEventListener('sync_config_changed', checkSync);
    window.addEventListener('sync_status_changed', checkStatus);
    // 啟動雲端即時同步背景循環
    const cleanup = startCloudSyncLoop();
    return () => {
      window.removeEventListener('sync_config_changed', checkSync);
      window.removeEventListener('sync_status_changed', checkStatus);
      cleanup();
    };
  }, []);

  // 同步按鈕只在「連線失敗」或「同步被關閉」時顯示
  const syncFailed = isCloudSync && syncStatus === 'error';
  const showSyncButton = syncFailed || !isCloudSync;

  // 字級：1 標準 / 2 大 / 3 特大 / 4 超大
  const fontLevel = getFontLevel(fontMode);

  const handleSelectUser = (name: string) => {
    setCurrentUser(name);
    setLocalUser(name);
    setUserModalOpen(false);
  };

  const handleGoToOrder = (mealKey?: string) => {
    if (mealKey) setSelectedMealKey(mealKey);
    setActiveTab('order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToStats = () => {
    setActiveTab('stats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* 頂部 Header */}
      <header className="app-header">
        <div className="header-top">
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} />
              苗栗 • 2026/10/31 - 11/01
            </div>
            <h1 className="header-title">2026 苗栗家庭旅行</h1>
            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>{__APP_VERSION__}</div>
          </div>

          {/* 右上角操作按鈕群組 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 長輩大字模式：點一下切換下一段字級（1→2→3→4→1） */}
            <button
              className="user-badge"
              onClick={() => toggleFontMode()}
              title={`目前字級 ${fontLevel}/4，點擊切換下一段`}
              style={{
                background: fontLevel > 1 ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)',
                borderColor: fontLevel > 1 ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
                fontWeight: fontLevel > 1 ? 700 : 500
              }}
            >
              <Type size={15} />
              <span>大字 {fontLevel}/4</span>
            </button>

            {/* 雲端同步：只在連線失敗或被關閉時顯示 */}
            {showSyncButton && (
              <button
                className="user-badge"
                onClick={() => setSyncModalOpen(true)}
                title={syncFailed ? '雲端同步連線失敗，點此查看' : '雲端同步已關閉，點此開啟'}
                style={{
                  background: syncFailed ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                  borderColor: syncFailed ? '#fca5a5' : 'rgba(255, 255, 255, 0.3)',
                  color: syncFailed ? 'white' : undefined
                }}
              >
                <Cloud size={15} />
                <span>{syncFailed ? '同步失敗' : '未同步'}</span>
              </button>
            )}

            {/* 分享 App QR Code */}
            <button
              className="user-badge"
              onClick={() => setShareModalOpen(true)}
              title="分享 App QR Code 給家人"
            >
              <Share2 size={15} />
              <span>分享</span>
            </button>

            {/* 身分切換 Badge */}
            <button
              className="user-badge"
              onClick={() => setUserModalOpen(true)}
              title="點擊切換點餐者"
            >
              <UserCheck size={16} />
              <span>{currentUser || '設定稱謂'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="container">
        {activeTab === 'itinerary' && <ItineraryView onGoToOrder={handleGoToOrder} />}
        {activeTab === 'order' && (
          <OrderView
            currentUser={currentUser}
            onRequestUser={() => setUserModalOpen(true)}
            selectedMealKey={selectedMealKey}
            onSelectMealKey={setSelectedMealKey}
            onGoToStats={handleGoToStats}
          />
        )}
        {activeTab === 'stats' && (
          <StatsView
            selectedMealKey={selectedMealKey}
            onSelectMealKey={setSelectedMealKey}
            onGoToOrder={() => setActiveTab('order')}
          />
        )}
      </main>

      {/* 底部導覽列 */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'itinerary' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('itinerary');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Calendar size={22} />
          <span>行程瀏覽</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'order' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('order');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Utensils size={22} />
          <span>點菜系統</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('stats');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <PieChart size={22} />
          <span>金額統計</span>
        </button>
      </nav>

      {/* 使用者選擇彈窗 */}
      {userModalOpen && (
        <UserSelectorModal
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onClose={() => setUserModalOpen(false)}
          allowClose={!!currentUser}
        />
      )}

      {/* 雲端同步與 LINE 分享彈窗 */}
      {syncModalOpen && (
        <SyncModal
          currentUser={currentUser}
          onClose={() => setSyncModalOpen(false)}
        />
      )}

      {/* 分享 App QR Code 彈窗 */}
      {shareModalOpen && (
        <ShareAppModal
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {/* 全域 Toast 提示 */}
      <ToastContainer />
    </div>
  );
}

export default App;
