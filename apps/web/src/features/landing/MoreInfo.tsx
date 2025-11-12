'use client';
import React from 'react';

export const MoreInfo: React.FC = () => {
  return (
    <section className="bg-base text-white rounded-3xl px-6 p-6 md:p-8 max-w-4xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-bold mb-10">
        About project - AssetPredict
      </h3>

      <div className="text-sm md:text-base leading-relaxed text-gray-200">
        <br />
        <p className="text-xl">
          Веб-приложение для прогноза временных рядов цен активов.
        </p>
        <br />
        <p className="text-xl">
          Интерактивный дашборд прогнозирует цены активов (акции/FX/крипто),
          показывает интервальные оценки и объясняет прогноз, показывая как
          влияли различные факторы (тренд, моментум, календарь, сезонность и
          т.д.). Гибридная архитектура: лёгкая предобработка в браузере, более
          тяжёлый инференс на сервере.
        </p>
        <br />
        <p className="text-xl">
          Ценность для пользователя: быстрый прогноз с обоснованием, сохранение
          истории прогнозов пользователя и оценка их точности.
        </p>
        <br />
        <div className="mt-8">
          <p className="text-xl">Целевая аудитория:</p>
          <ul className="text-xl list-disc list-inside space-y-2 ml-4 px-6">
            <li>
              Ретейл-инвесторы и аналитики, которым нужно «быстро оценить»
              базовую динамику, от которой можно отталкиваться для дальнейшего
              анализа.
            </li>
            <li>
              ML-энтузиасты для экспериментов и интересующиеся пользователи.
            </li>
          </ul>
        </div>
        <br />
        <p className="text-xl">
          Проект не ориентирован на профессиональные терминалы, а создаётся как
          инструмент, чтобы «за пару кликов» понять базовую динамику рынка.
        </p>
      </div>
    </section>
  );
};
