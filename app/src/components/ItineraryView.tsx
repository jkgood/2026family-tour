import React, { useState } from 'react';
import { Clock, MapPin, Phone, ExternalLink, Compass, Copy, Check } from 'lucide-react';
import { ITINERARY_DATA, DayPlan, ItineraryItem } from '../data/tripData';
import { PhoneCallModal } from './PhoneCallModal';
import { WeatherStrip } from './WeatherStrip';
import { showToast } from './Toast';

interface Props {
  onGoToOrder?: (mealKey: string) => void;
}

// 各天對應的實際日期（供天氣預報查詢）
const DAY_DATES = ['2026-10-31', '2026-11-01'];

export const ItineraryView: React.FC<Props> = ({ onGoToOrder }) => {
  const [callingItem, setCallingItem] = useState<{ title: string; phone: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAddress = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('✅ 地址已複製！可貼上至車機導航');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('⚠️ 複製失敗，請手動選取');
    }
  };

  const handlePhoneClick = (title: string, phone: string) => {
    const parts = phone.split('/').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      setCallingItem({ title, phone });
    } else {
      const clean = phone.replace(/[^\d+]/g, '');
      window.location.href = `tel:${clean}`;
    }
  };

  return (
    <div>
      {/* 頂部標語 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid #fde68a',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <div style={{ fontSize: '2rem' }}>🐮</div>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', fontSize: '1rem' }}>
            2026/10/31 - 11/01 苗栗家庭秋季旅行
          </div>
          <div style={{ fontSize: '0.85rem', color: '#b45309' }}>
            客家文化手作體驗、飛牛牧場宿營、在地招牌美食饗宴
          </div>
        </div>
      </div>

      {ITINERARY_DATA.map((day: DayPlan, dayIdx: number) => (
        <div key={day.date} style={{ marginBottom: '28px' }}>
          {/* 日期 Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e2e8f0'
            }}
          >
            <div>
              <span
                style={{
                  background: dayIdx === 0 ? '#2563eb' : '#059669',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginRight: '8px'
                }}
              >
                Day {dayIdx + 1}
              </span>
              <strong style={{ fontSize: '1.1rem' }}>
                {day.date} ({day.weekday})
              </strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{day.title}</div>
          </div>

          {/* 當地早中晚天氣預報 */}
          {DAY_DATES[dayIdx] && <WeatherStrip date={DAY_DATES[dayIdx]} />}

          {/* 時間軸列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {day.items.map((item: ItineraryItem) => {
              const isLunch1031 = item.id === 'day1-2';
              const isDinner1031 = item.id === 'day1-4';
              const isLunch1101 = item.id === 'day2-3';

              return (
                <div key={item.id} className="card" style={{ position: 'relative' }}>
                  {/* 時間與標題 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          marginBottom: '4px'
                        }}
                      >
                        <Clock size={16} />
                        {item.time}
                      </div>
                      <h4 className="itinerary-card-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                        {item.title}
                      </h4>
                    </div>

                    {/* 地圖快速導航按鈕 */}
                    {item.mapQuery && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          item.location || item.mapQuery
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{
                          textDecoration: 'none',
                          gap: '4px',
                          borderColor: '#93c5fd',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 700
                        }}
                        title="開啟 Google 地圖進行導航"
                      >
                        <Compass size={16} color="#2563eb" />
                        導航
                      </a>
                    )}
                  </div>

                  {/* 地點資訊與一鍵複製 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      marginBottom: '10px',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#334155',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <MapPin size={15} color="#64748b" style={{ flexShrink: 0 }} />
                      <span style={{ wordBreak: 'break-all' }}>{item.location}</span>
                    </div>
                    <button
                      onClick={() => handleCopyAddress(item.id, item.location)}
                      className="btn btn-outline btn-sm"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        flexShrink: 0,
                        gap: '4px',
                        background: copiedId === item.id ? '#dcfce7' : '#ffffff',
                        borderColor: copiedId === item.id ? '#86efac' : '#cbd5e1',
                        color: copiedId === item.id ? '#15803d' : '#475569'
                      }}
                      title="複製地址至剪貼簿，可貼至車機導航"
                    >
                      {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedId === item.id ? '已複製' : '複製'}
                    </button>
                  </div>

                  {/* 電話與營業時間 */}
                  {(item.phone || item.hours) && (
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        marginBottom: '10px',
                        color: '#334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      {item.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={14} color="#16a34a" />
                            <span>電話：{item.phone}</span>
                          </div>
                          <button
                            onClick={() => handlePhoneClick(item.title, item.phone!)}
                            className="btn btn-sm"
                            style={{
                              background: '#16a34a',
                              color: 'white',
                              padding: '5px 12px',
                              fontSize: '0.8rem',
                              gap: '4px',
                              borderRadius: '8px'
                            }}
                          >
                            <Phone size={13} />
                            撥打
                          </button>
                        </div>
                      )}
                      {item.hours && <div style={{ color: '#64748b', fontSize: '0.82rem' }}>🕒 營業時間：{item.hours}</div>}
                    </div>
                  )}

                  {/* 說明要點 */}
                  <div style={{ marginBottom: '12px' }}>
                    {item.description.map((desc, dIdx) => (
                      <div
                        key={dIdx}
                        style={{
                          fontSize: '0.875rem',
                          color: '#334155',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '6px'
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>•</span>
                        <span>{desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* 標籤 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {item.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 點餐跳轉按鈕 (如果是餐點) */}
                  {(isLunch1031 || isDinner1031 || isLunch1101) && onGoToOrder && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          if (isLunch1031) onGoToOrder('1031_lunch');
                          if (isDinner1031) onGoToOrder('1031_dinner');
                          if (isLunch1101) onGoToOrder('1101_lunch');
                        }}
                      >
                        🍽️ 查看此餐廳菜單並點菜 →
                      </button>
                    </div>
                  )}

                  {/* 相關連結 */}
                  {item.link && (
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          color: '#2563eb',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={13} />
                        景點/食記詳細部落格介紹
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {callingItem && (
        <PhoneCallModal
          title={callingItem.title}
          phoneString={callingItem.phone}
          onClose={() => setCallingItem(null)}
        />
      )}
    </div>
  );
};
