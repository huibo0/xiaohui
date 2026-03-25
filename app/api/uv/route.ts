import { NextResponse } from 'next/server';

// 北京坐标
const BEIJING_LAT = 39.9042;
const BEIJING_LNG = 116.4074;

interface UVCache {
  data: any;
  fetchedAt: number;
}

let cache: UVCache | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Open-Meteo free API - no key needed
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${BEIJING_LAT}&longitude=${BEIJING_LNG}&daily=uv_index_max,uv_index_clear_sky_max,sunrise,sunset&hourly=uv_index&current=uv_index,temperature_2m,weather_code&timezone=Asia/Shanghai&forecast_days=1`;

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error('UV API failed');

    const raw = await res.json();

    // Find current hour UV
    const now = new Date().toLocaleString('sv', { timeZone: 'Asia/Shanghai' });
    const currentHour = now.slice(0, 13) + ':00';
    const hourlyIndex = raw.hourly?.time?.indexOf(currentHour) ?? -1;
    const currentUV = hourlyIndex >= 0 ? raw.hourly.uv_index[hourlyIndex] : raw.current?.uv_index ?? 0;

    // Build hourly UV for today
    const hourlyData = (raw.hourly?.time || []).map((t: string, i: number) => ({
      hour: new Date(t).getHours(),
      uv: raw.hourly.uv_index[i] || 0,
    }));

    const data = {
      current_uv: Math.round(currentUV * 10) / 10,
      max_uv: raw.daily?.uv_index_max?.[0] ?? 0,
      max_uv_clear: raw.daily?.uv_index_clear_sky_max?.[0] ?? 0,
      temperature: raw.current?.temperature_2m ?? null,
      weather_code: raw.current?.weather_code ?? null,
      sunrise: raw.daily?.sunrise?.[0] ?? null,
      sunset: raw.daily?.sunset?.[0] ?? null,
      hourly: hourlyData,
      location: '北京',
      updated_at: new Date().toISOString(),
    };

    cache = { data, fetchedAt: Date.now() };
    return NextResponse.json(data);
  } catch (err: any) {
    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ ...cache.data, stale: true });
    }
    return NextResponse.json({ error: err.message, current_uv: 0 }, { status: 500 });
  }
}
