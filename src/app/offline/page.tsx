export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4" aria-hidden>📡</div>
      <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
        <span className="text-black font-black text-3xl" aria-hidden>G</span>
      </div>
      <h1 className="text-2xl font-black mb-3">Нет подключения к сети</h1>
      <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mb-8">
        Проверьте интернет-соединение. Ваши данные сохранены и появятся при восстановлении связи.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-2xl transition-colors min-h-[56px]"
      >
        Повторить попытку
      </button>
    </main>
  )
}
