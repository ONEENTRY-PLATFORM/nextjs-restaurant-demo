'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';

// Отключаем статический prerender — общая цепочка layout-ов включает
// `useSearchParams()` (поисковая строка / bottom sheet фильтра), который Next.js
// требует оборачивать в Suspense для статической генерации. Динамический рендер
// обходит prerender-time bailout (тот же подход, что и на home-странице).
export const dynamic = 'force-dynamic';

/**
 * Компонент тестовой страницы API для проверки производительности API.
 * @returns {JSX.Element} Компонент тестовой страницы API.
 */
export default function ApiTestPage(): JSX.Element {
  const [loadingTimes, setLoadingTimes] = useState<number[]>([]);
  const [averageTime, setAverageTime] = useState<number>(0);

  useEffect(() => {
    /**
     * Тестирует производительность API.
     * Замеряет время ответа API, отправляя 20 запросов на эндпоинт /api/test-connection.
     * Записывает время каждого запроса и вычисляет среднее время ответа.
     */
    const testApiPerformance = async (): Promise<void> => {
      const times = [];
      /** Цикл из 20 итераций, чтобы набрать достаточно точек данных для анализа производительности */
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        try {
          const response = await fetch('/api/test-connection');
          await response.text();
          const endTime = performance.now();
          times.push(endTime - startTime);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('API test failed:', error);
          times.push(-1);
        }
      }
      setLoadingTimes(times);
      /** Отфильтровываем времена успешных запросов (значения больше 0) */
      const validTimes = times.filter((t) => t > 0);
      /** Вычисляем и устанавливаем среднее время ответа */
      if (validTimes.length > 0) {
        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        setAverageTime(avg);
      }
    };

    void testApiPerformance();
  }, []);

  return (
    <div className="p-8">
      <h1>API Performance Test</h1>
      <div className="mt-4">
        <h2>Response Times (ms):</h2>
        <ul>
          {loadingTimes.map((time, index) => (
            <li key={index}>
              Request {index + 1}: {time > 0 ? time.toFixed(2) : 'Failed'}
            </li>
          ))}
        </ul>
        {averageTime > 0 && (
          <p className="mt-4">
            <strong>Average Response Time:</strong> {averageTime.toFixed(2)} ms
          </p>
        )}
      </div>
    </div>
  );
}
