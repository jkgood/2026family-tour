import React from 'react';
import { Plus, Minus } from 'lucide-react';
import type { DishItem } from '../data/tripData';

interface OrderLike {
  userName: string;
  itemId: string;
  quantity: number;
}

interface Props {
  dishes: DishItem[];
  orders: OrderLike[];
  currentUser: string;
  onAdd: (dish: DishItem) => void;
  onDecrease: (dishId: string) => void;
}

export const HotpotExtras: React.FC<Props> = ({ dishes, orders, currentUser, onAdd, onDecrease }) => {
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>🍖 單點加點 (現場補單)</h4>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>吃不夠再加，直接按 +</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dishes.map((dish) => {
          const dishOrders = orders.filter((o) => o.itemId === dish.id);
          const totalCount = dishOrders.reduce((sum, o) => sum + o.quantity, 0);
          const myCount = dishOrders
            .filter((o) => o.userName === currentUser)
            .reduce((sum, o) => sum + o.quantity, 0);

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
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#dc2626' }}>${dish.price}</span>
                </div>

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
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>尚未有人點選</div>
                )}
              </div>

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
                      onClick={() => onDecrease(dish.id)}
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
                      onClick={() => onAdd(dish)}
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
                    onClick={() => onAdd(dish)}
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
  );
};
