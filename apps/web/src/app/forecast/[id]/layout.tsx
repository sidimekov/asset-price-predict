// без "use client" - это серверный компонент
type ForecastLayoutProps = {
  children: React.ReactNode;
};

export async function generateStaticParams() {
  // Минимальный список id, для которых будет собран статический HTML
  // Пока бэкенд пустой - можно оставить демо-значения
  // Когда появится API/список прогнозов, заменить это на реальные id
  return [
    { id: 'demo' },
    { id: 'btc-usdt' },
    { id: 'eth-usdt' },
  ];
}

export default function ForecastLayout({ children }: ForecastLayoutProps) {
  return <>{children}</>;
}
