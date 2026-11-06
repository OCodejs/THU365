import { useEffect, useRef, useState } from "react";
import { createTHU365FaceTracker, renderFaceAR, type FaceARSettings } from "./THU365FaceAR";
import {
  ArrowLeft, Aperture, Camera, Check, ChevronRight, Download, FlipHorizontal2,
  Image as ImageIcon, LockKeyhole, Mic, Play, RotateCcw, ShieldCheck, Sparkles,
  Video, X, Zap
} from "lucide-react";

type Screen = "home" | "permission" | "camera" | "preview";
type MediaKind = "image" | "video";
type CameraFacing = "user" | "environment";
type BeautyPreset = { id: string; name: string; filter: string; description: string };
const BEAUTY_PRESETS: BeautyPreset[] = [
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
  const [facing, setFacing] = useState<CameraFacing>("user");
  const [mode, setMode] = useState<MediaKind>("image");
  const [beauty, setBeauty] = useState(35);
  const [arSettings, setArSettings] = useState<FaceARSettings>({ smooth: 35, lipstick: "rgba(190,48,83,.9)", blush: "rgba(238,105,135,.8)", eyeliner: false, hairTint: "none", sticker: "none", light: "soft" });
  const [trackingStatus, setTrackingStatus] = useState("Đang chờ camera");
  const [savedPresets, setSavedPresets] = useState<Array<{name:string;settings:FaceARSettings}>>(() => { try { return JSON.parse(localStorage.getItem("thu365-ar-presets") || "[]"); } catch { return []; } });
  const [preset, setPreset] = useState("natural");
  const activePreset = BEAUTY_PRESETS.find((item) => item.id === preset) ?? BEAUTY_PRESETS[0];
  const [recording, setRecording] = useState(false);
  const [micGuide, setMicGuide] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaKind>("image");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaName, setMediaName] = useState("thu365-photo.jpg");
  const [notice, setNotice] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<any>(null);
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
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);


  useEffect(() => {
    if (screen !== "camera") return;
    let active = true; let raf = 0; let tracker: any = null; let last = -1;
    setTrackingStatus("Đang tải mô hình nhận diện");
    void createTHU365FaceTracker().then((loaded) => {
      if (!active) { loaded.close(); return; }
      tracker = loaded; trackerRef.current = loaded; setTrackingStatus("AI Face Tracking đang hoạt động");
      const tick = () => {
        if (!active) return;
        const video = videoRef.current, canvas = arCanvasRef.current;
        if (video && canvas && video.readyState >= 2 && video.currentTime !== last) {
          last = video.currentTime;
          try { const result = tracker.detectForVideo(video, performance.now()); renderFaceAR(canvas, video, result, arSettings, `${activePreset.filter} brightness(${1 + beauty / 650}) saturate(${1 + beauty / 500})`); setTrackingStatus(result.faceLandmarks?.length ? "Đã nhận diện khuôn mặt" : "Đưa khuôn mặt vào khung hình"); } catch { setTrackingStatus("Đang khởi tạo theo dõi"); }
        }
        raf = requestAnimationFrame(tick);
      }; tick();
    }).catch(() => setTrackingStatus("Không tải được AI model · kiểm tra kết nối mạng"));
    return () => { active = false; cancelAnimationFrame(raf); tracker?.close?.(); trackerRef.current = null; };
  }, [screen, arSettings, activePreset.filter, beauty]);

  function saveARPreset() {
    const name = window.prompt("Tên preset cá nhân?"); if (!name?.trim()) return;
    const next = [...savedPresets.filter((item) => item.name !== name.trim()), { name: name.trim(), settings: arSettings }].slice(-12);
    setSavedPresets(next); localStorage.setItem("thu365-ar-presets", JSON.stringify(next)); showNotice("Đã lưu preset trên thiết bị");
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
      setError("Camera cần Safari/Chrome hiện đại và kết nối HTTPS. Hãy mở THU365 bằng Safari.");
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        }
      });
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
      } else {
        setError("Không thể mở camera. Kiểm tra quyền truy cập và thử lại.");
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
    if (facing === "user") {
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
      setMediaName(`thu365-${Date.now()}.jpg`);
      setMediaUrl(URL.createObjectURL(blob));
      setScreen("preview");
    }, "image/jpeg", 0.94);
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
      const recorder = mimeType ? new MediaRecorder(recordingStream, { mimeType }) : new MediaRecorder(recordingStream);
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
        setMediaName(`thu365-${Date.now()}.${type.includes("mp4") ? "mp4" : "webm"}`);
        setMediaUrl(URL.createObjectURL(blob));
        stopCamera();
        setScreen("preview");
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
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
        await navigator.share({ files: [file], title: "THU365 Beauty" });
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
            <div className="tw-brand">THU<span>365</span></div>
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
          <div className="tw-section-head"><strong>Bắt đầu sáng tạo</strong><span>THIẾT BỊ CỦA BẠN</span></div>
          <button className="tw-action-card tw-camera-card" onClick={() => { setError(""); setScreen("permission"); }}>
            <span className="tw-action-icon"><Camera size={22} /></span>
            <span className="tw-action-copy"><b>Mở camera</b><small>Chụp ảnh hoặc quay video bằng camera thật</small></span>
            <ChevronRight size={18} />
          </button>
          <button className="tw-action-card" onClick={() => fileRef.current?.click()}>
            <span className="tw-action-icon"><ImageIcon size={22} /></span>
            <span className="tw-action-copy"><b>Chọn ảnh hoặc video</b><small>Mở thư viện trên iPhone hoặc Android</small></span>
            <ChevronRight size={18} />
          </button>
          <div className="tw-privacy-note"><ShieldCheck size={15} /><span><b>Riêng tư mặc định.</b> Ảnh/video chỉ ở trong trình duyệt, không tải lên máy chủ. Hãy lưu tệp trước khi đóng ứng dụng.</span></div>
          <footer className="tw-footer">THU365 BEAUTY · BẢN DÙNG THỬ PWA</footer>
        </section>
      )}

      {screen === "permission" && (
        <section className="tw-permission">
          <button className="tw-back" onClick={() => setScreen("home")} aria-label="Quay lại"><ArrowLeft size={19} /></button>
          <div className="tw-eyebrow"><ShieldCheck size={13} /> QUYỀN TRUY CẬP THIẾT BỊ</div>
          <h1>Camera chỉ bật<br /><em>khi bạn sẵn sàng.</em></h1>
          <p>THU365 cần camera để hiển thị hình ảnh trực tiếp và chụp ảnh. Trình duyệt sẽ hỏi quyền sau khi bạn tiếp tục.</p>
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
            <video ref={videoRef} autoPlay muted playsInline className="tw-live-video" style={{ opacity: 0, transform: facing === "user" ? "scaleX(-1)" : "none" }} /><canvas ref={arCanvasRef} className="tw-ar-canvas" style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }} />
            <div className="tw-live-shade" />
            <header className="tw-camera-header">
              <button className="tw-glass" onClick={returnHome} aria-label="Đóng camera"><ArrowLeft size={19} /></button>
              <div className="tw-brand">THU<span>365</span></div>
              <button className="tw-glass" onClick={() => void startCamera(facing === "user" ? "environment" : "user")} aria-label="Đổi camera"><FlipHorizontal2 size={19} /></button>
            </header>
            <div className="tw-live-label"><span /> {trackingStatus.toUpperCase()}</div>
            <div className="tw-camera-bottom">
              <div className="tw-filter-row">
                <div><span>HIỆU ỨNG · {activePreset.description}</span><b>{beauty}%</b></div>
                <div className="tw-ar-tools"><label>SON <select value={arSettings.lipstick} onChange={(e) => setArSettings(v => ({...v, lipstick:e.target.value}))}><option value="none">Tắt</option><option value="rgba(190,48,83,.9)">Đỏ cherry</option><option value="rgba(190,95,105,.9)">Hồng đất</option><option value="rgba(145,70,105,.9)">Mận</option></select></label><label>MÁ HỒNG <select value={arSettings.blush} onChange={(e) => setArSettings(v => ({...v, blush:e.target.value}))}><option value="none">Tắt</option><option value="rgba(238,105,135,.8)">Rose</option><option value="rgba(240,150,105,.8)">Peach</option></select></label><label><input type="checkbox" checked={arSettings.eyeliner} onChange={(e) => setArSettings(v => ({...v, eyeliner:e.target.checked}))}/> Eyeliner</label><label>TÓC <select value={arSettings.hairTint} onChange={(e) => setArSettings(v => ({...v, hairTint:e.target.value}))}><option value="none">Tự nhiên</option><option value="#8b4d2d">Nâu</option><option value="#c69a45">Vàng</option><option value="#7b477e">Tím</option></select></label><label>STICKER <select value={arSettings.sticker} onChange={(e) => setArSettings(v => ({...v, sticker:e.target.value as FaceARSettings["sticker"]}))}><option value="none">Tắt</option><option value="hearts">Hearts</option><option value="sunglasses">Sunglasses</option><option value="sparkles">Sparkles</option></select></label><label>ÁNH SÁNG <select value={arSettings.light} onChange={(e) => setArSettings(v => ({...v, light:e.target.value as FaceARSettings["light"]}))}><option value="none">Tắt</option><option value="soft">Soft</option><option value="golden">Golden</option><option value="studio">Studio</option></select></label><button type="button" onClick={saveARPreset}>Lưu preset</button>{savedPresets.map((item) => <button type="button" key={item.name} onClick={() => setArSettings(item.settings)}>{item.name}</button>)}</div>
                <div className="tw-preset-strip" aria-label="Chọn hiệu ứng làm đẹp">{BEAUTY_PRESETS.map((item) => <button key={item.id} type="button" className={`tw-preset ${preset === item.id ? "is-active" : ""}`} onClick={() => setPreset(item.id)} aria-pressed={preset === item.id}><span className={`tw-preset-swatch swatch-${item.id}`} /><small>{item.name}</small></button>)}</div>
                <input aria-label="Cường độ làm đẹp" type="range" min="0" max="100" value={beauty} onChange={(event) => setBeauty(Number(event.target.value))} />
              </div>
              <div className="tw-capture-row">
                <button className="tw-side-button" onClick={() => fileRef.current?.click()}><ImageIcon size={21} /><small>Thư viện</small></button>
                <button className={`tw-shutter ${recording ? "tw-recording" : ""}`} onClick={() => mode === "image" ? capturePhoto() : recording ? stopRecording() : setMicGuide(true)} aria-label={recording ? "Dừng quay" : mode === "image" ? "Chụp ảnh" : "Bắt đầu quay"}><span /></button>
                <button className="tw-side-button" onClick={() => setMode(mode === "image" ? "video" : "image")}><Video size={21} /><small>{mode === "image" ? "Chế độ ảnh" : "Chế độ video"}</small></button>
              </div>
              <div className="tw-mode-label">{mode === "image" ? "CHỤP ẢNH" : recording ? "ĐANG QUAY · CHẠM ĐỂ DỪNG" : "QUAY VIDEO"}</div>
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
        .tw-hidden{display:none}.tw-back,.tw-glass{width:40px;height:40px;display:grid;place-items:center;border:1px solid #ffffff20;border-radius:50%;background:#ffffff0b;color:#f6f0ec}
        .tw-permission>.tw-back{margin-bottom:40px}.tw-permission>p{margin:15px 0 25px}
        .tw-permission-item{display:flex;align-items:center;gap:12px;padding:15px 0;border-bottom:1px solid #ffffff14}.tw-permission-item>svg{color:#e5b6aa}
        .tw-permission-item div{display:flex;flex:1;flex-direction:column;gap:5px}.tw-permission-item b{font-size:12px}.tw-permission-item small{color:#aaa09c;font-size:10px}
        .tw-permission-item>span{color:#d7a99d;font-size:8px;letter-spacing:.08em}.tw-permission-actions{position:absolute;bottom:max(25px,env(safe-area-inset-bottom));left:22px;right:22px}
        .tw-primary{width:100%;min-height:49px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;border-radius:13px;background:#e5b6aa;color:#211715;font-size:12px;font-weight:700}
        .tw-secondary{width:100%;min-height:42px;border:0;background:transparent;color:#c9b9b3;font-size:11px}
        .tw-camera-screen{min-height:100dvh;background:#090909}.tw-camera-view{height:100dvh;min-height:560px;position:relative;overflow:hidden;background:#161313}
        .tw-live-video,.tw-ar-canvas{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;background:#161313}.tw-ar-canvas{pointer-events:none}.tw-ar-tools{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px;align-items:center}.tw-ar-tools label{display:flex;align-items:center;gap:4px;white-space:nowrap;color:#d8c9c2;font-size:8px}.tw-ar-tools select,.tw-ar-tools button{border:1px solid #ffffff30;border-radius:8px;background:#211c1b;color:#f6f0ec;padding:6px;font-size:9px}.tw-ar-tools input{accent-color:#e5b6aa}
        .tw-live-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,#0009,transparent 23%,transparent 54%,#000b 100%)}
        .tw-camera-header{position:absolute;z-index:2;top:max(16px,env(safe-area-inset-top));left:18px;right:18px;display:flex;align-items:center;justify-content:space-between}
        .tw-live-label{position:absolute;top:80px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #ffffff24;border-radius:99px;background:#17131399;color:#f5e9e4;font-size:9px;letter-spacing:.1em;white-space:nowrap}
        .tw-live-label span{width:6px;height:6px;border-radius:50%;background:#d6a398;box-shadow:0 0 0 3px #d6a39830}
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
