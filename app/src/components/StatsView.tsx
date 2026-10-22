import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Trash2,
  Plus,
  Minus,
  Share2,
  Check,
  Edit3
} from 'lucide-react';
import { MEALS_DATA } from '../data/tripData';
import {
  useOrders,
  updateOrderQty,
  removeOrder,
  removeDishOrders,
  clearMealOrders,
  OrderItem
} from '../store/orderStore';
import { showToast } from './Toast';

interface Props {
  selectedMealKey: string;
  onSelectMealKey: (key: string) => void;
  onGoToOrder: () => void;
}

export const StatsView: React.FC<Props> = ({
  selectedMealKey,
  onSelectMealKey,
  onGoToOrder
}) => {
  const [copied, setCopied] = useState(false);
  // 納入金額／清單計算的點菜者（null = 尚未初始化，之後會設成全部）
  const [selectedUsers, setSelectedUsers] = useState<string[] | null>(null);
  const currentMeal = MEALS_DATA.find((m) => m.dateKey === selectedMealKey) || MEALS_DATA[0];
  const allOrders = useOrders();
  const mealOrders = allOrders.filter((o) => o.mealKey === selectedMealKey);

  // 本餐實際有點過的人 + 每人份數
  const ordererQtyMap: { [name: string]: number } = {};
  mealOrders.forEach((o) => {
    ordererQtyMap[o.userName] = (ordererQtyMap[o.userName] || 0) + o.quantity;
  });
  const orderers = Object.keys(ordererQtyMap).sort((a, b) => a.localeCompare(b, 'zh-Hant'));

  // 切換餐廳時重設勾選狀態
  useEffect(() => {
    setSelectedUsers(null);
  }, [selectedMealKey]);

  // 有點餐者變動時：預設全選；新出現的人自動勾上
  useEffect(() => {
    setSelectedUsers((prev) => {
      if (orderers.length === 0) return [];
      if (prev === null) return [...orderers];
      const stillThere = prev.filter((u) => orderers.includes(u));
      const newcomers = orderers.filter((u) => !prev.includes(u));
      return [...stillThere, ...newcomers];
    });
  }, [orderers.join('|')]);

  const activeUsers = selectedUsers ?? orderers;
  const filteredOrders = mealOrders.filter((o) => activeUsers.includes(o.userName));

  // 依「菜品」彙總統計（只算被勾選的點菜者）
  interface DishSummary {
    key: string;
    itemId: string;
    itemName: string;
    price: number;
    totalQty: number;
    detailsList: string[];
    details?: string;
    orders: OrderItem[];
    orderedBy: { [userName: string]: number };
  }

  const dishMap: { [key: string]: DishSummary } = {};
  filteredOrders.forEach((o) => {
    const key = o.itemId + (o.details ? `_${o.details}` : '');
    if (!dishMap[key]) {
      dishMap[key] = {
        key,
        itemId: o.itemId,
        itemName: o.itemName,
        price: o.price,
        totalQty: 0,
        detailsList: [],
        details: o.details,
        orders: [],
        orderedBy: {}
      };
    }
    dishMap[key].totalQty += o.quantity;
    dishMap[key].orders.push(o);
    dishMap[key].orderedBy[o.userName] = (dishMap[key].orderedBy[o.userName] || 0) + o.quantity;
    if (o.details && !dishMap[key].detailsList.includes(o.details)) {
      dishMap[key].detailsList.push(o.details);
    }
  });

  const dishSummaries = Object.values(dishMap);

  // 金額計算（無小數點，依勾選範圍）
  const subtotal = Math.round(filteredOrders.reduce((sum, o) => sum + o.price * o.quantity, 0));
  const serviceChargeRate = (currentMeal.serviceChargePercent || 0) / 100;
  const serviceCharge = Math.round(subtotal * serviceChargeRate);
  const grandTotal = Math.round(subtotal + serviceCharge);
  const totalPortions = filteredOrders.reduce((sum, o) => sum + o.quantity, 0);

  const toggleUser = (name: string) => {
    setSelectedUsers((prev) => {
      const cur = prev ?? orderers;
      if (cur.includes(name)) return cur.filter((u) => u !== name);
      return [...cur, name];
    });
  };

  const selectAllUsers = () => setSelectedUsers([...orderers]);
  const clearAllUsers = () => setSelectedUsers([]);

  // 複製文字清單分享到 LINE / 家族群組（依目前勾選範圍）
  const handleCopySummary = () => {
    let text = `【${currentMeal.restaurant}】家族點餐統計\n`;
    text += `用餐時段：${currentMeal.timing}\n`;
    if (activeUsers.length > 0 && activeUsers.length < orderers.length) {
      text += `納入計算：${activeUsers.join('、')}\n`;
    }
    text += `\n📋【點菜清單】\n`;
    if (dishSummaries.length === 0) {
      text += `（目前無納入計算的品項）\n`;
    } else {
      dishSummaries.forEach((d) => {
        const who = Object.entries(d.orderedBy)
          .map(([u, q]) => `${u}x${q}`)
          .join(', ');
        text += `• ${d.itemName} x ${d.totalQty} (點餐: ${who})\n`;
        if (d.detailsList.length > 0) {
          text += `  └ ${d.detailsList.join(' / ')}\n`;
        }
      });
    }

    text += `\n💰【金額統計】\n`;
    text += `菜色原價：$${subtotal}\n`;
    if (serviceCharge > 0) {
      text += `服務費(10%)：$${serviceCharge}\n`;
    }
    text += `總計金額：$${grandTotal}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('✅ 菜單清單已複製！可直接貼到 LINE 家族群組');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClear = () => {
    if (window.confirm(`確定要清空【${currentMeal.restaurant}】的所有點餐資料嗎？`)) {
      clearMealOrders(selectedMealKey);
    }
  };
  return (
    <div>
      {/* 餐廳切換 Tab */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}
      >
        {MEALS_DATA.map((meal) => {
          const isSelected = meal.dateKey === selectedMealKey;
          return (
            <button
              key={meal.id}
              onClick={() => onSelectMealKey(meal.dateKey)}
              style={{
                padding: '10px 6px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#1d4ed8' : '#475569',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {meal.dateKey === '1031_lunch' && '10/31 午餐'}
                {meal.dateKey === '1031_dinner' && '10/31 晚餐'}
                {meal.dateKey === '1101_lunch' && '11/01 午餐'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {meal.restaurant.split('（')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* 總結算卡片 */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {currentMeal.timing} • 結算統計
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>
              {currentMeal.restaurant}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>總結算金額</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>
              ${grandTotal}
            </div>
          </div>
        </div>

        {/* 費用拆解 (無小數點) */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #334155',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            textAlign: 'center',
            fontSize: '0.85rem'
          }}
        >
          <div>
            <div style={{ color: '#94a3b8' }}>菜色原價</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>${subtotal}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8' }}>服務費 (10%)</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>
              {serviceCharge > 0 ? `$${serviceCharge}` : '無'}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8' }}>已點品項</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>
              {totalPortions} 份
            </div>
          </div>
        </div>

        {/* 納入計算的點菜者（勾選篩選） */}
        {orderers.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #334155'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                納入計算的點菜者
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={selectAllUsers}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 600
                  }}
                >
                  全選
                </button>
                <button
                  type="button"
                  onClick={clearAllUsers}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  全不選
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              {orderers.map((name) => {
                const checked = (selectedUsers ?? orderers).includes(name);
                const qty = ordererQtyMap[name] || 0;
                return (
                  <label
                    key={name}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: checked ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                      border: checked ? '1px solid #38bdf8' : '1px solid transparent',
                      borderRadius: '999px',
                      padding: '5px 10px 5px 8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: checked ? '#e0f2fe' : '#94a3b8',
                      fontWeight: checked ? 600 : 500,
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUser(name)}
                      style={{
                        width: '14px',
                        height: '14px',
                        accentColor: '#38bdf8',
                        cursor: 'pointer',
                        margin: 0
                      }}
                    />
                    <span>
                      {name}
                      <span style={{ opacity: 0.75, fontWeight: 500 }}> ({qty}份)</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {activeUsers.length === 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#fbbf24' }}>
                請至少勾選一位點菜者，金額與清單才會顯示
              </div>
            )}
          </div>
        )}

        {/* 複製與重設操作列 */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopySummary}
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '0.85rem', padding: '8px 12px' }}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? '已複製到剪貼簿！' : '複製菜單清單傳 LINE'}
            </button>
            {mealOrders.length > 0 && (
              <button
                onClick={handleClear}
                className="btn btn-outline"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderColor: '#ef4444',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  padding: '8px 12px'
                }}
              >
                <Trash2 size={15} />
                清空
              </button>
            )}
          </div>
        </div>
      </div>

      {mealOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 18px' }}>
          <UtensilsCrossed size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>
            目前此餐廳尚無任何點餐紀錄
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
            大家可以點擊下方按鈕前往菜單挑選喜愛的菜色！
          </p>
          <button
            onClick={onGoToOrder}
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
          >
            立即前往點菜 →
          </button>
        </div>
      ) : (
        /* 最後菜單編輯與點單總表 (需求四：不需要個人金額統計；需求五：最後菜單具備編輯功能) */
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}
          >
            <h4
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: 0
              }}
            >
              <Edit3 size={18} color="#2563eb" />
              最後點單菜單編輯（共 {dishSummaries.length} 種品項、{totalPortions} 份）
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              可在此增減數量或刪除品項
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dishSummaries.map((dish) => {
              const dishTotalAmount = Math.round(dish.price * dish.totalQty);

              return (
                <div
                  key={dish.key}
                  className="card"
                  style={{
                    padding: '14px',
                    margin: 0,
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {/* 品項標題與總計 */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                        {dish.itemName}
                      </div>
                      {dish.details && (
                        <div style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: '2px', fontWeight: 500 }}>
                          {dish.details}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        單價：${dish.price}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>
                          共 {dish.totalQty} 份
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                          ${dishTotalAmount}
                        </div>
                      </div>

                      {/* 整道菜批次刪除按鈕 */}
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要刪除整道【${dish.itemName}】嗎？`)) {
                            removeDishOrders(selectedMealKey, dish.itemId, dish.details);
                          }
                        }}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="刪除此道菜全部點單"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 點餐成員明細與個別數量編輯 / 刪除 (需求五) */}
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dish.orders.map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8fafc',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.8rem'
                            }}
                          >
                            {ord.userName}
                          </span>
                          {ord.details && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ({ord.details})
                            </span>
                          )}
                        </div>

                        {/* 數量增減與單筆刪除 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => updateOrderQty(ord.id, -1)}
                            style={{
                              border: '1px solid #cbd5e1',
                              background: 'white',
                              borderRadius: '4px',
                              width: '26px',
                              height: '26px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#475569'
                            }}
                            title="減少 1 份"
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontWeight: 700, minWidth: '22px', textAlign: 'center' }}>
                            {ord.quantity}
                          </span>
                          <button
                            onClick={() => updateOrderQty(ord.id, 1)}
                            style={{
                              border: '1px solid #cbd5e1',
                              background: 'white',
                              borderRadius: '4px',
                              width: '26px',
                              height: '26px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#475569'
                            }}
                            title="增加 1 份"
                          >
                            <Plus size={13} />
                          </button>

                          <button
                            onClick={() => removeOrder(ord.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px',
                              marginLeft: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="刪除此筆點單"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
