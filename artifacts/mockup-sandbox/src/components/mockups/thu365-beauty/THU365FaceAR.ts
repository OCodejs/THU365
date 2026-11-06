export type FaceARSettings = {
  smooth: number;
  lipstick: string;
  blush: string;
  eyeliner: boolean;
  hairTint: string;
  sticker: "none" | "hearts" | "sunglasses" | "sparkles";
  light: "none" | "soft" | "golden" | "studio";
};

type Landmark = { x: number; y: number; z: number };
type FaceResult = { faceLandmarks?: Landmark[][] };

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export async function createTHU365FaceTracker() {
  // @ts-expect-error MediaPipe is loaded on demand from its pinned ESM CDN build.
  const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm");
  const files = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
  return vision.FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.55,
    minFacePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
}

const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

function pathFrom(ctx: CanvasRenderingContext2D, points: Landmark[], indices: number[], w: number, h: number) {
  ctx.beginPath();
  indices.forEach((index, i) => {
    const p = points[index];
    if (!p) return;
    const x = p.x * w, y = p.y * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

export function renderFaceAR(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  result: FaceResult,
  settings: FaceARSettings,
  filter = "none",
) {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.filter = filter;
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
  const face = result.faceLandmarks?.[0];
  if (!face) return;

  if (settings.smooth > 0) {
    ctx.save();
    pathFrom(ctx, face, FACE_OVAL, w, h);
    ctx.clip();
    ctx.globalAlpha = settings.smooth / 260;
    ctx.filter = `blur(${2 + settings.smooth / 14}px) saturate(1.02)`;
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
  }

  if (settings.lipstick !== "none") {
    ctx.save(); pathFrom(ctx, face, LIPS, w, h);
    ctx.fillStyle = settings.lipstick; ctx.globalAlpha = 0.38; ctx.fill();
    ctx.restore();
  }

  if (settings.blush !== "none") {
    for (const index of [205, 425]) {
      const p = face[index]; if (!p) continue;
      const x = p.x * w, y = p.y * h;
      const radius = w * 0.055;
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
      gradient.addColorStop(0, settings.blush); gradient.addColorStop(1, "transparent");
      ctx.save(); ctx.globalAlpha = 0.32; ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.62, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  if (settings.eyeliner) {
    ctx.save(); ctx.strokeStyle = "#21151b"; ctx.lineWidth = Math.max(2, w * 0.0035); ctx.lineCap = "round";
    for (const ids of [[33, 133, 159, 158, 157], [362, 263, 386, 385, 384]]) {
      ctx.beginPath(); ids.forEach((id, i) => { const p = face[id]; if (!p) return; i ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h); }); ctx.stroke();
    }
    ctx.restore();
  }

  if (settings.sticker !== "none") {
    const nose = face[1], left = face[234], right = face[454];
    if (nose && left && right) {
      const x = nose.x * w, y = nose.y * h, span = Math.abs(right.x - left.x) * w;
      ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (settings.sticker === "sunglasses") {
        ctx.font = `${Math.round(span * 0.29)}px sans-serif`; ctx.fillText("🕶️", x, y - span * 0.12);
      } else {
        ctx.font = `${Math.round(span * 0.16)}px sans-serif`;
        ctx.fillText(settings.sticker === "hearts" ? "💗  💗" : "✨  ✨", x, y - span * 0.62);
      }
      ctx.restore();
    }
  }

  if (settings.hairTint !== "none") {
    ctx.save(); ctx.globalCompositeOperation = "color"; ctx.globalAlpha = 0.12;
    ctx.fillStyle = settings.hairTint; ctx.beginPath();
    ctx.ellipse(face[10].x * w, Math.max(0, face[10].y * h - h * 0.06), w * 0.18, h * 0.13, 0, Math.PI, 0);
    ctx.fill(); ctx.restore();
  }

  if (settings.light !== "none") {
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.24, 1, w * 0.5, h * 0.24, w * 0.7);
    gradient.addColorStop(0, settings.light === "golden" ? "rgba(255,205,130,.15)" : "rgba(255,240,225,.12)");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  }
}
