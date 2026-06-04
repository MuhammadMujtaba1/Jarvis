import { useCallback, useState } from 'react'

export const useVoiceOutput = (enabled: boolean) => {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback(
    (text: string, rate = 1) => {
      if (!enabled || !window.speechSynthesis) return

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [enabled]
  )

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return { speak, stop, isSpeaking }
}
