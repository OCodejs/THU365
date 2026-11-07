import { useEffect, useRef, useState } from "react";
import { createTHU365FaceTracker, renderFaceAR, type FaceARSettings } from "./THU365FaceAR";
import {
  ArrowLeft, Aperture, Camera, Check, ChevronRight, Download, FlipHorizontal2, Settings, UserRound, Menu, ScanFace,
  Image as ImageIcon, LockKeyhole, Mic, Play, RotateCcw, ShieldCheck, Sparkles,
  Video, X, Zap, Clapperboard
} from "lucide-react";

type Screen = "home" | "module" | "permission" | "camera" | "preview";
type MediaKind = "image" | "video";
type CameraFacing = "user" | "environment";
type BeautyPreset = { id: string; name: string; filter: string; description: string };
type BeautyReference = { id:string;name:string;subtitle:string;image:string;gender:"Nam"|"Nữ";preset:string;beauty:number;settings:FaceARSettings;description:string };
const BEAUTY_REFERENCES: BeautyReference[] = [
  {id:"cn-male-clean",name:"C-Drama nam · Thanh lịch",subtitle:"Nam · ánh sáng studio",gender:"Nam",image:"https://images.pexels.com/photos/35514244/pexels-photo-35514244/free-photo-of-dramatic-studio-portrait-of-young-asian-male-model.jpeg?auto=compress&cs=tinysrgb&w=720",preset:"cool",beauty:38,settings:{smooth:32,lipstick:"none",blush:"none",eyeliner:false,hairTint:"none",sticker:"none",light:"studio"},description:"Da tự nhiên, tương phản nhẹ, ánh sáng điện ảnh"},
  {id:"cn-male-douyin",name:"Douyin nam · Sạch sáng",subtitle:"Nam · phong cách trẻ",gender:"Nam",image:"https://images.pexels.com/photos/34970889/pexels-photo-34970889/free-photo-of-young-asian-male-portrait-with-casual-fashion.jpeg?auto=compress&cs=tinysrgb&w=720",preset:"porcelain",beauty:44,settings:{smooth:42,lipstick:"none",blush:"none",eyeliner:false,hairTint:"none",sticker:"none",light:"soft"},description:"Làm dịu da, nâng sáng và giữ nét nam tính"},
  {id:"cn-female-glass",name:"Douyin nữ · Glass Skin",subtitle:"Nữ · da căng sáng",gender:"Nữ",image:"https://images.unsplash.com/photo-1633307375906-709ce1b7e9f3?auto=format&fit=crop&w=720&q=85",preset:"glass",beauty:52,settings:{smooth:54,lipstick:"rgba(190,95,105,.72)",blush:"rgba(238,125,145,.48)",eyeliner:false,hairTint:"none",sticker:"none",light:"soft"},description:"Da sáng trong, son hồng tự nhiên, ánh sáng mềm"},
  {id:"cn-female-peach",name:"C-Drama nữ · Peach Glow",subtitle:"Nữ · makeup đào",gender:"Nữ",image:"https://images.unsplash.com/photo-1589722078371-403f758b8451?auto=format&fit=crop&w=720&q=85",preset:"peachglow",beauty:56,settings:{smooth:48,lipstick:"rgba(225,115,145,.78)",blush:"rgba(240,150,105,.72)",eyeliner:true,hairTint:"none",sticker:"none",light:"golden"},description:"Má đào, môi hồng đào và ánh vàng nhẹ"},
];
function presetReferenceImage(id:string){return /mono|noir|cocoa|latte|cool|film|vintage/.test(id)?BEAUTY_REFERENCES[0].image:/natural|cloud|glass|rose|peach|fairy|porcelain|lavender|soft|matte/.test(id)?BEAUTY_REFERENCES[2].image:BEAUTY_REFERENCES[1].image;}
const BEAUTY_PRESETS: BeautyPreset[] = [
  { id: "cloud", name: "Cloud Skin", filter: "brightness(1.08) saturate(1.04) contrast(.96)", description: "Nền da mịn lì, soft-focus" },
  { id: "softfocus", name: "Soft Focus", filter: "brightness(1.07) saturate(1.06) contrast(.92)", description: "Làm dịu ánh sáng, chân dung mềm" },
  { id: "kbeauty", name: "K-Beauty", filter: "brightness(1.1) saturate(1.08) contrast(.97) sepia(.035)", description: "Trong trẻo, hồng nhẹ kiểu Hàn" },
  { id: "peachglow", name: "Peach Glow", filter: "brightness(1.09) saturate(1.15) sepia(.09)", description: "Má đào và ánh sáng ấm" },
  { id: "natural", name: "Natural", filter: "brightness(1.04) saturate(1.08) contrast(1.02)", description: "Da tự nhiên, ánh sáng dịu" },
  { id: "glass", name: "Glass Skin", filter: "brightness(1.12) saturate(1.08) contrast(.94)", description: "Hiệu ứng sáng trong kiểu glass skin" },
  { id: "soft", name: "Soft Glam", filter: "brightness(1.08) saturate(1.13) contrast(1.04) sepia(.04)", description: "Tông makeup mềm, ấm" },
  { id: "rose", name: "Rose", filter: "brightness(1.05) saturate(1.16) sepia(.12) hue-rotate(330deg)", description: "Hồng đào nhẹ nhàng" },
  { id: "latte", name: "Latte", filter: "brightness(1.04) saturate(.88) sepia(.2) contrast(1.04)", description: "Nâu sữa ấm áp" },
  { id: "cool", name: "Cool", filter: "brightness(1.06) saturate(.92) hue-rotate(9deg) contrast(1.06)", description: "Trong trẻo, tông lạnh" },
  { id: "film", name: "Film", filter: "brightness(1.02) saturate(.78) sepia(.16) contrast(1.12)", description: "Màu film hoài cổ" },
  { id: "glow", name: "Golden", filter: "brightness(1.1) saturate(1.18) sepia(.1)", description: "Ánh vàng rực rỡ" },
  { id: "mono", name: "Mono", filter: "grayscale(1) contrast(1.12)", description: "Đen trắng tối giản" },
  { id: "porcelain", name: "Porcelain", filter: "brightness(1.14) saturate(.92) contrast(.94)", description: "Da sáng trong, tông sứ" },
  { id: "lavender", name: "Lavender", filter: "brightness(1.08) saturate(.95) hue-rotate(18deg)", description: "Tím lavender dịu" },
  { id: "cocoa", name: "Cocoa", filter: "brightness(1.03) saturate(.86) sepia(.28) contrast(1.06)", description: "Nâu cacao ấm" },
  { id: "sunset", name: "Sunset", filter: "brightness(1.08) saturate(1.24) sepia(.18) hue-rotate(-8deg)", description: "Ánh hoàng hôn cam đào" },
  { id: "icy", name: "Icy Blue", filter: "brightness(1.12) saturate(.82) hue-rotate(22deg) contrast(1.04)", description: "Ánh xanh lạnh trong trẻo" },
  { id: "vintage", name: "Vintage", filter: "brightness(1.02) saturate(.72) sepia(.32) contrast(1.08)", description: "Màu ảnh film cổ điển" },
  { id: "vivid", name: "Vivid", filter: "brightness(1.06) saturate(1.35) contrast(1.08)", description: "Màu sắc nổi bật" },
  { id: "fairy", name: "Fairy Glow", filter: "brightness(1.16) saturate(1.08) contrast(.9) sepia(.06)", description: "Ánh sáng mơ màng" },
  { id: "matte", name: "Matte", filter: "brightness(1.05) saturate(.9) contrast(.88)", description: "Màu lì mềm mại" },
  { id: "noir", name: "Noir", filter: "grayscale(1) contrast(1.28) brightness(.96)", description: "Đen trắng điện ảnh" },
];

