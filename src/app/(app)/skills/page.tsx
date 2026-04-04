'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: 'var(--info)',
  Business: 'var(--positive)',
  Personal: 'var(--spiritual)',
}

const CATEGORY_LABELS: Record<string, string> = {
  Marketing: 'Marketing',
  Business: 'Business ops',
  Personal: 'Personal',
}

const TIPS: Record<string, string> = {
  'Cold Email': 'Complete cold email tasks to level up',
  'GMB/SEO': 'Complete SEO tasks to level up',
  'Paid Ads': 'Run ad campaigns to level up',
  Content: 'Create content to level up',
  Branding: 'Work on branding to level up',
  Sales: 'Close deals to level up',
  Finance: 'Track finances to level up',
  Hiring: 'Recruit team members to level up',
  SOPs: 'Document processes to level up',
  Systems: 'Build systems to level up',
  Discipline: 'Stay consistent to level up',
  Fitness: 'Hit the gym to level up',
  Faith: 'Pray on time to level up',
  Nutrition: 'Eat clean to level up',
  Focus: 'Complete deep work sessions to level up',
}

export default function SkillsPage() {
  const { skillLevels, addSkillXp } = useStore()

  const totalLevel = skillLevels.reduce((s, sk) => s + sk.level, 0)
  const categories = ['Marketing', 'Business', 'Personal']

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="title">Skill Tree</h1>
            <p className="subheadline mt-1">Level up through action.</p>
          </div>
          <div className="text-right">
            <div className="footnote text-[var(--text-secondary)]">Total level</div>
            <div className="data text-[32px] font-bold text-[var(--accent)]">{totalLevel}</div>
          </div>
        </div>

        {/* Category Sections */}
        {categories.map((cat, ci) => {
          const skills = skillLevels.filter((s) => s.category === cat)
          const color = CATEGORY_COLORS[cat]

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.03, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="card rounded-2xl p-5"
            >
              <h2 className="headline mb-4">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="space-y-4">
                {skills.map((sk) => (
                  <div key={sk.id} className="group relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[var(--text-mid)]">
                        {sk.skill}
                      </span>
                      <span
                        className="data-number text-[11px] rounded-md px-2 py-0.5"
                        style={{
                          background: `color-mix(in srgb, ${color} 22%, transparent)`,
                          color: color,
                        }}
                      >
                        Lv {sk.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-[var(--bg-secondary)]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${sk.xp}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="caption data-number w-[52px] text-right text-[var(--text-tertiary)]">
                        {sk.xp}/100 XP
                      </span>
                    </div>
                    {/* Tooltip */}
                    <div className="card-floating absolute -top-8 left-1/2 z-10 -translate-x-1/2 px-2.5 py-1 text-[13px] text-[var(--text-secondary)] opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                      {TIPS[sk.skill] || `Complete ${sk.skill} tasks to level up`}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </PageTransition>
  )
}
