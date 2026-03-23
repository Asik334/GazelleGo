'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  icon: string
  label: string
  role?: 'client' | 'driver' | null
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: '🏠', label: 'Биржа' },
  { href: '/dashboard/create', icon: '➕', label: 'Создать', role: 'client' },
  { href: '/profile', icon: '👤', label: 'Профиль' },
]

export function MobileBottomNav({ userRole }: { userRole?: string }) {
  const pathname = usePathname()
  
  const items = NAV_ITEMS.filter(item => !item.role || item.role === userRole)

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80">
        <ul className="flex items-stretch">
          {items.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    flex flex-col items-center justify-center gap-1 py-2.5 px-2
                    min-h-[56px] w-full transition-colors duration-150
                    ${isActive 
                      ? 'text-amber-400' 
                      : 'text-zinc-500 hover:text-zinc-300 active:text-zinc-200'
                    }
                  `}
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={`text-[11px] font-medium leading-none ${isActive ? 'text-amber-400' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-400 rounded-b-full" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
