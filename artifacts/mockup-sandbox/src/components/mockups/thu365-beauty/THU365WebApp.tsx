import { useEffect, useRef, useState } from "react";
import { createTHU365FaceTracker, renderFaceAR, type FaceARSettings } from "./THU365FaceAR";
import {
  ArrowLeft, Aperture, Camera, Check, ChevronRight, Download, FlipHorizontal2, Settings, UserRound, Menu, ScanFace, BookOpen, BrainCircuit, Palette, SlidersHorizontal, Bookmark, WandSparkles,
  Image as ImageIcon, LockKeyhole, Mic, Play, RotateCcw, ShieldCheck, Sparkles,
  Video, X, Zap, Clapperboard, HardDrive, Trash2, Wifi, Cpu
} from "lucide-react";

type Screen = "home" | "module" | "permission" | "camera" | "preview";
type MediaKind = "image" | "video";
type CameraFacing = "user" | "environment";
type BeautyPreset = { id: string; name: string; filter: string; description: string };
type BeautyReference = { id:string;name:string;subtitle:string;image:string;gender:"Nam"|"Nữ";preset:string;beauty:number;settings:FaceARSettings;description:string };
type AIModelPack = {id:string;name:string;version:string;url:string;description:string;sizeLabel:string;required:boolean;format:"task"|"tflite"};
async function validateAIModelBlob(model:AIModelPack,blob:Blob|null|undefined):Promise<boolean>{
 if(!blob||blob.size<1024)return false;
 const bytes=new Uint8Array(await blob.slice(0,12).arrayBuffer());
 if(model.format==="task")return bytes[0]===0x50&&bytes[1]===0x4b;
 return bytes.length>=8&&bytes[4]===0x54&&bytes[5]===0x46&&bytes[6]===0x4c&&bytes[7]===0x33;
}
const AI_MODEL_CACHE = "anhthu-ai-models-v1";
const AI_MODEL_PACKS: AIModelPack[] = [
 {id:"face",name:"Face Landmarker",version:"MediaPipe · float16 v1",url:"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",description:"Theo dõi landmark mắt, mũi, môi và đường viền khuôn mặt.",sizeLabel:"Dung lượng đo khi tải",required:true,format:"task"},
 {id:"skin",name:"Skin Segmentation",version:"MediaPipe · multiclass 256",url:"https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite",description:"Phân vùng da và tóc để làm mịn theo vùng, áp màu tóc chính xác hơn.",sizeLabel:"Dung lượng đo khi tải",required:true,format:"tflite"}
];
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
  const [activeDocsTopic, setActiveDocsTopic] = useState("overview");
  const [beautySkillQuery, setBeautySkillQuery] = useState("");
  const [beautyCompareValue, setBeautyCompareValue] = useState(50);
  const [beautyColorValues, setBeautyColorValues] = useState({warmth:0,tone:50,glow:35});
  const [beautyAssistantChoice, setBeautyAssistantChoice] = useState("natural");
  const [beautyPresetName, setBeautyPresetName] = useState("My Beauty Look");

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
  const activeDocsReference = BEAUTY_REFERENCES.find((item) => item.id === (
    activeDocsTopic === "face" || activeDocsTopic === "face-shape" ? "cn-male-clean" :
    activeDocsTopic === "skin" || activeDocsTopic === "makeup" || activeDocsTopic === "light" ? "cn-female-glass" :
    activeDocsTopic === "hair" || activeDocsTopic === "ar" ? "cn-female-peach" :
    activeDocsTopic === "background" || activeDocsTopic === "video" ? "cn-male-douyin" :
    activeDocsTopic === "reference" ? selectedReference : "cn-female-glass"
  )) ?? BEAUTY_REFERENCES[0];
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
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraPlaybackBlocked, setCameraPlaybackBlocked] = useState(false);
  const [devicePermissions, setDevicePermissions] = useState({ camera: "Chưa kiểm tra", microphone: "Chưa kiểm tra" });
  const [isStandalone, setIsStandalone] = useState(false);
  const [aiDiagnostics, setAiDiagnostics] = useState<{network:string;secure:string;camera:string;runtime:string;faceModel:string;skinModel:string} | null>(null);
  const [checkingAI, setCheckingAI] = useState(false);
  const [aiModelStates, setAiModelStates] = useState<Record<string,{installed:boolean;bytes:number;downloading:boolean;progress:number;error:string}>>({});
  const [aiModelBusy, setAiModelBusy] = useState(false);
  const [arReady, setArReady] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [aiRetry, setAiRetry] = useState(0);
  const [setupStage, setSetupStage] = useState<"install"|"models"|"camera"|"ready"|"error">("install");
  const setupEntryRef = useRef(false);
  const autoSetupStartedRef = useRef(false);
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
    const [runtimeResult, faceReachable, skinReachable] = await Promise.all([
      Promise.resolve(runtime),
      probe("https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"),
      probe("https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite")
    ]);
    const installedStatus = async (model:AIModelPack, reachable:string) => {
      try {
        if (!("caches" in window)) return "Cache Storage không khả dụng · "+reachable;
        const cache = await caches.open(AI_MODEL_CACHE);
        const response = await cache.match(model.url);
        if (!response) return "CHƯA CÀI · "+reachable;
        const blob = await response.blob();
        if (!await validateAIModelBlob(model,blob)) return "MODEL SAI ĐỊNH DẠNG / TẢI THIẾU · cần tải lại";
        return "ĐÃ TẢI, ĐÚNG ĐỊNH DẠNG VÀ LƯU TRÊN THIẾT BỊ · "+(blob.size/1048576).toFixed(2)+" MB";
      } catch { return "KHÔNG ĐỌC ĐƯỢC BỘ NHỚ · "+reachable; }
    };
    const [faceModel, skinModel] = await Promise.all([
      installedStatus(AI_MODEL_PACKS[0],faceReachable),
      installedStatus(AI_MODEL_PACKS[1],skinReachable)
    ]);
    setAiDiagnostics({ network, secure, camera, runtime: runtimeResult+" · MediaPipe JS/WASM tải từ CDN khi khởi tạo AI", faceModel, skinModel });
    setCheckingAI(false);
  }

  async function refreshAIModelInventory() {
    if (!("caches" in window)) return;
    try { const cache=await caches.open(AI_MODEL_CACHE); const next:Record<string,{installed:boolean;bytes:number;downloading:boolean;progress:number;error:string}>={};
      for(const model of AI_MODEL_PACKS){const response=await cache.match(model.url);const blob=response?await response.blob():null;const valid=await validateAIModelBlob(model,blob);next[model.id]={installed:valid,bytes:valid?(blob?.size??0):0,downloading:false,progress:valid?100:0,error:blob&&!valid?"Model sai định dạng hoặc tải thiếu · hãy xóa và tải lại":""};}
      setAiModelStates(next);
    } catch(cause){console.warn("Cannot inspect AI model cache",cause);}
  }
  async function downloadAIModel(model:AIModelPack) {
    const standalone=window.matchMedia?.("(display-mode: standalone)").matches||(navigator as any).standalone===true;
    if(!standalone){setActiveModule("setup");setScreen("module");showNotice("Hãy cài và mở AnhThu từ Màn hình chính trước khi tải AI.");return;}
    if(!("caches" in window)){showNotice("Trình duyệt không hỗ trợ lưu model offline.");return;}
    setAiModelBusy(true);setAiModelStates(v=>({...v,[model.id]:{installed:false,bytes:0,downloading:true,progress:0,error:""}}));
    const controller=new AbortController();
    const timeout=window.setTimeout(()=>controller.abort(),90000);
    try{
      const response=await fetch(model.url,{mode:"cors",cache:"no-cache",signal:controller.signal});if(!response.ok||!response.body)throw new Error("Máy chủ trả HTTP "+response.status);
      const total=Number(response.headers.get("content-length")||0),reader=response.body.getReader(),chunks:Uint8Array[]=[];let received=0;
      while(true){const part=await reader.read();if(part.done)break;if(part.value){chunks.push(part.value);received+=part.value.byteLength;setAiModelStates(v=>({...v,[model.id]:{installed:false,bytes:received,downloading:true,progress:total?Math.min(99,Math.round(received/total*100)):0,error:""}}));}}
      const blobParts=chunks.map((chunk)=>{const copy=new Uint8Array(chunk.byteLength);copy.set(chunk);return copy.buffer;});
      const blob=new Blob(blobParts,{type:"application/octet-stream"});if(!await validateAIModelBlob(model,blob))throw new Error("Tệp tải về không đúng định dạng model "+model.format+". Hãy thử tải lại hoặc kiểm tra mạng.");
      const cache=await caches.open(AI_MODEL_CACHE);await cache.put(model.url,new Response(blob,{headers:{"Content-Type":"application/octet-stream","Content-Length":String(blob.size)}}));
      setAiModelStates(v=>({...v,[model.id]:{installed:true,bytes:blob.size,downloading:false,progress:100,error:""}}));showNotice(model.name+" đã tải và lưu trên thiết bị");
      return true;
    }catch(cause){const message=cause instanceof DOMException&&cause.name==="AbortError"?"Hết thời gian tải model sau 90 giây":cause instanceof Error?cause.message:"Không thể tải model";setAiModelStates(v=>({...v,[model.id]:{installed:false,bytes:0,downloading:false,progress:0,error:message}}));showNotice("Tải model thất bại · camera cơ bản vẫn dùng được; hãy kiểm tra mạng hoặc CORS");return false;}
    finally{window.clearTimeout(timeout);setAiModelBusy(false);}
  }
  async function downloadRequiredAIModels():Promise<boolean> {
    const standalone=window.matchMedia?.("(display-mode: standalone)").matches||(navigator as any).standalone===true;
    if(!standalone){setActiveModule("setup");setScreen("module");setSetupStage("install");showNotice("Cài và mở AnhThu từ Màn hình chính trước khi tải AI.");return false;}
    for(const model of AI_MODEL_PACKS.filter(item=>item.required)){
      let valid=false;
      try{const cache=await caches.open(AI_MODEL_CACHE);const response=await cache.match(model.url);const blob=response?await response.blob():null;valid=await validateAIModelBlob(model,blob);}catch{}
      if(!valid){
        setSetupStage("models");
        const downloaded=await downloadAIModel(model);
        if(!downloaded)return false;
      }
      try{
        const cache=await caches.open(AI_MODEL_CACHE);
        const response=await cache.match(model.url);
        const blob=response?await response.blob():null;
        if(!await validateAIModelBlob(model,blob)){showNotice("Chưa cài xong "+model.name+". Kiểm tra lỗi tải rồi thử lại.");return false;}
      }catch{showNotice("Không kiểm tra được model "+model.name+" trong bộ nhớ.");return false;}
    }
    await refreshAIModelInventory();
    return true;
  }

  async function removeAIModel(model:AIModelPack){
    try{const cache=await caches.open(AI_MODEL_CACHE);await cache.delete(model.url);setAiModelStates(v=>({...v,[model.id]:{installed:false,bytes:0,downloading:false,progress:0,error:""}}));showNotice("Đã xóa model "+model.name+" khỏi thiết bị");}
    catch{showNotice("Không thể xóa model khỏi bộ nhớ trình duyệt");}
  }

  async function requestSetupPermissions():Promise<boolean> {
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){showNotice("Cần mở AnhThu bằng Safari/Chrome trên HTTPS để cấp quyền camera.");return false;}
    try {
      const camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});
      camera.getTracks().forEach(track=>track.stop());
    } catch(error) {
      const name=error instanceof DOMException?error.name:"";
      showNotice(name==="NotAllowedError"?"Camera bị từ chối. Hãy bật quyền trong Cài đặt iPhone → Safari.":name==="NotFoundError"?"Không tìm thấy camera trên thiết bị.":"Không thể cấp quyền camera · kiểm tra trình duyệt và cài đặt.");
      await refreshDevicePermissions();
      return false;
    }
    // Microphone permission is intentionally deferred until the user starts a video recording with sound.
    await refreshDevicePermissions();
    return true;
  }

  async function runAutoSetup() {
    if(autoSetupStartedRef.current)return;
    autoSetupStartedRef.current=true;
    const standalone=window.matchMedia?.("(display-mode: standalone)").matches||(navigator as any).standalone===true;
    setIsStandalone(Boolean(standalone));
    if(!standalone){autoSetupStartedRef.current=false;setSetupStage("install");setActiveModule("setup");setScreen("module");return;}
    setActiveModule("setup");setScreen("module");
    setSetupStage("models");
    const modelsReady=await downloadRequiredAIModels();
    if(!modelsReady){
      showNotice("AI model chưa tải được · camera cơ bản vẫn có thể sử dụng. Bạn có thể thử tải lại trong AI Model Center.");
    }
    setSetupStage("camera");
    const permissionGranted=await requestSetupPermissions();
    if(!permissionGranted){autoSetupStartedRef.current=false;setSetupStage("camera");showNotice("Cần cho phép camera để hoàn tất. Chạm nút thử lại nếu hộp thoại chưa xuất hiện.");return;}
    setSetupStage("ready");
    localStorage.setItem("anhthu-setup-complete-v1","true");
    await startCamera();
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
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setIsStandalone(Boolean(standalone));
    void refreshAIModelInventory();
    if (!setupEntryRef.current) {
      setupEntryRef.current = true;
      const complete=localStorage.getItem("anhthu-setup-complete-v1")==="true";
      if(!standalone||!("caches" in window)||!complete) void runAutoSetup();
    }
    if (activeModule === "settings") void refreshDevicePermissions();
    if (activeModule === "ai-models") void refreshAIModelInventory();
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
  const cameraRequestRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const processedVideoStreamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen === "camera" && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.srcObject = streamRef.current;
      void video.play().then(() => setCameraPlaybackBlocked(false)).catch(() => {
        setCameraPlaybackBlocked(true);
        setError("Camera đã được cấp quyền nhưng Safari chưa phát hình. Chạm “Bật hình camera” để tiếp tục.");
      });
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
    if (screen !== "camera") { setArReady(false); setAiReady(false); return; }
    let active = true;
    let raf = 0;
    let tracker: any = null;
    let last = -1;
    let lastInsightAt = 0;
    setArReady(false);
    setAiReady(false);
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
      setAiReady(true);
      setTrackingStatus(loaded.segmentationEnabled ? "AI Face + Skin sẵn sàng" : "AI Face sẵn sàng · Skin AI dự phòng");
    }).catch((cause) => {
      if (!active) return;
      tracker = null;
      trackerRef.current = null;
      setAiReady(false);
      console.warn("AnhThu AI model unavailable; live color/filter controls remain active:", cause);
      setTrackingStatus("Beauty màu đang hoạt động · AI Face chưa tải được");
    });

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      tracker?.close?.();
      trackerRef.current = null;
      setArReady(false);
      setAiReady(false);
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
    setCameraPlaybackBlocked(false);
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setIsStandalone(Boolean(standalone));
    if (!standalone) {
      setActiveModule("setup");
      setScreen("module");
      showNotice("Bắt buộc cài AnhThu vào Màn hình chính trước khi mở camera.");
      return;
    }
    // AI models enhance face tracking and segmentation, but must not block the basic camera.
    // If Cache Storage is unavailable or a model is missing, the camera uses its color-filter fallback.
    if ("caches" in window) void refreshAIModelInventory();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera cần Safari/Chrome hiện đại và kết nối HTTPS. Hãy mở AnhThu bằng Safari.");
      return;
    }
    if (cameraRequestRef.current) return;
    cameraRequestRef.current = true;
    setCameraStarting(true);
    try {
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
      const previousStream = streamRef.current;
      const actual = stream.getVideoTracks()[0]?.getSettings?.();
      setCameraQuality(actual?.width && actual?.height ? String(actual.width) + "×" + actual.height + (actual.frameRate ? " · " + Math.round(actual.frameRate) + " FPS" : "") : "Thiết bị tự chọn chất lượng");
      streamRef.current = stream;
      void refreshDevicePermissions();
      setFacing(nextFacing);
      setScreen("camera");
      if (videoRef.current) {
        const video = videoRef.current;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.srcObject = stream;
        try {
          await video.play();
          setCameraPlaybackBlocked(false);
        } catch {
          setCameraPlaybackBlocked(true);
          setError("Camera đã được cấp quyền nhưng Safari chưa phát hình. Chạm “Bật hình camera” để tiếp tục.");
        }
      }
      previousStream?.getTracks().forEach((track) => track.stop());
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
    } finally {
      cameraRequestRef.current = false;
      setCameraStarting(false);
    }
  }

  function capturePhoto() {
    if (!aiReady || !arReady) {
      showNotice("AI Face/ Skin chưa sẵn sàng · ảnh sẽ dùng bộ lọc màu cơ bản.");
    }
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
    if (!aiReady || !arReady) {
      setError("AI Beauty chưa sẵn sàng. Hãy chờ Face Tracking + Skin Segmentation khởi tạo xong trước khi quay.");
      return;
    }
    try {
      if (!streamRef.current) return;
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("Trình duyệt này chưa hỗ trợ quay video. Hãy cập nhật iOS/Safari.");
        return;
      }
      const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = audio;
      void refreshDevicePermissions();
      // Never silently record raw camera footage when the beauty canvas is unavailable.
      const processedCanvas = arCanvasRef.current;
      if (!processedCanvas?.captureStream) throw new Error("Thiết bị không hỗ trợ quay video từ canvas hiệu ứng.");
      processedVideoStreamRef.current = processedCanvas.captureStream(30);
      const processedTracks = processedVideoStreamRef.current.getVideoTracks();
      if (!processedTracks.length) throw new Error("Không thể tạo luồng video đã xử lý.");
      const sourceVideoTracks = processedTracks;
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
              <button className="tw-nav-feature" onClick={() => { setHomeMenuOpen(false); setActiveModule("setup"); setScreen("module"); }}><ShieldCheck/><span><b>Thiết lập ứng dụng</b><small>Cài app · tải AI · cấp quyền</small></span><ChevronRight/></button>
              <button className="tw-nav-feature" onClick={() => { setHomeMenuOpen(false); setShortVideoMode(false); setMode("image"); setError(""); setScreen("permission"); }}><Camera/><span><b>Camera làm đẹp</b><small>Chụp ảnh · quay video · AR</small></span><ChevronRight/></button>
              <div className="tw-nav-grid">
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("album");setScreen("module");}}><ImageIcon/><b>Album</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("editor");setScreen("module");}}><Aperture/><b>Chỉnh sửa ảnh</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("sharp");setScreen("module");}}><Zap/><b>Làm nét AI</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("beauty");setScreen("module");}}><Sparkles/><b>AI làm đẹp</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("effects");setScreen("module");}}><ScanFace/><b>Hiệu ứng</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("short-video");setShortVideoMode(true);setMode("video");setError("");setScreen("permission");}}><Clapperboard/><b>Video ngắn</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("docs");setScreen("module");}}><BookOpen/><b>Docs Beauty Skills</b></button>
                <button onClick={() => {setHomeMenuOpen(false);setActiveModule("ai-models");void refreshAIModelInventory();setScreen("module");}}><BrainCircuit/><b>Tải AI Models</b></button>
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
              <button onClick={() => {setBeautyCategory("face");setActiveBeautyTool("slim");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><ScanFace/></span><b>Tạo khối gương mặt</b><small>Đường nét tự nhiên</small></button>
              <button onClick={() => {setBeautyCategory("makeup");setActiveBeautyTool("hairTint");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><Sparkles/></span><b>Màu tóc</b><small>Thử tông màu tóc</small></button>
              <button onClick={() => {setBeautyCategory("face");setActiveBeautyTool("light");setMode("image");setShortVideoMode(false);setError("");setScreen("permission");}}><span><Zap/></span><b>Ánh sáng chân dung</b><small>Soft, studio, glow</small></button>
              <button onClick={() => {setActiveModule("editor");setScreen("module");}}><span><Aperture/></span><b>Màu phim & nền</b><small>Color grade, phông nền</small></button>
              <button onClick={() => {setActiveModule("sharp");setScreen("module");}}><span><ScanFace/></span><b>Phục hồi ảnh</b><small>Tăng nét và chi tiết</small></button>
              <button onClick={() => {setActiveModule("effects");setScreen("module");}}><span><Sparkles/></span><b>AR & sticker</b><small>Phụ kiện và hiệu ứng</small></button>
              <button onClick={() => {setActiveModule("short-video");setShortVideoMode(true);setMode("video");setScreen("module");}}><span><Video/></span><b>Video beauty</b><small>Quay clip dọc realtime</small></button>
              <button onClick={() => {setActiveModule("album");setScreen("module");}}><span><ImageIcon/></span><b>Thư viện riêng</b><small>Ảnh và video của bạn</small></button>
            </div>
          </section>
          <button className="tw-docs-home-card" onClick={() => {setActiveModule("docs");setActiveDocsTopic("overview");setScreen("module");}}><span><BookOpen size={20}/></span><div><b>Docs · Beauty Skills</b><small>12 hướng dẫn về AI Face, makeup, tóc, màu phim, video và preset.</small></div><ChevronRight size={18}/></button>
          <button className="tw-action-card" onClick={() => fileRef.current?.click()}><span className="tw-action-icon"><ImageIcon size={22}/></span><span className="tw-action-copy"><b>Chọn nhanh ảnh hoặc video</b><small>Mở bộ chọn ảnh an toàn của iOS / Android</small></span><ChevronRight size={18}/></button>
          <div className="tw-privacy-note"><ShieldCheck size={15}/><span><b>Riêng tư mặc định.</b> Ảnh/video chỉ ở trong trình duyệt, không tải lên máy chủ.</span></div>
          <footer className="tw-footer">ANHTHU BEAUTY · BẢN DÙNG THỬ PWA</footer>
        </section>
      )}
      {screen === "module" && (
        <section className="tw-module-screen">
          <header className="tw-preview-header">
            <button className="tw-back" onClick={() => setScreen("home")} aria-label="Quay lại"><ArrowLeft size={19}/></button>
            <div><b>{activeModule === "setup" ? "Thiết lập bắt buộc" : activeModule === "ai-models" ? "Tải AI Models" : activeModule === "docs" ? "Docs · Beauty Skills" : activeModule === "settings" ? "Cài đặt ứng dụng" : activeModule === "profile" ? "Hồ sơ của tôi" : activeModule === "album" ? "Album của tôi" : activeModule === "editor" ? "Chỉnh sửa ảnh" : activeModule === "sharp" ? "Làm nét ảnh AI" : activeModule === "beauty" ? "AI làm đẹp" : activeModule === "short-video" ? "Video ngắn" : "Hiệu ứng quốc tế"}</b><small>ANHTHU · KHÔNG GIAN RIÊNG TƯ</small></div>
          </header>
          {activeModule === "setup" ? (
            <div className="tw-ai-model-center">
              <div className="tw-ai-model-hero"><span><ShieldCheck size={26}/></span><div><b>Quy trình cài đặt tự động</b><p>AnhThu tự chạy lần lượt tải AI, xác minh model, xin quyền thiết bị và mở camera sau khi bạn cài ứng dụng.</p></div></div>
              <div className="tw-ai-model-note"><Cpu size={16}/><p><b>Trạng thái tự động:</b> {setupStage==="install"?"Đang chờ cài ứng dụng vào Màn hình chính":setupStage==="models"?"Đang tải và xác minh các model AI nâng cao":setupStage==="camera"?"Đang xin quyền camera · cần bạn xác nhận nếu iOS hỏi":setupStage==="ready"?"Đã hoàn tất thiết lập · đang mở camera": "Thiết lập tạm dừng · cần xử lý lỗi rồi thử lại"}.</p></div>
              <article className="tw-ai-model-card">
                <div className="tw-ai-model-card-top"><span className="tw-ai-model-icon"><Download size={21}/></span><div><b>Bước 1 · Cài ứng dụng AnhThu</b><small>{isStandalone ? "Đã chạy ở chế độ ứng dụng" : "Chưa cài · cần thêm vào Màn hình chính"}</small></div><span className={isStandalone?"tw-ai-model-installed":"tw-ai-model-cloud"}>{isStandalone?<Check size={14}/>:<Wifi size={14}/>}</span></div>
                <p><b>iPhone · Bản web:</b> mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính → Thêm. Mở icon THU365 để tự chạy cài AI và xin quyền camera. PWA không cần hồ sơ nhà phát triển hoặc mục Tin cậy.</p><p><b>iPhone · Bản native:</b> cài qua TestFlight khi bản iOS được ký và phát hành. Nếu tổ chức phân phối IPA nội bộ hợp lệ, iOS mới hiển thị nhà phát triển trong Cài đặt → Cài đặt chung → VPN &amp; Quản lý thiết bị để xác minh. Không thể bật Tin cậy từ website.</p><p>Android: dùng menu trình duyệt → Cài đặt ứng dụng / Add to Home screen.</p>
                <button className="tw-suite-primary" onClick={()=>{const installed=window.matchMedia?.("(display-mode: standalone)").matches||(navigator as any).standalone===true;setIsStandalone(Boolean(installed));if(installed){void runAutoSetup();}else{setSetupStage("install");showNotice("Hãy thêm AnhThu vào Màn hình chính rồi mở ứng dụng vừa cài.");}}}>Kiểm tra và tự chạy bước tiếp theo</button>
              </article>
              <article className="tw-ai-model-card">
                <div className="tw-ai-model-card-top"><span className="tw-ai-model-icon"><ShieldCheck size={21}/></span><div><b>Bản iOS native · IPA</b><small>Capacitor · camera · quyền iOS</small></div><span className="tw-ai-model-cloud"><Download size={14}/></span></div>
                <p>Đã chuẩn bị cấu hình native và quy trình build iOS. Để cài lên iPhone cần Apple Developer Team, Bundle ID đã đăng ký và chứng chỉ ký hợp lệ. Bản phát hành khuyến nghị qua TestFlight; phân phối IPA nội bộ cần provisioning profile phù hợp.</p>
                <button className="tw-suite-primary" onClick={()=>window.open("https://github.com/OCodejs/THU365-Beauty-Camera-Design/blob/feat/thu365-ios-pwa-native-install/ios/README.md","_blank","noopener,noreferrer")}>Xem hướng dẫn cài iOS native <ChevronRight size={15}/></button>
              </article>
              <article className="tw-ai-model-card">
                <div className="tw-ai-model-card-top"><span className="tw-ai-model-icon"><BrainCircuit size={21}/></span><div><b>Bước 2 · Tải và cài AI</b><small>Face Landmarker + Skin Segmentation · cần cho Face AI, không khóa camera cơ bản</small></div><span className="tw-ai-model-cloud"><Cpu size={14}/></span></div>
                <p>Hai model được tải và lưu trong Cache Storage riêng của ứng dụng. MediaPipe JavaScript runtime và WASM được tải tự động từ CDN khi khởi chạy AI; cần internet ở lần khởi tạo và không được tính là đã cài offline.</p>
                <button className="tw-suite-primary" onClick={()=>{const installed=window.matchMedia?.("(display-mode: standalone)").matches||(navigator as any).standalone===true;if(!installed){showNotice("Bước 1 chưa hoàn tất · cài AnhThu vào Màn hình chính rồi mở lại ứng dụng.");return;}void runAutoSetup();}}>Tự động tải AI và tiếp tục <ChevronRight size={15}/></button>
              </article>
              <article className="tw-ai-model-card">
                <div className="tw-ai-model-card-top"><span className="tw-ai-model-icon"><Camera size={21}/></span><div><b>Bước 3 · Cấp quyền thiết bị</b><small>Camera bắt buộc · Microphone khi quay video có tiếng</small></div></div>
                <p>Chỉ sau khi cài ứng dụng và tải đủ hai model, chạm nút dưới đây để Safari hiển thị yêu cầu quyền. Người dùng phải tự xác nhận; ứng dụng web không thể tự cấp quyền thay người dùng.</p>
                <button className="tw-suite-primary" disabled={!isStandalone||!AI_MODEL_PACKS.every(model=>!model.required||aiModelStates[model.id]?.installed)} onClick={()=>void runAutoSetup()}>Tiếp tục tự động · Xin quyền thiết bị</button>
              </article>
              <button className="tw-secondary" disabled={!isStandalone||!AI_MODEL_PACKS.filter(model=>model.required).every(model=>aiModelStates[model.id]?.installed)} onClick={()=>void runAutoSetup()}>Chạy lại quy trình tự động</button>
              <div className="tw-ai-model-note tw-ai-model-warning"><Wifi size={16}/><p><b>Điều kiện:</b> dùng HTTPS, trình duyệt hỗ trợ WebAssembly, WebGL/GPU hoặc CPU fallback, Cache Storage và có mạng khi tải runtime/WASM.</p></div>
              <button className="tw-secondary" onClick={()=>{setActiveModule("ai-models");void refreshAIModelInventory();}}>Tiếp tục cài AI Models</button>
            </div>
          ) : activeModule === "ai-models" ? (
            <div className="tw-ai-model-center">
              <div className="tw-ai-model-hero"><span><BrainCircuit size={26}/></span><div><b>AI Model Center</b><p>Tải, quản lý và xóa các mô hình AI dùng cho camera làm đẹp. Model được lưu trong bộ nhớ trình duyệt trên thiết bị này.</p></div></div>
              <div className="tw-ai-model-summary"><div><b>{Object.values(aiModelStates).filter(x=>x.installed).length}/{AI_MODEL_PACKS.length}</b><small>Model đã cài</small></div><div><b>{(Object.values(aiModelStates).reduce((n,x)=>n+x.bytes,0)/1048576).toFixed(1)} MB</b><small>Dung lượng đã lưu</small></div><button onClick={()=>void refreshAIModelInventory()}><RotateCcw size={14}/> Làm mới</button></div>
              <button className="tw-suite-primary" disabled={aiModelBusy||AI_MODEL_PACKS.filter(model=>model.required).every(model=>aiModelStates[model.id]?.installed)} onClick={()=>void downloadRequiredAIModels()}><Download size={15}/> Tải toàn bộ AI nâng cao</button>
              <div className="tw-ai-model-list">{AI_MODEL_PACKS.map(model=>{const state=aiModelStates[model.id]||{installed:false,bytes:0,downloading:false,progress:0,error:""};return <article className="tw-ai-model-card" key={model.id}>
                <div className="tw-ai-model-card-top"><span className="tw-ai-model-icon">{model.id==="face"?<ScanFace size={21}/>:<Sparkles size={21}/>}</span><div><b>{model.name}</b><small>{model.version} · {model.required?"Cốt lõi":"Tùy chọn"}</small></div><span className={state.installed?"tw-ai-model-installed":"tw-ai-model-cloud"}>{state.installed?<Check size={14}/>:<Wifi size={14}/>}</span></div>
                <p>{model.description}</p><div className="tw-ai-model-meta"><span><HardDrive size={13}/> {state.installed?(state.bytes/1048576).toFixed(2)+" MB đã lưu":model.sizeLabel}</span><span><Cpu size={13}/> Thiết bị</span></div>
                {state.downloading&&<div className="tw-ai-progress"><div style={{width:state.progress+"%"}}/></div>}{state.error&&<small className="tw-ai-model-error">{state.error}</small>}
                <div className="tw-ai-model-actions">{state.installed?<><button className="tw-suite-primary" onClick={()=>void refreshAIModelInventory()}><Check size={14}/> Đã cài đặt</button><button className="tw-ai-remove" onClick={()=>void removeAIModel(model)}><Trash2 size={14}/> Xóa</button></>:<button className="tw-suite-primary" disabled={state.downloading||aiModelBusy} onClick={()=>void downloadAIModel(model)}><Download size={14}/>{state.downloading?"Đang tải…":"Tải model về máy"}</button>}</div>
              </article>;})}</div>
              <div className="tw-ai-model-note"><ShieldCheck size={16}/><p><b>Riêng tư:</b> model được lưu trong Cache Storage trên thiết bị. Ảnh/video không được tải lên máy chủ.</p></div>
              <div className="tw-ai-model-note tw-ai-model-warning"><Wifi size={16}/><p><b>Thành phần ứng dụng:</b> Face Landmarker và Skin Segmentation cần được tải vào Cache Storage để bật Face AI; camera cơ bản vẫn hoạt động nếu tải model thất bại; MediaPipe JS runtime + WASM tải tự động từ CDN khi mở camera. Vì runtime/WASM chưa được đóng gói offline, kết nối internet vẫn bắt buộc khi khởi tạo AI.</p></div>
              <button className="tw-secondary" onClick={()=>{const standalone=window.matchMedia?.("(display-mode: standalone)").matches||(navigator as any).standalone===true;if(!standalone){setActiveModule("setup");showNotice("Cần cài AnhThu vào Màn hình chính trước.");return;}void startCamera();}}>Kiểm tra cài đặt và mở camera</button>
              <button className="tw-secondary" onClick={()=>{setActiveModule("settings");setScreen("module");}}>Mở chẩn đoán mạng & AI</button>
            </div>
          ) : activeModule === "docs" ? (
            <div className="tw-docs-hub">
              <div className="tw-docs-hero">
                <div className="tw-docs-hero-icon"><BookOpen size={25}/></div>
                <span>ANHTHU BEAUTY KNOWLEDGE BASE</span>
                <h2>Beauty Skills Docs</h2>
                <p>Hướng dẫn sử dụng, giải thích kỹ thuật và lộ trình phát triển từng kỹ năng làm đẹp. Chọn một chủ đề để đọc hướng dẫn chi tiết.</p>
                <div className="tw-docs-meta"><span><BookOpen size={12}/> 12 hướng dẫn</span><span><BrainCircuit size={12}/> AI & AR</span><span><ShieldCheck size={12}/> Privacy-first</span></div>
              </div>
              <div className="tw-docs-notice"><ShieldCheck size={17}/><p><b>Minh bạch tính năng:</b> tài liệu phân biệt công cụ đang có, tính năng cần model AI và hạng mục đang lên kế hoạch. Không phải hướng dẫn nào cũng đồng nghĩa model đã được cài đặt.</p></div>
              <div className="tw-docs-inspiration">
                <div><span>LOOKBOOK</span><b>Ảnh phong cách tham khảo</b><small>Chọn look để áp dụng ngay trong camera</small></div>
                <div className="tw-docs-look-grid">
                  {BEAUTY_REFERENCES.map((reference) => <button key={reference.id} onClick={() => {applyReferenceLook(reference);setShortVideoMode(false);setMode("image");setError("");setScreen("permission");}}>
                    <img src={reference.image} alt={reference.name} loading="lazy"/><b>{reference.name}</b><small>{reference.gender} · {reference.beauty}%</small>
                  </button>)}
                </div>
              </div>
              <div className="tw-docs-topic-list">
                {[
                  {id:"overview",icon:<Sparkles/>,title:"Bắt đầu với AnhThu Beauty",tag:"CƠ BẢN",desc:"Luồng camera, chọn ảnh mẫu, áp dụng preset và lưu kết quả."},
                  {id:"face",icon:<ScanFace/>,title:"AI Face Tracking & Landmark",tag:"AI / AR",desc:"Theo dõi khuôn mặt, điểm mắt-mũi-môi, độ ổn định và giới hạn."},
                  {id:"skin",icon:<BrainCircuit/>,title:"Skin Analysis & Glass Skin",tag:"AI MODEL",desc:"Phân vùng da, làm mịn có bảo toàn texture và kiểm soát cường độ."},
                  {id:"makeup",icon:<Palette/>,title:"Makeup Studio",tag:"MAKEUP",desc:"Son, má hồng, eyeliner, lông mày và phối màu theo tông da."},
                  {id:"face-shape",icon:<ScanFace/>,title:"Face Sculpt & Eye Styling",tag:"CHỈNH SỬA",desc:"Tinh chỉnh gương mặt nhẹ, cân đối mắt và giữ tỷ lệ tự nhiên."},
                  {id:"hair",icon:<WandSparkles/>,title:"Hair Color & Hairstyle",tag:"THỬ KIỂU",desc:"Thử màu tóc, mái, kiểu tóc và phụ kiện bằng ảnh tham chiếu."},
                  {id:"light",icon:<Zap/>,title:"Portrait Lighting & Color Lab",tag:"MÀU SẮC",desc:"Ánh sáng studio, tông phim, cân bằng trắng và màu nền."},
                  {id:"background",icon:<ImageIcon/>,title:"Background & Portrait Cutout",tag:"ẢNH",desc:"Tách chủ thể, xóa phông, thay nền và đổ bóng."},
                  {id:"ar",icon:<Aperture/>,title:"AR Effects, Stickers & Lenses",tag:"AR",desc:"Sticker bám mặt, kính, phụ kiện và hiệu ứng theo chuyển động."},
                  {id:"video",icon:<Video/>,title:"Realtime Video & Creator",tag:"VIDEO",desc:"Quay dọc, chống rung, âm thanh, filter và xuất video."},
                  {id:"reference",icon:<ImageIcon/>,title:"Reference Matching & Before/After",tag:"WORKFLOW",desc:"Dùng ảnh mẫu làm định hướng, so sánh trước-sau và tinh chỉnh."},
                  {id:"presets",icon:<Bookmark/>,title:"Preset Library & Personal Looks",tag:"CÁ NHÂN",desc:"Lưu cấu hình, đặt tên preset, áp dụng lại và quản lý bộ sưu tập."}
                ].map((item) => <button key={item.id} className={activeDocsTopic===item.id?"is-active":""} onClick={() => setActiveDocsTopic(item.id)}>
                  <span className="tw-docs-topic-icon">{item.icon}</span><span className="tw-docs-topic-copy"><b>{item.title}</b><small>{item.desc}</small></span><span className="tw-docs-topic-tag">{item.tag}</span><ChevronRight size={15}/>
                </button>)}
              </div>
              <article className="tw-docs-article">
                <div className="tw-docs-example">
                  <img src={activeDocsReference.image} alt={activeDocsReference.name} loading="lazy"/>
                  <div><span>LOOK THAM KHẢO · {activeDocsReference.gender.toUpperCase()}</span><b>{activeDocsReference.name}</b><small>{activeDocsReference.description}</small>
                    <button onClick={() => {applyReferenceLook(activeDocsReference);setShortVideoMode(false);setMode("image");setError("");setScreen("permission");}}><Camera size={14}/> Thử phong cách này</button>
                  </div>
                </div>
                {activeDocsTopic==="overview" ? <>
                  <span className="tw-docs-kicker">GETTING STARTED</span><h3>Bắt đầu trong 4 bước</h3>
                  <ol><li>Mở Camera Beauty và cấp quyền camera khi iPhone/Safari hỏi.</li><li>Chọn phong cách mẫu hoặc preset có sẵn; mẫu chỉ là gợi ý màu và makeup.</li><li>Chuyển sang Thủ công để tinh chỉnh từng thông số, hoặc Auto để dùng cấu hình gợi ý.</li><li>Chụp/quay, xem trước, sau đó lưu hoặc chia sẻ kết quả.</li></ol>
                  <div className="tw-docs-tip"><b>Mẹo:</b> dùng ánh sáng trước mặt, tránh đèn ngược sáng và giữ khuôn mặt trong khung để tracking ổn định hơn.</div>
                </> : activeDocsTopic==="face" ? <>
                  <span className="tw-docs-kicker">FACE LANDMARK</span><h3>AI Face Tracking & Landmark</h3><p>Pipeline dự kiến: camera frame → face detection → landmark smoothing → face mesh/region mapping → render AR. Điểm landmark là tọa độ hình học, không phải kết luận về danh tính hay đặc điểm nhạy cảm.</p><ul><li>Giữ mặt trong khung, tránh che mắt/mũi/miệng.</li><li>Ánh sáng đủ và chuyển động vừa phải giúp giảm rung hiệu ứng.</li><li>Hiển thị trạng thái rõ: đang tải model, đang tracking, mất khuôn mặt hoặc lỗi model.</li></ul>
                </> : activeDocsTopic==="skin" ? <>
                  <span className="tw-docs-kicker">SKIN SEGMENTATION</span><h3>Skin Analysis & Glass Skin</h3><p>Phân vùng da cần model segmentation chuyên dụng. Bộ lọc CSS chỉ thay đổi màu/độ sáng, không phải phân tích da hoặc làm mịn theo vùng bằng AI.</p><ul><li>Ưu tiên giữ lỗ chân lông và chi tiết tự nhiên.</li><li>Điều chỉnh riêng vùng trán, má, cằm; tránh làm mịn mắt, tóc và nền.</li><li>Có thanh cường độ, nút tắt hiệu ứng và so sánh trước/sau.</li></ul>
                </> : activeDocsTopic==="makeup" ? <>
                  <span className="tw-docs-kicker">VIRTUAL MAKEUP</span><h3>Makeup Studio</h3><p>Chia makeup thành lớp độc lập để có thể chỉnh màu và độ đậm riêng: môi, má, eyeliner, chân mày và highlight.</p><ul><li>Chọn bảng màu theo tông ấm, lạnh hoặc trung tính.</li><li>Điều chỉnh opacity và feather để viền makeup mềm.</li><li>Lưu tổ hợp makeup thành preset cá nhân.</li></ul>
                </> : activeDocsTopic==="face-shape" ? <>
                  <span className="tw-docs-kicker">FACIAL CONTROLS</span><h3>Face Sculpt & Eye Styling</h3><p>Chỉ nên dùng biến đổi cường độ thấp và có giới hạn, giữ tỷ lệ tự nhiên, tránh méo nền hoặc viền tóc.</p><ul><li>Điều chỉnh từng vùng và có nút reset từng thông số.</li><li>Kiểm tra ở nhiều góc mặt trước khi xuất ảnh.</li><li>Không áp dụng biến đổi khi tracking không ổn định.</li></ul>
                </> : activeDocsTopic==="hair" ? <>
                  <span className="tw-docs-kicker">HAIR LAB</span><h3>Hair Color & Hairstyle</h3><p>Đổi màu tóc chính xác cần phân vùng tóc; thử kiểu tóc cần ảnh tham chiếu hoặc mô hình tạo ảnh riêng.</p><ul><li>Chọn màu, độ bão hòa, độ sáng và độ trong suốt.</li><li>Giữ vùng da và nền không bị nhuộm màu.</li><li>Ảnh mẫu là tham chiếu phong cách, không bảo đảm tái tạo kiểu tóc chính xác.</li></ul>
                </> : activeDocsTopic==="light" ? <>
                  <span className="tw-docs-kicker">COLOR & LIGHT</span><h3>Portrait Lighting & Color Lab</h3><p>Bộ công cụ màu gồm exposure, contrast, highlights, shadows, temperature, tint, saturation, vibrance và tone curve.</p><ul><li>Dùng preset làm điểm bắt đầu, sau đó tinh chỉnh thủ công.</li><li>Tránh clipping vùng sáng trên da và giữ màu trắng trung tính.</li><li>Cho phép lưu thông số màu thành look riêng.</li></ul>
                </> : activeDocsTopic==="background" ? <>
                  <span className="tw-docs-kicker">BACKGROUND STUDIO</span><h3>Background & Portrait Cutout</h3><p>Tách nền cần model segmentation chủ thể. Sau khi có mask, có thể thay nền, làm mờ hậu cảnh và tạo bóng mềm.</p><ul><li>Kiểm tra viền tóc và vai ở mức zoom cao.</li><li>Hỗ trợ ảnh nền riêng do người dùng chọn.</li><li>Không tải ảnh riêng tư lên dịch vụ ngoài khi chưa có sự đồng ý.</li></ul>
                </> : activeDocsTopic==="ar" ? <>
                  <span className="tw-docs-kicker">AUGMENTED REALITY</span><h3>AR Effects, Stickers & Lenses</h3><p>Sticker gắn vào landmark hoặc anchor 3D; hiệu ứng cần cập nhật theo từng frame và xử lý mất tracking an toàn.</p><ul><li>Chọn sticker, scale, rotation và vị trí.</li><li>Hỗ trợ nhiều khuôn mặt nếu thiết bị đủ hiệu năng.</li><li>Tự ẩn sticker khi mất tracking, không để hiệu ứng trôi trên màn hình.</li></ul>
                </> : activeDocsTopic==="video" ? <>
                  <span className="tw-docs-kicker">VIDEO CREATOR</span><h3>Realtime Video & Creator</h3><p>Luồng video gồm camera preview, beauty render, ghi hình, âm thanh, xem trước và xuất file. Hiệu năng phụ thuộc thiết bị và trình duyệt.</p><ul><li>Ưu tiên 1080p/30fps làm cấu hình mặc định ổn định.</li><li>Kiểm tra microphone riêng và xin quyền đúng lúc.</li><li>Thông báo rõ khi trình duyệt không hỗ trợ codec hoặc độ phân giải.</li></ul>
                </> : activeDocsTopic==="reference" ? <>
                  <span className="tw-docs-kicker">REFERENCE MATCH</span><h3>Reference Matching & Before/After</h3><p>Ảnh mẫu nên dùng để tham khảo ánh sáng, màu sắc và makeup. Không nên sao chép danh tính hoặc tự động biến đổi khuôn mặt để giống một người cụ thể.</p><ul><li>Chọn ảnh tham chiếu có quyền sử dụng.</li><li>So sánh cùng khung hình và cùng điều kiện ánh sáng.</li><li>Dùng thanh kéo trước/sau và có thể hoàn tác.</li></ul>
                </> : <>
                  <span className="tw-docs-kicker">PRESET WORKFLOW</span><h3>Preset Library & Personal Looks</h3><p>Một preset nên lưu thông số hiệu ứng, tên, mô tả và thời điểm cập nhật. Lưu cục bộ trước; đồng bộ đám mây là tính năng riêng cần đăng nhập và sự đồng ý.</p><ul><li>Lưu cấu hình hiện tại với tên do bạn đặt.</li><li>Áp dụng lại preset, nhân bản hoặc xóa.</li><li>Không ghi đè ảnh gốc; luôn giữ bản xuất riêng.</li></ul>
                </>}
              </article>
              <section className="tw-skills-suite">
                <div className="tw-skills-suite-heading"><span>BEAUTY WORKSPACE</span><b>6 công cụ mở rộng</b><small>Thử trực tiếp các thao tác và lưu cấu hình trên thiết bị này.</small></div>
                <div className="tw-skills-suite-tabs">
                  {[
                    {id:"library",label:"1 · Skill Library",icon:<Sparkles size={14}/>},
                    {id:"presets-lab",label:"2 · Presets",icon:<Bookmark size={14}/>},
                    {id:"compare-lab",label:"3 · Before / After",icon:<SlidersHorizontal size={14}/>},
                    {id:"assistant-lab",label:"4 · AI Assistant",icon:<BrainCircuit size={14}/>},
                    {id:"color-lab",label:"5 · Color Lab",icon:<Palette size={14}/>},
                    {id:"video-lab",label:"6 · Video Effects",icon:<Video size={14}/>}
                  ].map(t=><button key={t.id} className={activeDocsTopic===t.id?"is-active":""} onClick={()=>setActiveDocsTopic(t.id)}>{t.icon}{t.label}</button>)}
                </div>
                {activeDocsTopic==="library" ? <div className="tw-skills-suite-panel">
                  <h3>Beauty Skill Library</h3><p>Tìm nhanh kỹ năng và mở hướng dẫn tương ứng.</p>
                  <input value={beautySkillQuery} onChange={e=>setBeautySkillQuery(e.target.value)} placeholder="Tìm makeup, tóc, da, video..."/>
                  <div className="tw-skill-library-grid">{[
                    ["Face & Skin","skin","Phân vùng da · Glass Skin"],["Makeup","makeup","Son · Má · Eyeliner"],["Hair Studio","hair","Màu tóc · Kiểu tóc"],["Portrait Light","light","Ánh sáng · Tông phim"],["Background","background","Tách nền · Phông ảnh"],["AR Effects","ar","Sticker · Phụ kiện"],["Video Creator","video","Quay · Filter · Xuất video"],["Face Sculpt","face-shape","Tinh chỉnh đường nét"]
                  ].filter(x=>(x[0]+" "+x[2]).toLowerCase().includes(beautySkillQuery.toLowerCase())).map(x=><button key={x[1]} onClick={()=>setActiveDocsTopic(x[1])}><b>{x[0]}</b><small>{x[2]}</small><ChevronRight size={14}/></button>)}</div>
                </div> : activeDocsTopic==="presets-lab" ? <div className="tw-skills-suite-panel">
                  <h3>Preset Manager</h3><p>Lưu cấu hình làm đẹp hiện tại vào bộ nhớ cục bộ của trình duyệt.</p>
                  <input value={beautyPresetName} onChange={e=>setBeautyPresetName(e.target.value)} placeholder="Tên preset"/>
                  <button className="tw-suite-primary" onClick={()=>{const name=beautyPresetName.trim();if(!name){showNotice("Hãy nhập tên preset");return;}const next=[...savedPresets,{name,settings:{...arSettings},preset,beauty,autoProfile}];setSavedPresets(next);localStorage.setItem("anhthu-ar-presets",JSON.stringify(next));showNotice("Đã lưu preset trên thiết bị");}}> <Bookmark size={14}/> Lưu cấu hình hiện tại</button>
                  <div className="tw-saved-presets">{savedPresets.length?savedPresets.map((p,i)=><div key={p.name+"-"+i}><span><b>{p.name}</b><small>{p.preset||"custom"} · {p.beauty??35}%</small></span><button onClick={()=>{setArSettings({...p.settings});if(p.preset)setPreset(p.preset);if(p.beauty!==undefined)setBeauty(p.beauty);if(p.autoProfile)setAutoProfile(p.autoProfile);showNotice("Đã áp dụng "+p.name);}}>Áp dụng</button><button aria-label="Xóa preset" onClick={()=>{const next=savedPresets.filter((_,j)=>j!==i);setSavedPresets(next);localStorage.setItem("anhthu-ar-presets",JSON.stringify(next));}}>×</button></div>):<small>Chưa có preset nào được lưu.</small>}</div>
                </div> : activeDocsTopic==="compare-lab" ? <div className="tw-skills-suite-panel">
                  <h3>Before / After Lab</h3><p>{mediaUrl?"Kéo thanh để điều chỉnh vùng xem trước.":"Chụp hoặc chọn ảnh trong công cụ chỉnh sửa để có ảnh thật cho so sánh."}</p>
                  {mediaUrl ? <div className="tw-compare-preview"><img src={mediaUrl} alt="Ảnh xem trước"/><div style={{clipPath:"inset(0 "+(100-beautyCompareValue)+"% 0 0)"}}><img src={mediaUrl} alt="Ảnh gốc"/></div><input aria-label="Thanh so sánh trước và sau" type="range" min="0" max="100" value={beautyCompareValue} onChange={e=>setBeautyCompareValue(Number(e.target.value))}/></div> : <button className="tw-suite-primary" onClick={()=>{setActiveModule("editor");setScreen("module");}}>Mở chỉnh sửa ảnh để chọn ảnh</button>}
                  <label>Vị trí thanh so sánh · {beautyCompareValue}%</label><input type="range" min="0" max="100" value={beautyCompareValue} onChange={e=>setBeautyCompareValue(Number(e.target.value))}/>
                </div> : activeDocsTopic==="assistant-lab" ? <div className="tw-skills-suite-panel">
                  <h3>AnhThu Beauty Assistant</h3><p>Chọn mục tiêu để nhận preset gợi ý. Đây là gợi ý theo cấu hình cục bộ, không phải kết quả phân tích AI khuôn mặt.</p>
                  <div className="tw-assistant-choices">{[["natural","Tự nhiên"],["glass","Glass Skin"],["douyin","Douyin Glam"],["soft","Soft Portrait"]].map(x=><button className={beautyAssistantChoice===x[0]?"is-active":""} key={x[0]} onClick={()=>setBeautyAssistantChoice(x[0])}>{x[1]}</button>)}</div>
                  <div className="tw-assistant-result"><BrainCircuit size={19}/><span><b>Gợi ý: {beautyAssistantChoice}</b><small>Ưu tiên cường độ vừa phải, ánh sáng mềm và giữ chi tiết da.</small></span></div>
                  <button className="tw-suite-primary" onClick={()=>{applyAutoBeauty(beautyAssistantChoice==="glass"?"cloud":beautyAssistantChoice==="douyin"?"softglam":beautyAssistantChoice==="soft"?"soft":"natural");setShortVideoMode(false);setMode("image");setError("");setScreen("permission");}}>Áp dụng gợi ý và mở camera</button>
                </div> : activeDocsTopic==="color-lab" ? <div className="tw-skills-suite-panel">
                  <h3>Color & Background Lab</h3><p>Điều chỉnh bảng màu thử nghiệm và lưu cùng preset.</p>
                  {([["warmth","Nhiệt độ màu"],["tone","Tông màu"],["glow","Glow / ánh sáng"]] as const).map(([k,label])=><label key={k}>{label} · {beautyColorValues[k]}<input type="range" min="0" max="100" value={beautyColorValues[k]} onChange={e=>setBeautyColorValues(v=>({...v,[k]:Number(e.target.value)}))}/></label>)}
                  <div className="tw-color-swatch" style={{filter:"hue-rotate("+((beautyColorValues.warmth-50)*.7)+"deg) saturate("+(0.7+beautyColorValues.tone/100)+") brightness("+(0.8+beautyColorValues.glow/250)+")"}}/>
                  <small>Thanh màu là bản xem trước giao diện; cần pipeline color grading để áp dụng vào file ảnh/video xuất ra.</small>
                </div> : activeDocsTopic==="video-lab" ? <div className="tw-skills-suite-panel">
                  <h3>Video Effects Lab</h3><p>Chọn chế độ quay và mở camera video để thử các điều khiển hiện có.</p>
                  <div className="tw-video-lab-options"><button onClick={()=>{setMode("video");setShortVideoMode(false);setError("");setScreen("permission");}}>Video thường · Camera</button><button onClick={()=>{setMode("video");setShortVideoMode(true);setError("");setScreen("permission");}}>Video ngắn · Creator</button></div>
                  <ul><li>Kiểm tra quyền camera trước khi quay.</li><li>Kiểm tra dung lượng và thời lượng trước khi xuất.</li><li>Hiệu ứng AI video cần model realtime tương thích thiết bị.</li></ul>
                </div> : null}
              </section>
              <div className="tw-docs-footer"><BookOpen size={15}/><span>Tài liệu hướng dẫn phiên bản thử nghiệm. Trạng thái AI phụ thuộc model thực tế được tích hợp trong bản đang chạy.</span></div>
            </div>
          ) : activeModule === "settings" ? (
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
                <small className="tw-ai-note">Trạng thái model được đọc trực tiếp từ Cache Storage trên thiết bị hiện tại. Kết nối được máy chủ không đồng nghĩa model đã tải; AI chỉ được xác nhận sẵn sàng sau khi Face Landmarker và Skin Segmentation khởi tạo thành công trong camera.</small>
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
            {cameraPlaybackBlocked && <div className="tw-camera-playback-prompt" role="alert"><b>Camera đã được cấp quyền</b><span>Safari cần thao tác chạm để phát luồng hình ảnh.</span><button type="button" onClick={() => {const video=videoRef.current;if(!video)return;void video.play().then(()=>{setCameraPlaybackBlocked(false);setError("");}).catch(()=>setError("Safari vẫn chưa phát được camera. Hãy kiểm tra quyền Camera và tải lại trang."));}}>Bật hình camera</button></div>}
            <div className="tw-live-shade" />
            <header className="tw-camera-header">
              <button className="tw-glass" onClick={returnHome} aria-label="Đóng camera"><X size={21} /></button>
              <div className="tw-camera-title-pill"><Sparkles size={14} /> AnhThu Beauty Studio</div>
              <button className="tw-glass" disabled={cameraStarting} onClick={() => void startCamera(facing === "user" ? "environment" : "user")} aria-label="Đổi camera"><FlipHorizontal2 size={20} /></button>
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
        .tw-camera-screen{min-height:100dvh;background:#090909}.tw-camera-playback-prompt{position:absolute;z-index:8;left:50%;top:42%;transform:translate(-50%,-50%);width:min(86%,340px);display:grid;gap:10px;padding:18px;border:1px solid #e5b6aa66;border-radius:16px;background:#171313ee;color:#fff;text-align:center;box-shadow:0 16px 48px #0009}.tw-camera-playback-prompt span{color:#d4c5bf;font-size:12px;line-height:1.5}.tw-camera-playback-prompt button{min-height:42px;border:0;border-radius:10px;background:#e5b6aa;color:#211715;font-weight:800}.tw-camera-view{height:100dvh;min-height:560px;position:relative;overflow:hidden;background:#161313}
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
        .tw-docs-hub{display:grid;gap:14px;padding-bottom:18px}
        .tw-docs-hero{position:relative;overflow:hidden;padding:22px 18px;border:1px solid #e5b6aa42;border-radius:20px;background:radial-gradient(circle at 90% 10%,#e5b6aa26,transparent 38%),linear-gradient(145deg,#24191a,#100e10)}
        .tw-docs-hero-icon{width:48px;height:48px;display:grid;place-items:center;margin-bottom:14px;border-radius:15px;background:#e5b6aa24;color:#f0c7bb}
        .tw-docs-hero>span{font-size:8px;letter-spacing:.17em;color:#e5b6aa;font-weight:800}
        .tw-docs-hero h2{margin:7px 0;font:500 27px Georgia,serif;color:#fff0e9}
        .tw-docs-hero p{max-width:540px;margin:0;color:#c7b8b2;font-size:11px;line-height:1.65}
        .tw-docs-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}
        .tw-docs-meta span{display:flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid #ffffff1b;border-radius:99px;color:#eadbd5;font-size:8px}
        .tw-docs-notice{display:flex;align-items:flex-start;gap:9px;padding:12px;border:1px solid #72f4cb32;border-radius:13px;background:#72f4cb0a;color:#b9e9da}
        .tw-docs-notice svg{flex:0 0 auto;margin-top:2px}.tw-docs-notice p{margin:0;font-size:9px;line-height:1.55}
        .tw-docs-topic-list{display:grid;gap:7px}
        .tw-docs-topic-list>button{display:grid;grid-template-columns:35px minmax(0,1fr) auto 14px;align-items:center;gap:9px;min-height:67px;padding:10px;border:1px solid #ffffff18;border-radius:13px;background:#ffffff08;color:#f6e9e4;text-align:left}
        .tw-docs-topic-list>button.is-active{border-color:#e5b6aa;background:#e5b6aa14}
        .tw-docs-topic-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#e5b6aa1c;color:#e5b6aa}
        .tw-docs-topic-icon svg{width:17px;height:17px}
        .tw-docs-topic-copy{display:grid;gap:4px;min-width:0}.tw-docs-topic-copy b{font-size:10px;line-height:1.3}.tw-docs-topic-copy small{font-size:8px;color:#b9aaa4;line-height:1.4}
        .tw-docs-topic-tag{font-size:7px;letter-spacing:.06em;color:#e5b6aa;white-space:nowrap}
        .tw-docs-topic-list>button>svg:last-child{color:#9c8982}
        .tw-docs-article{padding:16px;border:1px solid #e5b6aa38;border-radius:15px;background:linear-gradient(145deg,#21191a,#111012)}
        .tw-docs-kicker{font-size:8px;letter-spacing:.16em;color:#e5b6aa;font-weight:800}
        .tw-docs-article h3{margin:7px 0 10px;font:500 20px Georgia,serif;color:#fff0e9}
        .tw-docs-article p,.tw-docs-article li{font-size:10px;line-height:1.7;color:#c8bbb5}
        .tw-docs-article p{margin:0 0 9px}.tw-docs-article ul,.tw-docs-article ol{padding-left:18px;margin:8px 0}
        .tw-docs-article li{padding:3px 0}
        .tw-docs-tip{margin-top:12px;padding:11px;border-left:2px solid #e5b6aa;border-radius:0 9px 9px 0;background:#e5b6aa12;color:#eadbd5;font-size:9px;line-height:1.6}
        .tw-docs-footer{display:flex;align-items:flex-start;gap:8px;color:#a99b96;font-size:8px;line-height:1.5}
        .tw-docs-footer svg{flex:0 0 auto;color:#e5b6aa}
        @media(max-width:380px){.tw-docs-topic-list>button{grid-template-columns:32px minmax(0,1fr) 13px}.tw-docs-topic-tag{display:none}.tw-docs-hero h2{font-size:24px}}
        .tw-docs-home-card{width:100%;display:flex;align-items:center;gap:11px;margin:5px 0 14px;padding:13px;border:1px solid #e5b6aa55;border-radius:15px;background:linear-gradient(110deg,#e5b6aa1c,#ffffff08);color:#f6e8e2;text-align:left}
        .tw-docs-home-card>span{width:39px;height:39px;display:grid;place-items:center;flex:0 0 auto;border-radius:12px;background:#e5b6aa24;color:#e5b6aa}
        .tw-docs-home-card>div{display:grid;gap:4px;min-width:0;flex:1}.tw-docs-home-card b{font-size:11px}.tw-docs-home-card small{font-size:9px;color:#b8aaa4;line-height:1.45}
        .tw-docs-inspiration{padding:13px;border:1px solid #e5b6aa38;border-radius:16px;background:linear-gradient(145deg,#21191a,#111012)}
        .tw-docs-inspiration>div:first-child{display:grid;gap:4px;margin-bottom:10px}.tw-docs-inspiration>div:first-child span{font-size:8px;letter-spacing:.15em;color:#e5b6aa;font-weight:800}.tw-docs-inspiration>div:first-child b{font:500 17px Georgia,serif;color:#fff0e9}.tw-docs-inspiration>div:first-child small{font-size:9px;color:#b9aaa4}
        .tw-docs-look-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
        .tw-docs-look-grid button{min-width:0;padding:0 0 8px;overflow:hidden;border:1px solid #ffffff1a;border-radius:11px;background:#ffffff08;color:#f7eae4;text-align:left}
        .tw-docs-look-grid img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover}
        .tw-docs-look-grid b,.tw-docs-look-grid small{display:block;padding:0 6px}.tw-docs-look-grid b{margin-top:6px;font-size:8px;line-height:1.35}.tw-docs-look-grid small{margin-top:3px;color:#c2aaa0;font-size:7px}
        .tw-docs-example{display:grid;grid-template-columns:112px minmax(0,1fr);gap:12px;margin-bottom:14px;padding:10px;border:1px solid #e5b6aa45;border-radius:13px;background:#e5b6aa0d}
        .tw-docs-example>img{width:100%;height:145px;object-fit:cover;border-radius:9px}
        .tw-docs-example>div{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0}
        .tw-docs-example span{font-size:7px;letter-spacing:.12em;color:#e5b6aa;font-weight:800}.tw-docs-example b{font:500 14px Georgia,serif;color:#fff0e9}.tw-docs-example small{font-size:8px;line-height:1.45;color:#c8bbb5}
        .tw-docs-example button{display:flex;align-items:center;gap:6px;margin-top:auto;padding:8px 10px;border:0;border-radius:9px;background:#e5b6aa;color:#24191a;font-size:9px;font-weight:800}
        @media(max-width:380px){.tw-docs-look-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tw-docs-example{grid-template-columns:90px minmax(0,1fr)}.tw-docs-example>img{height:125px}}
        .tw-skills-suite{display:grid;gap:10px;margin:12px 0;padding:13px;border:1px solid #e5b6aa42;border-radius:17px;background:linear-gradient(145deg,#21191a,#100f11)}
        .tw-skills-suite-heading{display:grid;gap:4px}.tw-skills-suite-heading span{font-size:8px;letter-spacing:.15em;color:#e5b6aa;font-weight:800}.tw-skills-suite-heading b{font:500 19px Georgia,serif;color:#fff0e9}.tw-skills-suite-heading small{font-size:9px;color:#bbaea8}
        .tw-skills-suite-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        .tw-skills-suite-tabs button{display:flex;align-items:center;gap:6px;min-height:37px;padding:7px;border:1px solid #ffffff20;border-radius:9px;background:#ffffff08;color:#e9dcd6;font-size:9px;text-align:left}
        .tw-skills-suite-tabs button.is-active{border-color:#e5b6aa;background:#e5b6aa20;color:#fff}
        .tw-skills-suite-panel{display:grid;gap:10px;padding:12px;border:1px solid #ffffff1b;border-radius:12px;background:#ffffff07}
        .tw-skills-suite-panel h3{margin:0;font:500 18px Georgia,serif;color:#fff0e9}.tw-skills-suite-panel p{margin:0;color:#bcaea8;font-size:9px;line-height:1.55}
        .tw-skills-suite-panel input:not([type=range]){width:100%;padding:10px;border:1px solid #ffffff25;border-radius:9px;background:#090809;color:#fff;font-size:11px}
        .tw-skills-suite-panel label{display:grid;gap:6px;color:#e9dcd6;font-size:9px}.tw-skills-suite-panel input[type=range]{width:100%;accent-color:#e5b6aa}
        .tw-skill-library-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.tw-skill-library-grid button{display:grid;grid-template-columns:1fr 14px;gap:4px;padding:10px;border:1px solid #ffffff1c;border-radius:9px;background:#ffffff08;color:#fff;text-align:left}.tw-skill-library-grid b{font-size:9px}.tw-skill-library-grid small{grid-column:1;font-size:8px;color:#bbaea8}.tw-skill-library-grid svg{grid-column:2;grid-row:1/3;align-self:center}
        .tw-suite-primary{display:flex;justify-content:center;align-items:center;gap:7px;padding:11px;border:0;border-radius:9px;background:#e5b6aa;color:#211719;font-size:10px;font-weight:800}
        .tw-saved-presets{display:grid;gap:6px}.tw-saved-presets>div{display:flex;align-items:center;gap:6px;padding:8px;border:1px solid #ffffff18;border-radius:9px}.tw-saved-presets span{display:grid;gap:3px;flex:1}.tw-saved-presets b{font-size:9px}.tw-saved-presets small{font-size:8px;color:#bbaea8}.tw-saved-presets button{padding:7px;border:1px solid #ffffff24;border-radius:7px;background:#ffffff0a;color:#f2ded6;font-size:8px}
        .tw-compare-preview{position:relative;overflow:hidden;aspect-ratio:4/3;border-radius:10px}.tw-compare-preview>img,.tw-compare-preview>div,.tw-compare-preview>div>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.tw-compare-preview>input{position:absolute;inset:auto 8px 8px;width:calc(100% - 16px)}
        .tw-assistant-choices,.tw-video-lab-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.tw-assistant-choices button,.tw-video-lab-options button{padding:9px;border:1px solid #ffffff24;border-radius:9px;background:#ffffff08;color:#eee;font-size:9px}.tw-assistant-choices button.is-active{border-color:#e5b6aa;background:#e5b6aa22}
        .tw-assistant-result{display:flex;align-items:center;gap:9px;padding:10px;border-radius:10px;background:#e5b6aa12;color:#e5b6aa}.tw-assistant-result span{display:grid;gap:4px}.tw-assistant-result b{font-size:9px}.tw-assistant-result small{font-size:8px;color:#c5b4ad}
        .tw-color-swatch{height:68px;border-radius:10px;background:linear-gradient(110deg,#59454a,#d9a89b,#f4d4ba,#7b6d80,#28232b)}
        @media(max-width:380px){.tw-skills-suite-tabs button{font-size:8px}.tw-skill-library-grid{grid-template-columns:1fr}}
      .tw-ai-model-center{display:grid;gap:13px;padding:14px 0 24px}.tw-ai-model-hero{display:flex;gap:12px;align-items:center;padding:16px;border:1px solid #e5b6aa44;border-radius:17px;background:linear-gradient(135deg,#e5b6aa20,#ffffff05)}.tw-ai-model-hero>span{width:48px;height:48px;display:grid;place-items:center;flex:0 0 auto;border-radius:15px;background:#e5b6aa24;color:#e5b6aa}.tw-ai-model-hero b{font:500 20px Georgia,serif;color:#fff0e9}.tw-ai-model-hero p{margin:5px 0 0;color:#c6b8b2;font-size:11px;line-height:1.5}.tw-ai-model-summary{display:grid;grid-template-columns:1fr 1fr auto;align-items:center;gap:8px;padding:12px;border-radius:14px;background:#ffffff09}.tw-ai-model-summary>div{display:grid;gap:3px}.tw-ai-model-summary b{font-size:16px;color:#fff}.tw-ai-model-summary small{font-size:9px;color:#b9aaa4}.tw-ai-model-summary button,.tw-ai-remove{display:flex;align-items:center;gap:5px;padding:8px;border:1px solid #ffffff20;border-radius:9px;background:#ffffff08;color:#f5e8e2;font-size:9px}.tw-ai-model-list{display:grid;gap:10px}.tw-ai-model-card{padding:14px;border:1px solid #ffffff18;border-radius:15px;background:linear-gradient(145deg,#211b1b,#111012)}.tw-ai-model-card-top{display:flex;align-items:center;gap:10px}.tw-ai-model-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:#e5b6aa1d;color:#e5b6aa}.tw-ai-model-card-top>div{display:grid;gap:3px;flex:1;min-width:0}.tw-ai-model-card-top b{font-size:12px;color:#fff}.tw-ai-model-card-top small{font-size:9px;color:#bba9a2}.tw-ai-model-installed,.tw-ai-model-cloud{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:#72f4cb20;color:#72f4cb}.tw-ai-model-cloud{background:#e5b6aa18;color:#e5b6aa}.tw-ai-model-card p{margin:11px 0;color:#c8bbb5;font-size:10px;line-height:1.55}.tw-ai-model-meta{display:flex;justify-content:space-between;gap:8px;color:#b9aaa4;font-size:9px}.tw-ai-model-meta span{display:flex;align-items:center;gap:5px}.tw-ai-progress{height:5px;margin:11px 0;border-radius:9px;background:#ffffff18;overflow:hidden}.tw-ai-progress>div{height:100%;border-radius:9px;background:#e5b6aa;transition:width .2s}.tw-ai-model-error{display:block;margin-top:8px;color:#ff9b9b;font-size:9px}.tw-ai-model-actions{display:flex;gap:8px;margin-top:12px}.tw-ai-model-actions .tw-suite-primary{display:flex;align-items:center;justify-content:center;gap:7px;flex:1;min-height:38px}.tw-ai-model-note{display:flex;gap:9px;padding:12px;border-radius:12px;background:#72f4cb0d;color:#9ce9d1}.tw-ai-model-note p{margin:0;color:#c8bbb5;font-size:9px;line-height:1.55}.tw-ai-model-note b{color:#e9d7ce}.tw-ai-model-warning{background:#e5b6aa0d;color:#e5b6aa}@media(max-width:380px){.tw-ai-model-summary{grid-template-columns:1fr 1fr}.tw-ai-model-summary button{grid-column:1/-1;justify-content:center}}
      `}</style>
    </main>
  );
}
