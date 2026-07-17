'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, Check, X, StickyNote } from 'lucide-react'
import { formatDateShort } from '@/lib/date-formats'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CHECKLIST_RESULTS, CHECKLIST_RESULT_LABELS, type ChecklistResult } from '@/config/intake-checklist'
import type { ChecklistGroup as ChecklistGroupType, ChecklistItemWithState } from './types'
import { adminInteractive } from '@/lib/admin-ui'

interface ChecklistGroupProps {
  group: ChecklistGroupType
  readOnly?: boolean
  onSetResult: (
    itemId: string,
    result: ChecklistResult | null,
    notes?: string,
    options?: { secondPersonOverride?: boolean },
  ) => void
}

const isDone = (item: ChecklistItemWithState) =>
  item.state.result === CHECKLIST_RESULTS.PASS || item.state.result === CHECKLIST_RESULTS.NA

export function ChecklistGroup({ group, readOnly = false, onSetResult }: ChecklistGroupProps) {
  const t = useTranslations('admin.intake.checklist')
  const tForms = useTranslations('admin.forms')
  const [expanded, setExpanded] = useState(!readOnly)
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({})
  const [notesText, setNotesText] = useState<Record<string, string>>({})
  /** Items where a 'fail' click is waiting for its (required) reason. */
  const [pendingFail, setPendingFail] = useState<Record<string, boolean>>({})
  /**
   * Vier-Augen items where a 'pass' click is waiting for confirmation: a
   * second person just saves; the sole worker writes an override reason
   * (the API rejects a solo sign-off without one).
   */
  const [pendingConfirm, setPendingConfirm] = useState<Record<string, boolean>>({})
  const [secondPersonOverride, setSecondPersonOverride] = useState<Record<string, boolean>>({})
  const doneCount = group.items.filter(isDone).length
  const failCount = group.items.filter(i => i.state.result === CHECKLIST_RESULTS.FAIL).length

  const openNotes = (itemId: string, existing: string) => {
    setNotesText(prev => ({ ...prev, [itemId]: prev[itemId] ?? existing }))
    setNotesOpen(prev => ({ ...prev, [itemId]: true }))
  }

  const closeNotes = (itemId: string) => {
    setNotesOpen(prev => ({ ...prev, [itemId]: false }))
    setPendingFail(prev => ({ ...prev, [itemId]: false }))
    setPendingConfirm(prev => ({ ...prev, [itemId]: false }))
    setSecondPersonOverride(prev => ({ ...prev, [itemId]: false }))
  }

  const handleVerdict = (item: ChecklistItemWithState, result: ChecklistResult) => {
    // Clicking the active verdict again resets the item to open
    if (item.state.result === result) {
      onSetResult(item.id, null)
      return
    }
    if (result === CHECKLIST_RESULTS.FAIL) {
      // A fail needs a reason — open the notes editor and submit from there
      setPendingFail(prev => ({ ...prev, [item.id]: true }))
      openNotes(item.id, item.state.notes)
      return
    }
    if (result === CHECKLIST_RESULTS.PASS && item.requiresSecondPerson) {
      // Vier-Augen sign-off goes through the notes editor: a second person
      // saves directly, a solo worker must write the override reason.
      setPendingConfirm(prev => ({ ...prev, [item.id]: true }))
      openNotes(item.id, item.state.notes)
      return
    }
    onSetResult(item.id, result)
  }

  const saveNotes = (item: ChecklistItemWithState) => {
    const text = notesText[item.id]?.trim() ?? ''
    if (pendingFail[item.id]) {
      if (!text) return // fail requires a reason
      onSetResult(item.id, CHECKLIST_RESULTS.FAIL, text)
    } else if (pendingConfirm[item.id]) {
      onSetResult(item.id, CHECKLIST_RESULTS.PASS, text, {
        secondPersonOverride: secondPersonOverride[item.id] === true,
      })
    } else {
      onSetResult(item.id, item.state.result, text)
    }
    closeNotes(item.id)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 bg-surface-raised ${adminInteractive.rowHover} text-left`}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium text-sm">{group.label}</span>
          {failCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300">
              {t('failCount', { count: failCount })}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          doneCount === group.items.length
            ? 'bg-action-muted text-action'
            : 'bg-surface-overlay text-text-secondary'
        }`}>
          {doneCount}/{group.items.length}
        </span>
      </Button>

      {expanded && (
        <div className="divide-y">
          {group.items.map((item) => {
            const result = item.state.result
            const failed = result === CHECKLIST_RESULTS.FAIL
            return (
              <div
                key={item.id}
                className={`p-3 transition-colors ${
                  failed ? 'bg-error-50 dark:bg-error-900/20' : isDone(item) ? 'bg-action-muted' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Verdict buttons: pass / fail / n.a. */}
                  {!readOnly && <div className="flex items-center gap-1 mt-0.5 shrink-0" role="group" aria-label={item.label}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVerdict(item, CHECKLIST_RESULTS.PASS)}
                      className={`h-11 w-11 sm:h-7 sm:w-7 rounded border-2 flex items-center justify-center transition-colors ${
                        result === CHECKLIST_RESULTS.PASS
                          ? 'bg-action border-action text-white'
                          : 'border-default hover:border-action'
                      }`}
                      title={CHECKLIST_RESULT_LABELS.pass}
                      aria-label={`${item.label}: ${CHECKLIST_RESULT_LABELS.pass}`}
                      aria-pressed={result === CHECKLIST_RESULTS.PASS}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVerdict(item, CHECKLIST_RESULTS.FAIL)}
                      className={`h-11 w-11 sm:h-7 sm:w-7 rounded border-2 flex items-center justify-center transition-colors ${
                        failed
                          ? 'bg-error-600 border-error-600 text-white'
                          : 'border-default hover:border-error-500'
                      }`}
                      title={CHECKLIST_RESULT_LABELS.fail}
                      aria-label={`${item.label}: ${CHECKLIST_RESULT_LABELS.fail}`}
                      aria-pressed={failed}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVerdict(item, CHECKLIST_RESULTS.NA)}
                      className={`h-11 w-11 sm:h-7 sm:w-7 rounded border-2 flex items-center justify-center font-semibold transition-colors ${
                        result === CHECKLIST_RESULTS.NA
                          ? 'bg-surface-overlay border-strong text-text-secondary'
                          : 'border-default text-text-muted hover:border-strong'
                      }`}
                      title={CHECKLIST_RESULT_LABELS.na}
                      aria-label={`${item.label}: ${CHECKLIST_RESULT_LABELS.na}`}
                      aria-pressed={result === CHECKLIST_RESULTS.NA}
                    >
                      <span className="text-[10px] leading-none">NA</span>
                    </Button>
                  </div>}

                  <div className="flex-1 min-w-0">
                    {/* Label + required marker */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm ${
                        failed
                          ? 'font-medium text-error-700 dark:text-error-300'
                          : isDone(item)
                            ? 'line-through text-text-muted'
                            : 'font-medium text-text-primary'
                      }`}>
                        {item.label}
                      </span>
                      {item.required && (
                        <span className="text-xs text-error-500" title={t('requiredMarker')}>*</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-text-tertiary mt-0.5">{item.description}</p>

                    {/* Verdict metadata + notes */}
                    {result && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          {item.state.completedAt && (
                            <span className={`text-xs ${failed ? 'text-error-600 dark:text-error-400' : 'text-action'}`}>
                              {t('resultAt', {
                                result: CHECKLIST_RESULT_LABELS[result],
                                date: formatDateShort(item.state.completedAt),
                              })}
                            </span>
                          )}
                          {!readOnly && !notesOpen[item.id] && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openNotes(item.id, item.state.notes)}
                              className="text-xs text-text-muted hover:text-action flex items-center gap-0.5 transition-colors"
                            >
                              <StickyNote className="w-3 h-3" />
                              {item.state.notes ? t('editNote') : t('addNote')}
                            </Button>
                          )}
                        </div>

                        {/* Existing note preview (when textarea not open) */}
                        {item.state.notes && !notesOpen[item.id] && (
                          <p className="text-xs text-text-tertiary italic pl-0.5">„{item.state.notes}"</p>
                        )}
                      </div>
                    )}

                    {/* Notes editor (also collects fail reasons + Vier-Augen overrides) */}
                    {notesOpen[item.id] && (
                      <div className="mt-2 space-y-1.5">
                        {pendingFail[item.id] && (
                          <p className="text-xs text-error-600 dark:text-error-400">{t('failNoteRequired')}</p>
                        )}
                        {pendingConfirm[item.id] && (
                          <div className="space-y-2">
                            <p className="text-xs text-text-secondary">{t('confirmNoteHint')}</p>
                            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-800 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
                              <input
                                type="checkbox"
                                checked={secondPersonOverride[item.id] === true}
                                onChange={(event) => setSecondPersonOverride(prev => ({ ...prev, [item.id]: event.target.checked }))}
                                className="rounded border-strong text-action focus:ring-action"
                              />
                              {t('overrideSecondPerson')}
                            </label>
                          </div>
                        )}
                        <Textarea
                          autoFocus
                          value={notesText[item.id] ?? ''}
                          onChange={(e) => setNotesText(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder={
                            pendingFail[item.id] ? t('failNotePlaceholder')
                            : pendingConfirm[item.id] ? t('confirmNotePlaceholder')
                            : t('notePlaceholder')
                          }
                          rows={2}
                          className="text-xs resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => saveNotes(item)}
                            disabled={
                              (pendingFail[item.id] && !(notesText[item.id]?.trim())) ||
                              (pendingConfirm[item.id] && secondPersonOverride[item.id] === true && (notesText[item.id]?.trim().length ?? 0) < 10)
                            }
                            variant="primary"
                            size="sm"
                          >
                            {pendingFail[item.id] ? t('saveFail') : pendingConfirm[item.id] ? t('saveConfirm') : tForms('save')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => closeNotes(item.id)}
                            className={`text-xs px-2.5 py-1 border rounded-sm ${adminInteractive.rowHover} transition-colors`}
                          >
                            {tForms('cancel')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
