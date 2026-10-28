/*
  In-browser face engine for the demo (face sign-up and recognition).
  Uses the open-source face-api library (TensorFlow.js). The models are served from /models in this site and
  everything runs on this device: no photo or face data is sent anywhere.
*/
type FaceApi = typeof import('@vladmandic/face-api')

let api: FaceApi | null = null
let loading: Promise<FaceApi> | null = null

export function loadFaceEngine(): Promise<FaceApi> {
  if (api) return Promise.resolve(api)
  if (!loading) {
    loading = (async () => {
      const f = await import('@vladmandic/face-api')
      const tf = f.tf as unknown as { setBackend: (b: string) => Promise<boolean>; ready: () => Promise<void> }
      try {
        if (!(await tf.setBackend('webgl'))) await tf.setBackend('cpu')
      } catch {
        await tf.setBackend('cpu')
      }
      await tf.ready()
      const url = `${import.meta.env.BASE_URL}models`
      await Promise.all([f.nets.tinyFaceDetector.loadFromUri(url), f.nets.faceLandmark68Net.loadFromUri(url), f.nets.faceRecognitionNet.loadFromUri(url)])
      api = f
      return f
    })().catch((e) => {
      loading = null
      throw e
    })
  }
  return loading
}

export interface FaceFound {
  box: { x: number; y: number; width: number; height: number }
  score: number
  descriptor: number[]
}

/** Find every face in an image, video frame or canvas, with its 128-number face template. */
export async function findFaces(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceFound[]> {
  const f = await loadFaceEngine()
  const res = await f.detectAllFaces(input, new f.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 })).withFaceLandmarks().withFaceDescriptors()
  return res.map((r) => ({ box: { x: r.detection.box.x, y: r.detection.box.y, width: r.detection.box.width, height: r.detection.box.height }, score: r.detection.score, descriptor: Array.from(r.descriptor) }))
}

export const faceDistance = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0))

/** Two faces count as the same person below this distance (0.6 is the library default; 0.5 is stricter). */
export const MATCH_DISTANCE = 0.5

/** Turn a distance into a simple confidence figure for people: 0.5 is 75%, 0.35 is about 88%. */
export const confidenceOf = (d: number) => Math.max(0, Math.min(99, Math.round(100 * (1 - d * d))))
