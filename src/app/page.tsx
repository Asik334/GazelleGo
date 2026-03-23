import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-black text-lg">G</span>
          </div>
          <span className="font-bold text-xl tracking-tight">GazelleGo</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium px-4 py-2">
            Войти
          </Link>
          <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
            Начать →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-zinc-400 text-sm">Работает в Казахстане и СНГ</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Биржа грузов.<br />
            <span className="text-amber-500">Быстро.</span><br />
            <span className="text-zinc-500">Надёжно.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            Соединяем клиентов с водителями газелей по всему региону.
            Создайте заявку — водители откликнутся в течение минут.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register?role=client" className="group bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl transition-all text-base flex items-center gap-2">
              📦 Я отправляю груз
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/register?role=driver" className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold px-8 py-4 rounded-xl transition-all text-base flex items-center gap-2">
              🚛 Я водитель
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-24 max-w-2xl">
          {[
            { n: '2 400+', label: 'Заявок выполнено' },
            { n: '380+', label: 'Активных водителей' },
            { n: '4.8★', label: 'Средний рейтинг' },
          ].map(s => (
            <div key={s.label} className="border-l border-zinc-800 pl-6">
              <div className="text-3xl font-black text-amber-500">{s.n}</div>
              <div className="text-zinc-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 border-t border-zinc-900 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-black mb-16 text-center">Как это работает</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📝', title: 'Создайте заявку', desc: 'Укажите маршрут, тип груза, время и желаемую цену. Займёт 2 минуты.' },
              { step: '02', icon: '🤝', title: 'Водитель принимает', desc: 'Свободные водители в вашем регионе видят заявку и принимают заказ.' },
              { step: '03', icon: '✅', title: 'Груз доставлен', desc: 'Отслеживайте статус, общайтесь в чате, оставьте отзыв после.' },
            ].map(item => (
              <div key={item.step} className="relative bg-zinc-950 border border-zinc-900 rounded-2xl p-8 hover:border-zinc-700 transition-colors group">
                <div className="absolute top-6 right-6 text-zinc-800 text-5xl font-black group-hover:text-zinc-700 transition-colors">{item.step}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-10 col-span-1">
              <div className="text-5xl mb-6">💬</div>
              <h3 className="text-2xl font-bold mb-3">Встроенный чат</h3>
              <p className="text-zinc-500 leading-relaxed">Общайтесь с водителем прямо в приложении — уточняйте детали, координируйте доставку без лишних звонков.</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-10">
              <div className="text-5xl mb-6">⭐</div>
              <h3 className="text-2xl font-bold mb-3">Рейтинг и отзывы</h3>
              <p className="text-zinc-500 leading-relaxed">Честная система оценок. Лучшие водители получают больше заказов, клиенты видят только проверенных исполнителей.</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-10 md:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-5xl mb-6">🛡️</div>
                  <h3 className="text-2xl font-bold mb-3">Безопасные сделки</h3>
                  <p className="text-zinc-400 leading-relaxed max-w-xl">Верифицированные водители, история поездок, система отзывов — всё для вашей безопасности и спокойствия.</p>
                </div>
                <Link href="/register" className="hidden md:flex bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
                  Попробовать →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-10">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-500 rounded-md flex items-center justify-center">
              <span className="text-black font-black text-sm">G</span>
            </div>
            <span className="font-bold text-zinc-400">GazelleGo</span>
          </div>
          <p className="text-zinc-600 text-sm">© 2025 GazelleGo. Все права защищены.</p>
        </div>
      </footer>
    </main>
  )
}
