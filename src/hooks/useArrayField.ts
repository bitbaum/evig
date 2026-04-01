'use client'

/**
 * Generic array field management hook — SINGLE SOURCE OF TRUTH
 *
 * Replaces the duplicated add/remove/update pattern for array fields
 * in forms (features, process steps, tags, skills, learning objectives, etc.)
 *
 * Usage:
 *   const tags = useArrayField<string>(['react', 'next'])
 *   tags.add('typescript')
 *   tags.remove(0)
 *
 *   const features = useArrayField<Feature>([])
 *   features.add({ title: '', description: '' })
 *   features.updateAt(0, { title: 'New Title', description: 'Desc' })
 *   features.updateField(0, 'title', 'Changed')
 *   features.remove(1)
 */

import { useState, useCallback } from 'react'

export interface ArrayFieldReturn<T> {
  items: T[]
  setItems: React.Dispatch<React.SetStateAction<T[]>>
  add: (item: T) => void
  /** Add only if not already present (for primitive values) */
  addUnique: (item: T) => void
  remove: (index: number) => void
  /** Remove by value (for primitive arrays like string[]) */
  removeByValue: (value: T) => void
  /** Replace item at index */
  updateAt: (index: number, item: T) => void
  /** Update a single field of an object item at index */
  updateField: <K extends keyof T>(index: number, field: K, value: T[K]) => void
  /** Move item from one index to another */
  move: (from: number, to: number) => void
  clear: () => void
}

export function useArrayField<T>(initialValue: T[] = []): ArrayFieldReturn<T> {
  const [items, setItems] = useState<T[]>(initialValue)

  const add = useCallback((item: T) => {
    setItems(prev => [...prev, item])
  }, [])

  const addUnique = useCallback((item: T) => {
    setItems(prev => {
      if (prev.includes(item)) return prev
      return [...prev, item]
    })
  }, [])

  const remove = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const removeByValue = useCallback((value: T) => {
    setItems(prev => prev.filter(item => item !== value))
  }, [])

  const updateAt = useCallback((index: number, item: T) => {
    setItems(prev => prev.map((existing, i) => (i === index ? item : existing)))
  }, [])

  const updateField = useCallback(<K extends keyof T>(index: number, field: K, value: T[K]) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }, [])

  const move = useCallback((from: number, to: number) => {
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  return { items, setItems, add, addUnique, remove, removeByValue, updateAt, updateField, move, clear }
}
