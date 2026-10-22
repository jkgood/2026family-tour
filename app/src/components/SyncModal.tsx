import React, { useState } from 'react';
import { Cloud, X, Copy, Check, Share2, Download, HelpCircle } from 'lucide-react';
import {
  getSyncConfig,
  saveSyncConfig,
  isCloudSyncEnabled,
  setCloudSyncEnabled,
  exportOrdersShareCode,
  importOrdersShareCode
} from '../services/syncService';
import { showToast } from './Toast';

interface Props {
  currentUser: string;
  onClose: () => void;
}

export const SyncModal: React.FC<Props> = ({ currentUser, onClose }) => {
  const [enabled, setEnabled] = useState(() => isCloudSyncEnabled());
  const [config, setConfig] = useState(() => getSyncConfig());
  const [importCode, setImportCode] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const handleToggleSync = (val: boolean) => {
    setEnabled(val);
    setCloudSyncEnabled(val);
    if (val && !config.firebaseDatabaseUrl) {
      setShowFirebaseGuide(true);
    }
    showToast(val ? '🟢 雲端同步已開啟' : '⚪ 已切換為本機離線模式');
  };

  const handleSaveConfig = () => {
    const error = saveSyncConfig(config);
    if (error) {
      showToast('⚠️ ' + error);
      return;
    }
    showToast('✅ 雲端連線設定已儲存！');
  };

  const handleCopyShareCode = () => {
    const code = exportOrdersShareCode(currentUser);
    if (!code) {
      showToast('⚠️ 您目前尚未點任何餐點，無資料可分享');
      return;
    }
    const textToShare = `【2026苗栗家庭旅行 - ${currentUser} 的點餐碼】\n請主揪或家人在 App 點「同步與匯入」貼上此碼：\n${code}`;
    try {
      navigator.clipboard.writeText(textToShare);
      setCopiedShare(true);
      showToast('✅ 已複製點餐碼！可直接貼到 LINE 群組');
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      showToast('⚠️ 複製失敗，請手動複製');
    }
  };

  const handleImport = () => {
    if (!importCode.trim()) {
      showToast('⚠️ 請先貼上點餐碼');
      return;
    }
    const res = importOrdersShareCode(importCode);
    showToast(res.message);
    if (res.success) {
      setImportCode('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: enabled ? '#dcfce7' : '#f1f5f9',
                color: enabled ? '#16a34a' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>雲端同步與家族分享</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {enabled ? '🟢 雲端同步已開啟' : '⚪ 目前為本機模式 (離線可用)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 方案一：LINE 點餐碼分享 (免伺服器，超穩 100% 成功) */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '4px' }}>
            <Share2 size={16} color="#2563eb" />
            方式一：LINE 點餐碼一鍵分享與合併
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
            全家人各自用手機點餐後，可一鍵產生點餐碼傳至 LINE；主揪手機貼上即可自動合併全家清單！
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={handleCopyShareCode}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, gap: '6px' }}
            >
              {copiedShare ? <Check size={14} /> : <Copy size={14} />}
              {copiedShare ? '已複製！貼至 LINE' : `複製 ${currentUser} 的點餐碼`}
            </button>
          </div>

          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              貼上家人的點餐碼並合併：
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="在此貼上 LINE 收到的代碼 (TOUR2026:...)"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
              <button
                onClick={handleImport}
                className="btn btn-outline btn-sm"
                style={{ background: '#ffffff', borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}
              >
                <Download size={14} />
                合併
              </button>
            </div>
          </div>
        </div>

        {/* 方案二：Firebase 雲端即時連線 (多手機自動即時同步) */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.95rem' }}>
              <Cloud size={16} color="#16a34a" />
              方式二：Firebase 雲端即時同步
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleToggleSync(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              啟用
            </label>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
            開啟後，任何人在手機上點餐，所有人的畫面將在數秒內自動同步更新。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '3px' }}>
                Firebase Realtime Database 網址（僅限 https 的 Firebase 網址）：
              </div>
              <input
                type="text"
                placeholder="https://your-tour-default-rtdb.firebaseio.com"
                value={config.firebaseDatabaseUrl || ''}
                onChange={(e) => setConfig({ ...config, firebaseDatabaseUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '3px' }}>
                房間密鑰 (大家需填相同；僅限英數字、_、-，建議使用不易猜到的長字串)：
              </div>
              <input
                type="text"
                value={config.roomKey}
                maxLength={64}
                onChange={(e) => setConfig({ ...config, roomKey: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <button
                onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={13} />
                {showFirebaseGuide ? '收起免費設定說明' : '如何 1 分鐘免費建立 Firebase？'}
              </button>

              <button
                onClick={handleSaveConfig}
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                儲存設定
              </button>
            </div>

            {showFirebaseGuide && (
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                <strong>免費 3 步建立即時同步庫：</strong>
                <ol style={{ paddingLeft: '18px', marginTop: '4px' }}>
                  <li>前往 <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">Firebase Console</a> 免費新增專案。</li>
                  <li>左側選「Build」→「Realtime Database」→ 建立資料庫，並在「規則」頁貼上專案 docs/firebase-rules.json 的內容（請勿使用 read/write 全開的測試模式）。</li>
                  <li>複製資料庫頂部的 URL 網址，貼至上方欄位並點儲存即可！</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
