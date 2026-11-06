import { useEffect, useRef, useState } from "react";
import { createTHU365FaceTracker, renderFaceAR, type FaceARSettings } from "./THU365FaceAR";
import {
  ArrowLeft, Aperture, Camera, Check, ChevronRight, Download, FlipHorizontal2, Settings, UserRound,
  Image as ImageIcon, LockKeyhole, Mic, Play, RotateCcw, ShieldCheck, Sparkles,
  Video, X, Zap, Clapperboard
} from "lucide-react";

type Screen = "home" | "module" | "permission" | "camera" | "preview";
type MediaKind = "image" | "video";
type CameraFacing = "user" | "environment";
type BeautyPreset = { id: string; name: string; filter: string; description: string };
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
  { id: "mono", name: "Mono", filter: "grayscale(1) contrast(1.12)", description: "Đen trắng tối giản" }
];

export function THU365WebApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeModule, setActiveModule] = useState("album");
  const [facing, setFacing] = useState<CameraFacing>("user");
  const [mode, setMode] = useState<MediaKind>("image");
  const [beauty, setBeauty] = useState(35);
  const [beautyPanel, setBeautyPanel] = useState<"auto" | "manual">("auto");
  const [autoProfile, setAutoProfile] = useState("natural");
  const [arSettings, setArSettings] = useState<FaceARSettings>({ smooth: 35, lipstick: "rgba(190,48,83,.9)", blush: "rgba(238,105,135,.8)", eyeliner: false, hairTint: "none", sticker: "none", light: "soft" });
  const [trackingStatus, setTrackingStatus] = useState("Đang chờ camera");
  const [savedPresets, setSavedPresets] = useState<Array<{name:string;settings:FaceARSettings}>>(() => { try { return JSON.parse(localStorage.getItem("anhthu-ar-presets") || localStorage.getItem("thu365-ar-presets") || "[]"); } catch { return []; } });
  const [preset, setPreset] = useState("natural");
  const activePreset = BEAUTY_PRESETS.find((item) => item.id === preset) ?? BEAUTY_PRESETS[0];
  const [recording, setRecording] = useState(false);
  const [shortVideoMode, setShortVideoMode] = useState(false);
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
  const [profileName, setProfileName] = useState(() => localStorage.getItem("anhthu-profile-name") || "AnhThu User");
  const [studioSettings, setStudioSettings] = useState(() => { try { return { photo: "1080", video: "1080", fps: "60", mirror: true, ...JSON.parse(localStorage.getItem("anhthu-studio-settings") || "{}") }; } catch { return { photo: "1080", video: "1080", fps: "60", mirror: true }; } });
  const [cameraQuality, setCameraQuality] = useState("Đang chờ camera");
  const [arReady, setArReady] = useState(false);
  const [aiRetry, setAiRetry] = useState(0);
  function updateStudioSettings(patch: Partial<{photo:string;video:string;fps:string;mirror:boolean}>) { setStudioSettings((current:any) => { const next = {...current, ...patch}; localStorage.setItem("anhthu-studio-settings", JSON.stringify(next)); return next; }); }
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
    setArReady(false);
    setTrackingStatus("Camera đã bật · đang tải AI nền");
    // AI is optional: keep the raw camera visible during model download or offline.
    void createTHU365FaceTracker().then((loaded) => {
      if (!active) { loaded.close(); return; }
      tracker = loaded;
      trackerRef.current = loaded;
      setTrackingStatus(loaded.segmentationEnabled ? "AI Face + Skin sẵn sàng" : "AI Face sẵn sàng · Skin AI dự phòng");
      const tick = () => {
        if (!active) return;
        const video = videoRef.current;
        const canvas = arCanvasRef.current;
        if (video && canvas && video.readyState >= 2 && video.currentTime !== last) {
          last = video.currentTime;
          try {
            const result = tracker.detectForVideo(video, performance.now());
            const currentBeauty = beautyRef.current;
            const currentFilter = filterRef.current;
            const filter = currentFilter + " brightness(" + (1 + currentBeauty / 650) + ") saturate(" + (1 + currentBeauty / 500) + ")";
            renderFaceAR(canvas, video, result, arSettingsRef.current, filter);
            setArReady(true);
            setTrackingStatus(result.faceLandmarks && result.faceLandmarks.length ? (loaded.segmentationEnabled ? "Đã nhận diện khuôn mặt + vùng da" : "Đã nhận diện khuôn mặt") : "Đưa khuôn mặt vào khung hình");
          } catch { setTrackingStatus("AI đang khởi tạo · camera vẫn hoạt động"); }
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    }).catch((cause) => {
      if (!active) return;
      setArReady(false);
      trackerRef.current = null;
      console.warn("AnhThu AI model unavailable; continuing with camera-only preview:", cause);
      setTrackingStatus("Camera thường · AI chưa tải được");
    });
    return () => { active = false; cancelAnimationFrame(raf); tracker?.close?.(); trackerRef.current = null; setArReady(false); };
  }, [screen, aiRetry]);

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
    const name = window.prompt("Tên preset cá nhân?"); if (!name?.trim()) return;
    const next = [...savedPresets.filter((item) => item.name !== name.trim()), { name: name.trim(), settings: arSettings }].slice(-12);
    setSavedPresets(next); localStorage.setItem("anhthu-ar-presets", JSON.stringify(next)); showNotice("Đã lưu preset trên thiết bị");
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
    context.filter = `${activePreset.filter} brightness(${1 + beauty / 650}) saturate(${1 + beauty / 500})`;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
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
      const recordingStream = new MediaStream([
        ...streamRef.current.getVideoTracks(),
        ...audio.getAudioTracks()
      ]);
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
      if (shortVideoMode) shortVideoTimerRef.current = window.setTimeout(() => stopRecording(), 60_000);
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

  async function saveOrShare() {
    if (!mediaBlob) return;
    const file = new File([mediaBlob], mediaName, { type: mediaBlob.type || (mediaType === "image" ? "image/jpeg" : "video/mp4") });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "AnhThu Beauty" });
        return;
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
    }
    const link = document.createElement("a");
    link.href = mediaUrl;
    link.download = mediaName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotice("Đã gửi yêu cầu lưu tệp. Kiểm tra Ảnh hoặc Tệp trên iPhone.");
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
          <header className="tw-header">
            <div className="tw-brand">Anh<span>Thu</span></div>
            <div className="tw-private"><LockKeyhole size={12} /> RIÊNG TƯ TRƯỚC TIÊN</div>
          </header>
          <div className="tw-hero">
            <div className="tw-hero-orbit" />
            <div className="tw-hero-copy">
              <span className="tw-eyebrow"><Sparkles size={13} /> BEAUTY CAMERA STUDIO</span>
              <h1>Đẹp theo<br /><em>cách của bạn.</em></h1>
              <p>Chụp ảnh, thử sắc thái và lưu khoảnh khắc ngay trên thiết bị.</p>
            </div>
            <div className="tw-hero-mark"><Aperture size={74} strokeWidth={0.8} /></div>
          </div>
          <div className="tw-section-head"><strong>Không gian sáng tạo</strong><span>ANHTHU STUDIO</span></div>
          <div className="tw-module-grid">
            <button className="tw-module-card tw-module-feature" onClick={() => { setShortVideoMode(false); setMode("image"); setError(""); setScreen("permission"); }}><span className="tw-module-icon"><Camera size={22}/></span><b>Camera làm đẹp</b><small>Chụp ảnh · quay video · AR trực tiếp</small></button>
            <button className="tw-module-card" onClick={() => { setActiveModule("album"); setScreen("module"); }}><span className="tw-module-icon"><ImageIcon size={22}/></span><b>Album</b><small>Ảnh và video trên điện thoại</small></button>
            <button className="tw-module-card" onClick={() => { setActiveModule("editor"); setScreen("module"); }}><span className="tw-module-icon"><Aperture size={22}/></span><b>Chỉnh sửa ảnh</b><small>Cắt, màu sắc và ánh sáng</small></button>
            <button className="tw-module-card" onClick={() => { setActiveModule("sharp"); setScreen("module"); }}><span className="tw-module-icon"><Zap size={22}/></span><b>Làm nét ảnh AI</b><small>Phục hồi ảnh mờ · giảm nhiễu</small></button>
            <button className="tw-module-card" onClick={() => { setActiveModule("beauty"); setScreen("module"); }}><span className="tw-module-icon"><Sparkles size={22}/></span><b>AI làm đẹp</b><small>Da, makeup và nhận diện khuôn mặt</small></button>
            <button className="tw-module-card" onClick={() => { setActiveModule("effects"); setScreen("module"); }}><span className="tw-module-icon"><Check size={22}/></span><b>Hiệu ứng quốc tế</b><small>Phong cách Trung Quốc · Hàn Quốc</small></button>
            <button className="tw-module-card tw-module-feature" onClick={() => { setActiveModule("short-video"); setShortVideoMode(true); setMode("video"); setError(""); setScreen("permission"); }}><span className="tw-module-icon"><Clapperboard size={22}/></span><b>Video ngắn</b><small>Quay video dọc tối đa 60 giây · Beauty realtime</small></button>
            <button className="tw-module-card" onClick={() => { setActiveModule("settings"); setScreen("module"); }}><span className="tw-module-icon"><Settings size={22}/></span><b>Cài đặt ứng dụng</b><small>Full HD · FPS · chất lượng quay</small></button>
            <button className="tw-module-card" onClick={() => { setActiveModule("profile"); setScreen("module"); }}><span className="tw-module-icon"><UserRound size={22}/></span><b>Hồ sơ</b><small>Thông tin cá nhân trên thiết bị</small></button>
          </div>
          <button className="tw-action-card" onClick={() => fileRef.current?.click()}>
            <span className="tw-action-icon"><ImageIcon size={22} /></span>
            <span className="tw-action-copy"><b>Chọn nhanh ảnh hoặc video</b><small>Mở bộ chọn ảnh an toàn của iOS / Android</small></span>
            <ChevronRight size={18} />
          </button>
          <div className="tw-privacy-note"><ShieldCheck size={15} /><span><b>Riêng tư mặc định.</b> Ảnh/video chỉ ở trong trình duyệt, không tải lên máy chủ. Hãy lưu tệp trước khi đóng ứng dụng.</span></div>
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
              <button className="tw-glass" onClick={returnHome} aria-label="Đóng camera"><ArrowLeft size={19} /></button>
              <div className="tw-brand">Anh<span>Thu</span></div>
              <button className="tw-glass" onClick={() => void startCamera(facing === "user" ? "environment" : "user")} aria-label="Đổi camera"><FlipHorizontal2 size={19} /></button>
            </header>
            <div className="tw-live-label"><span /> {trackingStatus.toUpperCase()} · {cameraQuality}</div>
            {trackingStatus.includes("AI chưa tải") && <button type="button" className="tw-ai-retry" onClick={() => { setTrackingStatus("Đang thử tải lại AI"); setAiRetry((value) => value + 1); }}>Thử tải lại AI</button>}
            <div className="tw-camera-bottom">
              <div className="tw-filter-row">
                <div className="tw-beauty-tabs"><button type="button" className={beautyPanel === "auto" ? "is-active" : ""} onClick={() => setBeautyPanel("auto")}>✨ TỰ ĐỘNG</button><button type="button" className={beautyPanel === "manual" ? "is-active" : ""} onClick={() => setBeautyPanel("manual")}>🎚 THỦ CÔNG</button><b>{beauty}%</b></div>
                {beautyPanel === "auto" ? <div className="tw-auto-beauty"><p>Chọn phong cách · AnhThu tự áp dụng bộ thông số làm đẹp</p><div className="tw-auto-profiles"><button onClick={() => applyAutoBeauty("natural")} className={autoProfile === "natural" ? "is-active" : ""}>Natural</button><button onClick={() => applyAutoBeauty("cloud")} className={autoProfile === "cloud" ? "is-active" : ""}>Cloud Skin</button><button onClick={() => applyAutoBeauty("softglam")} className={autoProfile === "softglam" ? "is-active" : ""}>Soft Glam</button><button onClick={() => applyAutoBeauty("peach")} className={autoProfile === "peach" ? "is-active" : ""}>Peach Glow</button></div><button className="tw-auto-apply" onClick={() => applyAutoBeauty()}>✨ Auto setup làm đẹp</button></div> : <div className="tw-manual-beauty"><div className="tw-manual-head"><span>ĐIỀU CHỈNH THỦ CÔNG</span><button type="button" onClick={() => {setBeauty(0);setArSettings({smooth:0,lipstick:"none",blush:"none",eyeliner:false,hairTint:"none",sticker:"none",light:"none"});}}>Đặt lại</button></div><label>Độ mịn da <input type="range" min="0" max="100" value={arSettings.smooth} onChange={(e) => setArSettings(v => ({...v,smooth:Number(e.target.value)}))}/><small>{arSettings.smooth}%</small></label><label>Ánh sáng & màu <input type="range" min="0" max="100" value={beauty} onChange={(e) => setBeauty(Number(e.target.value))}/><small>{beauty}%</small></label></div>}
                <div className="tw-ar-tools"><label>SON <select value={arSettings.lipstick} onChange={(e) => setArSettings(v => ({...v, lipstick:e.target.value}))}><option value="none">Tắt</option><option value="rgba(190,48,83,.9)">Đỏ cherry</option><option value="rgba(190,95,105,.9)">Hồng đất</option><option value="rgba(145,70,105,.9)">Mận</option></select></label><label>MÁ HỒNG <select value={arSettings.blush} onChange={(e) => setArSettings(v => ({...v, blush:e.target.value}))}><option value="none">Tắt</option><option value="rgba(238,105,135,.8)">Rose</option><option value="rgba(240,150,105,.8)">Peach</option></select></label><label><input type="checkbox" checked={arSettings.eyeliner} onChange={(e) => setArSettings(v => ({...v, eyeliner:e.target.checked}))}/> Eyeliner</label><label>TÓC <select value={arSettings.hairTint} onChange={(e) => setArSettings(v => ({...v, hairTint:e.target.value}))}><option value="none">Tự nhiên</option><option value="#8b4d2d">Nâu</option><option value="#c69a45">Vàng</option><option value="#7b477e">Tím</option></select></label><label>STICKER <select value={arSettings.sticker} onChange={(e) => setArSettings(v => ({...v, sticker:e.target.value as FaceARSettings["sticker"]}))}><option value="none">Tắt</option><option value="hearts">Hearts</option><option value="sunglasses">Sunglasses</option><option value="sparkles">Sparkles</option></select></label><label>ÁNH SÁNG <select value={arSettings.light} onChange={(e) => setArSettings(v => ({...v, light:e.target.value as FaceARSettings["light"]}))}><option value="none">Tắt</option><option value="soft">Soft</option><option value="golden">Golden</option><option value="studio">Studio</option></select></label><button type="button" onClick={saveARPreset}>Lưu preset</button>{savedPresets.map((item) => <button type="button" key={item.name} onClick={() => setArSettings(item.settings)}>{item.name}</button>)}</div>
                <div className="tw-preset-strip" aria-label="Chọn hiệu ứng làm đẹp">{BEAUTY_PRESETS.map((item) => <button key={item.id} type="button" className={`tw-preset ${preset === item.id ? "is-active" : ""}`} onClick={() => setPreset(item.id)} aria-pressed={preset === item.id}><span className={`tw-preset-swatch swatch-${item.id}`} /><small>{item.name}</small></button>)}</div>
                <input aria-label="Cường độ làm đẹp" type="range" min="0" max="100" value={beauty} onChange={(event) => setBeauty(Number(event.target.value))} />
              </div>
              <div className="tw-capture-row">
                <button className="tw-side-button" onClick={() => fileRef.current?.click()}><ImageIcon size={21} /><small>Thư viện</small></button>
                <button className={`tw-shutter ${recording ? "tw-recording" : ""}`} onClick={() => mode === "image" ? capturePhoto() : recording ? stopRecording() : setMicGuide(true)} aria-label={recording ? "Dừng quay" : mode === "image" ? "Chụp ảnh" : "Bắt đầu quay"}><span /></button>
                <button className="tw-side-button" onClick={() => setMode(mode === "image" ? "video" : "image")}><Video size={21} /><small>{mode === "image" ? "Chế độ ảnh" : "Chế độ video"}</small></button>
              </div>
              <div className="tw-mode-label">{mode === "image" ? "CHỤP ẢNH" : recording ? `ĐANG QUAY · ${recordingSeconds}s${shortVideoMode ? " / 60s" : ""} · CHẠM ĐỂ DỪNG` : shortVideoMode ? "VIDEO NGẮN · TỐI ĐA 60 GIÂY" : "QUAY VIDEO"}</div>
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
            {mediaType === "image" ? <img src={mediaUrl} alt="Ảnh vừa chụp hoặc chọn" /> : <video src={mediaUrl} controls playsInline />}
          </div>
          <div className="tw-preview-actions">
            <button className="tw-primary" onClick={() => void saveOrShare()}><Download size={17} /> Lưu hoặc chia sẻ</button>
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
        .tw-hidden{display:none}.tw-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0 13px}.tw-module-card{min-height:126px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:15px;border:1px solid #ffffff16;border-radius:16px;background:#151313;color:#f6f0ec;text-align:left}.tw-module-card b{font-size:12px}.tw-module-card small{color:#aaa09c;font-size:9px;line-height:1.4}.tw-module-feature{border-color:#e5b6aa66;background:linear-gradient(145deg,#2a1d1b,#151313)}.tw-module-icon{width:39px;height:39px;display:grid;place-items:center;border-radius:12px;background:#e5b6aa18;color:#e5b6aa}.tw-module-screen{width:100%;max-width:520px;min-height:100dvh;margin:auto;padding:max(22px,env(safe-area-inset-top)) 22px max(25px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:18px}.tw-module-hero{flex:1;min-height:280px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:24px;border:1px solid #ffffff16;border-radius:20px;background:radial-gradient(ellipse at 80% 20%,#563c37 0,transparent 48%),#151313}.tw-module-hero h2{margin:22px 0 8px;font:500 30px/1.08 Georgia,serif}.tw-module-hero p{color:#b3a7a2;font-size:12px;line-height:1.7}.tw-module-foot{display:flex;gap:9px;color:#aaa09c;font-size:10px;line-height:1.5}.tw-module-foot svg{flex:0 0 auto;color:#e5b6aa}.tw-settings-panel,.tw-profile-panel{display:flex;flex-direction:column;gap:15px;padding:18px;border:1px solid #ffffff16;border-radius:18px;background:#151313}.tw-settings-intro h2,.tw-profile-panel h2{font:500 25px Georgia,serif;margin:13px 0 5px}.tw-settings-intro p,.tw-profile-panel p{margin:0;color:#aaa09c;font-size:10px;line-height:1.6}.tw-settings-panel>label,.tw-profile-panel>label{display:flex;flex-direction:column;gap:8px;color:#e5d7d1;font-size:11px}.tw-settings-panel select,.tw-profile-panel input{width:100%;min-height:43px;padding:0 12px;border:1px solid #ffffff24;border-radius:10px;background:#211c1b;color:#f6f0ec;font-size:12px}.tw-setting-toggle{display:flex!important;flex-direction:row!important;align-items:center}.tw-setting-toggle input{accent-color:#e5b6aa}.tw-quality-note{display:flex;flex-direction:column;gap:7px;padding:13px;border:1px solid #e5b6aa35;border-radius:12px;background:#e5b6aa0b;color:#cbbab4;font-size:10px;line-height:1.5}.tw-quality-note b{color:#f0d8d0}.tw-quality-note small{color:#9f918b;font-size:9px}.tw-profile-avatar{width:72px;height:72px;display:grid;place-items:center;border:1px solid #e5b6aa66;border-radius:50%;background:#e5b6aa20;color:#e5b6aa;font:500 30px Georgia,serif}.tw-back,.tw-glass{width:40px;height:40px;display:grid;place-items:center;border:1px solid #ffffff20;border-radius:50%;background:#ffffff0b;color:#f6f0ec}
        .tw-permission>.tw-back{margin-bottom:40px}.tw-permission>p{margin:15px 0 25px}
        .tw-permission-item{display:flex;align-items:center;gap:12px;padding:15px 0;border-bottom:1px solid #ffffff14}.tw-permission-item>svg{color:#e5b6aa}
        .tw-permission-item div{display:flex;flex:1;flex-direction:column;gap:5px}.tw-permission-item b{font-size:12px}.tw-permission-item small{color:#aaa09c;font-size:10px}
        .tw-permission-item>span{color:#d7a99d;font-size:8px;letter-spacing:.08em}.tw-permission-actions{position:absolute;bottom:max(25px,env(safe-area-inset-bottom));left:22px;right:22px}
        .tw-primary{width:100%;min-height:49px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:13px;background:#e5b6aa;color:#211715;font-size:12px;font-weight:700}
        .tw-secondary{width:100%;min-height:42px;border:0;background:transparent;color:#c9b9b3;font-size:11px}
        .tw-camera-screen{min-height:100dvh;background:#090909}.tw-camera-view{height:100dvh;min-height:560px;position:relative;overflow:hidden;background:#161313}
        .tw-live-video,.tw-ar-canvas{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;background:#161313}.tw-ar-canvas{pointer-events:none}.tw-beauty-tabs{display:flex;align-items:center;gap:7px;margin-bottom:9px}.tw-beauty-tabs button,.tw-auto-profiles button,.tw-manual-head button{border:1px solid #ffffff24;border-radius:9px;background:#211c1b;color:#cbbab4;padding:8px 10px;font-size:9px}.tw-beauty-tabs button.is-active,.tw-auto-profiles button.is-active{background:#e5b6aa;color:#211715;border-color:#e5b6aa}.tw-beauty-tabs b{margin-left:auto;color:#e5b6aa;font-size:11px}.tw-auto-beauty p{font-size:9px;color:#b8aaa4;margin:4px 0 8px}.tw-auto-profiles{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px}.tw-auto-apply{width:100%;padding:9px;border:1px solid #e5b6aa66;border-radius:9px;background:#e5b6aa;color:#211715;font-weight:700;font-size:10px}.tw-manual-beauty{padding:8px 0}.tw-manual-head{display:flex;justify-content:space-between;align-items:center;color:#e5b6aa;font-size:9px}.tw-manual-beauty label{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:9px;color:#d8c9c2;font-size:9px}.tw-manual-beauty input{grid-column:1/2;width:100%;accent-color:#e5b6aa}.tw-manual-beauty small{grid-column:2;grid-row:1/3;align-self:center}.tw-ar-tools{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px;align-items:center}.tw-ar-tools label{display:flex;align-items:center;gap:4px;white-space:nowrap;color:#d8c9c2;font-size:8px}.tw-ar-tools select,.tw-ar-tools button{border:1px solid #ffffff30;border-radius:8px;background:#211c1b;color:#f6f0ec;padding:6px;font-size:9px}.tw-ar-tools input{accent-color:#e5b6aa}
        .tw-live-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,#0009,transparent 23%,transparent 54%,#000b 100%)}
        .tw-camera-header{position:absolute;z-index:2;top:max(16px,env(safe-area-inset-top));left:18px;right:18px;display:flex;align-items:center;justify-content:space-between}
        .tw-live-label{position:absolute;top:80px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #ffffff24;border-radius:99px;background:#17131399;color:#f5e9e4;font-size:9px;letter-spacing:.1em;white-space:nowrap}
        .tw-live-label span{width:6px;height:6px;border-radius:50%;background:#d6a398;box-shadow:0 0 0 3px #d6a39830}.tw-ai-retry{position:absolute;z-index:3;top:119px;left:50%;transform:translateX(-50%);padding:7px 12px;border:1px solid #e5b6aa66;border-radius:99px;background:#211918;color:#f2c9bd;font-size:10px}
        .tw-camera-bottom{position:absolute;left:0;right:0;bottom:max(22px,env(safe-area-inset-bottom));padding:0 24px}
        .tw-filter-row{padding:12px 14px;margin-bottom:23px;border:1px solid #ffffff1b;border-radius:14px;background:#161313c9;backdrop-filter:blur(15px)}
        .tw-filter-row>div{display:flex;justify-content:space-between;margin-bottom:10px;color:#c7b9b3;font-size:8px;letter-spacing:.1em}.tw-filter-row b{color:#e5b6aa;font-size:10px}
        .tw-filter-row input{width:100%;accent-color:#e5b6aa}
        .tw-preset-strip{display:flex;gap:9px;overflow-x:auto;padding:2px 0 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.tw-preset-strip::-webkit-scrollbar{display:none}
        .tw-preset{flex:0 0 58px;display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:transparent;color:#cfc4bf;padding:3px 0;font-size:8px}.tw-preset small{font-size:8px;white-space:nowrap}.tw-preset-swatch{width:43px;height:43px;border:2px solid #ffffff40;border-radius:50%;background:linear-gradient(145deg,#f1c7b7,#9b655e 48%,#30211f);box-shadow:inset 0 0 0 2px #171313}.tw-preset.is-active .tw-preset-swatch{border-color:#e5b6aa;box-shadow:0 0 0 2px #e5b6aa55}.tw-preset.is-active small{color:#f2c9bd;font-weight:700}.swatch-glass{filter:brightness(1.3) saturate(.8)}.swatch-soft{filter:sepia(.2) saturate(1.3)}.swatch-rose{filter:hue-rotate(330deg)}.swatch-latte{filter:sepia(.6)}.swatch-cool{filter:hue-rotate(25deg)}.swatch-film{filter:grayscale(.25) sepia(.3)}.swatch-glow{filter:brightness(1.3) sepia(.2)}.swatch-mono{filter:grayscale(1) contrast(1.2)}
        .tw-capture-row{display:flex;align-items:center;justify-content:space-between}.tw-side-button{display:flex;flex-direction:column;align-items:center;gap:7px;width:66px;border:0;background:transparent;color:#f6f0ec}
        .tw-side-button small{font-size:9px;color:#c4b8b2}.tw-shutter{width:76px;height:76px;display:grid;place-items:center;border:3px solid #fff;border-radius:50%;background:#ffffff26}
        .tw-shutter span{width:58px;height:58px;border-radius:50%;background:#f6f0ec}.tw-shutter.tw-recording span{width:25px;height:25px;border-radius:6px;background:#d86e63}
        .tw-mode-label{text-align:center;margin-top:13px;color:#e9c8bd;font-size:9px;font-weight:700;letter-spacing:.14em}
        .tw-preview-screen{display:flex;flex-direction:column;gap:20px}.tw-preview-header{display:flex;align-items:center;gap:13px}.tw-preview-header>div{display:flex;flex:1;flex-direction:column;gap:4px}.tw-preview-header b{font-size:13px}.tw-preview-header small{color:#aaa09c;font-size:9px}
        .tw-media-frame{flex:1;min-height:280px;max-height:65dvh;display:grid;place-items:center;overflow:hidden;border:1px solid #ffffff18;border-radius:18px;background:#151313}
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
      `}</style>
    </main>
  );
}
