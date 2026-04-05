'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Drawer } from 'vaul'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import { NAV_SECTIONS } from '@/config/navigation'

const TABS: { href: string; label: string; icon: (active: boolean) => ReactNode }[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/ai',
    label: 'Command',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 14a5 5 0 110-10 5 5 0 010 10z"
          stroke="currentColor"
          strokeWidth={2}
        />
      </svg>
    ),
  },
  {
    href: '/ecosystem',
    label: 'Empire',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/health',
    label: 'Health',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s-7-4.35-7-11a4 4 0 017-2.7A4 4 0 0119 10c0 6.65-7 11-7 11z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/decision-lab',
    label: 'AI',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 3h6v6H9V3zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" stroke="currentColor" strokeWidth={2} />
      </svg>
    ),
  },
]

function isTabActive(pathname: string | null, href: string) {
  if (!pathname) return false
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function MobileTabBar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[120] flex h-[49px] items-stretch border-t border-[var(--separator)] bg-[var(--bg-elevated)] md:hidden"
        aria-label="Primary"
      >
        {TABS.map((tab) => {
          const active = isTabActive(pathname, tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1"
              aria-current={active ? 'page' : undefined}
            >
              <span className={active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}>{tab.icon(active)}</span>
              <span
                className={`max-w-full truncate text-[10px] font-medium leading-none ${active ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 text-[var(--text-tertiary)]"
          aria-label="More navigation"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="max-w-full truncate text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

      <Drawer.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[130] bg-black/60" />
          <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[140] overflow-hidden`}>
            <DrawerDragHandle />
            <Drawer.Title className="sr-only">All pages</Drawer.Title>
            <div className="max-h-[min(75vh,600px)] overflow-y-auto px-4 pb-8 pt-2">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="mb-4">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                    {section.label}
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] ${
                          isTabActive(pathname, item.href)
                            ? 'bg-[var(--accent-bg)] font-semibold text-[var(--accent)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="w-5 text-center opacity-80">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
