import { useEffect, useRef, useState } from 'react'
import type { FaceFound } from './faceEngine'

/* Camera and image helpers for face sign-up and recognition. Everything stays in the browser. */

export function fileToCanvas(file: File, max = 640): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * k)
      c.height = Math.round(img.naturalHeight * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not open that image'))
    }
    img.src = url
  })
}

export function frameOf(video: HTMLVideoElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = video.videoWidth || 640
  c.height = video.videoHeight || 480
  c.getContext('2d')!.drawImage(video, 0, 0, c.width, c.height)
  return c
}

/** Square crop around the face with some margin, as a small JPEG for the thumbnail. */
export function faceThumb(src: HTMLCanvasElement, box: FaceFound['box'], size = 220) {
  const side = Math.min(Math.max(box.width, box.height) * 1.8, src.width, src.height)
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const sx = Math.max(0, Math.min(src.width - side, cx - side / 2))
  const sy = Math.max(0, Math.min(src.height - side, cy - side / 2))
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  c.getContext('2d')!.drawImage(src, sx, sy, side, side, 0, 0, size, size)
  return c.toDataURL('image/jpeg', 0.85)
}

export function useCamera(on: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!on) return
    let stream: MediaStream | null = null
    let cancelled = false
    setError(null)
    setReady(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser can’t open the camera here. The camera needs a secure address (https or localhost). Use a photo instead.')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream = s
        const v = videoRef.current
        if (v) {
          v.srcObject = s
          v.onloadeddata = () => setReady(true)
          v.play().catch(() => undefined)
        }
      })
      .catch((e: Error) => setError(e.name === 'NotAllowedError' ? 'Camera access was blocked. Allow the camera in the browser address bar, or use a photo instead.' : 'No camera was found. Use a photo instead.'))
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [on])
  return { videoRef, ready, error }
}

