import React, { useState } from 'react';
import { Share2, Copy, Check, X, Smartphone } from 'lucide-react';
import { showToast } from './Toast';

interface Props {
  onClose: () => void;
}

export const ShareAppModal: React.FC<Props> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://jkgood.github.io/2026family-tour/';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(
    currentUrl
  )}`;

  const shareText = `【2026 苗栗家庭旅行 App】\n點擊連結或掃描 QR Code 查看完整行程與線上預先點餐：\n${currentUrl}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      showToast('✅ App 連結已複製！');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('⚠️ 複製失敗，請手動複製');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '2026 苗栗家庭旅行',
          text: '2026/10/31 - 11/01 苗栗家庭旅行行程與點餐表',
          url: currentUrl
        });
      } catch {
        // 用户取消分享
      }
    } else {
      try {
        navigator.clipboard.writeText(shareText);
        showToast('✅ 已複製分享文字，請直接貼至 LINE 群組！');
      } catch {
        showToast('⚠️ 請直接手動複製網址');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', textAlign: 'center' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Smartphone size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>分享 App 給家人</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>手機相機掃描即可開啟</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* QR Code 圖片區 */}
        <div
          style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'inline-block',
            margin: '0 auto 14px auto'
          }}
        >
          <img
            src={qrUrl}
            alt="家庭旅行 App QR Code"
            style={{
              width: '180px',
              height: '180px',
              display: 'block',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          />
        </div>

        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px', wordBreak: 'break-all', padding: '0 10px' }}>
          網址：{currentUrl}
        </div>

        {/* 操作按鈕 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleNativeShare}
            className="btn btn-primary"
            style={{ width: '100%', gap: '6px' }}
          >
            <Share2 size={16} />
            直接分享至 LINE / 群組
          </button>

          <button
            onClick={handleCopyLink}
            className="btn btn-outline"
            style={{ width: '100%', gap: '6px' }}
          >
            {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
            {copied ? '網址已複製！' : '複製網址連結'}
          </button>
        </div>
      </div>
    </div>
  );
};
