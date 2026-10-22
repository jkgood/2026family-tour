import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Image as ImageIcon,
  Flame,
  Search,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MEALS_DATA, DishItem } from '../data/tripData';
import { HOTPOT_EXTRAS } from '../data/hotpotExtras';
import { PINNED_CATEGORIES, EXTRA_DISHES, EXTRA_MEAL_NOTES, getDefaultCategory } from '../data/mealExtras';
import { HotpotExtras } from './HotpotExtras';
import { addOrder, useOrders, updateOrderQty, getLocalUser } from '../store/orderStore';
import confetti from 'canvas-confetti';

interface Props {
  currentUser: string;
  onRequestUser: () => void;
  selectedMealKey: string;
  onSelectMealKey: (key: string) => void;
  onGoToStats: () => void;
}

export const OrderView: React.FC<Props> = ({
  currentUser,
  onRequestUser,
  selectedMealKey,
  onSelectMealKey,
  onGoToStats
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(() => getDefaultCategory(selectedMealKey));
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showLiveSummary, setShowLiveSummary] = useState(true);

  // 火鍋分頁：個人套餐 / 單點
  const [hotpotTab, setHotpotTab] = useState<'set' | 'extras'>('set');

  // 火鍋客製化彈窗狀態
  const [hotpotModalOpen, setHotpotModalOpen] = useState(false);
  const [selectedMeat, setSelectedMeat] = useState<{ id: string; name: string; price: number } | null>(null);
  const [selectedSoup, setSelectedSoup] = useState<string>('牧場自產鮮奶湯底 (最推薦)');
  const [selectedSide, setSelectedSide] = useState<string>('白飯');

  const currentMeal = MEALS_DATA.find((m) => m.dateKey === selectedMealKey) || MEALS_DATA[0];

  // 換餐廳時，回到該餐的預設分頁（有「招牌菜／合菜」就停在最前面那個）
  useEffect(() => {
    setActiveCategory(getDefaultCategory(currentMeal.dateKey));
    setSearchTerm('');
  }, [currentMeal.dateKey]);

  const allOrders = useOrders();
  const currentMealOrders = allOrders.filter((o) => o.mealKey === selectedMealKey);
  const myMealOrders = currentMealOrders.filter((o) => o.userName === currentUser);

  // 火鍋分頁上的已點份數
  const extrasIds = new Set(HOTPOT_EXTRAS.map((d) => d.id));
  const extrasCount = currentMealOrders
    .filter((o) => extrasIds.has(o.itemId))
    .reduce((sum, o) => sum + o.quantity, 0);
  const setCount = currentMealOrders
    .filter((o) => !extrasIds.has(o.itemId))
    .reduce((sum, o) => sum + o.quantity, 0);

  // 本餐所有菜色 = 額外加入的（招牌菜／合菜）+ 原有菜單
  const mealDishes: DishItem[] = [
    ...(EXTRA_DISHES[currentMeal.dateKey] || []),
    ...(currentMeal.dishes || [])
  ];

  // 分類分頁：先放「招牌菜、合菜」，再來是「全部」與其他分類
  const dataCategories = Array.from(new Set(mealDishes.map((d) => d.category)));
  const pinnedCategories = PINNED_CATEGORIES.filter((c) => dataCategories.includes(c));
  const otherCategories = dataCategories.filter((c) => !pinnedCategories.includes(c));
  const categories = [...pinnedCategories, '全部', ...otherCategories];

  const filteredDishes = mealDishes.filter((d) => {
    const matchesCat = activeCategory === '全部' || d.category === activeCategory;
    const matchesSearch = !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddDish = (dish: DishItem) => {
    const user = currentUser || getLocalUser();
    if (!user) {
      onRequestUser();
      return;
    }
    addOrder({
      mealKey: selectedMealKey,
      userName: user,
      itemId: dish.id,
      itemName: dish.name,
      price: dish.price,
      quantity: 1,
      details: dish.note ? `備註: ${dish.note}` : undefined
    });

    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.85 }
      });
    } catch {
      // ignore confetti errors
    }
  };

  const handleDecreaseDish = (dishId: string) => {
    const user = currentUser || getLocalUser();
    const target = currentMealOrders.slice().reverse().find((o) => o.userName === user && o.itemId === dishId);
    if (target) {
      updateOrderQty(target.id, -1);
    }
  };

  const handleConfirmHotpot = () => {
    if (!currentUser) {
      onRequestUser();
      return;
    }
    if (!selectedMeat) return;

    addOrder({
      mealKey: selectedMealKey,
      userName: currentUser,
      itemId: selectedMeat.id,
      itemName: selectedMeat.name,
      price: selectedMeat.price,
      quantity: 1,
      details: `湯底: ${selectedSoup} | 附餐: ${selectedSide}`
    });

    setHotpotModalOpen(false);
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.85 }
    });
  };

  // 依菜品彙總即時點菜結果
  interface DishGroup {
    itemName: string;
    totalQty: number;
    orderedBy: { [userName: string]: number };
    detailsList: string[];
  }
  const liveSummaryMap: { [key: string]: DishGroup } = {};
  currentMealOrders.forEach((o) => {
    const key = o.itemId + (o.details ? `_${o.details}` : '');
    if (!liveSummaryMap[key]) {
      liveSummaryMap[key] = {
        itemName: o.itemName,
        totalQty: 0,
        orderedBy: {},
        detailsList: []
      };
    }
    liveSummaryMap[key].totalQty += o.quantity;
    liveSummaryMap[key].orderedBy[o.userName] = (liveSummaryMap[key].orderedBy[o.userName] || 0) + o.quantity;
    if (o.details && !liveSummaryMap[key].detailsList.includes(o.details)) {
      liveSummaryMap[key].detailsList.push(o.details);
    }
  });
  const liveSummaries = Object.values(liveSummaryMap);

  // 金額計算（無小數點）
  const totalSubtotal = currentMealOrders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  const serviceRate = (currentMeal.serviceChargePercent || 0) / 100;
  const grandTotal = Math.round(totalSubtotal * (1 + serviceRate));

  const extraNote = EXTRA_MEAL_NOTES[currentMeal.dateKey];

  return (
    <div>
      {/* 餐廳切換選單 Tab */}
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
              onClick={() => {
                onSelectMealKey(meal.dateKey);
                setActiveCategory(getDefaultCategory(meal.dateKey));
                setSearchTerm('');
              }}
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
                {meal.dateKey === '1031_lunch' && '10/31 週六中午'}
                {meal.dateKey === '1031_dinner' && '10/31 週六晚餐'}
                {meal.dateKey === '1101_lunch' && '11/01 週日中午'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {meal.restaurant.split('（')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* 餐廳資訊 Card */}
      <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: currentMeal.mealType.includes('合菜') ? '#fef3c7' : '#fee2e2',
                  color: currentMeal.mealType.includes('合菜') ? '#92400e' : '#991b1b'
                }}
              >
                {currentMeal.mealType}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{currentMeal.timing}</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '6px' }}>
              {currentMeal.restaurant}
            </h3>
          </div>

          {/* 原始截圖菜單按鈕 */}
          {currentMeal.originalMenuImages && currentMeal.originalMenuImages.length > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setPreviewImage(currentMeal.originalMenuImages![0])}
            >
              <ImageIcon size={14} />
              查看原始菜單截圖
            </button>
          )}
        </div>

        <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '8px', lineHeight: 1.4 }}>
          {currentMeal.note}
        </p>

        {extraNote && (
          <p
            style={{
              fontSize: '0.85rem',
              color: '#92400e',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '8px 10px',
              marginTop: '8px',
              lineHeight: 1.4
            }}
          >
            {extraNote}
          </p>
        )}

        {/* 目前身分提示 */}
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: currentUser ? '#f0fdf4' : '#fffbeb',
            border: currentUser ? '1px solid #bbf7d0' : '1px solid #fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem'
          }}
        >
          <div>
            {currentUser ? (
              <span>
                目前點餐者：<strong style={{ color: '#166534' }}>{currentUser}</strong>
              </span>
            ) : (
              <span style={{ color: '#b45309' }}>尚未選取身分，點擊右方登入稱謂：</span>
            )}
          </div>
          <button
            onClick={onRequestUser}
            className="btn btn-sm"
            style={{
              padding: '4px 10px',
              background: currentUser ? '#e2e8f0' : '#f59e0b',
              color: currentUser ? '#334155' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem'
            }}
          >
            {currentUser ? '切換成員' : '點此選擇身分'}
          </button>
        </div>
      </div>

      {/* 即時整桌點菜看板 (需求三：能在菜單上即時看到其它點菜結果) */}
      {currentMealOrders.length > 0 && (
        <div
          className="card"
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            padding: '12px 14px',
            marginBottom: '16px'
          }}
        >
          <div
            onClick={() => setShowLiveSummary(!showLiveSummary)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                即時整桌點菜動態（已點 {currentMealOrders.reduce((sum, o) => sum + o.quantity, 0)} 份，共 ${grandTotal}）
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.8rem' }}>
              <span>{showLiveSummary ? '收合' : '展開查看'}</span>
              {showLiveSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {showLiveSummary && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {liveSummaries.map((item, idx) => {
                  const whoList = Object.entries(item.orderedBy)
                    .map(([u, q]) => `${u}x${q}`)
                    .join(', ');
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.itemName}</span>
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          fontWeight: 700,
                          borderRadius: '4px',
                          padding: '1px 5px'
                        }}
                      >
                        x{item.totalQty}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({whoList})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 依餐點類型分別呈現 UI */}
      {currentMeal.hotpot ? (
        /* 火鍋模式 */
        <div>
          {/* 個人套餐 / 單點 分頁 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              padding: '4px',
              background: '#e2e8f0',
              borderRadius: '12px',
              marginBottom: '14px'
            }}
          >
            {(
              [
                { key: 'set', label: '🍲 個人套餐', count: setCount },
                { key: 'extras', label: '🍖 單點加點', count: extrasCount }
              ] as const
            ).map((tab) => {
              const active = hotpotTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setHotpotTab(tab.key)}
                  style={{
                    padding: '9px 6px',
                    border: 'none',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: active ? '#ffffff' : 'transparent',
                    color: active ? '#1d4ed8' : '#475569',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      style={{
                        marginLeft: '6px',
                        fontSize: '0.72rem',
                        background: active ? '#2563eb' : '#94a3b8',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '1px 7px'
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hotpotTab === 'set' ? (
            <div>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={18} color="#dc2626" />
                  個人套餐選擇 (含肉品、菜盤、附餐)
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>點擊下方套餐進行自選</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {currentMeal.hotpot.meats.map((meat) => {
                  const myCount = myMealOrders.filter((o) => o.itemId === meat.id).reduce((sum, o) => sum + o.quantity, 0);
                  const totalCount = currentMealOrders.filter((o) => o.itemId === meat.id).reduce((sum, o) => sum + o.quantity, 0);
                  const meatOrders = currentMealOrders.filter((o) => o.itemId === meat.id);

                  return (
                    <div
                      key={meat.id}
                      className="card"
                      style={{
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{meat.name}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                          ${meat.price}
                        </div>

                        {/* 即時顯示誰點了這份火鍋 (需求三) */}
                        <div style={{ marginTop: '10px' }}>
                          {totalCount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                                整桌已點 {totalCount} 份：
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {meatOrders.map((ord) => {
                                  const isMe = ord.userName === currentUser;
                                  return (
                                    <div
                                      key={ord.id}
                                      style={{
                                        fontSize: '0.72rem',
                                        background: isMe ? '#eff6ff' : '#f8fafc',
                                        color: isMe ? '#1d4ed8' : '#334155',
                                        border: isMe ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        padding: '3px 6px',
                                        lineHeight: 1.3
                                      }}
                                    >
                                      <strong>{ord.userName}</strong> x{ord.quantity}
                                      {ord.details && (
                                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                          {ord.details}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>尚未有人點選</span>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedMeat(meat);
                            setHotpotModalOpen(true);
                          }}
                        >
                          <Plus size={14} />
                          選擇湯底與副食 {myCount > 0 ? `(我已點 ${myCount})` : ''}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 單點加點 (現場補單) */
            <div style={{ marginTop: '-24px' }}>
              <HotpotExtras
                dishes={HOTPOT_EXTRAS}
                orders={currentMealOrders}
                currentUser={currentUser}
                onAdd={handleAddDish}
                onDecrease={handleDecreaseDish}
              />
            </div>
          )}
        </div>
      ) : (
        /* 合菜模式 */
        <div>
          {/* 搜尋與分類篩選 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="搜尋菜名（如：封鴨、蝦球、客家小炒...）"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 分類標籤 */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '14px'
            }}
          >
            {categories.map((cat) => {
              const isPinned = pinnedCategories.includes(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '0.8rem',
                    fontWeight: isPinned ? 700 : 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    border: isPinned && !isActive ? '1px solid #f59e0b' : '1px solid transparent',
                    background: isActive ? '#2563eb' : isPinned ? '#fffbeb' : '#e2e8f0',
                    color: isActive ? 'white' : isPinned ? '#b45309' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {isPinned ? '★ ' : ''}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 菜品清單列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredDishes.map((dish) => {
              const myCount = myMealOrders.filter((o) => o.itemId === dish.id).reduce((sum, o) => sum + o.quantity, 0);
              const dishOrders = currentMealOrders.filter((o) => o.itemId === dish.id);
              const totalCount = dishOrders.reduce((sum, o) => sum + o.quantity, 0);

              // 統計這道菜有哪些成員點了幾份
              const userQuantities: { [userName: string]: number } = {};
              dishOrders.forEach((o) => {
                userQuantities[o.userName] = (userQuantities[o.userName] || 0) + o.quantity;
              });

              return (
                <div
                  key={dish.id}
                  className="card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    margin: 0
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{dish.name}</span>
                      {dish.isVegetarian && (
                        <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>
                          素
                        </span>
                      )}
                      {dish.note && (
                        <span style={{ fontSize: '0.75rem', color: '#ea580c', background: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>
                          {dish.note}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2563eb' }}>
                        ${dish.price}
                      </span>
                      {dish.unit && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/{dish.unit}</span>}
                    </div>

                    {/* 即時顯示誰點了這道菜 (需求三) */}
                    {totalCount > 0 ? (
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                          全家已點 {totalCount} 份：
                        </span>
                        {Object.entries(userQuantities).map(([user, qty]) => {
                          const isMe = user === currentUser;
                          return (
                            <span
                              key={user}
                              style={{
                                fontSize: '0.75rem',
                                padding: '1px 7px',
                                borderRadius: '6px',
                                background: isMe ? '#dbeafe' : '#f1f5f9',
                                color: isMe ? '#1d4ed8' : '#334155',
                                border: isMe ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                fontWeight: isMe ? 700 : 500
                              }}
                            >
                              {user} x{qty}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        尚未有人點選
                      </div>
                    )}
                  </div>

                  {/* 加減點按鈕 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {myCount > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#f1f5f9',
                          borderRadius: '20px',
                          padding: '2px 4px',
                          border: '1px solid #cbd5e1'
                        }}
                      >
                        <button
                          onClick={() => handleDecreaseDish(dish.id)}
                          style={{
                            border: 'none',
                            background: 'white',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                          title="減少一份"
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#16a34a' }}>
                          {myCount}
                        </span>
                        <button
                          onClick={() => handleAddDish(dish)}
                          style={{
                            border: 'none',
                            background: '#2563eb',
                            color: 'white',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="增加一份"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddDish(dish)}
                        style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
                        title="加一份"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部浮動快速統計 Bar (需求二：金額無小數點) */}
      {currentMealOrders.length > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: '75px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '16px',
            marginTop: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              此餐共點了 {currentMealOrders.reduce((sum, o) => sum + o.quantity, 0)} 道菜
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              總計：${grandTotal}
              {currentMeal.serviceChargePercent && (
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#cbd5e1', marginLeft: '4px' }}>
                  (含10%服務費)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onGoToStats}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            查看明細與編輯 →
          </button>
        </div>
      )}

      {/* 火鍋湯底與副食選擇 Modal */}
      {hotpotModalOpen && selectedMeat && currentMeal.hotpot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              {selectedMeat.name} (${selectedMeat.price})
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              請為【{currentUser || '您'}】選擇這份火鍋套餐的湯底與副食：
            </p>

            {/* 湯底 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>1. 選擇湯底：</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentMeal.hotpot.soups.map((s) => (
                  <label
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: selectedSoup === s ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: selectedSoup === s ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="soup"
                      checked={selectedSoup === s}
                      onChange={() => setSelectedSoup(s)}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: selectedSoup === s ? 700 : 500 }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 副食 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>2. 選擇附餐：</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {currentMeal.hotpot.sides.map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setSelectedSide(side)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: selectedSide === side ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: selectedSide === side ? '#eff6ff' : '#ffffff',
                      color: selectedSide === side ? '#2563eb' : '#334155',
                      fontWeight: selectedSide === side ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setHotpotModalOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={handleConfirmHotpot}
              >
                確認加入點餐
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 菜單截圖預覽 Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '90vw', padding: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700 }}>菜單原始截圖</span>
              <button
                onClick={() => setPreviewImage(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <img
              src={previewImage}
              alt="Menu preview"
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
