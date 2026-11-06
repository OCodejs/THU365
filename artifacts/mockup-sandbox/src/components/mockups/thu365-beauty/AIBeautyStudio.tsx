import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  LockKeyhole,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

type Look = "Hàn Quốc" | "Vintage" | "Anime" | "3D";
type Category = "Trang điểm" | "Làn da" | "Đường nét";

const looks: { name: Look; note: string; filter: string; tone: string }[] = [
  { name: "Hàn Quốc", note: "Trong trẻo", filter: "saturate(1.12) brightness(1.03)", tone: "#dca69c" },
  { name: "Vintage", note: "Phim ấm", filter: "sepia(.2) saturate(.92) contrast(.96)", tone: "#c8a47b" },
  { name: "Anime", note: "Mắt long lanh", filter: "saturate(1.32) brightness(1.06)", tone: "#c995b6" },
  { name: "3D", note: "Ánh khối", filter: "contrast(1.08) saturate(1.08)", tone: "#b9a2d1" },
];

const categorySettings: Record<Category, { title: string; value: number; left: string; right: string }> = {
  "Trang điểm": { title: "Cường độ trang điểm", value: 68, left: "Tự nhiên", right: "Rõ nét" },
  "Làn da": { title: "Độ mịn làn da", value: 42, left: "Giữ kết cấu", right: "Mịn hơn" },
  "Đường nét": { title: "Độ nét gương mặt", value: 34, left: "Nguyên bản", right: "Thanh thoát" },
};

