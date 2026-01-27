'use client'

/**
 * Audio Playback Hook
 *
 * Handles audio playback state and controls.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAudioPlaybackReturn {
  isPlaying: boolean
  playbackTime: number
  togglePlayback: () => void
  resetPlayback: () => void
}

export function useAudioPlayback(audioUrl: string | null): UseAudioPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying, audioUrl])

  // Reset playback state
  const resetPlayback = useCallback(() => {
    setIsPlaying(false)
    setPlaybackTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  // Handle audio playback events
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl)

      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(audioRef.current?.currentTime || 0)
      }

      audioRef.current.onended = () => {
        setIsPlaying(false)
        setPlaybackTime(0)
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioUrl])

  return {
    isPlaying,
    playbackTime,
    togglePlayback,
    resetPlayback,
  }
}
