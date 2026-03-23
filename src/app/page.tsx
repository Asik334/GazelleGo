import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-dvh bg-black text-white flex flex-col items-center justify-center px-5 py-12">
      {/* Ambient glow — decorative only */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-orange-600/5 blur-[80px]" />
      </div>

      <div className="max-w-xl w-full text-center space-y-8 relative z-10 animate-in">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-black font-black text-3xl" aria-hidden>G</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">GazelleGo</h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Биржа грузоперевозок — соединяем клиентов и водителей
          </p>
        </div>

        {/* Feature cards — stack on small, 3-col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {[
            { icon: '📦', title: 'Создайте заявку', desc: 'Укажите маршрут, груз и время — водители сами откликнутся' },
            { icon: '🚐', title: 'Найдите водителя', desc: 'Водители видят все доступные заявки и принимают заказы' },
            { icon: '✅', title: 'Отслеживайте', desc: 'Следите за своими заявками в личном кабинете' },
          ].map(f => (
            <div key={f.title} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5">
              <div className="text-2xl mb-2" aria-hidden>{f.icon}</div>
              <h2 className="font-semibold mb-1 text-sm sm:text-base">{f.title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/login"
            className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold px-8 py-4 rounded-2xl transition-colors text-base min-h-[56px] flex items-center justify-center"
          >
            Войти
          </Link>
          <Link
            href="/dashboard"
            className="border border-zinc-700 hover:border-zinc-500 text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-base min-h-[56px] flex items-center justify-center"
          >
            Открыть биржу
          </Link>
        </div>

        <p className="text-zinc-700 text-xs pt-2">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-zinc-500 hover:text-amber-400 transition-colors underline underline-offset-2">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  )
}
