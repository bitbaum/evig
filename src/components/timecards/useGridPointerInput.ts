'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * useGridPointerInput — ONE gesture engine for every selectable grid in the
 * timecard tool (month calendar + day hour grid). Translates raw pointer
 * events from mouse, touch, and pen into three semantic callbacks:
 *
 *   onDragStart(key, pointerType) — a paint gesture began on `key`
 *   onDragOver(key, lastKey)      — the gesture moved onto `key`
 *   onTap(key, modifiers)         — a plain click/tap (no drag happened)
 *
 * Device behavior:
 *   - Mouse: left-press (no modifiers) starts painting immediately; moving
 *     over cells extends it via per-cell pointerenter (mice don't capture, so
 *     enter fires normally). Modifier clicks and non-left buttons skip the
 *     drag machinery and surface as onTap with modifiers.
 *   - Touch/pen: pointer events implicitly capture to the origin element, so
 *     enter never fires on other cells — instead the container's pointermove
 *     hit-tests document.elementFromPoint. A drag starts EITHER by moving
 *     mostly horizontally (a vertical swipe stays a page scroll — give the
 *     grid `touch-action: pan-y`) OR by holding still (long-press), which is
 *     what makes painting down a column possible on touch. While painting, a
 *     non-passive touchmove listener preventDefaults so the browser can't
 *     start scrolling mid-paint.
 *
 * Once a drag session ran, the trailing click is swallowed so it can't
 * collapse the painted selection back to a single cell. A plain mouse click
 * is therefore handled at pointerdown (as onDragStart) — consumers must make
 * their onDragStart the "plain click" semantic too. onTap only fires for
 * modifier clicks, touch taps, and keyboard-activated clicks.
 */

export const GRID_CELL_ATTR = 'data-grid-key'

// Hold this long without moving to lock a touch paint (kept below Android's
// ~500ms context-menu long-press so painting wins the race).
const LONG_PRESS_MS = 350
// Movement beyond this cancels a pending long-press (the finger is swiping)…
const SLOP_PX = 10
// …and a mostly-horizontal move beyond the slop starts painting immediately.
const HORIZONTAL_RATIO = 1.2

export interface GridTapInfo {
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  pointerType: string
}

interface DragSession {
  pointerType: string
  startX: number
  startY: number
  startKey: string
  active: boolean
  lastKey: string | null
  longPressTimer: ReturnType<typeof setTimeout> | null
}

function isTouchLike(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}

