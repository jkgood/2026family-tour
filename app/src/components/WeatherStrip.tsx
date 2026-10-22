import React, { useEffect, useState } from 'react';

// 苗栗市座標；資料來源 Open-Meteo（免金鑰）
const LAT = 24.57;
const LON = 120.82;

interface Slot {
  label: string;
  hour: number;
  icon: string;
  desc: string;
  temp: number | null;
  rain: number | null;
}

const SLOTS = [
  { label: '早上', hour: 8 },
  { label: '中午', hour: 12 },
  { label: '晚上', hour: 18 }
];

function codeToWeather(code: number): { icon: string; desc: string } {
  if (code === 0) return { icon: '☀️', desc: '晴' };
  if (code === 1 || code === 2) return { icon: '⛅', desc: '多雲' };
  if (code === 3) return { icon: '☁️', desc: '陰' };
  if (code === 45 || code === 48) return { icon: '🌫️', desc: '霧' };
  if (code >= 51 && code <= 57) return { icon: '🌦️', desc: '毛毛雨' };
  if (code >= 61 && code <= 67) return { icon: '🌧️', desc: '雨' };
  if (code >= 80 && code <= 82) return { icon: '🌦️', desc: '陣雨' };
  if (code >= 95) return { icon: '⛈️', desc: '雷雨' };
  return { icon: '🌡️', desc: '—' };
}

interface Props {
  date: string; // YYYY-MM-DD
}

type HourlyData = {
  time: string[];
  temperature_2m: (number | null)[];
  precipitation_probability: (number | null)[];
  weather_code: (number | null)[];
};

export const WeatherStrip: React.FC<Props> = ({ date }) => {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&hourly=temperature_2m,precipitation_probability,weather_code` +
      `&timezone=Asia%2FTaipei&start_date=${date}&end_date=${date}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('weather http ' + res.status);
        return res.json();
      })
      .then((json: { hourly?: HourlyData }) => {
        if (cancelled) return;
        const h = json.hourly;
        if (!h || !Array.isArray(h.time) || h.time.length === 0) {
          setStatus('unavailable');
          return;
        }
        const result: Slot[] = SLOTS.map((s) => {
          const key = `${date}T${String(s.hour).padStart(2, '0')}:00`;
          const i = h.time.indexOf(key);
          const code = i >= 0 ? h.weather_code[i] : null;
          const w = code === null || code === undefined ? { icon: '❔', desc: '—' } : codeToWeather(code);
          return {
            label: s.label,
            hour: s.hour,
            icon: w.icon,
            desc: w.desc,
            temp: i >= 0 ? h.temperature_2m[i] : null,
            rain: i >= 0 ? h.precipitation_probability[i] : null
          };
        });
        const hasData = result.some((r) => r.temp !== null);
        setSlots(result);
        setStatus(hasData ? 'ok' : 'unavailable');
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const boxStyle: React.CSSProperties = {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    padding: '10px 12px',
    marginBottom: '14px'
  };

  if (status === 'loading') {
    return <div style={{ ...boxStyle, fontSize: '0.8rem', color: '#64748b' }}>🌤️ 天氣預報載入中…</div>;
  }

  if (status === 'unavailable' || !slots) {
    return (
      <div style={{ ...boxStyle, fontSize: '0.8rem', color: '#64748b' }}>
        🌤️ 天氣預報暫時無法取得（可能尚未開放或網路不通）
      </div>
    );
  }

  return (
    <div style={boxStyle}>
      <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700, marginBottom: '6px' }}>
        🌤️ 苗栗天氣預報
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        {slots.map((s) => (
          <div
            key={s.label}
            style={{
              background: 'white',
              borderRadius: '10px',
              padding: '8px 4px',
              textAlign: 'center',
              minWidth: 0
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', lineHeight: 1.3 }}>{s.icon}</div>
            <div style={{ fontSize: '0.8rem', color: '#334155' }}>{s.desc}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              {s.temp !== null ? `${Math.round(s.temp)}°C` : '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
              💧{s.rain !== null ? `${s.rain}%` : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
