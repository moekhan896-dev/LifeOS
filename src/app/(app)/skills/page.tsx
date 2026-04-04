'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: '#06b6d4',
  Business: '#10b981',
  Personal: '#eab308',
}

const CATEGORY_LABELS: Record<string, string> = {
  Marketing: 'MARKETING',
  Business: 'BUSINESS OPS',
  Personal: 'PERSONAL',
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
            <h1 style={{ fontSize: 28, fontWeight: 600 }} className="text-white">
              Skill Tree
            </h1>
            <p className="text-[13px] text-[var(--text-mid)] mt-1">Level up through action.</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Total Level</div>
            <div className="text-[32px] font-mono font-bold text-emerald-400">{totalLevel}</div>
          </div>
        </div>

        {/* Category Sections */}
        {categories.map((cat, ci) => {
          const skills = skillLevels.filter((s) => s.category === cat)
          const color = CATEGORY_COLORS[cat]

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.08, duration: 0.25 }}
              className="rounded-[16px] p-5"
              style={{ background: '#0e1018' }}
            >
              <h2 className="text-[14px] font-semibold text-white mb-4">
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
                        className="font-mono text-[11px] rounded-md px-2 py-0.5"
                        style={{
                          background: `${color}15`,
                          color: color,
                        }}
                      >
                        Lv {sk.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full" style={{ background: '#1e2338' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${sk.xp}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-dim)] w-[52px] text-right">
                        {sk.xp}/100 XP
                      </span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1d2e] text-[11px] text-[var(--text-mid)] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
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
