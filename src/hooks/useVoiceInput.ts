import React, { useState, useCallback } from 'react'

interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
      }
      isFinal: boolean
    }
  }
}

interface SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognition
  webkitSpeechRecognition?: new () => SpeechRecognition
}

const windowWithSpeechRecognition = window as WindowWithSpeechRecognition

const SpeechRecognitionAPI =
  windowWithSpeechRecognition.SpeechRecognition ||
  windowWithSpeechRecognition.webkitSpeechRecognition

export const useVoiceInput = (enabled: boolean) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition] = React.useState<SpeechRecognition | null>(
    SpeechRecognitionAPI ? new SpeechRecognitionAPI() : null
  )

  const startListening = useCallback(() => {
    if (!recognition || !enabled) return

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.results.length - 1; i >= 0; i--) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: Event) => {
      console.error('Speech recognition error:', event)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (error) {
      console.warn('Could not start speech recognition:', error)
    }
  }, [recognition, enabled])

  const stopListening = useCallback(() => {
    if (!recognition) return
    try {
      recognition.stop()
    } catch (error) {
      console.warn('Could not stop speech recognition:', error)
    }
    setIsListening(false)
  }, [recognition])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition: !!recognition
  }
}