export function AIBeautyStudio({ onExit }: { onExit?: () => void } = {}) {
  const [activeLook, setActiveLook] = useState<Look>("Hàn Quốc");
  const [category, setCategory] = useState<Category>("Trang điểm");
  const [intensity, setIntensity] = useState(68);
  const [comparing, setComparing] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const selectedLook = looks.find((look) => look.name === activeLook) ?? looks[0];

  const chooseCategory = (next: Category) => {
    setCategory(next);
    setIntensity(categorySettings[next].value);
  };

  const savePortrait = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const activeFilter = `${selectedLook.filter} ${category === "Làn da" ? "brightness(1.015)" : ""}`;

  return (
    <main className="thu365-studio">
      <style>{`
        .thu365-studio {
          --ink: #09090b;
          --panel: #141416;
          --panel-raised: #1b1b1e;
          --muted: #939095;
          --line: rgba(255,255,255,.09);
          --rose: #e5b6aa;
          --rose-bright: #f2c8bb;
          min-height: 100dvh;
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          overflow: hidden;
          color: #f6f1ee;
          background: var(--ink);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: -.015em;
          display: flex;
          flex-direction: column;
          position: relative;
          isolation: isolate;
        }
        .thu365-studio * { box-sizing: border-box; }
        .ts-topbar {
          height: 58px;
          min-height: 58px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 0 18px;
          background: #0a0a0c;
          border-bottom: 1px solid rgba(255,255,255,.035);
        }
        .ts-icon-button {
          width: 38px; height: 38px; border: 0; border-radius: 50%;
          color: #f3eeeb; background: transparent; display:grid; place-items:center;
          cursor:pointer; transition: background .18s ease, transform .18s ease;
        }
        .ts-icon-button:hover { background: rgba(255,255,255,.08); }
        .ts-icon-button:active { transform: scale(.94); }
        .ts-brand { text-align:center; line-height:1.1; }
        .ts-brand-name { font-family: Georgia, "Times New Roman", serif; font-size:18px; letter-spacing:.16em; font-weight:600; }
        .ts-brand-caption { margin-top:5px; color:#a7a0a2; font-size:9px; letter-spacing:.19em; text-transform:uppercase; }
        .ts-done {
          border:1px solid rgba(229,182,170,.37); background:rgba(229,182,170,.1);
          color:var(--rose-bright); height:34px; padding:0 13px; border-radius:999px;
          font-size:12px; font-weight:600; cursor:pointer;
        }
        .ts-photo-wrap {
          position:relative;
          height:min(40vh, 350px);
          min-height:300px;
          flex: 0 0 auto;
          overflow:hidden;
          background:#1a1718;
        }
        .ts-photo {
          display:block; width:100%; height:100%; object-fit:cover; object-position:center 43%;
          transition: filter .25s ease, transform .35s ease;
        }
        .ts-photo-overlay {
          position:absolute; inset:0; pointer-events:none; opacity:.28;
          background: linear-gradient(180deg, rgba(0,0,0,.34), transparent 23%, transparent 72%, rgba(0,0,0,.55));
        }
        .ts-photo-top {
          position:absolute; top:14px; left:15px; right:15px;
          display:flex; justify-content:space-between; align-items:center;
        }
        .ts-project-pill, .ts-privacy {
          height:29px; display:flex; align-items:center; gap:7px; border-radius:999px;
          background:rgba(15,14,15,.54); border:1px solid rgba(255,255,255,.16);
          backdrop-filter: blur(12px); color:#f7f0ed; font-size:10px;
        }
        .ts-project-pill { padding:0 11px; letter-spacing:.02em; }
        .ts-privacy { padding:0 10px; color:#eee2dc; cursor:pointer; font-family:inherit; }
        .ts-privacy svg { color:var(--rose-bright); }
        .ts-privacy-note {
          position:absolute; z-index:2; top:51px; right:15px; width:222px; padding:11px 12px;
          color:#eee7e4; background:rgba(18,16,17,.93); border:1px solid rgba(255,255,255,.14);
          border-radius:11px; backdrop-filter:blur(14px); font-size:10px; line-height:1.5;
          box-shadow:0 8px 25px rgba(0,0,0,.25);
        }
        .ts-photo-caption {
          position:absolute; bottom:13px; left:16px; color:rgba(255,255,255,.78);
          font-size:10px; letter-spacing:.04em; text-shadow:0 1px 8px rgba(0,0,0,.4);
        }
        .ts-compare {
          position:absolute; right:15px; bottom:13px; height:34px; padding:0 12px;
          display:flex; align-items:center; gap:7px; border:1px solid rgba(255,255,255,.23);
          border-radius:999px; background:rgba(13,12,13,.63); color:white;
          backdrop-filter:blur(10px); font-size:11px; cursor:pointer;
        }
        .ts-compare[aria-pressed="true"] { background:#f0d3c9; color:#201918; border-color:#f0d3c9; }
        .ts-compare-line { position:absolute; top:0; bottom:0; left:50%; width:1px; background:rgba(255,255,255,.88); pointer-events:none; }
        .ts-compare-line:after {
          content:"↔"; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          width:27px; height:27px; display:grid; place-items:center; border-radius:50%;
          background:rgba(16,15,16,.7); border:1px solid rgba(255,255,255,.75); color:white; font-size:13px;
        }
        .ts-workspace { padding: 15px 18px 17px; display:flex; flex-direction:column; gap:13px; }
        .ts-heading-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .ts-eyebrow { color:var(--rose); text-transform:uppercase; letter-spacing:.18em; font-size:9px; font-weight:700; }
        .ts-title { margin:5px 0 0; font-family:Georgia, "Times New Roman", serif; font-size:21px; line-height:1.14; font-weight:500; letter-spacing:-.035em; }
        .ts-project-meta { margin-top:5px; color:var(--muted); font-size:10px; }
        .ts-reset {
          margin-top:3px; padding:7px 0 7px 8px; display:flex; align-items:center; gap:6px;
          color:#b8b1b2; background:none; border:0; font-size:10px; cursor:pointer;
        }
        .ts-section-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:9px; }
        .ts-section-title { font-size:11px; font-weight:650; letter-spacing:.02em; }
        .ts-section-subtitle { color:#918b8d; font-size:9px; }
        .ts-look-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .ts-look {
          min-width:0; padding:0; text-align:left; color:#e9e4e1; border:0; background:none; cursor:pointer;
        }
        .ts-look-thumb {
          position:relative; height:54px; border-radius:9px; overflow:hidden; display:block;
          background:#292326; border:1px solid rgba(255,255,255,.08);
          transition:border-color .18s ease, transform .18s ease;
        }
        .ts-look:hover .ts-look-thumb { transform:translateY(-2px); }
        .ts-look[aria-pressed="true"] .ts-look-thumb { border:1.5px solid var(--rose-bright); }
        .ts-look-thumb img {
          width:100%; height:100%; display:block; object-fit:cover; object-position:center 38%;
          opacity:.82; filter:var(--look-filter);
        }
        .ts-look[aria-pressed="true"] .ts-look-thumb:after {
          content:""; position:absolute; inset:0; background:rgba(217,166,153,.10);
        }
        .ts-look-check {
          position:absolute; top:4px; right:4px; z-index:1; width:16px; height:16px;
          display:grid; place-items:center; border-radius:50%; background:#f0c8bc; color:#211817;
        }
        .ts-look-name { display:block; margin-top:6px; font-size:10px; font-weight:650; }
        .ts-look-note { display:block; margin-top:2px; font-size:8px; color:#969093; white-space:nowrap; }
        .ts-tools { border-top:1px solid var(--line); padding-top:12px; }
        .ts-category-row { display:flex; align-items:center; gap:6px; }
        .ts-category {
          padding:7px 11px; border-radius:999px; border:1px solid transparent;
          color:#a9a2a4; background:transparent; font-size:10px; cursor:pointer;
        }
        .ts-category[aria-pressed="true"] { color:#f2d1c7; background:rgba(229,182,170,.11); border-color:rgba(229,182,170,.2); }
        .ts-slider-head { display:flex; justify-content:space-between; align-items:center; margin:12px 1px 8px; }
        .ts-slider-title { font-size:10px; color:#e4dddd; }
        .ts-slider-value { color:var(--rose-bright); font-size:10px; font-variant-numeric:tabular-nums; }
        .ts-range {
          width:100%; height:3px; display:block; margin:0; appearance:none; -webkit-appearance:none;
          border-radius:99px; outline:none;
          background:linear-gradient(to right, #d6a99e 0%, #d6a99e var(--range-fill), #444044 var(--range-fill), #444044 100%);
          cursor:pointer;
        }
        .ts-range::-webkit-slider-thumb {
          appearance:none; -webkit-appearance:none; width:15px; height:15px; border-radius:50%;
          border:3px solid #171416; background:#f1c4b7; box-shadow:0 0 0 1px #e5b6aa;
        }
        .ts-range::-moz-range-thumb { width:10px; height:10px; border-radius:50%; border:3px solid #171416; background:#f1c4b7; box-shadow:0 0 0 1px #e5b6aa; }
        .ts-range-labels { display:flex; justify-content:space-between; margin-top:7px; color:#817b7e; font-size:9px; }
        .ts-footer {
          margin-top:auto; padding:12px 18px max(15px, env(safe-area-inset-bottom));
          background:linear-gradient(180deg, rgba(9,9,11,.15), #0a0a0c 27%);
          border-top:1px solid rgba(255,255,255,.055);
          padding-bottom:max(9px, env(safe-area-inset-bottom));
        }
        .ts-save {
          width:100%; min-height:46px; border:0; border-radius:12px; display:flex;
          align-items:center; justify-content:center; gap:9px; cursor:pointer;
          color:#241918; background:linear-gradient(105deg,#e8c0b4,#d9aaa0);
          font-size:12px; font-weight:720; letter-spacing:.01em; transition:transform .16s ease, filter .16s ease;
        }
        .ts-save:hover { filter:brightness(1.06); }
        .ts-save:active { transform:scale(.985); }
        .ts-save[aria-live] { }
        .ts-footer-note { margin-top:8px; text-align:center; color:#716b6e; font-size:9px; }
        .ts-toast {
          position:absolute; z-index:5; bottom:85px; left:50%; transform:translateX(-50%);
          padding:10px 15px; background:#f3e7e2; color:#251c1b; border-radius:999px;
          font-size:11px; font-weight:650; box-shadow:0 8px 28px rgba(0,0,0,.34);
          white-space:nowrap; animation:ts-toast-in .2s ease-out;
        }
        @keyframes ts-toast-in { from { opacity:0; transform:translate(-50%,7px); } to { opacity:1; transform:translate(-50%,0); } }
        @media (max-width:360px) {
          .ts-workspace { padding-left:14px; padding-right:14px; gap:12px; }
          .ts-photo-wrap { min-height:285px; }
          .ts-look-row { gap:5px; }
        }
        @media (min-height:900px) {
          .ts-photo-wrap { height:min(54vh,480px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .thu365-studio *, .thu365-studio *:before, .thu365-studio *:after { transition:none !important; animation:none !important; }
        }
      `}</style>

      <header className="ts-topbar">
          <button className="ts-icon-button" aria-label="Quay lại" onClick={() => onExit ? onExit() : setSaved(false)}>
          <ArrowLeft size={19} strokeWidth={1.7} />
        </button>
        <div className="ts-brand" aria-label="THU365 Beauty Studio">
          <div className="ts-brand-name">THU365</div>
          <div className="ts-brand-caption">Phòng làm đẹp</div>
        </div>
        <button className="ts-done" onClick={savePortrait}>{saved ? "Đã lưu" : "Lưu ảnh"}</button>
      </header>

      <section className="ts-photo-wrap" aria-label="Ảnh chân dung đang chỉnh sửa">
        <img
          className="ts-photo"
          src="/__mockup/images/thu365-beauty-portrait.jpg"
          alt="Chân dung tham chiếu đang được xem trước"
          style={{ filter: comparing ? "none" : activeFilter, transform: comparing ? "scale(1.015)" : "scale(1)" }}
        />
        {comparing && (
          <>
            <img
              className="ts-photo"
              src="/__mockup/images/thu365-beauty-portrait.jpg"
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                clipPath: "inset(0 50% 0 0)",
                filter: activeFilter,
                transform: "scale(1.015)",
              }}
            />
            <div className="ts-compare-line" />
          </>
        )}
        <div className="ts-photo-overlay" />
        <div className="ts-photo-top">
          <div className="ts-project-pill"><Sparkles size={12} /> Chân dung mới</div>
          <button className="ts-privacy" aria-expanded={privacyOpen} onClick={() => setPrivacyOpen((open) => !open)}>
            <LockKeyhole size={12} /> Quyền riêng tư
          </button>
        </div>
        {privacyOpen && (
          <div className="ts-privacy-note" role="status">
            Đây là bản xem trước. Chưa có kết nối lưu ảnh hoặc chia sẻ.
          </div>
        )}
        <div className="ts-photo-caption">{comparing ? "Trái: đã chỉnh · Phải: ảnh gốc" : "Ảnh gốc được giữ nguyên"}</div>
        <button className="ts-compare" aria-pressed={comparing} onClick={() => setComparing((value) => !value)}>
          <Eye size={14} /> {comparing ? "Đang so sánh" : "So sánh"}
        </button>
      </section>

      <section className="ts-workspace">
        <div className="ts-heading-row">
          <div>
            <div className="ts-eyebrow">Chỉnh ảnh chân dung</div>
            <h1 className="ts-title">Đẹp theo cách của bạn.</h1>
            <div className="ts-project-meta">Chọn một phong cách, rồi tinh chỉnh từng chút.</div>
          </div>
          <button className="ts-reset" onClick={() => { setActiveLook("Hàn Quốc"); chooseCategory("Trang điểm"); }}>
            <RotateCcw size={12} /> Đặt lại
          </button>
        </div>

        <section aria-label="Chọn phong cách">
          <div className="ts-section-heading">
            <span className="ts-section-title">Phong cách</span>
            <span className="ts-section-subtitle">{selectedLook.note} · có thể đổi bất cứ lúc nào</span>
          </div>
          <div className="ts-look-row">
            {looks.map((look) => (
              <button
                className="ts-look"
                key={look.name}
                aria-pressed={activeLook === look.name}
                onClick={() => setActiveLook(look.name)}
              >
                <span className="ts-look-thumb" style={{ ["--look-filter" as string]: look.filter }}>
                  <img src="/__mockup/images/thu365-beauty-portrait.jpg" alt="" />
                  {activeLook === look.name && <span className="ts-look-check"><Check size={10} strokeWidth={3} /></span>}
                </span>
                <span className="ts-look-name">{look.name}</span>
                <span className="ts-look-note">{look.note}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ts-tools" aria-label="Tinh chỉnh vẻ đẹp">
          <div className="ts-section-heading">
            <span className="ts-section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <SlidersHorizontal size={13} color="#e5b6aa" /> Tinh chỉnh
            </span>
            <span className="ts-section-subtitle">Điều chỉnh theo ý bạn</span>
          </div>
          <div className="ts-category-row" role="group" aria-label="Danh mục chỉnh sửa">
            {(["Trang điểm", "Làn da", "Đường nét"] as Category[]).map((item) => (
              <button
                key={item}
                className="ts-category"
                aria-pressed={category === item}
                onClick={() => chooseCategory(item)}
              >{item}</button>
            ))}
          </div>
          <div className="ts-slider-head">
            <label className="ts-slider-title" htmlFor="beauty-intensity">{categorySettings[category].title}</label>
            <span className="ts-slider-value">{intensity}%</span>
          </div>
          <input
            id="beauty-intensity"
            className="ts-range"
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            aria-label={categorySettings[category].title}
            style={{ ["--range-fill" as string]: `${intensity}%` }}
          />
          <div className="ts-range-labels">
            <span>{categorySettings[category].left}</span>
            <span>{categorySettings[category].right}</span>
          </div>
        </section>
      </section>

      <footer className="ts-footer">
        <button className="ts-save" onClick={savePortrait} aria-live="polite">
          {saved ? <Check size={17} /> : <Sparkles size={16} />}
          {saved ? "Đã lưu bản chỉnh sửa" : "Lưu bản chỉnh sửa"}
          {!saved && <ChevronRight size={16} />}
        </button>
        <div className="ts-footer-note">Ảnh gốc vẫn có thể xem lại trong bản xem trước.</div>
      </footer>
      {saved && <div className="ts-toast" role="status">Bản chỉnh sửa đã sẵn sàng trong phiên này</div>}
    </main>
  );
}