function RobotFaceScan(){return <div className="tw-robot-wrap" aria-label="Robot AI quét khuôn mặt"><div className="tw-robot-aura"/><svg className="tw-robot-svg" viewBox="0 0 220 220" role="img" aria-hidden="true"><defs><linearGradient id="thu-robot-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe4d9"/><stop offset=".48" stopColor="#d99c91"/><stop offset="1" stopColor="#855d63"/></linearGradient><linearGradient id="thu-robot-screen" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#172b30"/><stop offset="1" stopColor="#091416"/></linearGradient></defs><path d="M110 17v17M102 17h16" stroke="#f5c5b6" strokeWidth="5" strokeLinecap="round"/><circle cx="110" cy="13" r="7" fill="#f5c5b6"/><rect x="30" y="45" width="160" height="137" rx="42" fill="url(#thu-robot-metal)" stroke="#ffe0d4" strokeWidth="3"/><rect x="45" y="61" width="130" height="104" rx="30" fill="url(#thu-robot-screen)" stroke="#f8cbbd" strokeOpacity=".6" strokeWidth="2"/><path d="M26 88H14m192 0h-12" stroke="#e9b6aa" strokeWidth="8" strokeLinecap="round"/><circle cx="110" cy="112" r="35" fill="none" stroke="#e6b6aa" strokeOpacity=".5" strokeDasharray="3 5"/><path d="M87 102q8-9 16 0m14 0q8-9 16 0" fill="none" stroke="#f8e1d8" strokeWidth="5" strokeLinecap="round"/><path d="M94 129q16 13 32 0" fill="none" stroke="#eab2a6" strokeWidth="4" strokeLinecap="round"/><path className="tw-robot-scan-line" d="M55 112h110" stroke="#72f4cb" strokeWidth="3" strokeLinecap="round" filter="drop-shadow(0 0 5px #72f4cb)"/><path d="M66 82v-9h9m70 0h9v9M66 145v9h9m70 0h9v-9" fill="none" stroke="#72f4cb" strokeWidth="2.5" strokeLinecap="round"/><rect x="70" y="182" width="80" height="13" rx="6.5" fill="#d89e93"/><circle cx="110" cy="188.5" r="3" fill="#fff0e8"/></svg><span className="tw-robot-status"><i/> AI FACE SCAN</span></div>}
export function THU365WebApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const [activeHomeReference, setActiveHomeReference] = useState(BEAUTY_REFERENCES[0].id);
  const [activeModule, setActiveModule] = useState("album");
  const [facing, setFacing] = useState<CameraFacing>("user");
  const [mode, setMode] = useState<MediaKind>("image");
  const [beauty, setBeauty] = useState(35);
  const [beautyPanel, setBeautyPanel] = useState<"auto" | "manual">("auto");
  const [beautyPanelOpen, setBeautyPanelOpen] = useState(true);
  const [beautyCategory, setBeautyCategory] = useState<"face" | "makeup">("face");
  const [activeBeautyTool, setActiveBeautyTool] = useState("smooth");
  const [autoProfile, setAutoProfile] = useState("natural");
  const [arSettings, setArSettings] = useState<FaceARSettings>({ smooth: 35, lipstick: "rgba(190,48,83,.9)", blush: "rgba(238,105,135,.8)", lipstickStrength: 70, blushStrength: 55, faceSlim: 0, eyeEnlarge: 0, eyeliner: false, hairTint: "none", sticker: "none", light: "soft" });
  const [trackingStatus, setTrackingStatus] = useState("Đang chờ camera");
  const [savedPresets, setSavedPresets] = useState<Array<{name:string;settings:FaceARSettings;preset?:string;beauty?:number;autoProfile?:string}>>(() => { try { return JSON.parse(localStorage.getItem("anhthu-ar-presets") || localStorage.getItem("thu365-ar-presets") || "[]"); } catch { return []; } });
  const [preset, setPreset] = useState("natural");
  const [selectedReference, setSelectedReference] = useState("cn-female-glass");
  const [faceInsight, setFaceInsight] = useState("Đưa khuôn mặt vào khung hình để AI phân tích góc và tỷ lệ landmark");
  const [referenceCompare, setReferenceCompare] = useState(true);
  const activePreset = BEAUTY_PRESETS.find((item) => item.id === preset) ?? BEAUTY_PRESETS[0];
  const [recording, setRecording] = useState(false);
  const [shortVideoMode, setShortVideoMode] = useState(false);
  const [videoLimitSeconds, setVideoLimitSeconds] = useState(600);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const shortVideoTimerRef = useRef<number | null>(null);
  const recordingClockRef = useRef<number | null>(null);
  const [micGuide, setMicGuide] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaKind>("image");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaName, setMediaName] = useState("thu365-photo.jpg");
  const [notice, setNotice] = useState("");
  const [editSettings, setEditSettings] = useState({brightness:100,contrast:100,saturation:100,warmth:0,hue:0,vignette:0,fade:0,rotation:0,aspect:"original",tone:"none"});
  const [editPanel, setEditPanel] = useState<"light"|"color"|"crop"|"effects">("light");
  const [showEditor, setShowEditor] = useState(true);
  const [exportingEdit, setExportingEdit] = useState(false);
  const editFilter = `${activePreset.filter} brightness(${editSettings.brightness}%) contrast(${editSettings.contrast}%) saturate(${editSettings.saturation}%) hue-rotate(${editSettings.hue}deg)`;
  const [profileName, setProfileName] = useState(() => localStorage.getItem("anhthu-profile-name") || "AnhThu User");
  const [studioSettings, setStudioSettings] = useState(() => { try { return { photo: "1080", video: "1080", fps: "60", mirror: true, ...JSON.parse(localStorage.getItem("anhthu-studio-settings") || "{}") }; } catch { return { photo: "1080", video: "1080", fps: "60", mirror: true }; } });
  const [cameraQuality, setCameraQuality] = useState("Đang chờ camera");
  const [devicePermissions, setDevicePermissions] = useState({ camera: "Chưa kiểm tra", microphone: "Chưa kiểm tra" });
  const [isStandalone, setIsStandalone] = useState(false);
  const [aiDiagnostics, setAiDiagnostics] = useState<{network:string;secure:string;camera:string;runtime:string;faceModel:string;skinModel:string} | null>(null);
  const [checkingAI, setCheckingAI] = useState(false);
  const [arReady, setArReady] = useState(false);
  const [aiRetry, setAiRetry] = useState(0);
  function updateStudioSettings(patch: Partial<{photo:string;video:string;fps:string;mirror:boolean}>) { setStudioSettings((current:any) => { const next = {...current, ...patch}; localStorage.setItem("anhthu-studio-settings", JSON.stringify(next)); return next; }); }
  async function runAIDiagnostics() {
    setCheckingAI(true);
    const runtime = typeof WebAssembly !== "undefined" ? "WebAssembly khả dụng" : "Thiếu WebAssembly";
    const secure = window.isSecureContext ? "HTTPS / secure context hợp lệ" : "Không an toàn · camera và AI có thể bị chặn";
    const camera = typeof navigator.mediaDevices?.getUserMedia === "function" ? "Trình duyệt hỗ trợ getUserMedia" : "Trình duyệt không hỗ trợ camera";
    const network = navigator.onLine ? "Thiết bị đang báo có mạng" : "Thiết bị đang offline";
    const probe = async (url: string) => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 9000);
      try {
        const response = await fetch(url, { method: "HEAD", mode: "cors", cache: "no-store", signal: controller.signal });
        return response.ok ? "Kết nối OK · HTTP " + response.status : "Máy chủ trả HTTP " + response.status;
      } catch (cause) {
        return cause instanceof DOMException && cause.name === "AbortError" ? "Hết thời gian chờ 9 giây" : "Không xác minh được · có thể do mạng hoặc CORS";
      } finally { window.clearTimeout(timer); }
    };
    const [runtimeResult, faceModel, skinModel] = await Promise.all([
      Promise.resolve(runtime),
      probe("https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"),
      probe("https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite")
    ]);
    setAiDiagnostics({ network, secure, camera, runtime: runtimeResult, faceModel, skinModel });
    setCheckingAI(false);
  }

  async function refreshDevicePermissions() {
    const read = async (name: "camera" | "microphone") => {
      try {
        if (!navigator.permissions?.query) return "Trình duyệt không hỗ trợ xem trạng thái";
        const result = await navigator.permissions.query({ name: name as PermissionName });
        return result.state === "granted" ? "Đã cho phép" : result.state === "denied" ? "Đã từ chối · cần mở Cài đặt" : "Chưa cấp · sẽ hỏi khi sử dụng";
      } catch { return "Chỉ kiểm tra được khi sử dụng"; }
    };
    const [camera, microphone] = await Promise.all([read("camera"), read("microphone")]);
    setDevicePermissions({ camera, microphone });
  }

  useEffect(() => {
    setIsStandalone(window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);
    if (activeModule === "settings") void refreshDevicePermissions();
  }, [activeModule]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<any>(null);
  const arSettingsRef = useRef(arSettings);
  const beautyRef = useRef(beauty);
  const filterRef = useRef(activePreset.filter);
  arSettingsRef.current = arSettings;
  beautyRef.current = beauty;
  filterRef.current = activePreset.filter;
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const processedVideoStreamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [screen]);

  useEffect(() => () => {
    if (shortVideoTimerRef.current) window.clearTimeout(shortVideoTimerRef.current);
    if (recordingClockRef.current) window.clearInterval(recordingClockRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);


  useEffect(() => {
    if (screen !== "camera") { setArReady(false); return; }
    let active = true;
    let raf = 0;
    let tracker: any = null;
    let last = -1;
    let lastInsightAt = 0;
    setArReady(false);
    setTrackingStatus("Camera đã bật · đang tải AI nền");

    // Start the processed preview immediately. Beauty color controls must work
    // even when the optional MediaPipe model is slow, blocked, or offline.
    const tick = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = arCanvasRef.current;
      if (video && canvas && video.readyState >= 2 && video.currentTime !== last) {
        last = video.currentTime;
        try {
          const result = tracker ? tracker.detectForVideo(video, performance.now()) : {};
          const currentBeauty = beautyRef.current;
          const currentFilter = filterRef.current;
          const filter = currentFilter + " brightness(" + (1 + currentBeauty / 650) + ") saturate(" + (1 + currentBeauty / 500) + ")";
          renderFaceAR(canvas, video, result, arSettingsRef.current, filter);
          setArReady(true);

          const face = result.faceLandmarks?.[0];
          if (face && performance.now() - lastInsightAt > 700) {
            lastInsightAt = performance.now();
            const dist = (a:number,b:number) => Math.hypot((face[a]?.x ?? 0) - (face[b]?.x ?? 0), (face[a]?.y ?? 0) - (face[b]?.y ?? 0));
            const width = dist(234,454), height = dist(10,152), eyes = dist(33,263), mouth = dist(61,291);
            const ratio = height > 0 ? width / height : 0;
            const shape = ratio > .82 ? "khung mặt rộng" : ratio < .68 ? "khung mặt thon" : "khung mặt cân đối";
            setFaceInsight("AI đang theo dõi · " + shape + " · mắt " + Math.round(eyes*1000)/10 + "% · môi " + Math.round(mouth*1000)/10 + "% chiều rộng khung");
            setTrackingStatus(tracker?.segmentationEnabled ? "Đã nhận diện khuôn mặt + vùng da" : "Đã nhận diện khuôn mặt");
          } else if (!face && tracker && performance.now() - lastInsightAt > 700) {
            lastInsightAt = performance.now();
            setFaceInsight("Chưa thấy đủ landmark · hãy nhìn thẳng camera và đủ sáng");
            setTrackingStatus("Đưa khuôn mặt vào khung hình");
          } else if (!tracker) {
            setTrackingStatus("Beauty màu đang hoạt động · AI đang tải nền");
          }
        } catch (cause) {
          console.warn("THU365 live beauty frame failed:", cause);
          setTrackingStatus("Đang khôi phục khung hình · camera vẫn hoạt động");
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    void createTHU365FaceTracker().then((loaded) => {
      if (!active) { loaded.close(); return; }
      tracker = loaded;
      trackerRef.current = loaded;
      setTrackingStatus(loaded.segmentationEnabled ? "AI Face + Skin sẵn sàng" : "AI Face sẵn sàng · Skin AI dự phòng");
    }).catch((cause) => {
      if (!active) return;
      tracker = null;
      trackerRef.current = null;
      console.warn("AnhThu AI model unavailable; live color/filter controls remain active:", cause);
      setTrackingStatus("Beauty màu đang hoạt động · AI Face chưa tải được");
    });

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      tracker?.close?.();
      trackerRef.current = null;
      setArReady(false);
    };
  }, [screen, aiRetry]);

  function applyReferenceLook(reference:BeautyReference) {
    setSelectedReference(reference.id);
    setAutoProfile(reference.preset);
    setBeautyPanel("auto");
    setPreset(reference.preset);
    setBeauty(reference.beauty);
    setArSettings({...reference.settings});
    showNotice("Đã áp dụng phong cách mẫu · "+reference.name);
  }

  function applyAutoBeauty(profile = autoProfile) {
    setAutoProfile(profile); setBeautyPanel("auto");
    const profiles: Record<string, {preset:string;beauty:number;settings:FaceARSettings}> = {
      natural: { preset:"natural", beauty:38, settings:{smooth:38,lipstick:"rgba(190,95,105,.72)",blush:"rgba(238,125,145,.55)",eyeliner:false,hairTint:"none",sticker:"none",light:"soft"} },
      cloud: { preset:"cloud", beauty:46, settings:{smooth:46,lipstick:"rgba(175,82,105,.78)",blush:"rgba(230,125,145,.48)",eyeliner:false,hairTint:"none",sticker:"none",light:"soft"} },
      softglam: { preset:"soft", beauty:58, settings:{smooth:52,lipstick:"rgba(190,48,83,.88)",blush:"rgba(238,105,135,.72)",eyeliner:true,hairTint:"none",sticker:"none",light:"golden"} },
      peach: { preset:"peachglow", beauty:50, settings:{smooth:45,lipstick:"rgba(190,95,105,.78)",blush:"rgba(240,150,105,.78)",eyeliner:false,hairTint:"none",sticker:"none",light:"golden"} }
    };
    const selected = profiles[profile] || profiles.natural; setPreset(selected.preset); setBeauty(selected.beauty); setArSettings(selected.settings); showNotice("Đã tự động thiết lập beauty · " + profile);
  }

  function saveARPreset() {
    const name = window.prompt("Đặt tên cho cài đặt làm đẹp này?");
    if (!name?.trim()) return;
    const next = [...savedPresets.filter((item) => item.name !== name.trim()), {
      name: name.trim(),
      settings: { ...arSettings },
      preset,
      beauty,
      autoProfile
    }].slice(-12);
    setSavedPresets(next);
    localStorage.setItem("anhthu-ar-presets", JSON.stringify(next));
    showNotice("Đã lưu toàn bộ cài đặt làm đẹp trên thiết bị");
  }

  function applySavedPreset(item: {name:string;settings:FaceARSettings;preset?:string;beauty?:number;autoProfile?:string}) {
    setArSettings(item.settings);
    if (item.preset) setPreset(item.preset);
    if (typeof item.beauty === "number") setBeauty(item.beauty);
    if (item.autoProfile) setAutoProfile(item.autoProfile);
    showNotice("Đã khôi phục cài đặt · " + item.name);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  async function startCamera(nextFacing = facing) {
    setError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera cần Safari/Chrome hiện đại và kết nối HTTPS. Hãy mở AnhThu bằng Safari.");
      return;
    }
    try {
      stopCamera();
      const requestedResolution = mode === "image" ? studioSettings.photo : studioSettings.video;
      const preferredConstraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: requestedResolution === "4k" ? 3840 : requestedResolution === "720" ? 1280 : 1920 },
          height: { ideal: requestedResolution === "4k" ? 2160 : requestedResolution === "720" ? 720 : 1080 },
          frameRate: { ideal: Number(studioSettings.fps) }
        }
      };
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
      } catch (firstError) {
        const firstName = firstError instanceof DOMException ? firstError.name : "";
        if (firstName === "NotAllowedError" || firstName === "PermissionDeniedError" || firstName === "NotFoundError") throw firstError;
        // Retry with browser defaults when the requested HD/4K/FPS profile is unsupported.
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: nextFacing } } });
      }
      const actual = stream.getVideoTracks()[0]?.getSettings?.();
      setCameraQuality(actual?.width && actual?.height ? String(actual.width) + "×" + String(actual.height) + (actual.frameRate ? " · " + Math.round(actual.frameRate) + " FPS" : "") : "Thiết bị tự chọn chất lượng");
      streamRef.current = stream;
      void refreshDevicePermissions();
      setFacing(nextFacing);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => undefined);
      }
      setScreen("camera");
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Bạn chưa cấp quyền camera. Mở Cài đặt iPhone → Safari → Camera, chọn Cho phép, rồi thử lại.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("Không tìm thấy camera trên thiết bị này.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setError("Camera đang được ứng dụng khác sử dụng hoặc iOS chưa khởi tạo được. Đóng ứng dụng camera khác rồi thử lại.");
      } else if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
        setError("Thiết bị không hỗ trợ cấu hình camera đã chọn. Hãy đặt video về Full HD hoặc HD trong Cài đặt.");
      } else if (name === "SecurityError") {
        setError("Safari đang chặn quyền camera. Hãy mở trang bằng HTTPS và cho phép Camera trong Cài đặt iPhone.");
      } else {
        setError("Không thể mở camera (" + (name || "lỗi thiết bị") + "). Kiểm tra quyền Camera trong Cài đặt iPhone rồi thử lại.");
      }
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      showNotice("Camera chưa sẵn sàng. Thử lại sau giây lát.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (facing === "user" && studioSettings.mirror) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    const processedFrame = arReady && arCanvasRef.current?.width ? arCanvasRef.current : video;
    context.filter = processedFrame === video ? `${activePreset.filter} brightness(${1 + beauty / 650}) saturate(${1 + beauty / 500})` : "none";
    context.drawImage(processedFrame, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        showNotice("Không thể tạo ảnh. Hãy thử lại.");
        return;
      }
      stopCamera();
      setMediaBlob(blob);
      setMediaType("image");
      setMediaName(`anhthu-${Date.now()}.jpg`);
      setMediaUrl(URL.createObjectURL(blob));
      setScreen("preview");
    }, "image/jpeg", studioSettings.photo === "4k" ? 0.98 : 0.95);
  }

  async function beginVideoRecording() {
    setError("");
    try {
      if (!streamRef.current) return;
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("Trình duyệt này chưa hỗ trợ quay video. Hãy cập nhật iOS/Safari.");
        return;
      }
      const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = audio;
      void refreshDevicePermissions();
      // Record the processed AR canvas whenever face tracking is ready; use the raw camera only as a startup fallback.
      const processedCanvas = arReady ? arCanvasRef.current : null;
      processedVideoStreamRef.current = processedCanvas?.captureStream ? processedCanvas.captureStream(30) : null;
      const processedTracks = processedVideoStreamRef.current?.getVideoTracks() ?? [];
      const sourceVideoTracks = processedTracks.length ? processedTracks : streamRef.current.getVideoTracks();
      const recordingStream = new MediaStream([...sourceVideoTracks, ...audio.getAudioTracks()]);
      const candidates = ["video/mp4;codecs=h264,aac", "video/mp4", "video/webm;codecs=vp8,opus", "video/webm"];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const targetBitrate = studioSettings.video === "4k" ? 20_000_000 : studioSettings.video === "720" ? 6_000_000 : 12_000_000;
      const recorderOptions: MediaRecorderOptions = { videoBitsPerSecond: targetBitrate, audioBitsPerSecond: 192_000, ...(mimeType ? { mimeType } : {}) };
      const recorder = new MediaRecorder(recordingStream, recorderOptions);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "video/mp4";
        const blob = new Blob(chunksRef.current, { type });
        audioStreamRef.current?.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        processedVideoStreamRef.current?.getTracks().forEach((track) => track.stop());
        processedVideoStreamRef.current = null;
        setMediaBlob(blob);
        setMediaType("video");
        setMediaName(`anhthu-${Date.now()}.${type.includes("mp4") ? "mp4" : "webm"}`);
        setMediaUrl(URL.createObjectURL(blob));
        stopCamera();
        setScreen("preview");
        setRecording(false);
        if (shortVideoTimerRef.current) window.clearTimeout(shortVideoTimerRef.current);
        if (recordingClockRef.current) window.clearInterval(recordingClockRef.current);
        shortVideoTimerRef.current = null; recordingClockRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setRecordingSeconds(0);
      if (recordingClockRef.current) window.clearInterval(recordingClockRef.current);
      const startedAt = Date.now();
      recordingClockRef.current = window.setInterval(() => setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000)), 500);
      if (shortVideoMode) shortVideoTimerRef.current = window.setTimeout(() => stopRecording(), videoLimitSeconds * 1000);
      setMicGuide(false);
    } catch (cause) {
      const name = cause instanceof DOMException ? cause.name : "";
      setError(name === "NotAllowedError"
        ? "Bạn chưa cấp quyền microphone. Có thể bật quyền trong Cài đặt iPhone → Safari → Microphone."
        : "Không thể bắt đầu quay video. Hãy kiểm tra microphone và thử lại.");
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      setMicGuide(false);
    }
  }

  function stopRecording() {
    if (shortVideoTimerRef.current) window.clearTimeout(shortVideoTimerRef.current);
    shortVideoTimerRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  }

  function selectLibraryFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      showNotice("Chỉ hỗ trợ ảnh hoặc video.");
      return;
    }
    stopCamera();
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaBlob(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    setMediaName(file.name || "thu365-media");
    setMediaUrl(URL.createObjectURL(file));
    setScreen("preview");
  }

  async function renderEditedPhoto(): Promise<Blob | null> {
    if (!mediaBlob || mediaType !== "image") return mediaBlob;
    const bitmap = await createImageBitmap(mediaBlob);
    const sourceW = bitmap.width, sourceH = bitmap.height;
    let targetW = sourceW, targetH = sourceH;
    if (editSettings.aspect !== "original") {
      const ratio = editSettings.aspect === "square" ? 1 : editSettings.aspect === "portrait" ? 4/5 : 16/9;
      if (sourceW / sourceH > ratio) targetW = sourceH * ratio; else targetH = sourceW / ratio;
    }
    const canvas = document.createElement("canvas");
    const swap = Math.abs(editSettings.rotation) % 180 === 90;
    canvas.width = Math.round(swap ? targetH : targetW);
    canvas.height = Math.round(swap ? targetW : targetH);
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return null; }
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(editSettings.rotation * Math.PI / 180);
    ctx.filter = editFilter + ` sepia(${Math.max(0,editSettings.warmth)/500}) opacity(1)`;
    const cropX = (sourceW-targetW)/2, cropY = (sourceH-targetH)/2;
    ctx.drawImage(bitmap,cropX,cropY,targetW,targetH,-targetW/2,-targetH/2,targetW,targetH);
    ctx.restore();
    if (editSettings.tone !== "none") {
      ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = .22;
      ctx.fillStyle = editSettings.tone; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore();
    }
    if (editSettings.fade > 0) {
      ctx.save(); ctx.globalAlpha = editSettings.fade/350; ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore();
    }
    if (editSettings.vignette > 0) {
      const radius = Math.max(canvas.width,canvas.height)*.72;
      const gradient = ctx.createRadialGradient(canvas.width/2,canvas.height/2,radius*.25,canvas.width/2,canvas.height/2,radius);
      gradient.addColorStop(0,"rgba(0,0,0,0)"); gradient.addColorStop(1,`rgba(0,0,0,${editSettings.vignette/120})`);
      ctx.fillStyle=gradient; ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    bitmap.close();
    return await new Promise(resolve => canvas.toBlob(resolve,"image/jpeg",.94));
  }

  async function saveOrShare() {
    if (!mediaBlob) return;
    setExportingEdit(true);
    let outputBlob = mediaBlob;
    if (mediaType === "image") {
      try { outputBlob = await renderEditedPhoto() || mediaBlob; }
      catch { showNotice("Không thể xuất ảnh đã chỉnh sửa. Thử lại."); setExportingEdit(false); return; }
    }
    const file = new File([outputBlob], mediaName.replace(/\\.[^.]+$/, mediaType === "image" ? ".jpg" : ".mp4"), { type: outputBlob.type || (mediaType === "image" ? "image/jpeg" : "video/mp4") });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "AnhThu Beauty" });
        setExportingEdit(false);
        return;
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") { setExportingEdit(false); return; }
    }
    const outputUrl = URL.createObjectURL(outputBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = outputUrl;
    downloadLink.download = file.name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(outputUrl), 30000);
    showNotice("Đã xuất tệp đã chỉnh sửa. Kiểm tra Ảnh hoặc Tệp trên iPhone.");
    setExportingEdit(false);
  }

  function returnHome() {
    if (recording && recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      setRecording(false);
    }
    stopCamera();
    setError("");
    setScreen("home");
  }

  return (
    <main className="thu365-web">
      <input ref={fileRef} className="tw-hidden" type="file" accept="image/*,video/*" onChange={(event) => { selectLibraryFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      {screen === "home" && (
        <section className="tw-home">
          <header className="tw-header tw-home-header">
            <button className="tw-hamburger" onClick={() => setHomeMenuOpen(true)} aria-label="Mở menu điều hướng"><Menu size={24}/></button>
            <div className="tw-brand"><img src="/thu365/app-icon.svg" alt="" />Anh<span>Thu</span></div>
            <div className="tw-private"><LockKeyhole size={12} /> RIÊNG TƯ</div>
          </header>
          {homeMenuOpen && <div className="tw-nav-layer">
            <button className="tw-nav-scrim" onClick={() => setHomeMenuOpen(false)} aria-label="Đóng menu"/>
            <nav className="tw-nav-drawer" aria-label="Điều hướng chính">
              <div className="tw-nav-heading"><div className="tw-brand"><img src="/thu365/app-icon.svg" alt=""/>Anh<span>Thu</span></div><button onClick={() => setHomeMenuOpen(false)} aria-label="Đóng menu"><X size={22}/></button></div>
              <div className="tw-nav-caption">KHÔNG GIAN SÁNG TẠO</div>
              <button className="tw-nav-feature" onClick={() => { setHomeMenuOpen(false); setShortVideoMode(false); setMode("image"); setError(""); setScreen("permission"); }}><Camera/><span><b>Camera làm đẹp</b><small>Chụp ảnh · quay video · AR</small></span><ChevronRight/></button>
              <div className="tw-nav-grid">
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("album");setScreen("module");}}><ImageIcon/><b>Album</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("editor");setScreen("module");}}><Aperture/><b>Chỉnh sửa ảnh</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("sharp");setScreen("module");}}><Zap/><b>Làm nét AI</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("beauty");setScreen("module");}}><Sparkles/><b>AI làm đẹp</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("effects");setScreen("module");}}><ScanFace/><b>Hiệu ứng</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("short-video");setShortVideoMode(true);setMode("video");setError("");setScreen("permission");}}><Clapperboard/><b>Video ngắn</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("settings");setScreen("module");}}><Settings/><b>Cài đặt</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("profile");setScreen("module");}}><UserRound/><b>Hồ sơ</b></button>
              </div>
              <div className="tw-nav-bottom"><ShieldCheck size={15}/> Ảnh và video được xử lý riêng tư trên thiết bị.</div>
            </nav>
          </div>}
          <div className="tw-hero tw-home-hero">
            <div className="tw-hero-orbit" />
            <div className="tw-hero-copy">
              <span className="tw-eyebrow"><Sparkles size={13}/> BEAUTY CAMERA STUDIO</span>
              <h1>Chân dung đẹp<br/><em>theo phong cách bạn.</em></h1>
              <p>AI phân tích khuôn mặt, gợi ý makeup và ánh sáng phù hợp với ảnh mẫu.</p>
              <button className="tw-home-primary" onClick={() => {setShortVideoMode(false);setMode("image");setError("");setScreen("permission");}}><Camera size={17}/> Mở camera làm đẹp</button>
            </div>
            <div className="tw-hero-mark"><RobotFaceScan/></div>
          </div>
          <section className="tw-home-ai">
            <div className="tw-home-section-title"><div><span>ANHTHU AI</span><h2>Trợ lý làm đẹp thông minh</h2></div><small className="tw-live-scan-badge">LIVE SCAN</small></div>
            <div className="tw-ai-assistant-card"><RobotFaceScan/><div><b>Robot AI đang chờ bạn</b><p>Đưa khuôn mặt vào khung. AI sẽ nhận diện điểm mắt, mũi, môi và phân tích ánh sáng trước khi đề xuất hiệu ứng.</p><small><span/> FACE TRACKING · LANDMARK · BEAUTY MATCH</small></div></div>
          </section>
          <section className="tw-home-references">
            <div className="tw-home-section-title"><div><span>BEAUTY REFERENCE</span><h2>Chọn phong cách mẫu</h2></div><small>4 LOOKS</small></div>
            <div className="tw-home-reference-grid">
              {BEAUTY_REFERENCES.map((reference) => <button key={reference.id} className={activeHomeReference===reference.id?"is-selected":""} onClick={() => setActiveHomeReference(reference.id)}>
                <img src={reference.image} alt={reference.name} loading="lazy"/>
                <span className="tw-ref-overlay"><b>{reference.name}</b><small>{reference.subtitle}</small></span>
                {activeHomeReference===reference.id&&<span className="tw-ref-selected"><Check size={13}/> Đang chọn</span>}
              </button>)}
            </div>
            <div className="tw-home-reference-detail"><div><b>{BEAUTY_REFERENCES.find(item=>item.id===activeHomeReference)?.name}</b><small>{BEAUTY_REFERENCES.find(item=>item.id===activeHomeReference)?.description}</small></div><button onClick={() => {const ref=BEAUTY_REFERENCES.find(item=>item.id===activeHomeReference);if(ref){setArSettings(ref.settings);setBeauty(ref.beauty);}setShortVideoMode(false);setMode("image");setError("");setScreen("permission");}}>Thử phong cách <ChevronRight size={15}/></button></div>
          </section>
          <section className="tw-home-features">
            <div className="tw-home-section-title"><div><span>KHÁM PHÁ</span><h2>Công cụ nổi bật</h2></div></div>
            <div className="tw-home-feature-grid">
              <article><Sparkles/><b>AI Beauty</b><small>Làm mịn da, makeup và tinh chỉnh khuôn mặt.</small></article>
              <article><ScanFace/><b>Face Tracking</b><small>Theo dõi landmark khi chụp và quay video.</small></article>
              <article><Aperture/><b>Photo Studio</b><small>Màu phim, ánh sáng, phông nền và chân dung.</small></article>
              <article><Clapperboard/><b>Video Effects</b><small>Hiệu ứng realtime cho video dọc.</small></article>
            </div>
          </section>
          <section className="tw-home-skills">
            <div className="tw-home-section-title"><div><span>BEAUTY SKILLS</span><h2>Bộ kỹ năng làm đẹp</h2></div><small>10 CÔNG CỤ</small></div>
            <p className="tw-skills-intro">Chọn đúng công cụ để mở camera làm đẹp realtime hoặc không gian chỉnh sửa ảnh.</p>
            <div className="tw-skills-grid">
              <button onClick={() => {setBeautyCategory("face");setActiveBeautyTool("smooth");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><Sparkles/></span><b>Làm mịn da</b><small>Da mềm, giữ texture</small></button>
              <button onClick={() => {setBeautyCategory("makeup");setActiveBeautyTool("lipstick");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><Aperture/></span><b>Trang điểm AI</b><small>Son, má hồng, eyeliner</small></button>
              <button onClick={() => {setBeautyCategory("face");setActiveBeautyTool("faceSlim");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><ScanFace/></span><b>Tạo khối gương mặt</b><small>Đường nét tự nhiên</small></button>
              <button onClick={() => {setBeautyCategory("makeup");setActiveBeautyTool("hairTint");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><Sparkles/></span><b>Màu tóc</b><small>Thử tông màu tóc</small></button>
              <button onClick={() => {setBeautyCategory("face");setActiveBeautyTool("light");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><Zap/></span><b>Ánh sáng chân dung</b><small>Soft, studio, glow</small></button>
              <button onClick={() => {setActiveModule("editor");setScreen("module");}}><span><Aperture/></span><b>Màu phim & nền</b><small>Color grade, phông nền</small></button>
              <button onClick={() => {setActiveModule("sharp");setScreen("module");}}><span><ScanFace/></span><b>Phục hồi ảnh</b><small>Tăng nét và chi tiết</small></button>
              <button onClick={() => {setActiveModule("effects");setScreen("module");}}><span><Sparkles/></span><b>AR & sticker</b><small>Phụ kiện và hiệu ứng</small></button>
              <button onClick={() => {setActiveModule("short-video");setShortVideoMode(true);setMode("video");setScreen("module");}}><span><Video/></span><b>Video beauty</b><small>Quay clip dọc realtime</small></button>
              <button onClick={() => {setActiveModule("album");setScreen("module");}}><span><ImageIcon/></span><b>Thư viện riêng</b><small>Ảnh và video của bạn</small></button>
            </div>
          </section>
          <button className="tw-action-card" onClick={() => fileRef.current?.click()}><span className="tw-action-icon"><ImageIcon size={22}/></span><span className="tw-action-copy"><b>Chọn nhanh ảnh hoặc video</b><small>Mở bộ chọn ảnh an toàn của iOS / Android</small></span><ChevronRight size={18}/></button>
          <div className="tw-privacy-note"><ShieldCheck size={15}/><span><b>Riêng tư mặc định.</b> Ảnh/video chỉ ở trong trình duyệt, không tải lên máy chủ.</span></div>
          <footer className="tw-footer">ANHTHU BEAUTY · BẢN DÙNG THỬ PWA</footer>
        </section>
      )}
      {screen === "module" && (
        <section className="tw-module-screen">
          <header className="tw-preview-header">
            <button className="tw-back" onClick={() => setScreen("home")} aria-label="Quay lại"><ArrowLeft size={19}/></button>
            <div><b>{activeModule === "settings" ? "Cài đặt ứng dụng" : activeModule === "profile" ? "Hồ sơ của tôi" : activeModule === "album" ? "Album của tôi" : activeModule === "editor" ? "Chỉnh sửa ảnh" : activeModule === "sharp" ? "Làm nét ảnh AI" : activeModule === "beauty" ? "AI làm đẹp" : activeModule === "short-video" ? "Video ngắn" : "Hiệu ứng quốc tế"}</b><small>ANHTHU · KHÔNG GIAN RIÊNG TƯ</small></div>
          </header>
          {activeModule === "settings" ? (
            <div className="tw-settings-panel">
              <div className="tw-settings-intro"><span className="tw-module-icon"><Settings size={25}/></span><h2>Chất lượng hình ảnh</h2><p>Ưu tiên độ phân giải cao và chuyển động mượt. Thiết bị có thể tự hạ cấu hình khi không hỗ trợ.</p></div>
              <label>Độ phân giải ảnh<select value={studioSettings.photo} onChange={(e) => updateStudioSettings({photo:e.target.value})}><option value="1080">Full HD · 1080p</option><option value="4k">Tối đa thiết bị · 4K nếu hỗ trợ</option></select></label>
              <label>Độ phân giải video<select value={studioSettings.video} onChange={(e) => updateStudioSettings({video:e.target.value})}><option value="720">HD · 720p</option><option value="1080">Full HD · 1080p (khuyên dùng)</option><option value="4k">4K · nếu camera hỗ trợ</option></select></label>
              <label>Tốc độ khung hình<select value={studioSettings.fps} onChange={(e) => updateStudioSettings({fps:e.target.value})}><option value="30">30 FPS · tiết kiệm dung lượng</option><option value="60">60 FPS · chuyển động mượt</option></select></label>
              <label className="tw-setting-toggle"><input type="checkbox" checked={studioSettings.mirror} onChange={(e) => updateStudioSettings({mirror:e.target.checked})}/> Lật gương camera trước khi chụp</label>
              <div className="tw-device-permissions">
                <div className="tw-settings-intro"><span className="tw-module-icon"><ShieldCheck size={24}/></span><h2>Quyền thiết bị</h2><p>Ứng dụng chỉ xin quyền đúng lúc bạn dùng tính năng. iOS/Safari luôn yêu cầu bạn xác nhận.</p></div>
                <div className="tw-permission-status"><Camera size={17}/><div><b>Camera</b><small>{devicePermissions.camera}</small></div><button onClick={() => void startCamera()}>Thử mở</button></div>
                <div className="tw-permission-status"><Mic size={17}/><div><b>Microphone</b><small>{devicePermissions.microphone}</small></div><button onClick={() => { setMode("video"); setShortVideoMode(false); setScreen("permission"); }}>Quay thử</button></div>
                <div className="tw-permission-status"><ImageIcon size={17}/><div><b>Ảnh & video</b><small>Chỉ truy cập mục bạn tự chọn trong bộ chọn của iPhone.</small></div><button onClick={() => fileRef.current?.click()}>Chọn tệp</button></div>
                <button className="tw-secondary tw-refresh-permissions" onClick={() => void refreshDevicePermissions()}>Làm mới trạng thái quyền</button>
                <p className="tw-permission-help">Nếu đã từ chối quyền: mở Cài đặt iPhone → Safari → Camera / Microphone, hoặc mở Cài đặt của website trong Safari để bật lại. Không có ứng dụng web nào được tự bật quyền thay bạn.</p>
              </div>
              {error && <p className="tw-permission-help" role="alert">{error}</p>}
              <div className="tw-ai-diagnostics">
                <div className="tw-ai-diagnostics-head"><div><h2>Chẩn đoán AI Beauty</h2><p>Kiểm tra kết nối model Face Landmarker và Skin Segmentation mà không tải toàn bộ model.</p></div><Sparkles size={21}/></div>
                <button className="tw-secondary tw-ai-check" disabled={checkingAI} onClick={() => void runAIDiagnostics()}>{checkingAI ? "Đang kiểm tra kết nối…" : "Kiểm tra mạng & AI Model"}</button>
                {aiDiagnostics ? <div className="tw-ai-check-list">
                  <div><span>Internet</span><b>{aiDiagnostics.network}</b></div>
                  <div><span>Bảo mật trình duyệt</span><b>{aiDiagnostics.secure}</b></div>
                  <div><span>Camera API</span><b>{aiDiagnostics.camera}</b></div>
                  <div><span>WebAssembly</span><b>{aiDiagnostics.runtime}</b></div>
                  <div><span>Face Landmarker model</span><b>{aiDiagnostics.faceModel}</b></div>
                  <div><span>Skin Segmentation model</span><b>{aiDiagnostics.skinModel}</b></div>
                </div> : <p className="tw-permission-help">Chưa chạy kiểm tra. Khi Face AI không tải được, hãy kiểm tra mạng và hai model ở đây.</p>}
                <button className="tw-secondary tw-ai-retry" onClick={() => { if (streamRef.current) { setAiRetry((value) => value + 1); setScreen("camera"); } else { void startCamera(); } }}>Mở camera & tải lại AI</button>
                <small className="tw-ai-note">Kiểm tra HEAD chỉ xác minh khả năng kết nối máy chủ; không chứng minh model đã tải hoặc nhận diện khuôn mặt thành công. Model thật được khởi tạo khi mở camera.</small>
              </div>
              <div className="tw-device-install"><h2>Cài đặt ứng dụng</h2><p>{isStandalone ? "AnhThu đang chạy từ màn hình chính." : "Để mở toàn màn hình như ứng dụng, hãy thêm AnhThu vào Màn hình chính."}</p><ol><li>Mở trang AnhThu bằng Safari.</li><li>Chạm nút Chia sẻ.</li><li>Chọn “Thêm vào Màn hình chính”, sau đó xác nhận.</li></ol><small>Icon THU365 sẽ được dùng khi iOS cập nhật dữ liệu PWA. Nếu icon cũ còn hiển thị, xóa shortcut cũ và thêm lại sau khi tải lại trang.</small></div>
              <div className="tw-quality-note"><b>Thiết lập quay hiện tại</b><span>Video bitrate mục tiêu: {studioSettings.video === "4k" ? "20 Mbps" : studioSettings.video === "720" ? "6 Mbps" : "12 Mbps"}</span><small>FPS và độ phân giải thực tế phụ thuộc camera, iOS, Safari và nhiệt độ thiết bị. Bitrate cao không thể khôi phục chi tiết đã mất do thiếu sáng hoặc lấy nét sai.</small></div>
            </div>
          ) : activeModule === "profile" ? (
            <div className="tw-profile-panel"><div className="tw-profile-avatar">{(profileName.trim()[0] || "A").toUpperCase()}</div><h2>Hồ sơ cá nhân</h2><p>Thông tin hồ sơ được lưu cục bộ trên thiết bị này.</p><label>Tên hiển thị<input value={profileName} maxLength={32} onChange={(e) => {setProfileName(e.target.value);localStorage.setItem("anhthu-profile-name",e.target.value);}} placeholder="Nhập tên hiển thị"/></label><div className="tw-quality-note"><b>Hồ sơ trên thiết bị</b><span>Chế độ: Khách · không cần đăng nhập</span><small>AnhThu hiện chưa có tài khoản đám mây hoặc đồng bộ hồ sơ giữa nhiều thiết bị.</small></div></div>
          ) : (
            <>
              <div className="tw-module-hero"><span className="tw-module-icon"><Sparkles size={28}/></span><h2>{activeModule === "album" ? "Thư viện trên thiết bị" : activeModule === "editor" ? "Công cụ chỉnh sửa ảnh" : activeModule === "sharp" ? "Khôi phục chi tiết hình ảnh" : activeModule === "beauty" ? "Làm đẹp thông minh" : activeModule === "short-video" ? "Tạo video dọc 9:16" : "Beauty effects studio"}</h2><p>{activeModule === "album" ? "Chọn ảnh hoặc video từ thư viện iPhone. AnhThu chỉ truy cập nội dung bạn chủ động chọn." : activeModule === "editor" ? "Chọn ảnh để mở quy trình chỉnh sửa. Bản hiện tại đang hoàn thiện bộ công cụ chỉnh sửa nâng cao." : activeModule === "sharp" ? "Chọn ảnh cần xử lý. AI tăng nét chuyên sâu và phục hồi chi tiết sẽ được bổ sung sau khi tích hợp mô hình chuyên dụng." : activeModule === "beauty" ? "Dùng camera để nhận diện khuôn mặt, theo dõi vùng da và áp dụng các thiết lập làm đẹp tự động hoặc thủ công." : activeModule === "short-video" ? "Quay video dọc có hiệu ứng làm đẹp realtime. Giới hạn mỗi clip 60 giây; xem lại và lưu/chia sẻ sau khi quay." : "Bộ sưu tập phong cách lấy cảm hứng từ xu hướng beauty Trung Quốc và Hàn Quốc; API thương mại cần quyền truy cập từ nhà cung cấp."}</p></div>
              {activeModule === "beauty" || activeModule === "effects" || activeModule === "short-video" ? <button className="tw-primary" onClick={() => { setError(""); if(activeModule === "short-video"){setShortVideoMode(true);setMode("video");} void startCamera(); }}>{activeModule === "short-video" ? "Mở studio video ngắn" : "Mở camera studio"} <ChevronRight size={17}/></button> : <button className="tw-primary" onClick={() => fileRef.current?.click()}><ImageIcon size={17}/> {activeModule === "album" ? "Mở Album trên điện thoại" : "Chọn ảnh từ thiết bị"}</button>}
              <div className="tw-module-foot"><ShieldCheck size={15}/> iPhone chỉ cấp quyền với ảnh bạn chọn. Ứng dụng không được phép tự đọc toàn bộ bộ nhớ.</div>
            </>
          )}
          <button className="tw-secondary" onClick={() => setScreen("home")}>Về trang chủ</button>
        </section>
      )}

      {screen === "permission" && (
        <section className="tw-permission">
          <button className="tw-back" onClick={() => setScreen("home")} aria-label="Quay lại"><ArrowLeft size={19} /></button>
          <div className="tw-eyebrow"><ShieldCheck size={13} /> QUYỀN TRUY CẬP THIẾT BỊ</div>
          <h1>Camera chỉ bật<br /><em>khi bạn sẵn sàng.</em></h1>
          <p>AnhThu cần camera để hiển thị hình ảnh trực tiếp và chụp ảnh. Trình duyệt sẽ hỏi quyền sau khi bạn tiếp tục.</p>
          <div className="tw-permission-item"><Camera size={19} /><div><b>Camera</b><small>Cần thiết để chụp ảnh và quay video.</small></div><span>BẮT BUỘC</span></div>
          <div className="tw-permission-item"><Mic size={19} /><div><b>Microphone</b><small>Chỉ hỏi khi bạn chọn quay video có tiếng.</small></div><span>TÙY CHỌN</span></div>
          <div className="tw-permission-item"><ImageIcon size={19} /><div><b>Thư viện ảnh</b><small>Chỉ mở khi bạn tự chọn ảnh/video.</small></div><span>TÙY CHỌN</span></div>
          <div className="tw-permission-actions">
            <button className="tw-primary" onClick={() => void startCamera()}>Tiếp tục và bật camera <ChevronRight size={17} /></button>
            <button className="tw-secondary" onClick={() => setScreen("home")}>Để sau</button>
          </div>
        </section>
      )}

      {screen === "camera" && (
        <section className="tw-camera-screen">
          <div className="tw-camera-view">
            <video ref={videoRef} autoPlay muted playsInline className="tw-live-video" style={{ opacity: arReady ? 0 : 1, transform: facing === "user" && studioSettings.mirror ? "scaleX(-1)" : "none" }} /><canvas ref={arCanvasRef} className="tw-ar-canvas" style={{ opacity: arReady ? 1 : 0, transform: facing === "user" && studioSettings.mirror ? "scaleX(-1)" : "none" }} />
            <div className="tw-live-shade" />
            <header className="tw-camera-header">
              <button className="tw-glass" onClick={returnHome} aria-label="Đóng camera"><X size={21} /></button>
              <div className="tw-camera-title-pill"><Sparkles size={14} /> AnhThu Beauty Studio</div>
              <button className="tw-glass" onClick={() => void startCamera(facing === "user" ? "environment" : "user")} aria-label="Đổi camera"><FlipHorizontal2 size={20} /></button>
            </header>
            <aside className="tw-camera-rail" aria-label="Công cụ camera">
              <button type="button" onClick={() => { if (!beautyPanelOpen) { setBeautyPanelOpen(true); setBeautyPanel("manual"); } else { setBeautyPanelOpen(false); } }} aria-expanded={beautyPanelOpen} aria-label={beautyPanelOpen ? "Thu gọn bảng làm đẹp" : "Mở bảng làm đẹp"}><Sparkles size={19}/><small>Beauty</small></button>
              <button type="button" onClick={() => { setBeautyPanel("manual"); showNotice("Điều chỉnh ánh sáng trong bảng làm đẹp"); }} aria-label="Điều chỉnh ánh sáng"><Zap size={19}/><small>Ánh sáng</small></button>
              <button type="button" onClick={() => { setMode("video"); setShortVideoMode(true); setVideoLimitSeconds(15); showNotice("Đã chọn video 15 giây"); }} aria-label="Video nhanh"><Clapperboard size={19}/><small>15s</small></button>
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Mở thư viện"><ImageIcon size={19}/><small>Thư viện</small></button>
            </aside>
            <div className="tw-live-label"><span /> {trackingStatus.toUpperCase()} · {cameraQuality}</div>
            {trackingStatus.includes("AI chưa tải") && <button type="button" className="tw-ai-retry" onClick={() => { setTrackingStatus("Đang thử tải lại AI"); setAiRetry((value) => value + 1); }}>Thử tải lại AI</button>}
            <div className="tw-camera-bottom">
              {beautyPanelOpen && <div className="tw-filter-row tw-filter-row-expanded">
                  <div className="tw-beauty-panel-header"><div><b>BEAUTY STUDIO</b><small>Điều chỉnh hiệu ứng trực tiếp</small></div><button type="button" onClick={() => setBeautyPanelOpen(false)} aria-label="Đóng bảng làm đẹp"><X size={19}/><span>Đóng</span></button></div>
                <div className="tw-beauty-tabs"><button type="button" className={beautyPanel === "auto" ? "is-active" : ""} onClick={() => setBeautyPanel("auto")}>✨ TỰ ĐỘNG</button><button type="button" className={beautyPanel === "manual" ? "is-active" : ""} onClick={() => setBeautyPanel("manual")}>🎚 THỦ CÔNG</button><b>{beauty}%</b></div>
                {beautyPanel === "auto" ? <div className="tw-auto-beauty"><p>Chọn ảnh tham chiếu · AI áp dụng màu sắc và makeup lên khuôn mặt đang theo dõi</p><div className="tw-reference-head"><b>✨ THƯ VIỆN BEAUTY REFERENCE</b><span>{BEAUTY_REFERENCES.length} mẫu</span></div><div className="tw-reference-grid">{BEAUTY_REFERENCES.map((reference)=><button type="button" key={reference.id} className={selectedReference===reference.id?"tw-reference-card selected":"tw-reference-card"} onClick={()=>applyReferenceLook(reference)} aria-pressed={selectedReference===reference.id}><img src={reference.image} alt={reference.name} loading="lazy" referrerPolicy="no-referrer"/><span className="tw-reference-tag">{reference.gender}</span><b>{reference.name}</b><small>{reference.subtitle}</small></button>)}</div><div className="tw-reference-analysis"><span className="tw-ai-pulse"/> <span>{faceInsight}</span></div><div className="tw-reference-selected"><b>Đang áp dụng: {BEAUTY_REFERENCES.find(item=>item.id===selectedReference)?.name || "Natural"}</b><small>{BEAUTY_REFERENCES.find(item=>item.id===selectedReference)?.description || "Phong cách tự nhiên"}</small></div><div className="tw-auto-profiles"><button onClick={() => applyAutoBeauty("natural")} className={autoProfile === "natural" ? "is-active" : ""}>Natural</button><button onClick={() => applyAutoBeauty("cloud")} className={autoProfile === "cloud" ? "is-active" : ""}>Cloud Skin</button><button onClick={() => applyAutoBeauty("softglam")} className={autoProfile === "softglam" ? "is-active" : ""}>Soft Glam</button><button onClick={() => applyAutoBeauty("peach")} className={autoProfile === "peach" ? "is-active" : ""}>Peach Glow</button></div><button className="tw-auto-apply" onClick={() => applyAutoBeauty()}>✨ Auto setup làm đẹp</button></div> : <div className="tw-manual-beauty">
                  <div className="tw-manual-head"><span>ĐIỀU CHỈNH CHI TIẾT</span><button type="button" onClick={() => {setBeauty(0);setArSettings(v => ({...v,smooth:0,faceSlim:0,eyeEnlarge:0,lipstick:"none",blush:"none",lipstickStrength:0,blushStrength:0,eyeliner:false,eyelash:false,highlight:false,hairTint:"none",sticker:"none",light:"none"}));}}>↺ Đặt lại</button></div>
                  <div className="tw-beauty-category-tabs"><button type="button" className={beautyCategory==="face"?"is-active":""} onClick={()=>{setBeautyCategory("face");setActiveBeautyTool("smooth");}}>Khuôn mặt</button><button type="button" className={beautyCategory==="makeup"?"is-active":""} onClick={()=>{setBeautyCategory("makeup");setActiveBeautyTool("lipstick");}}>Trang điểm</button></div>
                  <div className="tw-beauty-tool-grid">
                    {(beautyCategory==="face" ? [{id:"smooth",label:"Làm mịn",icon:"✧"},{id:"slim",label:"Tạo khối",icon:"◉"},{id:"eyes",label:"Mắt to",icon:"◎"},{id:"light",label:"Ánh sáng",icon:"☼"}] : [{id:"lipstick",label:"Son môi",icon:"◒"},{id:"blush",label:"Má hồng",icon:"◉"},{id:"eyeliner",label:"Kẻ mắt",icon:"⌁"},{id:"eyelash",label:"Mi cong",icon:"〰"},{id:"highlight",label:"Highlight",icon:"✧"}]).map(tool=><button type="button" key={tool.id} className={activeBeautyTool===tool.id?"is-active":""} onClick={()=>{setActiveBeautyTool(tool.id);if(tool.id==="eyeliner")setArSettings(v=>({...v,eyeliner:!v.eyeliner}));if(tool.id==="eyelash")setArSettings(v=>({...v,eyelash:!v.eyelash}));if(tool.id==="highlight")setArSettings(v=>({...v,highlight:!v.highlight}));if(tool.id==="lipstick"&&arSettings.lipstick==="none")setArSettings(v=>({...v,lipstick:"rgba(190,48,83,.9)",lipstickStrength:70}));if(tool.id==="blush"&&arSettings.blush==="none")setArSettings(v=>({...v,blush:"rgba(238,105,135,.8)",blushStrength:55}));}}><span>{tool.icon}</span><small>{tool.label}</small></button>)}
                  </div>
                  <div className="tw-beauty-slider-head"><span>{({smooth:"Làm mịn da",slim:"Tạo khối gương mặt",eyes:"Kích cỡ mắt",light:"Ánh sáng & màu",lipstick:"Cường độ son môi",blush:"Cường độ má hồng",eyeliner:"Cường độ eyeliner",eyelash:"Cường độ mi cong",highlight:"Cường độ highlight"} as Record<string,string>)[activeBeautyTool]||"Cường độ hiệu ứng"}</span><b>{activeBeautyTool==="smooth"?arSettings.smooth:activeBeautyTool==="slim"?(arSettings.faceSlim??0):activeBeautyTool==="eyes"?(arSettings.eyeEnlarge??0):activeBeautyTool==="lipstick"?(arSettings.lipstickStrength??70):activeBeautyTool==="blush"?(arSettings.blushStrength??55):activeBeautyTool==="eyeliner"?(arSettings.eyelinerStrength??100):activeBeautyTool==="eyelash"?(arSettings.eyelashStrength??100):activeBeautyTool==="highlight"?(arSettings.highlightStrength??100):beauty}%</b></div>
                  <input className="tw-beauty-intensity" aria-label="Cường độ hiệu ứng đang chọn" type="range" min="0" max="100" value={activeBeautyTool==="smooth"?arSettings.smooth:activeBeautyTool==="slim"?(arSettings.faceSlim??0):activeBeautyTool==="eyes"?(arSettings.eyeEnlarge??0):activeBeautyTool==="lipstick"?(arSettings.lipstickStrength??70):activeBeautyTool==="blush"?(arSettings.blushStrength??55):beauty} onChange={e=>{const value=Number(e.target.value);if(activeBeautyTool==="smooth")setArSettings(v=>({...v,smooth:value}));else if(activeBeautyTool==="slim")setArSettings(v=>({...v,faceSlim:value}));else if(activeBeautyTool==="eyes")setArSettings(v=>({...v,eyeEnlarge:value}));else if(activeBeautyTool==="lipstick")setArSettings(v=>({...v,lipstickStrength:value,lipstick:value===0?"none":v.lipstick==="none"?"rgba(190,48,83,.9)":v.lipstick}));else if(activeBeautyTool==="blush")setArSettings(v=>({...v,blushStrength:value,blush:value===0?"none":v.blush==="none"?"rgba(238,105,135,.8)":v.blush}));else if(activeBeautyTool==="eyeliner")setArSettings(v=>({...v,eyeliner:true,eyelinerStrength:value}));else if(activeBeautyTool==="eyelash")setArSettings(v=>({...v,eyelash:true,eyelashStrength:value}));else if(activeBeautyTool==="highlight")setArSettings(v=>({...v,highlight:true,highlightStrength:value}));else setBeauty(value);}}/>
                  <div className="tw-beauty-hints"><span>0 · Tắt</span><span>100 · Tối đa</span></div>
                </div>}
                <div className={`tw-ar-tools ${beautyCategory==="makeup"?"":"tw-ar-tools-muted"}`}><label>SON <select aria-label="Màu son" value={arSettings.lipstick} onChange={(e) => setArSettings(v => ({...v, lipstick:e.target.value}))}><option value="none">Tắt</option><option value="rgba(190,48,83,.9)">Đỏ cherry</option><option value="rgba(190,95,105,.9)">Hồng đất</option><option value="rgba(145,70,105,.9)">Mận</option><option value="rgba(210,70,105,.85)">Đỏ ruby</option><option value="rgba(160,85,72,.82)">Cam đất</option><option value="rgba(225,115,145,.72)">Hồng đào</option></select></label><label>MÁ HỒNG <select aria-label="Màu má hồng" value={arSettings.blush} onChange={(e) => setArSettings(v => ({...v, blush:e.target.value}))}><option value="none">Tắt</option><option value="rgba(238,105,135,.8)">Rose</option><option value="rgba(240,150,105,.8)">Peach</option><option value="rgba(205,105,145,.75)">Berry</option><option value="rgba(245,180,165,.7)">Baby Pink</option></select></label><label><input type="checkbox" checked={arSettings.eyeliner} onChange={(e) => setArSettings(v => ({...v, eyeliner:e.target.checked}))}/> Eyeliner</label><label><input type="checkbox" checked={Boolean(arSettings.eyelash)} onChange={(e) => setArSettings(v => ({...v, eyelash:e.target.checked}))}/> Mi cong</label><label><input type="checkbox" checked={Boolean(arSettings.highlight)} onChange={(e) => setArSettings(v => ({...v, highlight:e.target.checked}))}/> Highlight</label><label>TÓC <select aria-label="Màu tóc" value={arSettings.hairTint} onChange={(e) => setArSettings(v => ({...v, hairTint:e.target.value}))}><option value="none">Tự nhiên</option><option value="#8b4d2d">Nâu socola</option><option value="#c69a45">Vàng mật ong</option><option value="#7b477e">Tím khói</option><option value="#b45c72">Hồng trà</option><option value="#354d73">Xanh đen</option><option value="#a4a0a0">Bạc khói</option></select></label><label>STICKER <select aria-label="Hiệu ứng sticker" value={arSettings.sticker} onChange={(e) => setArSettings(v => ({...v, sticker:e.target.value as FaceARSettings["sticker"]}))}><option value="none">Tắt</option><option value="hearts">Trái tim</option><option value="sunglasses">Kính</option><option value="sparkles">Lấp lánh</option><option value="bunny">Tai thỏ</option><option value="cat">Mèo</option><option value="crown">Vương miện</option><option value="butterfly">Bướm</option></select></label><label>ÁNH SÁNG <select value={arSettings.light} onChange={(e) => setArSettings(v => ({...v, light:e.target.value as FaceARSettings["light"]}))}><option value="none">Tắt</option><option value="soft">Soft</option><option value="golden">Golden</option><option value="studio">Studio</option></select></label></div>
                <div className="tw-save-settings-row">
                  <button type="button" className="tw-save-settings-button" onClick={saveARPreset}>💾 Lưu cài đặt làm đẹp</button>
                  {savedPresets.length > 0 && <div className="tw-saved-presets" aria-label="Cài đặt đã lưu">{savedPresets.map((item) => <button type="button" key={item.name} onClick={() => applySavedPreset(item)}>↩ {item.name}</button>)}</div>}
                </div>
                <div className="tw-preset-strip" aria-label="Chọn hiệu ứng làm đẹp">{BEAUTY_PRESETS.map((item) => <button key={item.id} type="button" className={`tw-preset ${preset === item.id ? "is-active" : ""}`} onClick={() => setPreset(item.id)} aria-pressed={preset === item.id}><span className="tw-preset-photo"><img src={presetReferenceImage(item.id)} alt={item.name+" reference"} loading="lazy" referrerPolicy="no-referrer" style={{filter:item.filter}}/></span><small>{item.name}</small></button>)}</div>
                <input aria-label="Cường độ làm đẹp" type="range" min="0" max="100" value={beauty} onChange={(event) => setBeauty(Number(event.target.value))} />
              </div>}
              <div className="tw-capture-modes" role="group" aria-label="Chế độ chụp và quay">
                <button type="button" className={mode === "video" && videoLimitSeconds === 600 ? "is-active" : ""} onClick={() => { setMode("video"); setShortVideoMode(true); setVideoLimitSeconds(600); }}>10 phút</button>
                <button type="button" className={mode === "video" && videoLimitSeconds === 60 ? "is-active" : ""} onClick={() => { setMode("video"); setShortVideoMode(true); setVideoLimitSeconds(60); }}>60s</button>
                <button type="button" className={mode === "video" && videoLimitSeconds === 15 ? "is-active" : ""} onClick={() => { setMode("video"); setShortVideoMode(true); setVideoLimitSeconds(15); }}>15s</button>
                <button type="button" className={mode === "image" ? "is-active" : ""} onClick={() => { setMode("image"); setShortVideoMode(false); }}>ẢNH</button>
                <button type="button" className="tw-text-mode" onClick={() => showNotice("Chế độ Văn bản đang được phát triển")}>VĂN BẢN</button>
              </div>
              <div className="tw-capture-row">
                <button className="tw-side-button" onClick={() => fileRef.current?.click()}><ImageIcon size={21} /><small>Thư viện</small></button>
                <button className={`tw-shutter ${recording ? "tw-recording" : ""}`} onClick={() => mode === "image" ? capturePhoto() : recording ? stopRecording() : setMicGuide(true)} aria-label={recording ? "Dừng quay" : mode === "image" ? "Chụp ảnh" : "Bắt đầu quay"}><span /></button>
                <button className="tw-side-button" onClick={() => setMode(mode === "image" ? "video" : "image")}><Video size={21} /><small>{mode === "image" ? "Chế độ ảnh" : "Chế độ video"}</small></button>
              </div>
              <div className="tw-mode-label">{mode === "image" ? "CHỤP ẢNH" : recording ? `ĐANG QUAY · ${recordingSeconds}s${shortVideoMode ? " / " + (videoLimitSeconds === 600 ? "10 phút" : videoLimitSeconds + "s") : ""} · CHẠM ĐỂ DỪNG` : shortVideoMode ? "VIDEO · TỐI ĐA " + (videoLimitSeconds === 600 ? "10 PHÚT" : videoLimitSeconds + " GIÂY") : "QUAY VIDEO"}</div>
            </div>
          </div>
          {error && <div className="tw-error" role="alert">{error}</div>}
          {micGuide && (
            <div className="tw-modal-scrim">
              <section className="tw-modal" role="dialog" aria-modal="true" aria-labelledby="tw-mic-title">
                <button className="tw-modal-close" onClick={() => setMicGuide(false)} aria-label="Đóng"><X size={18} /></button>
                <div className="tw-modal-icon"><Mic size={22} /></div>
                <h2 id="tw-mic-title">Cho phép microphone?</h2>
                <p>Microphone chỉ được bật khi bạn quay video có âm thanh. Âm thanh không được gửi lên máy chủ.</p>
                <button className="tw-primary" onClick={() => void beginVideoRecording()}>Cho phép và bắt đầu quay</button>
                <button className="tw-secondary" onClick={() => setMicGuide(false)}>Hủy</button>
              </section>
            </div>
          )}
        </section>
      )}

      {screen === "preview" && (
        <section className="tw-preview-screen">
          <header className="tw-preview-header">
            <button className="tw-back" onClick={returnHome} aria-label="Về trang chủ"><ArrowLeft size={19} /></button>
            <div><b>Khoảnh khắc của bạn</b><small>Chỉ lưu trên thiết bị khi bạn chọn lưu</small></div>
            <button className="tw-back" onClick={() => { if (mediaUrl) URL.revokeObjectURL(mediaUrl); setMediaUrl(""); setMediaBlob(null); setScreen("home"); }} aria-label="Đóng"><X size={18} /></button>
          </header>
          <div className="tw-media-frame">
            {mediaType === "image" ? <><img src={mediaUrl} alt="Ảnh đang chỉnh sửa" style={{filter:editFilter + ` sepia(${Math.max(0,editSettings.warmth)/500})`,transform:`rotate(${editSettings.rotation}deg)`}} />{editSettings.tone !== "none" && <div aria-hidden="true" style={{position:"absolute",inset:0,background:editSettings.tone,opacity:.22,mixBlendMode:"soft-light",pointerEvents:"none"}} />}</> : <video src={mediaUrl} controls playsInline style={{filter:editFilter}} />}
          </div>
          {mediaType === "image" && <section className="tw-photo-editor" aria-label="Bộ công cụ chỉnh sửa ảnh">
            <div className="tw-editor-heading"><div><b>✨ Photo Editor</b><small>Chỉnh sửa ảnh · xem trước trực tiếp</small></div><button type="button" onClick={() => setEditSettings({brightness:100,contrast:100,saturation:100,warmth:0,hue:0,vignette:0,fade:0,rotation:0,aspect:"original",tone:"none"})}>Đặt lại</button></div>
            <nav className="tw-editor-tabs">
              <button className={editPanel==="light"?"active":""} onClick={()=>setEditPanel("light")}>Ánh sáng</button><button className={editPanel==="color"?"active":""} onClick={()=>setEditPanel("color")}>Màu sắc</button><button className={editPanel==="crop"?"active":""} onClick={()=>setEditPanel("crop")}>Cắt ảnh</button><button className={editPanel==="effects"?"active":""} onClick={()=>setEditPanel("effects")}>Hiệu ứng</button>
            </nav>
            {editPanel==="light" && <div className="tw-editor-controls">
              {([["brightness","Độ sáng",0,200],["contrast","Tương phản",0,200]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="range" min={min} max={max} value={editSettings[key]} onChange={e=>setEditSettings(v=>({...v,[key]:Number(e.target.value)}))}/><small>{editSettings[key]}%</small></label>)}
            </div>}
            {editPanel==="color" && <div className="tw-editor-controls">
              {([["saturation","Độ bão hòa",0,200],["warmth","Nhiệt độ màu",-100,100],["hue","Sắc độ",-180,180]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="range" min={min} max={max} value={editSettings[key]} onChange={e=>setEditSettings(v=>({...v,[key]:Number(e.target.value)}))}/><small>{editSettings[key]}</small></label>)}
              <div className="tw-tone-palette"><span>Tông phủ nền ảnh</span>{[["none","Tự nhiên"],["#f0b7a4","Peach"],["#d9b8e8","Lavender"],["#b7d9e8","Icy"],["#d5bd91","Vintage"],["#d99a9a","Rose"],["#a4b99b","Sage"]].map(([tone,label])=><button key={tone} className={editSettings.tone===tone?"selected":""} onClick={()=>setEditSettings(v=>({...v,tone}))} style={{background:tone==="none"?"#252124":tone}} title={label}>{tone==="none"?"×":""}</button>)}</div>
            </div>}
            {editPanel==="crop" && <div className="tw-editor-controls">
              <label>Tỷ lệ khung hình<select value={editSettings.aspect} onChange={e=>setEditSettings(v=>({...v,aspect:e.target.value}))}><option value="original">Gốc</option><option value="square">1:1 Vuông</option><option value="portrait">4:5 Chân dung</option><option value="landscape">16:9 Ngang</option></select></label>
              <div className="tw-editor-actions"><button onClick={()=>setEditSettings(v=>({...v,rotation:(v.rotation+90)%360}))}>↻ Xoay 90°</button><button onClick={()=>setEditSettings(v=>({...v,rotation:(v.rotation+270)%360}))}>↺ Xoay trái</button></div>
            </div>}
            {editPanel==="effects" && <div className="tw-editor-controls">
              {([["fade","Fade / Mờ",0,100],["vignette","Viền tối",0,100]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="range" min={min} max={max} value={editSettings[key]} onChange={e=>setEditSettings(v=>({...v,[key]:Number(e.target.value)}))}/><small>{editSettings[key]}%</small></label>)}
              <div className="tw-tone-palette"><span>Bộ lọc màu nhanh</span>{BEAUTY_PRESETS.slice(0,13).map(item=><button key={item.id} onClick={()=>{setPreset(item.id);showNotice("Đã chọn màu "+item.name);}}>{item.name}</button>)}</div>
            </div>}
          </section>}
          {mediaType === "video" && <p className="tw-local-note">Video hiện hỗ trợ xem trước bộ lọc màu; công cụ xuất chỉnh sửa ảnh chưa áp dụng lên video.</p>}
          <div className="tw-preview-actions">
            <button className="tw-primary" disabled={exportingEdit} onClick={() => void saveOrShare()}><Download size={17} /> {exportingEdit ? "Đang xuất ảnh..." : "Lưu ảnh đã chỉnh sửa"}</button>
            <button className="tw-secondary" onClick={() => { if (mediaUrl) URL.revokeObjectURL(mediaUrl); setMediaUrl(""); setMediaBlob(null); setScreen("permission"); }}>Chụp lại</button>
          </div>
          <p className="tw-local-note"><LockKeyhole size={13} /> Tệp không được tải lên. Trên iPhone, chọn Lưu hình ảnh hoặc Lưu vào Tệp trong bảng chia sẻ.</p>
        </section>
      )}

      {notice && <div className="tw-toast" role="status">{notice}</div>}
      {error && screen !== "camera" && <div className="tw-error tw-global-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Đóng thông báo"><X size={15} /></button></div>}
      <style>{`
        .thu365-web,.thu365-web *{box-sizing:border-box}.thu365-web{min-height:100dvh;background:#0a0a0b;color:#f6f0ec;font-family:Arial,sans-serif}
        .tw-home,.tw-permission,.tw-preview-screen{width:100%;max-width:520px;min-height:100dvh;margin:auto;padding:max(22px,env(safe-area-inset-top)) 22px max(25px,env(safe-area-inset-bottom));position:relative;overflow:hidden}
        .tw-header{display:flex;align-items:center;justify-content:space-between}.tw-brand{font-size:16px;font-weight:800;letter-spacing:.2em}.tw-brand span{color:#e5b6aa}
        .tw-private{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #ffffff1c;border-radius:99px;color:#cbbab4;font-size:9px;letter-spacing:.08em}
        .tw-hero{height:270px;position:relative;display:flex;align-items:center;margin:22px -22px 22px;padding:22px;overflow:hidden;background:radial-gradient(ellipse at 78% 45%,#563c37 0,transparent 45%),linear-gradient(135deg,#171313,#0a0a0b 72%)}
        .tw-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0a0a0b 0%,transparent 100%);pointer-events:none}
        .tw-hero-copy{position:relative;z-index:2}.tw-eyebrow{display:flex;align-items:center;gap:7px;color:#e5b6aa;font-size:9px;font-weight:700;letter-spacing:.18em}
        .tw-hero h1,.tw-permission h1{margin:15px 0 10px;font:500 clamp(39px,10vw,48px)/.98 Georgia,serif;letter-spacing:-.055em}.tw-hero h1 em,.tw-permission h1 em{color:#e5b6aa;font-weight:400}
        .tw-hero p,.tw-permission>p{max-width:275px;color:#b3a7a2;font-size:12px;line-height:1.6}
        .tw-hero-mark{position:absolute;right:20px;bottom:18px;color:#e5b6aa44;transform:rotate(-15deg)}
        .tw-hero-orbit{position:absolute;width:240px;height:240px;right:-55px;top:15px;border:1px solid #e5b6aa22;border-radius:50%}
        .tw-section-head{display:flex;align-items:center;justify-content:space-between;margin:7px 0 12px}.tw-section-head strong{font-size:13px}.tw-section-head span{color:#77716f;font-size:8px;letter-spacing:.1em}
        .tw-action-card{width:100%;display:flex;align-items:center;gap:13px;padding:15px 14px;margin:9px 0;border:1px solid #ffffff16;border-radius:16px;background:#151313;color:#f6f0ec;text-align:left}
        .tw-camera-card{border-color:#e5b6aa55;background:linear-gradient(110deg,#211918,#151313)}
        .tw-action-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;color:#e5b6aa;background:#e5b6aa16}
        .tw-action-copy{display:flex;flex:1;flex-direction:column;gap:5px}.tw-action-copy b{font-size:13px}.tw-action-copy small{color:#aaa09c;font-size:10px}
        .tw-action-card>svg:last-child{color:#c6a49b}.tw-privacy-note{display:flex;gap:9px;margin-top:22px;padding:13px;border:1px solid #ffffff12;border-radius:13px;color:#aaa09c;font-size:10px;line-height:1.5}
        .tw-privacy-note svg{flex:0 0 auto;color:#e5b6aa}.tw-privacy-note b{color:#e9d9d3}.tw-footer{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));left:22px;color:#625b58;font-size:8px;letter-spacing:.14em}
        .tw-hidden{display:none}.tw-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0 13px}.tw-module-card{min-height:126px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:15px;border:1px solid #ffffff16;border-radius:16px;background:#151313;color:#f6f0ec;text-align:left}.tw-module-card b{font-size:12px}.tw-module-card small{color:#aaa09c;font-size:9px;line-height:1.4}.tw-module-feature{border-color:#e5b6aa66;background:linear-gradient(145deg,#2a1d1b,#151313)}.tw-module-icon{width:39px;height:39px;display:grid;place-items:center;border-radius:12px;background:#e5b6aa18;color:#e5b6aa}.tw-module-screen{width:100%;max-width:520px;min-height:100dvh;margin:auto;padding:max(22px,env(safe-area-inset-top)) 22px max(25px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:18px}.tw-module-hero{flex:1;min-height:280px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:24px;border:1px solid #ffffff16;border-radius:20px;background:radial-gradient(ellipse at 80% 20%,#563c37 0,transparent 48%),#151313}.tw-module-hero h2{margin:22px 0 8px;font:500 30px/1.08 Georgia,serif}.tw-module-hero p{color:#b3a7a2;font-size:12px;line-height:1.7}.tw-module-foot{display:flex;gap:9px;color:#aaa09c;font-size:10px;line-height:1.5}.tw-module-foot svg{flex:0 0 auto;color:#e5b6aa}.tw-brand{display:flex;align-items:center;gap:8px}.tw-brand img{width:29px;height:29px;border-radius:9px;object-fit:cover;border:1px solid #ffffff25}
        .tw-ai-diagnostics{margin:18px 0;padding:17px;border:1px solid #d9a58b35;border-radius:16px;background:linear-gradient(145deg,#211918,#171313)}.tw-ai-diagnostics-head{display:flex;justify-content:space-between;align-items:flex-start;color:#edc4b5}.tw-ai-diagnostics h2{font:500 22px Georgia,serif;margin:0 0 7px;color:#f4e9e4}.tw-ai-diagnostics p{font-size:10px;color:#b9a8a1;line-height:1.55;margin:0 0 12px}.tw-ai-check,.tw-ai-retry{width:100%;padding:11px;border:1px solid #d9a58b55;border-radius:10px;color:#f0c8bd;background:#2a1d1a;font-size:10px}.tw-ai-check-list{display:grid;gap:9px;margin:14px 0}.tw-ai-check-list div{display:grid;gap:3px;border-bottom:1px solid #ffffff12;padding-bottom:8px}.tw-ai-check-list span{font-size:9px;color:#9f8e88}.tw-ai-check-list b{font-size:10px;color:#f1ded6;font-weight:500;overflow-wrap:anywhere}.tw-ai-retry{margin-top:10px}.tw-ai-note{display:block;color:#a99a94;font-size:9px;line-height:1.55;margin-top:10px}
        .tw-device-permissions,.tw-device-install{margin:18px 0;padding:17px;border:1px solid #ffffff18;border-radius:16px;background:#171313}
        .tw-permission-status{display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid #ffffff12;color:#e5b6aa}.tw-permission-status>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.tw-permission-status b{color:#f4e9e4;font-size:11px}.tw-permission-status small{color:#a99a94;font-size:9px;line-height:1.4}.tw-permission-status button{border:1px solid #e5b6aa66;border-radius:9px;background:#241b1a;color:#f0c8bd;padding:8px 10px;font-size:9px;white-space:nowrap}
        .tw-refresh-permissions{margin-top:8px;border:1px solid #ffffff20;border-radius:10px}.tw-permission-help,.tw-device-install small{display:block;color:#a99a94;font-size:9px;line-height:1.6;margin:10px 0 0}.tw-device-install h2{font:500 22px Georgia,serif;margin:0 0 8px}.tw-device-install p,.tw-device-install li{color:#c9b9b3;font-size:10px;line-height:1.6}.tw-device-install ol{padding-left:18px}
        .tw-settings-panel,.tw-profile-panel{display:flex;flex-direction:column;gap:15px;padding:18px;border:1px solid #ffffff16;border-radius:18px;background:#151313}.tw-settings-intro h2,.tw-profile-panel h2{font:500 25px Georgia,serif;margin:13px 0 5px}.tw-settings-intro p,.tw-profile-panel p{margin:0;color:#aaa09c;font-size:10px;line-height:1.6}.tw-settings-panel>label,.tw-profile-panel>label{display:flex;flex-direction:column;gap:8px;color:#e5d7d1;font-size:11px}.tw-settings-panel select,.tw-profile-panel input{width:100%;min-height:43px;padding:0 12px;border:1px solid #ffffff24;border-radius:10px;background:#211c1b;color:#f6f0ec;font-size:12px}.tw-setting-toggle{display:flex!important;flex-direction:row!important;align-items:center}.tw-setting-toggle input{accent-color:#e5b6aa}.tw-quality-note{display:flex;flex-direction:column;gap:7px;padding:13px;border:1px solid #e5b6aa35;border-radius:12px;background:#e5b6aa0b;color:#cbbab4;font-size:10px;line-height:1.5}.tw-quality-note b{color:#f0d8d0}.tw-quality-note small{color:#9f918b;font-size:9px}.tw-profile-avatar{width:72px;height:72px;display:grid;place-items:center;border:1px solid #e5b6aa66;border-radius:50%;background:#e5b6aa20;color:#e5b6aa;font:500 30px Georgia,serif}.tw-back,.tw-glass{width:40px;height:40px;display:grid;place-items:center;border:1px solid #ffffff20;border-radius:50%;background:#ffffff0b;color:#f6f0ec}
        .tw-permission>.tw-back{margin-bottom:40px}.tw-permission>p{margin:15px 0 25px}
        .tw-permission-item{display:flex;align-items:center;gap:12px;padding:15px 0;border-bottom:1px solid #ffffff14}.tw-permission-item>svg{color:#e5b6aa}
        .tw-permission-item div{display:flex;flex:1;flex-direction:column;gap:5px}.tw-permission-item b{font-size:12px}.tw-permission-item small{color:#aaa09c;font-size:10px}
        .tw-permission-item>span{color:#d7a99d;font-size:8px;letter-spacing:.08em}.tw-permission-actions{position:absolute;bottom:max(25px,env(safe-area-inset-bottom));left:22px;right:22px}
        .tw-primary{width:100%;min-height:49px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:13px;background:#e5b6aa;color:#211715;font-size:12px;font-weight:700}
        .tw-secondary{width:100%;min-height:42px;border:0;background:transparent;color:#c9b9b3;font-size:11px}
        .tw-camera-screen{min-height:100dvh;background:#050505;overflow:hidden}.tw-camera-title-pill{display:flex;align-items:center;gap:8px;padding:10px 17px;border:1px solid #ffffff12;border-radius:99px;background:#1b1b1ddd;color:#fff;font-size:12px;font-weight:700;letter-spacing:.02em;backdrop-filter:blur(16px)}.tw-camera-title-pill svg{color:#e9b6a8}.tw-camera-rail{position:absolute;z-index:4;right:12px;top:22%;display:flex;flex-direction:column;gap:17px;align-items:center}.tw-camera-rail button{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:transparent;color:#fff;text-shadow:0 1px 8px #000;font-size:9px}.tw-camera-rail small{font-size:8px;font-weight:600}
        .tw-camera-screen{min-height:100dvh;background:#090909}.tw-camera-view{height:100dvh;min-height:560px;position:relative;overflow:hidden;background:#161313}
        .tw-live-video,.tw-ar-canvas{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;background:#161313}.tw-ar-canvas{pointer-events:none}.tw-beauty-tabs{display:flex;align-items:center;gap:7px;margin-bottom:9px}.tw-beauty-tabs button,.tw-auto-profiles button,.tw-manual-head button{border:1px solid #ffffff24;border-radius:9px;background:#211c1b;color:#cbbab4;padding:8px 10px;font-size:9px}.tw-beauty-tabs button.is-active,.tw-auto-profiles button.is-active{background:#e5b6aa;color:#211715;border-color:#e5b6aa}.tw-beauty-tabs b{margin-left:auto;color:#e5b6aa;font-size:11px}.tw-auto-beauty p{font-size:9px;color:#b8aaa4;margin:4px 0 8px}.tw-auto-profiles{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px}.tw-auto-apply{width:100%;padding:9px;border:1px solid #e5b6aa66;border-radius:9px;background:#e5b6aa;color:#211715;font-weight:700;font-size:10px}.tw-manual-beauty{padding:8px 0}.tw-beauty-category-tabs{display:flex;gap:7px;margin:9px 0 10px;border-bottom:1px solid #ffffff20}.tw-beauty-category-tabs button{flex:1;padding:9px 6px;border:0;border-bottom:2px solid transparent;background:transparent;color:#b8aaa4;font-size:11px;font-weight:700}.tw-beauty-category-tabs button.is-active{color:#f2c8bc;border-bottom-color:#e5b6aa}.tw-beauty-tool-grid{display:flex;gap:8px;overflow-x:auto;padding:3px 0 9px;scrollbar-width:none}.tw-beauty-tool-grid button{flex:0 0 54px;min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border:1px solid #ffffff20;border-radius:12px;background:#211c1b;color:#d9cbc5}.tw-beauty-tool-grid button.is-active{border-color:#e5b6aa;background:#49302e;color:#ffd9cf;box-shadow:0 0 0 1px #e5b6aa55}.tw-beauty-tool-grid button span{font-size:19px}.tw-beauty-tool-grid button small{font-size:9px;white-space:nowrap}.tw-beauty-slider-head{display:flex;justify-content:space-between;align-items:center;margin:5px 0;color:#ead8d1;font-size:10px}.tw-beauty-slider-head b{color:#f2c2b4;font-size:11px}.tw-beauty-intensity{width:100%;accent-color:#e5b6aa}.tw-ar-tools-muted{display:none!important}.tw-beauty-hints{display:flex;justify-content:space-between;color:#9f918c;font-size:8px;margin-top:2px}.tw-manual-head{display:flex;justify-content:space-between;align-items:center;color:#e5b6aa;font-size:9px}.tw-manual-beauty label{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:9px;color:#d8c9c2;font-size:9px}.tw-manual-beauty input{grid-column:1/2;width:100%;accent-color:#e5b6aa}.tw-manual-beauty small{grid-column:2;grid-row:1/3;align-self:center}.tw-ar-tools{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px;align-items:center}.tw-ar-tools label{display:flex;align-items:center;gap:4px;white-space:nowrap;color:#d8c9c2;font-size:8px}.tw-ar-tools select,.tw-ar-tools button{border:1px solid #ffffff30;border-radius:8px;background:#211c1b;color:#f6f0ec;padding:6px;font-size:9px}.tw-ar-tools button.tw-save-beauty{flex:0 0 auto;border-color:#e5b6aa;background:#e5b6aa;color:#211715;font-weight:800;padding:8px 11px}.tw-ar-tools input{accent-color:#e5b6aa}.tw-save-settings-row{display:grid;gap:8px;margin:3px 0 11px}.tw-save-settings-button{width:100%;min-height:39px;border:1px solid #e5b6aa;border-radius:10px;background:#e5b6aa;color:#211715;font-size:11px;font-weight:800}.tw-saved-presets{display:flex;gap:7px;overflow-x:auto;padding-bottom:3px}.tw-saved-presets button{flex:0 0 auto;border:1px solid #ffffff30;border-radius:8px;background:#211c1b;color:#f6f0ec;padding:7px 9px;font-size:9px}
        .tw-live-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,#0009,transparent 23%,transparent 54%,#000b 100%)}
        .tw-camera-header{position:absolute;z-index:2;top:max(16px,env(safe-area-inset-top));left:18px;right:18px;display:flex;align-items:center;justify-content:space-between}
        .tw-live-label{position:absolute;top:80px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #ffffff24;border-radius:99px;background:#17131399;color:#f5e9e4;font-size:9px;letter-spacing:.1em;white-space:nowrap}
        .tw-live-label span{width:6px;height:6px;border-radius:50%;background:#d6a398;box-shadow:0 0 0 3px #d6a39830}.tw-ai-retry{position:absolute;z-index:3;top:119px;left:50%;transform:translateX(-50%);padding:7px 12px;border:1px solid #e5b6aa66;border-radius:99px;background:#211918;color:#f2c9bd;font-size:10px}
        .tw-camera-bottom{position:absolute;z-index:3;left:0;right:0;bottom:max(12px,env(safe-area-inset-bottom));padding:0 14px}.tw-filter-row{max-height:36dvh;overflow-y:auto;padding:10px 11px;margin-bottom:10px;border:1px solid #ffffff20;border-radius:19px;background:linear-gradient(145deg,#171313df,#080808e8);backdrop-filter:blur(20px);box-shadow:0 12px 36px #0008;scrollbar-width:none}.tw-filter-row::-webkit-scrollbar{display:none}
        .tw-filter-row>div{display:flex;justify-content:space-between;margin-bottom:10px;color:#c7b9b3;font-size:8px;letter-spacing:.1em}.tw-filter-row b{color:#e5b6aa;font-size:10px}
        .tw-filter-row input{width:100%;accent-color:#e5b6aa}
        .tw-preset-strip{display:flex;gap:9px;overflow-x:auto;padding:2px 0 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.tw-preset-strip::-webkit-scrollbar{display:none}
        .tw-reference-head{display:flex;justify-content:space-between;align-items:center;color:#f1c6b9;font-size:9px;letter-spacing:.06em;margin:8px 0}.tw-reference-head span{color:#9f918c;font-size:8px}.tw-reference-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:225px;overflow:auto}.tw-reference-card{position:relative;min-width:0;display:grid;grid-template-rows:100px auto auto;gap:4px;text-align:left;padding:5px;border:1px solid #ffffff20;border-radius:12px;background:#211b1a;color:#f8eee9}.tw-reference-card.selected{border-color:#e9b8aa;box-shadow:0 0 0 1px #e9b8aa55}.tw-reference-card img{width:100%;height:100px;object-fit:cover;object-position:center 28%;border-radius:8px;background:#342c2a}.tw-reference-card b{font-size:9px;line-height:1.3}.tw-reference-card small{font-size:8px;color:#b7a9a3}.tw-reference-tag{position:absolute;top:9px;left:9px;border-radius:20px;padding:3px 7px;background:#100d0dcc;color:#f5d2c7;font-size:8px}.tw-reference-analysis{display:flex;align-items:flex-start;gap:7px;margin:9px 0;padding:8px;border-radius:9px;background:#101b19;border:1px solid #5a9e8050;color:#b7e4cb;font-size:8px;line-height:1.45}.tw-ai-pulse{flex:0 0 7px;width:7px;height:7px;margin-top:2px;border-radius:50%;background:#67d69c;box-shadow:0 0 10px #67d69c}.tw-reference-selected{display:grid;gap:3px;margin:4px 0 9px;padding:8px;border-left:2px solid #e5b6aa;background:#ffffff08}.tw-reference-selected b{font-size:9px;color:#f4c9bd}.tw-reference-selected small{font-size:8px;color:#c6b7b0}.tw-preset{flex:0 0 61px;display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:transparent;color:#cfc4bf;padding:3px 0;font-size:8px}.tw-preset small{font-size:8px;white-space:nowrap}.tw-preset-photo{display:block;width:49px;height:49px;overflow:hidden;border:2px solid #ffffff40;border-radius:50%;background:#29201f;box-shadow:inset 0 0 0 2px #171313}.tw-preset-photo img{width:100%;height:100%;object-fit:cover;object-position:center 25%}.tw-preset.is-active .tw-preset-photo{border-color:#e5b6aa;box-shadow:0 0 0 2px #e5b6aa55}.tw-preset.is-active small{color:#f2c9bd;font-weight:700}.tw-preset.is-active small{color:#f2c9bd;font-weight:700}.swatch-glass{filter:brightness(1.3) saturate(.8)}.swatch-soft{filter:sepia(.2) saturate(1.3)}.swatch-rose{filter:hue-rotate(330deg)}.swatch-latte{filter:sepia(.6)}.swatch-cool{filter:hue-rotate(25deg)}.swatch-film{filter:grayscale(.25) sepia(.3)}.swatch-glow{filter:brightness(1.3) sepia(.2)}.swatch-mono{filter:grayscale(1) contrast(1.2)}
        .tw-capture-modes{display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,22px);margin:0 0 12px;white-space:nowrap}.tw-capture-modes button{border:0;border-radius:99px;padding:8px 11px;background:transparent;color:#fff;font-size:clamp(10px,2.8vw,13px);font-weight:700}.tw-capture-modes button.is-active{background:#fff;color:#161313}.tw-capture-modes .tw-text-mode{opacity:.82}
        .tw-capture-row{display:flex;align-items:center;justify-content:space-between;padding:0 8px}.tw-shutter{width:78px;height:78px;background:#ffffff20;box-shadow:0 0 0 4px #0005}.tw-shutter span{width:62px;height:62px}.tw-side-button{width:58px}
.tw-side-button{display:flex;flex-direction:column;align-items:center;gap:7px;width:66px;border:0;background:transparent;color:#f6f0ec}
        .tw-side-button small{font-size:9px;color:#c4b8b2}.tw-shutter{width:76px;height:76px;display:grid;place-items:center;border:3px solid #fff;border-radius:50%;background:#ffffff26}
        .tw-shutter span{width:58px;height:58px;border-radius:50%;background:#f6f0ec}.tw-shutter.tw-recording span{width:25px;height:25px;border-radius:6px;background:#d86e63}
        .tw-mode-label{text-align:center;margin-top:13px;color:#e9c8bd;font-size:9px;font-weight:700;letter-spacing:.14em}
        .tw-photo-editor{border:1px solid #ffffff20;border-radius:16px;background:#171313;padding:13px;display:grid;gap:12px}.tw-editor-heading{display:flex;align-items:center;justify-content:space-between}.tw-editor-heading>div{display:grid;gap:4px}.tw-editor-heading b{font-size:13px}.tw-editor-heading small{font-size:9px;color:#aaa09c}.tw-editor-heading>button,.tw-editor-actions button{border:1px solid #ffffff25;background:#242020;color:#f6f0ec;border-radius:9px;padding:8px 10px;font-size:10px}.tw-editor-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tw-editor-tabs button{border:1px solid #ffffff20;border-radius:9px;background:#242020;color:#c8bfbb;padding:9px 3px;font-size:10px}.tw-editor-tabs button.active{background:#e5b6aa;color:#241816;border-color:#e5b6aa;font-weight:800}.tw-editor-controls{display:grid;gap:12px}.tw-editor-controls label{display:grid;grid-template-columns:1fr auto;align-items:center;gap:7px;font-size:10px;color:#eee4df}.tw-editor-controls input{grid-column:1/-1;width:100%;accent-color:#e5b6aa}.tw-editor-controls label small{color:#e5b6aa}.tw-editor-controls select{grid-column:1/-1;width:100%;padding:10px;border-radius:9px;background:#252124;color:#fff;border:1px solid #ffffff25}.tw-tone-palette{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.tw-tone-palette span{width:100%;font-size:10px;color:#b9adaa}.tw-tone-palette button{min-width:31px;height:31px;border:2px solid #ffffff30;border-radius:50%;color:#211715;font-size:9px;padding:0}.tw-tone-palette button.selected{outline:2px solid #e5b6aa;outline-offset:2px}.tw-tone-palette button[title]{font-size:0}.tw-editor-actions{display:flex;gap:8px}.tw-editor-actions button{flex:1}
        .tw-preview-screen{display:flex;flex-direction:column;gap:20px}.tw-preview-header{display:flex;align-items:center;gap:13px}.tw-preview-header>div{display:flex;flex:1;flex-direction:column;gap:4px}.tw-preview-header b{font-size:13px}.tw-preview-header small{color:#aaa09c;font-size:9px}
        .tw-media-frame{position:relative;flex:1;min-height:280px;max-height:65dvh;display:grid;place-items:center;overflow:hidden;border:1px solid #ffffff18;border-radius:18px;background:#151313}
        .tw-media-frame img,.tw-media-frame video{display:block;max-width:100%;max-height:65dvh;object-fit:contain}.tw-preview-actions{display:grid;gap:7px}
        .tw-local-note{display:flex;align-items:flex-start;gap:8px;color:#928783;font-size:9px;line-height:1.5}.tw-local-note svg{flex:0 0 auto;color:#e5b6aa}
        .tw-modal-scrim{position:fixed;z-index:80;inset:0;display:flex;align-items:flex-end;justify-content:center;background:#000a;padding:14px}
        .tw-modal{position:relative;width:min(100%,450px);padding:25px 21px max(23px,env(safe-area-inset-bottom));border:1px solid #ffffff1c;border-radius:22px;background:#171313}
        .tw-modal-close{position:absolute;right:16px;top:16px;border:0;background:transparent;color:#f6f0ec}.tw-modal-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#e5b6aa18;color:#e5b6aa}
        .tw-modal h2{font:500 25px Georgia,serif;margin:16px 0 8px}.tw-modal p{margin:0 0 20px;color:#aaa09c;font-size:11px;line-height:1.6}
        .tw-error{position:absolute;z-index:15;left:16px;right:16px;bottom:16px;padding:12px 14px;border:1px solid #d9897d55;border-radius:12px;background:#251817;color:#f0c5bc;font-size:10px;line-height:1.5}
        .tw-global-error{position:fixed;display:flex;align-items:center;justify-content:space-between}.tw-global-error button{border:0;background:transparent;color:inherit}
        .tw-toast{position:fixed;z-index:100;left:50%;bottom:max(90px,calc(env(safe-area-inset-bottom) + 80px));transform:translateX(-50%);max-width:90%;padding:11px 15px;border:1px solid #ffffff24;border-radius:99px;background:#211c1b;color:#f6f0ec;font-size:10px;white-space:nowrap}
        @media(max-height:700px){.tw-hero{height:225px}.tw-permission>.tw-back{margin-bottom:22px}.tw-camera-bottom{padding:0 18px}}
        @media(prefers-reduced-motion:reduce){.thu365-web *{scroll-behavior:auto}}
/* Mobile beauty workspace: prevent flex compression and provide an explicit expand/collapse control. */
        .tw-filter-row>.tw-auto-beauty,.tw-filter-row>.tw-manual-beauty{display:block!important;width:100%;min-width:0}
        .tw-filter-row>.tw-beauty-panel-header{display:flex!important;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:4px 0 12px;border-bottom:1px solid #ffffff20;letter-spacing:0}
        .tw-beauty-panel-header>div{display:flex;flex-direction:column;gap:4px;min-width:0}
        .tw-beauty-panel-header b{font-size:13px;letter-spacing:.12em;color:#f3c8bb}
        .tw-beauty-panel-header small{font-size:10px;color:#b8aaa4}
        .tw-beauty-panel-header button{display:flex;align-items:center;gap:6px;padding:9px 12px;border:1px solid #ffffff28;border-radius:999px;background:#302522;color:#f7e8e2;font-size:11px}
        .tw-filter-row-expanded{position:fixed!important;z-index:20!important;inset:env(safe-area-inset-top,8px) 8px calc(env(safe-area-inset-bottom,8px) + 8px)!important;width:auto!important;max-height:none!important;height:auto!important;overflow-y:auto!important;overscroll-behavior:contain;padding:16px!important;margin:0!important;border:1px solid #e5b6aa66!important;border-radius:22px!important;background:linear-gradient(155deg,rgba(24,18,18,.98),rgba(5,5,5,.985))!important;backdrop-filter:blur(26px);box-shadow:0 18px 60px #000b!important}
        .tw-filter-row-expanded .tw-reference-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-height:min(34dvh,320px);overflow-y:auto}
        .tw-filter-row-expanded .tw-reference-card{grid-template-rows:clamp(110px,18dvh,180px) auto auto}
        .tw-filter-row-expanded .tw-reference-card img{height:100%;min-height:0}
        .tw-filter-row-expanded .tw-beauty-tool-grid button{flex-basis:68px;min-height:70px}
        .tw-filter-row-expanded .tw-beauty-tool-grid button small{font-size:10px}
        .tw-filter-row-expanded .tw-beauty-slider-head{font-size:13px;margin:12px 0 8px}
        .tw-filter-row-expanded .tw-beauty-slider-head b{font-size:14px}
        .tw-filter-row-expanded .tw-beauty-intensity{height:30px}
        .tw-filter-row-expanded .tw-beauty-category-tabs button{font-size:13px;padding:13px 8px}
        .tw-filter-row-expanded .tw-save-settings-button{min-height:46px;font-size:13px}
        .tw-filter-row-expanded .tw-ar-tools{flex-wrap:wrap;overflow:visible}
        .tw-filter-row-expanded .tw-ar-tools label{font-size:11px}
        @media(min-width:700px){.tw-filter-row-expanded{left:50%!important;right:auto!important;top:24px!important;bottom:24px!important;width:min(720px,calc(100vw - 48px))!important;transform:translateX(-50%)}.tw-filter-row-expanded .tw-reference-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
        
        .tw-home-header{display:grid!important;grid-template-columns:42px 1fr auto!important;align-items:center;gap:10px}
        .tw-hamburger{width:40px;height:40px;display:grid;place-items:center;border:1px solid #ffffff20;border-radius:13px;background:#211b1bd9;color:#f7e8e2}
        .tw-home-header .tw-brand{justify-self:center}
        .tw-nav-layer{position:fixed;z-index:120;inset:0}
        .tw-nav-scrim{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000b;backdrop-filter:blur(5px)}
        .tw-nav-drawer{position:absolute;inset:0 auto 0 0;width:min(88vw,390px);padding:max(22px,env(safe-area-inset-top)) 18px max(24px,env(safe-area-inset-bottom));overflow-y:auto;background:linear-gradient(160deg,#211819,#09090b 72%);border-right:1px solid #e5b6aa35;box-shadow:22px 0 70px #0009;animation:thu-nav-in .24s ease-out}
        @keyframes thu-nav-in{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        .tw-nav-heading{display:flex;align-items:center;justify-content:space-between;padding:6px 0 25px}
        .tw-nav-heading>button{width:40px;height:40px;border:1px solid #ffffff22;border-radius:50%;background:#ffffff0c;color:#fff}
        .tw-nav-caption{font-size:10px;letter-spacing:.16em;color:#e5b6aa;margin:5px 0 12px;font-weight:800}
        .tw-nav-feature{width:100%;display:flex;align-items:center;gap:12px;padding:15px;border:1px solid #e5b6aa66;border-radius:16px;background:linear-gradient(110deg,#e5b6aa26,#ffffff08);color:#f8e8e2;text-align:left}
        .tw-nav-feature>svg:first-child{color:#e5b6aa;width:24px;height:24px}
        .tw-nav-feature>svg:last-child{margin-left:auto;width:17px}
        .tw-nav-feature span{display:grid;gap:4px}.tw-nav-feature b{font-size:13px}.tw-nav-feature small{font-size:10px;color:#bdaea9}
        .tw-nav-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}
        .tw-nav-grid button{min-height:88px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:10px;padding:13px;border:1px solid #ffffff18;border-radius:14px;background:#ffffff08;color:#f4e8e3;text-align:left}
        .tw-nav-grid button svg{width:20px;height:20px;color:#e5b6aa}.tw-nav-grid button b{font-size:11px}
        .tw-nav-bottom{display:flex;gap:8px;align-items:center;margin-top:22px;padding:13px;border-radius:12px;background:#ffffff08;color:#b9aaa5;font-size:10px;line-height:1.5}.tw-nav-bottom svg{flex:0 0 auto;color:#e5b6aa}
        .tw-home-hero{min-height:300px!important;height:auto!important;padding:26px 20px!important;display:flex!important;align-items:center;overflow:hidden}
        .tw-home-hero .tw-hero-copy{position:relative;z-index:2;max-width:68%}
        .tw-home-hero h1{font-size:clamp(29px,8vw,43px)!important;line-height:1.06!important}
        .tw-home-hero p{font-size:12px!important;line-height:1.6}
        .tw-home-primary{display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:12px 15px;border:0;border-radius:99px;background:#e5b6aa;color:#251918;font-weight:800;font-size:11px}
        .tw-home-hero .tw-hero-mark{position:absolute!important;right:-8px!important;bottom:16px!important;opacity:1!important}
        .tw-robot-wrap{position:relative;width:clamp(125px,38vw,190px);display:grid;justify-items:center;filter:drop-shadow(0 12px 24px #0008)}
        .tw-robot-aura{position:absolute;inset:8% 0 18%;border-radius:50%;background:radial-gradient(circle,#e5b6aa3d,transparent 68%);animation:thu-robot-pulse 3s ease-in-out infinite}
        .tw-robot-svg{position:relative;width:100%;overflow:visible}
        .tw-robot-scan-line{animation:thu-face-scan 2.3s ease-in-out infinite}
        @keyframes thu-face-scan{0%,100%{transform:translateY(-25px);opacity:.35}50%{transform:translateY(28px);opacity:1}}
        @keyframes thu-robot-pulse{0%,100%{transform:scale(.92);opacity:.55}50%{transform:scale(1.08);opacity:1}}
        .tw-robot-status{display:flex;align-items:center;gap:6px;margin-top:-4px;padding:6px 9px;border:1px solid #72f4cb40;border-radius:99px;background:#0c1716;color:#a5f7dd;font-size:8px;font-weight:800;letter-spacing:.12em}
        .tw-robot-status i,.tw-ai-assistant-card small span{width:6px;height:6px;border-radius:50%;background:#72f4cb;box-shadow:0 0 9px #72f4cb}
        .tw-home-ai,.tw-home-references,.tw-home-features{margin:24px 0}
        .tw-home-section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}
        .tw-home-section-title>div>span{font-size:9px;letter-spacing:.18em;color:#e5b6aa;font-weight:800}
        .tw-home-section-title h2{margin:5px 0 0;font:500 21px Georgia,serif;color:#fff1eb}
        .tw-home-section-title>small{font-size:9px;color:#b8aaa4}
        .tw-ai-assistant-card{display:flex;align-items:center;gap:13px;padding:15px;border:1px solid #e5b6aa35;border-radius:18px;background:radial-gradient(circle at 0 0,#e5b6aa20,transparent 60%),#171313}
        .tw-ai-assistant-card .tw-robot-wrap{width:112px;flex:0 0 112px}
        .tw-ai-assistant-card .tw-robot-status{font-size:7px}
        .tw-ai-assistant-card>div:last-child{min-width:0}
        .tw-ai-assistant-card b{font-size:13px}.tw-ai-assistant-card p{font-size:10px;line-height:1.55;color:#c0b3ae;margin:7px 0}
        .tw-ai-assistant-card small{display:flex;align-items:center;gap:6px;font-size:7px;letter-spacing:.06em;color:#a4e9d3}
        .tw-home-reference-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .tw-home-reference-grid>button{position:relative;min-width:0;height:190px;overflow:hidden;padding:0;border:1px solid #ffffff20;border-radius:15px;background:#1c1717;text-align:left}
        .tw-home-reference-grid>button.is-selected{border:2px solid #e5b6aa;box-shadow:0 0 0 2px #e5b6aa26}
        .tw-home-reference-grid img{width:100%;height:100%;object-fit:cover;display:block}
        .tw-ref-overlay{position:absolute;inset:auto 0 0;padding:28px 10px 10px;display:grid;gap:4px;background:linear-gradient(transparent,#090708eF);color:#fff}
        .tw-ref-overlay b{font-size:10px;line-height:1.3}.tw-ref-overlay small{font-size:8px;color:#e5d4ce}
        .tw-ref-selected{position:absolute;top:8px;left:8px;display:flex;align-items:center;gap:4px;padding:5px 7px;border-radius:99px;background:#e5b6aa;color:#211615;font-size:8px;font-weight:800}
        .tw-home-reference-detail{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:12px;border:1px solid #ffffff18;border-radius:13px;background:#ffffff08}
        .tw-home-reference-detail>div{display:grid;gap:4px;min-width:0}.tw-home-reference-detail b{font-size:10px}.tw-home-reference-detail small{font-size:9px;color:#b6a9a4;line-height:1.4}
        .tw-home-reference-detail>button{display:flex;align-items:center;gap:4px;flex:0 0 auto;padding:9px 10px;border:0;border-radius:99px;background:#e5b6aa;color:#241817;font-size:9px;font-weight:800}
        .tw-home-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .tw-home-feature-grid article{display:grid;gap:7px;padding:14px;border:1px solid #ffffff17;border-radius:14px;background:#ffffff08}
        .tw-home-feature-grid svg{width:20px;height:20px;color:#e5b6aa}.tw-home-feature-grid b{font-size:11px}.tw-home-feature-grid small{font-size:9px;line-height:1.45;color:#b8aaa4}
        @media(max-width:380px){.tw-home-hero .tw-hero-copy{max-width:72%}.tw-home-hero .tw-hero-mark{right:-20px!important}.tw-ai-assistant-card .tw-robot-wrap{width:94px;flex-basis:94px}.tw-home-reference-grid>button{height:165px}}
        @media(prefers-reduced-motion:reduce){.tw-nav-drawer,.tw-robot-aura,.tw-robot-scan-line{animation:none!important}}
        .tw-live-scan-badge{padding:5px 8px;border:1px solid #72f4cb40;border-radius:99px;color:#a5f7dd;font-size:8px;letter-spacing:.1em;font-weight:800}
                .tw-skills-intro{margin:-3px 0 12px;color:#b7a9a4;font-size:10px;line-height:1.55}
        .tw-skills-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .tw-skills-grid>button{min-height:106px;display:grid;grid-template-columns:34px 1fr;grid-template-rows:auto auto;align-content:center;align-items:center;column-gap:9px;row-gap:5px;padding:12px;border:1px solid #ffffff1c;border-radius:14px;background:linear-gradient(145deg,#ffffff0d,#e5b6aa08);color:#f7e9e3;text-align:left;transition:transform .18s,border-color .18s}
        .tw-skills-grid>button:active{transform:scale(.97);border-color:#e5b6aa}
        .tw-skills-grid>button>span{grid-row:1/3;width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#e5b6aa1c;color:#e5b6aa}
        .tw-skills-grid>button>span svg{width:18px;height:18px}
        .tw-skills-grid>button>b{font-size:10px;line-height:1.3}
        .tw-skills-grid>button>small{font-size:8px;color:#b7a9a4;line-height:1.4}
      `}</style>
    </main>
  );
}