export function useGridPointerInput({
  onDragStart,
  onDragOver,
  onTap,
}: {
  onDragStart: (key: string, pointerType: string) => void
  onDragOver: (key: string, lastKey: string | null) => void
  onTap: (key: string, info: GridTapInfo) => void
}) {
  // Latest callbacks in a ref so gesture handlers never see stale closures.
  const cbRef = useRef({ onDragStart, onDragOver, onTap })
  useEffect(() => {
    cbRef.current = { onDragStart, onDragOver, onTap }
  })

  const sessionRef = useRef<DragSession | null>(null)
  const dragActiveRef = useRef(false)
  const suppressClickRef = useRef(false)
  const lastPointerTypeRef = useRef<string>('mouse')
  const containerRef = useRef<HTMLElement | null>(null)

  const clearLongPress = () => {
    const s = sessionRef.current
    if (s?.longPressTimer) {
      clearTimeout(s.longPressTimer)
      s.longPressTimer = null
    }
  }

  const activate = useCallback((fromTouchGesture: boolean) => {
    const s = sessionRef.current
    if (!s || s.active) return
    clearLongPress()
    s.active = true
    dragActiveRef.current = true
    // A touch-initiated paint IS the gesture — always eat the trailing click.
    // For mouse, onDragStart already carries the plain-click semantic, so the
    // trailing click must be eaten too; both paths suppress.
    if (fromTouchGesture || s.pointerType === 'mouse') suppressClickRef.current = true
    s.lastKey = s.startKey
    cbRef.current.onDragStart(s.startKey, s.pointerType)
  }, [])

  const paintOver = useCallback((key: string) => {
    const s = sessionRef.current
    if (!s?.active || key === s.lastKey) return
    const last = s.lastKey
    s.lastKey = key
    cbRef.current.onDragOver(key, last)
  }, [])

  const endSession = useCallback(() => {
    clearLongPress()
    sessionRef.current = null
    dragActiveRef.current = false
  }, [])

  // End the session from anywhere (mouseup outside the grid, touch lift).
  useEffect(() => {
    window.addEventListener('pointerup', endSession)
    window.addEventListener('pointercancel', endSession)
    return () => {
      window.removeEventListener('pointerup', endSession)
      window.removeEventListener('pointercancel', endSession)
    }
  }, [endSession])

  // While a touch paint is active, block the browser from scrolling. Must be
  // a non-passive native listener — React's synthetic handlers are passive
  // for touchmove and can't preventDefault. React calls the callback ref with
  // null on unmount, which detaches the listener.
  const blockScrollWhilePainting = useCallback((e: TouchEvent) => {
    if (dragActiveRef.current) e.preventDefault()
  }, [])
  const setContainer = useCallback(
    (el: HTMLElement | null) => {
      containerRef.current?.removeEventListener('touchmove', blockScrollWhilePainting)
      containerRef.current = el
      el?.addEventListener('touchmove', blockScrollWhilePainting, { passive: false })
    },
    [blockScrollWhilePainting],
  )

  const onPointerDown = useCallback(
    (key: string, e: React.PointerEvent) => {
      suppressClickRef.current = false
      const pointerType = e.pointerType || 'mouse'
      lastPointerTypeRef.current = pointerType
      // Modifier clicks (range/toggle) and non-primary buttons are click
      // territory — no drag session. (`button` can be undefined on synthetic
      // pointer events — treat that as primary.)
      if ((e.button ?? 0) !== 0 || e.shiftKey || e.ctrlKey || e.metaKey) return
      sessionRef.current = {
        pointerType,
        startX: e.clientX,
        startY: e.clientY,
        startKey: key,
        active: false,
        lastKey: null,
        longPressTimer: null,
      }
      if (isTouchLike(pointerType)) {
        // Wait for intent: long-press or a horizontal move starts the paint;
        // a vertical move stays a scroll.
        sessionRef.current.longPressTimer = setTimeout(() => activate(true), LONG_PRESS_MS)
      } else {
        // Mouse paints immediately; prevent text-selection/native drag.
        e.preventDefault()
        activate(false)
      }
    },
    [activate],
  )

  // Mouse path: no implicit capture, so entering another cell fires here.
  const onPointerEnter = useCallback(
    (key: string, e: React.PointerEvent) => {
      if (!isTouchLike(e.pointerType || 'mouse')) paintOver(key)
    },
    [paintOver],
  )

  // Touch path: all moves fire on the origin element (implicit capture) and
  // bubble to the container — hit-test the actual finger position.
  const onContainerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = sessionRef.current
      if (!s || !isTouchLike(s.pointerType)) return
      if (!s.active) {
        const dx = Math.abs(e.clientX - s.startX)
        const dy = Math.abs(e.clientY - s.startY)
        if (dx > SLOP_PX && dx > dy * HORIZONTAL_RATIO) {
          activate(true)
        } else if (dy > SLOP_PX) {
          // Vertical intent — let the page scroll; abort the pending paint.
          endSession()
          return
        } else {
          return
        }
      }
      const hit = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest?.(`[${GRID_CELL_ATTR}]`)
      const key = hit?.getAttribute(GRID_CELL_ATTR)
      if (key) paintOver(key)
    },
    [activate, endSession, paintOver],
  )

  const onClick = useCallback((key: string, e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    cbRef.current.onTap(key, {
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      pointerType: lastPointerTypeRef.current,
    })
  }, [])

  const getCellProps = useCallback(
    (key: string) => ({
      [GRID_CELL_ATTR]: key,
      onPointerDown: (e: React.PointerEvent) => onPointerDown(key, e),
      onPointerEnter: (e: React.PointerEvent) => onPointerEnter(key, e),
      onClick: (e: React.MouseEvent) => onClick(key, e),
    }),
    [onPointerDown, onPointerEnter, onClick],
  )

  return {
    getCellProps,
    containerProps: { ref: setContainer, onPointerMove: onContainerPointerMove },
    /** True while a paint gesture is running (e.g. to veto context menus). */
    dragActiveRef,
    /** Pointer type of the most recent pointerdown ('mouse' | 'touch' | 'pen'). */
    lastPointerTypeRef,
  }
}
