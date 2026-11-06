import { useState, type CSSProperties } from "react";
import {
  Aperture,
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  FlipHorizontal2,
  LockKeyhole,
  MoreHorizontal,
  Sparkles,
  Video,
  WandSparkles,
  X,
} from "lucide-react";

type CameraMode = "Ảnh" | "Video";

const looks = [
  { name: "Tự nhiên", family: "Gốc", style: "none" },
  { name: "Seoul glow", family: "Hàn Quốc", style: "saturate(1.12) brightness(1.08) contrast(.94)" },
  { name: "Nắng film", family: "Vintage", style: "sepia(.22) saturate(.9) contrast(.94)" },
  { name: "Mơ màng", family: "Anime", style: "saturate(1.28) brightness(1.12) hue-rotate(-8deg)" },
  { name: "Mây ngọc", family: "3D", style: "saturate(1.18) brightness(1.04) contrast(1.06)" },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .bc-root, .bc-root * { box-sizing: border-box; }
  .bc-root {
    --ink: #f8f4ef;
    --muted: rgba(248,244,239,.62);
    --soft: rgba(248,244,239,.12);
    --rose: #e9b7aa;
    position: relative; isolation: isolate; margin: 0 auto; width: 100%; max-width: 430px;
    min-height: 100dvh; overflow: hidden; color: var(--ink);
    background: #0b0b0b; font-family: 'DM Sans', sans-serif;
  }
  .bc-root:before { content: ''; position: absolute; inset: 0; z-index: 5; pointer-events: none; opacity: .11;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.22'/%3E%3C/svg%3E"); }
  .bc-camera {
    height: min(58dvh, 500px); min-height: 450px; position: relative; overflow: hidden;
    background: #23201e; border-radius: 0 0 29px 29px;
  }
  .bc-portrait { width: 100%; height: 100%; object-fit: cover; object-position: 50% 43%; display: block;
    transition: filter .28s ease, transform .3s ease; }
  .bc-portrait.flipped { transform: scaleX(-1); }
  .bc-shade { position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(180deg, rgba(9,8,8,.66) 0%, transparent 22%, transparent 55%, rgba(9,8,8,.28) 74%, rgba(9,8,8,.8) 100%); }
  .bc-topbar { position:absolute; left: 21px; right: 21px; top: max(18px, env(safe-area-inset-top)); z-index:2;
    display:flex; align-items:center; justify-content:space-between; }
  .bc-brand { font: 800 18px/1 'Manrope', sans-serif; letter-spacing: .17em; }
  .bc-brand-wrap { display:flex; align-items:center; gap:9px; }
  .bc-picker-back { width:34px; height:34px; }
  .bc-brand span { color: var(--rose); }
  .bc-top-actions { display:flex; align-items:center; gap:10px; }
  .bc-glass {
    border: 1px solid rgba(255,255,255,.2); background: rgba(20,19,18,.36); color:var(--ink);
    backdrop-filter: blur(14px); display:flex; align-items:center; justify-content:center; cursor:pointer;
  }
  .bc-privacy { padding: 8px 11px; gap:7px; border-radius:99px; font-size:11px; font-weight:600; letter-spacing:.01em; }
  .bc-circle { width:38px; height:38px; border-radius:50%; }
  .bc-camera-note { position:absolute; z-index:2; top:76px; left:50%; transform:translateX(-50%);
    padding:7px 11px; display:flex; gap:7px; align-items:center; border-radius:100px;
    background:rgba(20,19,18,.4); border:1px solid rgba(255,255,255,.12); backdrop-filter:blur(12px);
    white-space:nowrap; color:rgba(255,255,255,.84); font-size:10px; letter-spacing:.02em; }
  .bc-rec-indicator { width:6px; height:6px; border-radius:50%; background:#d9b7a4; box-shadow:0 0 0 3px rgba(217,183,164,.14); }
  .bc-float-actions { position:absolute; z-index:2; right:16px; top:43%; display:flex; flex-direction:column; gap:11px; }
  .bc-float-button { width:40px; height:40px; border:1px solid rgba(255,255,255,.24); border-radius:50%; color:white;
    background:rgba(17,16,15,.38); backdrop-filter:blur(12px); display:grid; place-items:center; cursor:pointer; }
  .bc-caption { position:absolute; z-index:2; left:22px; bottom:28px; }
  .bc-caption-kicker { display:flex; align-items:center; gap:7px; color:#f4d4c8; font-size:10px; letter-spacing:.12em; text-transform:uppercase; font-weight:700; }
  .bc-caption-title { margin-top:7px; font:600 22px/1.15 'Manrope', sans-serif; letter-spacing:-.045em; }
  .bc-caption-sub { margin-top:6px; color:rgba(255,255,255,.7); font-size:11px; }
  .bc-main { padding: 17px 20px max(20px, env(safe-area-inset-bottom)); }
  .bc-look-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .bc-section-title { font:600 13px 'Manrope',sans-serif; letter-spacing:-.01em; }
  .bc-section-meta { color:var(--muted); font-size:10px; }
  .bc-look-list { display:flex; gap:10px; overflow-x:auto; scrollbar-width:none; padding:1px 0 5px; margin-right:-20px; }
  .bc-look-list::-webkit-scrollbar { display:none; }
  .bc-look { flex:0 0 69px; padding:0; color:var(--muted); background:none; border:0; text-align:center; cursor:pointer; }
  .bc-look-thumb { position:relative; display:block; width:58px; height:58px; margin:0 auto 6px; border-radius:19px; overflow:hidden;
    border:1.5px solid transparent; transition:transform .2s ease, border-color .2s ease; }
  .bc-look.active .bc-look-thumb { border-color:#efc5b4; transform:translateY(-2px); }
  .bc-look-thumb img { width:100%; height:100%; display:block; object-fit:cover; object-position:50% 34%; }
  .bc-look-name { display:block; white-space:nowrap; font-size:9px; line-height:1.1; }
  .bc-look.active .bc-look-name { color:#f4d4c8; font-weight:700; }
  .bc-family { display:block; margin-top:3px; font-size:8px; color:rgba(248,244,239,.42); }
  .bc-divider { height:1px; background:rgba(255,255,255,.1); margin:12px 0 12px; }
  .bc-control-row { display:flex; align-items:center; justify-content:space-between; }
  .bc-beauty-title { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:600; }
  .bc-level { color:#e9b7aa; font:600 11px 'Manrope',sans-serif; }
  .bc-slider-wrap { display:flex; align-items:center; gap:10px; margin-top:8px; color:rgba(255,255,255,.52); }
  .bc-slider { width:100%; height:3px; margin:0; appearance:none; background:linear-gradient(90deg,#e8b7a9 var(--progress),rgba(255,255,255,.2) var(--progress)); border-radius:5px; outline:none; }
  .bc-slider::-webkit-slider-thumb { appearance:none; width:13px; height:13px; border-radius:50%; background:#f5e9df; border:2px solid #cf9a88; box-shadow:0 0 0 4px rgba(233,183,170,.12); cursor:pointer; }
  .bc-slider::-moz-range-thumb { width:10px; height:10px; border-radius:50%; background:#f5e9df; border:2px solid #cf9a88; cursor:pointer; }
  .bc-slider-label { font-size:9px; }
  .bc-capture-area { display:grid; grid-template-columns:1fr 1.3fr 1fr; align-items:center; margin-top:18px; }
  .bc-side-action { border:0; color:rgba(255,255,255,.79); background:none; cursor:pointer; justify-self:center; display:flex; flex-direction:column; align-items:center; gap:5px; font-size:9px; }
  .bc-side-action:disabled { opacity:.35; cursor:not-allowed; }
  .bc-gallery-thumb { width:34px; height:34px; border-radius:11px; overflow:hidden; border:1px solid rgba(255,255,255,.45); position:relative; }
  .bc-gallery-thumb img { width:100%; height:100%; display:block; object-fit:cover; object-position:50% 35%; }
  .bc-capture-center { display:flex; flex-direction:column; align-items:center; gap:8px; }
  .bc-mode-switch { display:flex; align-items:center; gap:16px; font-size:10px; font-weight:700; letter-spacing:.04em; }
  .bc-mode { padding:0; border:0; background:none; color:rgba(255,255,255,.48); font:inherit; cursor:pointer; }
  .bc-mode:disabled { opacity:.35; cursor:not-allowed; }
  .bc-mode.active { color:#f0c7b9; }
  .bc-shutter { width:61px; height:61px; border-radius:50%; display:grid; place-items:center; border:2px solid rgba(255,255,255,.88); background:rgba(255,255,255,.13); cursor:pointer; transition:transform .18s ease; }
  .bc-shutter:active { transform:scale(.94); }
  .bc-shutter-inner { width:47px; height:47px; border-radius:50%; background:#f6eee8; transition:all .18s ease; }
  .bc-shutter.video .bc-shutter-inner { width:23px; height:23px; border-radius:7px; background:#d98f7c; }
  .bc-toast { position:absolute; z-index:9; left:50%; bottom:23px; transform:translateX(-50%); padding:10px 14px; border:1px solid rgba(255,255,255,.16);
    border-radius:20px; background:rgba(35,31,29,.92); box-shadow:0 8px 28px rgba(0,0,0,.34); color:#f8eee7; font-size:11px; white-space:nowrap; animation:bc-in .2s ease both; }
  .bc-modal-scrim { position:fixed; z-index:10; inset:0; background:rgba(0,0,0,.56); display:flex; align-items:flex-end; justify-content:center; }
  .bc-modal { width:min(100%,430px); background:#171615; border:1px solid rgba(255,255,255,.12); border-radius:24px 24px 0 0; padding:23px 22px max(28px,env(safe-area-inset-bottom)); box-shadow:0 -14px 60px rgba(0,0,0,.35); animation:bc-up .24s ease both; }
  .bc-modal-top { display:flex; justify-content:space-between; align-items:center; }
  .bc-modal h2 { margin:0; font:700 18px 'Manrope',sans-serif; letter-spacing:-.04em; }
  .bc-modal p { margin:10px 0 0; color:rgba(255,255,255,.65); font-size:12px; line-height:1.6; }
  .bc-modal-close { width:32px; height:32px; border:0; border-radius:50%; background:rgba(255,255,255,.09); color:white; display:grid; place-items:center; cursor:pointer; }
  .bc-privacy-list { display:grid; gap:13px; margin-top:20px; }
  .bc-privacy-item { display:flex; gap:11px; align-items:center; color:#f4eee8; font-size:11px; }
  .bc-privacy-item span { color:#d8b7a9; }
  .bc-gallery-preview { margin-top:17px; height:160px; border-radius:15px; overflow:hidden; position:relative; background:#24201e; }
  .bc-gallery-preview img { width:100%; height:100%; object-fit:cover; object-position:center 37%; opacity:.85; }
  .bc-gallery-preview-label { position:absolute; inset:auto 12px 12px; font-size:11px; text-shadow:0 1px 8px #000; }
  @keyframes bc-in { from { opacity:0; transform:translate(-50%,8px); } to { opacity:1; transform:translate(-50%,0); } }
  @keyframes bc-up { from { opacity:.7; transform:translateY(25px); } to { opacity:1; transform:translateY(0); } }
  @media (max-height:760px) {
    .bc-camera { height:58dvh; min-height:405px; }
    .bc-main { padding-top:13px; }
    .bc-divider { margin:9px 0; }
    .bc-capture-area { margin-top:12px; }
  }
`;

export function BeautyCamera({ onExit, optionalAccessSkipped = false }: { onExit?: () => void; optionalAccessSkipped?: boolean } = {}) {
  const [selectedLook, setSelectedLook] = useState(1);
  const [intensity, setIntensity] = useState(64);
  const [mode, setMode] = useState<CameraMode>("Ảnh");
  const [flipped, setFlipped] = useState(false);
  const [modal, setModal] = useState<"privacy" | "gallery" | null>(null);
  const [notice, setNotice] = useState("");

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const activeLook = looks[selectedLook];

  return (
    <div className="bc-root">
      <style>{styles}</style>
      <section className="bc-camera" aria-label="Khung xem trước camera">
        <img
          className={`bc-portrait${flipped ? " flipped" : ""}`}
          src="/__mockup/images/thu365-beauty-portrait.jpg"
          alt="Ảnh chân dung xem trước"
          style={{ filter: activeLook.style === "none" ? "none" : `${activeLook.style} brightness(${1 + intensity / 850})` }}
        />
        <div className="bc-shade" />
        <header className="bc-topbar">
          <div className="bc-brand-wrap">
            {onExit && (
              <button className="bc-glass bc-circle bc-picker-back" onClick={onExit} aria-label="Về chọn trải nghiệm">
                <ArrowLeft size={17} />
              </button>
            )}
            <div className="bc-brand">THU<span>365</span></div>
          </div>
          <div className="bc-top-actions">
            <button className="bc-glass bc-privacy" onClick={() => setModal("privacy")} aria-label="Mở cài đặt riêng tư">
              <LockKeyhole size={13} strokeWidth={1.8} /> Riêng tư
            </button>
            <button className="bc-glass bc-circle" onClick={() => showNotice("Thêm tùy chọn camera sẽ sớm có mặt")} aria-label="Tùy chọn khác">
              <MoreHorizontal size={19} />
            </button>
          </div>
        </header>
        <div className="bc-camera-note">
          <span className="bc-rec-indicator" />
          {optionalAccessSkipped ? "Bản xem trước · Đã bỏ qua quyền tùy chọn" : "Bản xem trước giao diện · Chưa yêu cầu quyền thiết bị"}
        </div>
        <div className="bc-float-actions">
          <button className="bc-float-button" onClick={() => setFlipped(!flipped)} aria-label="Đổi camera trước sau" aria-pressed={flipped}>
            <FlipHorizontal2 size={17} />
          </button>
          <button className="bc-float-button" onClick={() => showNotice("Đã chọn tỷ lệ khung hình 9:16")} aria-label="Tỷ lệ khung hình 9 trên 16">
            <span style={{ fontSize: 9, fontWeight: 700 }}>9:16</span>
          </button>
        </div>
        <div className="bc-caption">
          <div className="bc-caption-kicker"><Sparkles size={12} /> Đang thử · {activeLook.family}</div>
          <div className="bc-caption-title">Một khoảnh khắc,<br />đúng chất bạn.</div>
          <div className="bc-caption-sub">Ánh sáng dịu · Góc chân dung</div>
        </div>
      </section>

      <main className="bc-main">
        <div className="bc-look-heading">
          <div className="bc-section-title">Chọn sắc thái</div>
          <div className="bc-section-meta">Vuốt để khám phá <ChevronDown size={11} style={{ verticalAlign: "middle", transform: "rotate(-90deg)" }} /></div>
        </div>
        <div className="bc-look-list" role="list" aria-label="Các sắc thái làm đẹp">
          {looks.map((look, index) => (
            <button
              className={`bc-look${selectedLook === index ? " active" : ""}`}
              key={look.name}
              onClick={() => setSelectedLook(index)}
              aria-pressed={selectedLook === index}
            >
              <span className="bc-look-thumb">
                <img
                  src="/__mockup/images/thu365-beauty-portrait.jpg"
                  alt=""
                  style={{ filter: look.style === "none" ? "none" : look.style }}
                />
              </span>
              <span className="bc-look-name">{look.name}</span>
              <span className="bc-family">{look.family}</span>
            </button>
          ))}
        </div>

        <div className="bc-divider" />
        <div className="bc-control-row">
          <div className="bc-beauty-title"><WandSparkles size={15} color="#e9b7aa" /> Làm đẹp tinh tế</div>
          <div className="bc-level">{intensity}%</div>
        </div>
        <div className="bc-slider-wrap">
          <span className="bc-slider-label">Nhẹ</span>
          <input
            className="bc-slider"
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            aria-label="Cường độ làm đẹp"
            style={{ "--progress": `${intensity}%` } as CSSProperties}
          />
          <span className="bc-slider-label">Rõ</span>
        </div>

        <div className="bc-capture-area">
          <button
            className="bc-side-action"
            onClick={() => setModal("gallery")}
            aria-label="Mở thư viện gần đây"
            disabled={optionalAccessSkipped}
            aria-label={optionalAccessSkipped ? "Thư viện ảnh, đã tắt vì bạn bỏ qua quyền tùy chọn" : "Mở thư viện ảnh mẫu"}
            title={optionalAccessSkipped ? "Thư viện ảnh đã được bỏ qua" : undefined}
          >
            <span className="bc-gallery-thumb"><img src="/__mockup/images/thu365-beauty-portrait.jpg" alt="" /></span>
            <span>Thư viện</span>
          </button>
          <div className="bc-capture-center">
            <div className="bc-mode-switch" role="tablist" aria-label="Chế độ chụp">
              {(["Ảnh", "Video"] as CameraMode[]).map((item) => (
                <button
                  key={item}
                  className={`bc-mode${mode === item ? " active" : ""}`}
                  onClick={() => setMode(item)}
                  role="tab"
                  aria-selected={mode === item}
                  disabled={optionalAccessSkipped && item === "Video"}
                  aria-label={optionalAccessSkipped && item === "Video" ? "Quay video đã tắt vì bạn bỏ qua quyền microphone" : `Chọn chế độ ${item}`}
                  title={optionalAccessSkipped && item === "Video" ? "Microphone đã được bỏ qua" : undefined}
                >
                  {item === "Video" && <Video size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />}{item}
                </button>
              ))}
            </div>
            <button
              className={`bc-shutter${mode === "Video" ? " video" : ""}`}
              onClick={() => showNotice("Điều khiển chụp chỉ minh họa trong bản xem trước")}
              aria-label={mode === "Ảnh" ? "Xem nút chụp minh họa" : "Xem nút quay video minh họa"}
            >
              <span className="bc-shutter-inner" />
            </button>
          </div>
          <button className="bc-side-action" onClick={() => showNotice("Đã mở bộ hiệu ứng nhanh")} aria-label="Khám phá hiệu ứng">
            <span className="bc-gallery-thumb" style={{ display: "grid", placeItems: "center", background: "linear-gradient(145deg,#4c3735,#211d20)" }}>
              <Aperture size={18} color="#f1d0c3" />
            </span>
            <span>Hiệu ứng</span>
          </button>
        </div>
      </main>

      {notice && <div className="bc-toast" role="status">{notice}</div>}

      {modal && (
        <div className="bc-modal-scrim" onClick={() => setModal(null)}>
          <section className="bc-modal" role="dialog" aria-modal="true" aria-labelledby="bc-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="bc-modal-top">
              <h2 id="bc-modal-title">{modal === "privacy" ? "Không gian riêng của bạn" : "Khoảnh khắc gần đây"}</h2>
              <button className="bc-modal-close" onClick={() => setModal(null)} aria-label="Đóng"><X size={16} /></button>
            </div>
            {modal === "privacy" ? (
              <>
                <p>THU365 giữ quyền kiểm soát trong tay bạn. Đây là bản xem trước trực quan; các quyền thiết bị chưa được yêu cầu.</p>
                <div className="bc-privacy-list">
                  <div className="bc-privacy-item"><LockKeyhole size={15} /><div><strong>Bạn tự quyết định</strong><br /><span>Chọn quyền cần thiết cho trải nghiệm của mình.</span></div></div>
                  <div className="bc-privacy-item"><CircleHelp size={15} /><div><strong>Bạn chọn cách chia sẻ</strong><br /><span>Chưa kết nối mạng xã hội hoặc thư viện thật.</span></div></div>
                </div>
              </>
            ) : (
              <>
                <div className="bc-gallery-preview">
                  <img src="/__mockup/images/thu365-beauty-portrait.jpg" alt="Chân dung xem trước trong thư viện" />
                  <div className="bc-gallery-preview-label">Ảnh xem trước · {activeLook.name}</div>
                </div>
                <p>Thư viện mẫu để bạn xem giao diện. Nội dung hiển thị chỉ mang tính minh họa.</p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
