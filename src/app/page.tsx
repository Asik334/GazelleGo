import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center space-y-8">

        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">🚛 GazelleGo</h1>
          <p className="text-xl text-zinc-400">
            Биржа грузоперевозок — соединяем клиентов и водителей
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-semibold mb-1">Создайте заявку</h3>
            <p className="text-sm text-zinc-400">Укажите маршрут, груз и время — водители сами откликнутся</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <div className="text-2xl mb-2">🚐</div>
            <h3 className="font-semibold mb-1">Найдите водителя</h3>
            <p className="text-sm text-zinc-400">Водители видят все доступные заявки и принимают заказы</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold mb-1">Отслеживайте статус</h3>
            <p className="text-sm text-zinc-400">Следите за своими заявками в личном кабинете</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-zinc-200 transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/dashboard"
            className="border border-zinc-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-zinc-900 transition-colors"
          >
            Открыть биржу
          </Link>
        </div>

      </div>
    </div>
  )
}