'use client'

import { toast } from 'sonner'

export function MicDictateButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  return (
    <button
      type="button"
      title="Dictate"
      className="shrink-0 rounded-[8px] border border-[var(--border)] p-1.5 text-[14px] text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      onClick={() => {
        if (typeof window === 'undefined') return
        const w = window as unknown as {
          SpeechRecognition?: new () => { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; onresult: ((ev: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null }
          webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; onresult: ((ev: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null }
        }
        const SR = w.SpeechRecognition || w.webkitSpeechRecognition
        if (!SR) {
          toast.error('Voice dictation is not supported in this browser')
          return
        }
        const r = new SR()
        r.lang = 'en-US'
        r.interimResults = false
        r.maxAlternatives = 1
        r.onresult = (e) => {
          const t = e.results[0]?.[0]?.transcript
          if (t) onTranscript(t)
        }
        r.onerror = () => toast.error('Could not start microphone')
        r.start()
        toast.message('Listening…')
      }}
    >
      🎤
    </button>
  )
}
