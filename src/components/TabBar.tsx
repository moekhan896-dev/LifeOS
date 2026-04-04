'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/home', icon: '\u{1F3E0}', label: 'Home' },
  { href: '/command', icon: '\u{1F3AF}', label: 'Command' },
  { href: '/empire', icon: '\u{1F3E2}', label: 'Empire' },
  { href: '/health', icon: '\u2661', label: 'Health' },
  { href: '/ai', icon: '\u{1F9E0}', label: 'AI' },
  { href: '/more', icon: '\u2699', label: 'More' },
] as const

export default function TabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 border-t border-white/[0.06] bg-[rgba(14,17,24,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-emerald-400' : 'text-[#4a5278]'
              }`}
            >
              <span className="text-[18px] leading-none">{tab.icon}</span>
              {active && (
                <span className="text-[9px] font-medium tracking-wider uppercase">
                  {tab.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
