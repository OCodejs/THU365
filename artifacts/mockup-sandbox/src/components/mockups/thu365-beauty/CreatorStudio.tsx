import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clapperboard,
  Expand,
  LockKeyhole,
  Music2,
  Pause,
  Play,
  Plus,
  Scissors,
  Send,
  Sparkles,
  Sticker,
  Type,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type Panel = "sound" | "sticker" | "text" | "export" | null;

const filters = [
  { name: "Gốc", tint: "none" },
  { name: "Nắng nhẹ", tint: "sepia(.16) saturate(1.08)" },
  { name: "Hồng đào", tint: "hue-rotate(-8deg) saturate(1.15)" },
  { name: "Film ấm", tint: "sepia(.28) contrast(1.04)" },
  { name: "Sương mai", tint: "brightness(1.08) saturate(.8)" },
];

const sounds = [
  { title: "Ngày trong veo", detail: "Nhạc không lời · 0:18", length: "00:18" },
  { title: "Chạm nắng", detail: "Guitar mộc · 0:24", length: "00:24" },
  { title: "Phút dịu dàng", detail: "Piano nhẹ · 0:15", length: "00:15" },
];

export function CreatorStudio() {
  const [filter, setFilter] = useState("Hồng đào");
  const [panel, setPanel] = useState<Panel>(null);
  const [sound, setSound] = useState(sounds[0]);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sticker, setSticker] = useState("");
  const [caption, setCaption] = useState("");
  const [exported, setExported] = useState(false);

  const openPanel = (next: Panel) => {
    setPanel(next);
    setExported(false);
  };

  return (
    <main className="thu-studio">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        .thu-studio {
          --bg: #10100f; --panel: #191817; --line: rgba(255,255,255,.09);
          --muted: #a5a09a; --soft: #ded9d2; --accent: #f3aa91; --accent2: #f5d3a7;
          min-height: 100dvh; width: 100%; overflow: hidden; position: relative;
          background: radial-gradient(ellipse at 50% 34%, #29201d 0, #151413 38%, var(--bg) 74%);
          color: #f5f0e9; font-family: 'DM Sans', sans-serif; box-sizing: border-box;
          padding: max(12px, env(safe-area-inset-top)) 16px max(14px, env(safe-area-inset-bottom));
          display: flex; flex-direction: column;
        }
        .thu-studio * { box-sizing: border-box; }
        .thu-studio button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .studio-top { height: 46px; display:flex; align-items:center; justify-content:space-between; flex:0 0 auto; }
        .studio-back, .studio-more { border:0; background:transparent; padding:8px; display:flex; align-items:center; justify-content:center; }
        .studio-title { font: 700 15px 'Manrope',sans-serif; letter-spacing:.015em; }
        .studio-subtitle { color:var(--muted); font-size:10px; margin-top:2px; text-align:center; }
        .privacy-pill { display:flex; gap:5px; align-items:center; color:#d6d0c9; font-size:10px; background:#242220; border:1px solid var(--line); border-radius:999px; padding:7px 9px; }
        .preview-stage { flex:1 1 auto; min-height:315px; max-height:405px; display:flex; justify-content:center; align-items:center; position:relative; margin:4px -16px 8px; }
        .portrait-frame { height:100%; max-height:405px; aspect-ratio:9/16; max-width:calc(100vw - 142px); border-radius:20px; overflow:hidden; position:relative; background:#302621; box-shadow:0 18px 55px rgba(0,0,0,.43); }
        .portrait-frame img { width:100%; height:100%; display:block; object-fit:cover; object-position:center 37%; transform:scale(1.06); transition:filter .28s ease; }
        .portrait-frame::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,rgba(0,0,0,.4),transparent 24%,transparent 62%,rgba(0,0,0,.5)); pointer-events:none; }
        .preview-head { position:absolute; z-index:2; top:11px; left:11px; right:11px; display:flex; justify-content:space-between; align-items:center; }
        .preview-tag { background:rgba(18,17,16,.66); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.16); border-radius:999px; padding:6px 8px; display:flex; align-items:center; gap:5px; font-size:9px; color:#fff9f1; }
        .preview-tools { position:absolute; z-index:2; right:10px; top:50%; transform:translateY(-40%); display:grid; gap:12px; }
        .preview-tool { width:32px; height:32px; border-radius:50%; background:rgba(20,18,17,.65); border:1px solid rgba(255,255,255,.16); display:grid; place-items:center; }
        .play-preview { position:absolute; z-index:2; left:50%; top:50%; transform:translate(-50%,-50%); width:46px; height:46px; border:1px solid rgba(255,255,255,.7); border-radius:50%; background:rgba(14,13,12,.3); display:grid; place-items:center; backdrop-filter:blur(7px); }
        .preview-foot { position:absolute; z-index:2; left:12px; right:12px; bottom:11px; display:flex; align-items:center; justify-content:space-between; font-size:10px; }
        .preview-caption { font:600 11px 'Manrope',sans-serif; letter-spacing:.01em; text-shadow:0 1px 8px #000; }
        .filter-strip { height:67px; flex:0 0 auto; display:flex; align-items:flex-start; gap:9px; overflow-x:auto; scrollbar-width:none; padding:0 1px 4px; }
        .filter-strip::-webkit-scrollbar { display:none; }
        .filter-option { flex:0 0 58px; display:flex; flex-direction:column; align-items:center; gap:5px; border:0; background:transparent; padding:0; color:#aaa39c!important; font-size:9px!important; white-space:nowrap; }
        .filter-thumb { width:47px; height:42px; border-radius:12px; overflow:hidden; border:1px solid transparent; position:relative; }
        .filter-thumb img { width:100%; height:100%; object-fit:cover; object-position:center 36%; }
        .filter-option.selected { color:#f8d4c3!important; }
        .filter-option.selected .filter-thumb { border:1.5px solid var(--accent); box-shadow:0 0 0 2px rgba(243,170,145,.15); }
        .sound-line { height:38px; flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; padding:0 10px; border-radius:12px; background:rgba(255,255,255,.055); border:1px solid var(--line); margin:0 0 8px; }
        .sound-detail { display:flex; align-items:center; min-width:0; gap:8px; }
        .sound-icon { width:25px; height:25px; display:grid; place-items:center; border-radius:8px; background:rgba(243,170,145,.15); color:var(--accent); }
        .sound-copy { min-width:0; }
        .sound-name { font-size:10px; font-weight:600; }
        .sound-meta { font-size:9px; color:var(--muted); margin-top:1px; }
        .timeline { flex:0 0 auto; height:91px; padding:9px 10px 8px; border-radius:14px; background:#1b1a19; border:1px solid rgba(255,255,255,.055); }
        .timeline-top { display:flex; justify-content:space-between; align-items:center; font-size:10px; margin-bottom:8px; }
        .timeline-label { display:flex; align-items:center; gap:6px; font-weight:600; }
        .time-count { color:#b3ada6; font-variant-numeric:tabular-nums; font-size:10px; }
        .clip-track { height:43px; display:flex; gap:4px; position:relative; align-items:stretch; }
        .clip { flex:1; min-width:0; position:relative; overflow:hidden; border-radius:5px; border:1px solid rgba(255,255,255,.12); }
        .clip img { width:100%; height:100%; object-fit:cover; object-position:center 39%; filter:saturate(.8); }
        .clip.active { border:1.5px solid #f4d3ad; }
        .clip:first-child { flex:1.25; }
        .clip:last-child { flex:.78; }
        .clip-plus { position:absolute; z-index:2; right:-1px; top:50%; transform:translateY(-50%); width:21px; height:21px; border-radius:50%; border:1px solid rgba(255,255,255,.22); background:#35312e; display:grid; place-items:center; }
        .timeline-playhead { position:absolute; z-index:3; left:39%; top:-3px; bottom:-3px; width:2px; background:#ffe3c9; box-shadow:0 0 6px rgba(255,227,201,.45); border-radius:2px; pointer-events:none; }
        .tools-row { height:72px; flex:0 0 auto; display:grid; grid-template-columns:repeat(4,1fr); align-items:center; }
        .tool-button { background:transparent; border:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:#d4cec7!important; font-size:9px!important; }
        .tool-icon { width:34px; height:34px; display:grid; place-items:center; border-radius:12px; background:#22201e; border:1px solid rgba(255,255,255,.06); color:#f0c6b1; }
        .export-row { flex:0 0 auto; display:flex; align-items:center; gap:10px; padding-top:3px; }
        .aspect-button { height:43px; min-width:68px; border-radius:13px; border:1px solid var(--line); background:#1b1a19; display:flex; align-items:center; justify-content:center; gap:6px; font-size:10px!important; }
        .export-button { flex:1; height:44px; background:linear-gradient(110deg,#f4c9af,#efaa93)!important; border:0; color:#271915!important; border-radius:14px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px!important; font-weight:700!important; letter-spacing:.01em; box-shadow:0 6px 19px rgba(214,132,106,.2); }
        .export-note { color:#9f9890; font-size:9px; margin-left:3px; }
        .studio-modal { position:absolute; z-index:10; inset:0; display:flex; align-items:flex-end; background:rgba(0,0,0,.58); backdrop-filter:blur(4px); }
        .modal-sheet { width:100%; border-radius:23px 23px 0 0; border:1px solid rgba(255,255,255,.1); background:#211f1d; padding:17px 18px max(20px,env(safe-area-inset-bottom)); box-shadow:0 -16px 55px rgba(0,0,0,.45); animation:sheet-up .2s ease-out; }
        @keyframes sheet-up { from { transform:translateY(18px); opacity:.75; } to { transform:translateY(0); opacity:1; } }
        .sheet-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .sheet-title { font:700 16px 'Manrope',sans-serif; }
        .sheet-close { width:30px; height:30px; border-radius:50%; border:0; background:#34312e; display:grid; place-items:center; }
        .sound-choice { width:100%; border:1px solid transparent; background:#2a2825; border-radius:13px; padding:11px; margin:5px 0; display:flex; align-items:center; gap:10px; text-align:left; }
        .sound-choice.chosen { border-color:rgba(243,170,145,.65); background:#302825; }
        .sound-choice .sound-name { font-size:12px; }
        .sound-choice .sound-meta { font-size:10px; }
        .choice-check { margin-left:auto; color:var(--accent); }
        .sticker-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .sticker-choice { padding:14px 6px; min-height:54px; border:1px solid var(--line); border-radius:12px; background:#2a2825; color:#e8ded4!important; font-size:11px!important; }
        .sticker-choice.chosen { border-color:var(--accent); color:var(--accent)!important; }
        .caption-input { width:100%; border-radius:12px; border:1px solid #51443d; background:#151413; color:#fff; padding:13px; outline:none; font:13px 'DM Sans',sans-serif; }
        .sheet-primary { width:100%; margin-top:12px; height:43px; border:0; border-radius:13px; background:var(--accent)!important; color:#2a1914!important; font-weight:700!important; font-size:12px!important; }
        .export-summary { background:#2b2825; border:1px solid var(--line); padding:14px; border-radius:14px; display:flex; align-items:center; gap:12px; }
        .export-ratio { width:34px; height:49px; border:1px solid #e8b49d; border-radius:7px; display:grid; place-items:center; font-size:8px; color:#ffd5bf; }
        .export-caption { font-size:12px; font-weight:600; }
        .export-sub { color:var(--muted); font-size:10px; margin-top:4px; }
        .done-message { text-align:center; padding:22px 6px 8px; }
        .done-mark { margin:0 auto 10px; width:43px; height:43px; display:grid; place-items:center; border-radius:50%; background:rgba(243,170,145,.16); color:var(--accent); }
        .done-title { font:700 16px 'Manrope',sans-serif; }
        .done-copy { margin:6px auto 0; color:var(--muted); font-size:11px; max-width:250px; line-height:1.5; }
        @media (max-height:760px) {
          .preview-stage { min-height:275px; }
          .filter-strip { height:61px; }
          .timeline { height:84px; }
          .tools-row { height:64px; }
        }
      `}</style>

      <header className="studio-top">
        <button className="studio-back" aria-label="Quay lại chế độ xem trước" onClick={() => { setEditing(false); setPanel(null); }}><ArrowLeft size={19} /></button>
        <div>
          <div className="studio-title">Dựng câu chuyện</div>
          <div className="studio-subtitle">Bản nháp · vừa lưu</div>
        </div>
        <div className="privacy-pill" aria-label="Chỉ mình tôi xem">
          <LockKeyhole size={12} /> Riêng tư
        </div>
      </header>

      <section className="preview-stage" aria-label="Xem trước video dọc">
        <div className="portrait-frame">
          <img
            src="/__mockup/images/thu365-beauty-portrait.jpg"
            alt="Chân dung tham chiếu cho câu chuyện làm đẹp"
            style={{ filter: filters.find((item) => item.name === filter)?.tint }}
          />
          <div className="preview-head">
            <span className="preview-tag"><Clapperboard size={11} /> XEM TRƯỚC</span>
            <span className="preview-tag"><Expand size={10} /> 9:16</span>
          </div>
          <div className="preview-tools">
            <button className="preview-tool" aria-label={muted ? "Bật âm thanh xem trước" : "Tắt âm thanh xem trước"} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
            <button className="preview-tool" aria-label="Tùy chọn khung hình" onClick={() => openPanel("export")}><Expand size={13} /></button>
          </div>
          <button className="play-preview" onClick={() => setPlaying(!playing)} aria-label={playing ? "Tạm dừng xem trước" : "Phát xem trước"}>
            {playing ? <Pause size={17} fill="white" /> : <Play size={17} fill="white" />}
          </button>
          {(sticker || caption) && (
            <div className="preview-caption">
              {caption || sticker}
            </div>
          )}
          <div className="preview-foot">
            <span className="preview-caption">một chút dịu dàng</span>
            <span className="preview-tag">00:12</span>
          </div>
        </div>
      </section>

      <div className="filter-strip" aria-label="Chọn màu sắc">
        {filters.map((item) => (
          <button
            key={item.name}
            className={`filter-option ${filter === item.name ? "selected" : ""}`}
            onClick={() => setFilter(item.name)}
            aria-pressed={filter === item.name}
          >
            <span className="filter-thumb">
              <img src="/__mockup/images/thu365-beauty-portrait.jpg" alt="" style={{ filter: item.tint }} />
            </span>
            {item.name}
          </button>
        ))}
      </div>

      <button className="sound-line" onClick={() => openPanel("sound")} aria-label={`Chọn âm thanh, hiện tại ${sound.title}`}>
        <span className="sound-detail">
          <span className="sound-icon"><Music2 size={13} /></span>
          <span className="sound-copy">
            <span className="sound-name">{sound.title}</span>
            <span className="sound-meta">Âm thanh · {sound.detail.split("·")[0].trim()}</span>
          </span>
        </span>
        <ChevronDown size={15} color="#b7aea5" />
      </button>

      <section className="timeline" aria-label="Dòng thời gian các đoạn video">
        <div className="timeline-top">
          <span className="timeline-label"><Scissors size={13} color="#efb99f" /> Dòng thời gian <span style={{ color: "#8e8882", fontWeight: 400 }}>· 3 đoạn</span></span>
          <span className="time-count">00:04 <span style={{ color: "#6f6963" }}>/</span> 00:12</span>
        </div>
        <div className="clip-track">
          <span className="timeline-playhead" />
          {[0, 1, 2].map((clip) => (
            <button
              key={clip}
              className={`clip ${clip === 0 ? "active" : ""}`}
              onClick={() => setEditing(true)}
              aria-label={`Chọn đoạn ${clip + 1}`}
            >
              <img src="/__mockup/images/thu365-beauty-portrait.jpg" alt="" />
              {clip === 0 && <span style={{ position: "absolute", left: 5, bottom: 3, fontSize: 8, textShadow: "0 1px 4px #000" }}>Cận cảnh</span>}
            </button>
          ))}
          <button className="clip-plus" onClick={() => setEditing(true)} aria-label="Thêm đoạn"><Plus size={13} /></button>
        </div>
      </section>

      <div className="tools-row">
        <button className="tool-button" onClick={() => { setEditing(true); setPanel(null); }} aria-pressed={editing}>
          <span className="tool-icon"><Scissors size={15} /></span>{editing ? "Đang chỉnh" : "Cắt đoạn"}
        </button>
        <button className="tool-button" onClick={() => openPanel("sticker")}>
          <span className="tool-icon"><Sticker size={15} /></span>Nhãn dán
        </button>
        <button className="tool-button" onClick={() => openPanel("text")}>
          <span className="tool-icon"><Type size={15} /></span>Thêm chữ
        </button>
        <button className="tool-button" onClick={() => setEditing(!editing)} aria-pressed={editing}>
          <span className="tool-icon"><Sparkles size={15} /></span>{editing ? "Đã chọn" : "Chuyển cảnh"}
        </button>
      </div>

      <div className="export-row">
        <button className="aspect-button" onClick={() => openPanel("export")} aria-label="Thiết lập khung xuất 9:16">
          <span style={{ width: 10, height: 15, border: "1px solid #edc1a9", borderRadius: 3 }} /> 9:16
        </button>
        <button className="export-button" onClick={() => openPanel("export")}>
          <Send size={14} /> Xuất video
        </button>
      </div>

      {panel && (
        <div className="studio-modal" onClick={() => setPanel(null)}>
          <section className="modal-sheet" role="dialog" aria-modal="true" aria-label="Tùy chọn dựng video" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-head">
              <div className="sheet-title">
                {panel === "sound" && "Chọn âm thanh"}
                {panel === "sticker" && "Thêm nhãn dán"}
                {panel === "text" && "Thêm dòng chữ"}
                {panel === "export" && (exported ? "Sẵn sàng chia sẻ" : "Kiểm tra video")}
              </div>
              <button className="sheet-close" onClick={() => setPanel(null)} aria-label="Đóng"><X size={15} /></button>
            </div>
            {panel === "sound" && (
              <>
                {sounds.map((item) => (
                  <button key={item.title} className={`sound-choice ${sound.title === item.title ? "chosen" : ""}`} onClick={() => setSound(item)}>
                    <span className="sound-icon"><Music2 size={15} /></span>
                    <span><span className="sound-name">{item.title}</span><span className="sound-meta">{item.detail}</span></span>
                    {sound.title === item.title && <Check className="choice-check" size={16} />}
                  </button>
                ))}
                <button className="sheet-primary" onClick={() => setPanel(null)}>Dùng âm thanh này</button>
              </>
            )}
            {panel === "sticker" && (
              <>
                <div className="sticker-grid">
                  {["Ánh nắng", "Ngày đẹp", "Tự tin", "Nhẹ nhàng", "Chăm da", "Lấp lánh"].map((item) => (
                    <button key={item} className={`sticker-choice ${sticker === item ? "chosen" : ""}`} onClick={() => setSticker(item)}>{item}</button>
                  ))}
                </div>
                <button className="sheet-primary" onClick={() => setPanel(null)}>Đặt vào video</button>
              </>
            )}
            {panel === "text" && (
              <>
                <input className="caption-input" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={36} placeholder="Viết một câu thật là bạn…" aria-label="Nội dung chữ" />
                <div className="sound-meta" style={{ margin: "8px 2px 0" }}>Tối đa 36 ký tự · bạn có thể chỉnh lại sau</div>
                <button className="sheet-primary" onClick={() => setPanel(null)}>Thêm vào câu chuyện</button>
              </>
            )}
            {panel === "export" && (
              exported ? (
                <div className="done-message">
                  <div className="done-mark"><Check size={21} /></div>
                  <div className="done-title">Bản xem trước đã sẵn sàng</div>
                  <p className="done-copy">Đây là mô phỏng giao diện. Video chưa được xử lý hay lưu vào thiết bị.</p>
                  <button className="sheet-primary" onClick={() => setPanel(null)}>Hoàn tất</button>
                </div>
              ) : (
                <>
                  <div className="export-summary">
                    <div className="export-ratio">9:16</div>
                    <div>
                      <div className="export-caption">Video dọc · 00:12</div>
                      <div className="export-sub">3 đoạn · {filter} · {sound.title}</div>
                      <div className="export-sub">Riêng tư · không tự động đăng</div>
                    </div>
                  </div>
                  <button className="sheet-primary" onClick={() => setExported(true)}>Xác nhận khung 9:16</button>
                </>
              )
            )}
          </section>
        </div>
      )}
    </main>
  );
}
