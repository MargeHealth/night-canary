'use client'
import { Button } from '@/components/ui/button'
import { Mail, Download, FileText } from 'lucide-react'
import { MarkdownView } from './MarkdownView'
import { ReadAloudButton } from './ReadAloudButton'

export function GPLetter({ markdown }: { markdown: string }) {
  function downloadMd() {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gp-referral-letter.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  function emailGp() {
    const subject = encodeURIComponent('Self-prepared symptom history for GP review')
    const body = encodeURIComponent(markdown)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className="space-y-4">
      {/* Rendered letter — looks like a real document */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          Preview
        </div>
        <article className="bg-white border border-slate-200 rounded-lg shadow-sm max-h-[500px] overflow-y-auto p-5 sm:p-7">
          <MarkdownView markdown={markdown} />
        </article>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <ReadAloudButton text={markdown} className="w-full" />
        <Button onClick={downloadMd} variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button onClick={emailGp} className="w-full">
          <Mail className="w-4 h-4 mr-2" />
          Email to GP
        </Button>
      </div>
    </div>
  )
}
