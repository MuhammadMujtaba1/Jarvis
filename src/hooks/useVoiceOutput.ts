import { useEffect, useState } from 'react'

interface UseVoiceOutput {
  speak: (text: string) => void
  isSpeaking: boolean
  stop: () => void
}

export const useVoiceOutput = (enabled = true): UseVoiceOutput => {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = (text: string) => {
    if (!enabled || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not available')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  return { speak, isSpeaking, stop }
}
