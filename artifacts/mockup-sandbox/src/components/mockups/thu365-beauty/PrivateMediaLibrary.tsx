import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, Grid3X3, Image as ImageIcon, LockKeyhole, Play, ShieldCheck, Video, X } from "lucide-react";

type MediaKind = "photo" | "video";

const samples = [
  { id: "p1", kind: "photo" as const, title: "Ánh sáng dịu", date: "Hôm nay · 09:42", position: "50% 28%", tone: "saturate(.92) brightness(1.04)" },
  { id: "v1", kind: "video" as const, title: "Một chút dịu dàng", date: "Hôm qua · 18:20", position: "50% 42%", tone: "sepia(.12) saturate(.9)", duration: "00:12" },
  { id: "p2", kind: "photo" as const, title: "Nắng cuối ngày", date: "Hôm qua · 16:08", position: "50% 58%", tone: "sepia(.2) saturate(.92)" },
  { id: "p3", kind: "photo" as const, title: "Seoul glow", date: "Thứ Hai · 11:16", position: "50% 36%", tone: "saturate(1.16) brightness(1.08)" },
  { id: "v2", kind: "video" as const, title: "Khoảnh khắc tự tin", date: "Chủ nhật · 20:05", position: "50% 48%", tone: "contrast(.96) saturate(.84)", duration: "00:08" },
  { id: "p4", kind: "photo" as const, title: "Chân dung tự nhiên", date: "Thứ Bảy · 14:30", position: "50% 24%", tone: "brightness(1.03) saturate(.82)" },
];

const styles = `
  .ml-root,.ml-root *{box-sizing:border-box}
  .ml-root{--ml-ink:#f7f1ec;--ml-muted:#a79c96;--ml-line:rgba(255,255,255,.1);width:100%;max-width:430px;min-height:100dvh;margin:0 auto;padding:max(17px,env(safe-area-inset-top)) 19px max(24px,env(safe-area-inset-bottom));color:var(--ml-ink);background:#0b0b0b;font-family:'DM Sans',sans-serif;overflow-x:hidden}
  .ml-header{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .ml-back{width:36px;height:36px;flex:0 0 36px;border:1px solid var(--ml-line);border-radius:50%;display:grid;place-items:center;background:#191817;color:#f8eee8;cursor:pointer}
  .ml-brand{font:800 14px 'Manrope',sans-serif;letter-spacing:.16em}.ml-brand span{color:#e9b7aa}
  .ml-private{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid rgba(233,183,170,.2);border-radius:99px;color:#e8c6ba;background:rgba(233,183,170,.07);font-size:9px}
  .ml-heading{margin:25px 0 17px}.ml-eyebrow{color:#d2a99d;font-size:9px;font-weight:700;letter-spacing:.17em}.ml-title{margin:7px 0 5px;font:600 29px/1.08 Georgia,serif;letter-spacing:-.04em}.ml-subtitle{margin:0;color:var(--ml-muted);font-size:10px;line-height:1.5}
  .ml-privacy-card{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid rgba(233,183,170,.17);border-radius:13px;background:linear-gradient(120deg,rgba(233,183,170,.08),rgba(255,255,255,.025));}
  .ml-privacy-icon{width:29px;height:29px;flex:0 0 29px;border-radius:10px;display:grid;place-items:center;color:#e8c0b2;background:rgba(233,183,170,.1)}
  .ml-privacy-copy{min-width:0;font-size:9px;line-height:1.5;color:#c4b9b2}.ml-privacy-copy strong{display:block;margin-bottom:2px;color:#f5eae3;font-size:10px}
  .ml-tabs{display:flex;align-items:center;gap:8px;margin:20px 0 12px}
  .ml-tab{height:36px;min-width:92px;padding:0 13px;border:1px solid var(--ml-line);border-radius:11px;background:#171615;color:#aaa09a;font-size:10px;font-weight:600;cursor:pointer}
  .ml-tab.active{border-color:rgba(233,183,170,.5);background:rgba(233,183,170,.1);color:#f2c9bb}
  .ml-tab span{margin-left:6px;font-size:9px;opacity:.65}
  .ml-empty-toggle{margin-left:auto;padding:7px 0;border:0;background:none;color:#b6a9a1;font-size:9px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
  .ml-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
  .ml-item{position:relative;min-width:0;aspect-ratio: .78;border:1px solid rgba(255,255,255,.1);border-radius:11px;overflow:hidden;padding:0;background:#211e1c;text-align:left;cursor:pointer}
  .ml-item img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .25s ease}
  .ml-item:active img{transform:scale(1.04)}
  .ml-item-shade{position:absolute;inset:35% 0 0;background:linear-gradient(transparent,rgba(0,0,0,.75))}
  .ml-item-title{position:absolute;left:7px;right:7px;bottom:7px;color:white;font-size:8px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ml-kind{position:absolute;top:7px;left:7px;width:22px;height:22px;border-radius:7px;display:grid;place-items:center;color:white;background:rgba(0,0,0,.45);backdrop-filter:blur(8px)}
  .ml-duration{position:absolute;right:7px;top:10px;color:white;font-size:8px;font-variant-numeric:tabular-nums;text-shadow:0 1px 5px #000}
  .ml-sample-note{display:flex;align-items:center;gap:7px;margin:12px 1px 0;color:#857b75;font-size:9px}
  .ml-empty{min-height:230px;padding:28px 20px;border:1px dashed rgba(255,255,255,.16);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:rgba(255,255,255,.018)}
  .ml-empty-icon{width:48px;height:48px;display:grid;place-items:center;border:1px solid rgba(233,183,170,.2);border-radius:16px;color:#e5b8a9;background:rgba(233,183,170,.07)}
  .ml-empty h2{margin:13px 0 5px;font:600 15px 'Manrope',sans-serif}.ml-empty p{max-width:240px;margin:0;color:var(--ml-muted);font-size:10px;line-height:1.55}
  .ml-empty button{margin-top:15px;padding:9px 13px;border:1px solid rgba(233,183,170,.3);border-radius:10px;background:rgba(233,183,170,.08);color:#f0c5b7;font-size:10px;cursor:pointer}
  .ml-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px;padding-top:15px;border-top:1px solid var(--ml-line)}
  .ml-bottom-note{max-width:190px;color:#817771;font-size:8px;line-height:1.5}
  .ml-picker-link{display:flex;align-items:center;gap:5px;padding:9px 10px;border:1px solid var(--ml-line);border-radius:10px;background:#171615;color:#e9d9d0;font-size:9px;white-space:nowrap;cursor:pointer}
  .ml-preview-scrim{position:fixed;z-index:80;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.84);backdrop-filter:blur(12px)}
  .ml-preview{position:relative;width:min(100%,350px);padding:10px;border:1px solid rgba(255,255,255,.13);border-radius:19px;background:#171514;box-shadow:0 25px 80px rgba(0,0,0,.55)}
  .ml-preview-image{position:relative;overflow:hidden;aspect-ratio:9/12;border-radius:12px;background:#27211f}
  .ml-preview-image img{width:100%;height:100%;display:block;object-fit:cover}
  .ml-preview-image:after{content:"";position:absolute;inset:45% 0 0;background:linear-gradient(transparent,rgba(0,0,0,.5))}
  .ml-preview-play{position:absolute;z-index:1;left:50%;top:50%;transform:translate(-50%,-50%);width:48px;height:48px;border:1px solid rgba(255,255,255,.6);border-radius:50%;display:grid;place-items:center;color:white;background:rgba(0,0,0,.3);backdrop-filter:blur(8px)}
  .ml-preview-close{position:absolute;z-index:2;right:17px;top:17px;width:31px;height:31px;border:1px solid rgba(255,255,255,.2);border-radius:50%;display:grid;place-items:center;color:white;background:rgba(0,0,0,.45);cursor:pointer}
  .ml-preview-meta{padding:12px 4px 4px}.ml-preview-meta strong{display:block;font-size:12px}.ml-preview-meta span{display:block;margin-top:4px;color:var(--ml-muted);font-size:9px}
  .ml-root button:focus-visible{outline:2px solid #f0c4b5;outline-offset:3px}
  @media(max-width:350px){.ml-root{padding-left:14px;padding-right:14px}.ml-grid{gap:6px}.ml-item-title{font-size:7px}.ml-tab{min-width:78px;padding:0 9px}}
  @media(max-height:620px){.ml-heading{margin:14px 0 11px}.ml-title{font-size:25px}.ml-privacy-card{padding:9px}.ml-tabs{margin:13px 0 9px}.ml-item{aspect-ratio:.9}.ml-bottom{margin-top:14px}}
  @media(prefers-reduced-motion:reduce){.ml-item img{transition:none}}
`;

export function PrivateMediaLibrary({ onBack, onConceptPicker }: { onBack: () => void; onConceptPicker: () => void }) {
  const [kind, setKind] = useState<MediaKind>("photo");
  const [emptyPreview, setEmptyPreview] = useState(false);
  const [selected, setSelected] = useState<(typeof samples)[number] | null>(null);
  const visibleSamples = samples.filter((item) => item.kind === kind);

  return (
    <main className="ml-root">
      <style>{styles}</style>
      <header className="ml-header">
        <button type="button" className="ml-back" onClick={onBack} aria-label="Quay lại camera"><ArrowLeft size={17} /></button>
        <div className="ml-brand">THU<span>365</span></div>
        <div className="ml-private"><LockKeyhole size={11} /> RIÊNG TƯ</div>
      </header>

      <section className="ml-heading">
        <div className="ml-eyebrow">KHÔNG GIAN CỦA BẠN</div>
        <h1 className="ml-title">Thư viện riêng tư</h1>
        <p className="ml-subtitle">Xem lại những khoảnh khắc trong giao diện mẫu THU365.</p>
      </section>

      <section className="ml-privacy-card" aria-label="Trạng thái quyền riêng tư">
        <span className="ml-privacy-icon"><ShieldCheck size={15} /></span>
        <div className="ml-privacy-copy"><strong>Chỉ là nội dung mẫu</strong>Đây là bản xem trước trực quan. Không truy cập tệp trên thiết bị, không tải lên và không lưu trữ ảnh hoặc video thật.</div>
      </section>

      <div className="ml-tabs" role="tablist" aria-label="Loại nội dung thư viện">
        <button type="button" role="tab" aria-selected={kind === "photo"} className={`ml-tab ${kind === "photo" ? "active" : ""}`} onClick={() => { setKind("photo"); setEmptyPreview(false); }}>Ảnh <span>04</span></button>
        <button type="button" role="tab" aria-selected={kind === "video"} className={`ml-tab ${kind === "video" ? "active" : ""}`} onClick={() => { setKind("video"); setEmptyPreview(false); }}>Video <span>02</span></button>
        <button type="button" className="ml-empty-toggle" onClick={() => setEmptyPreview(!emptyPreview)} aria-pressed={emptyPreview}>{emptyPreview ? "Xem mẫu" : "Xem trạng thái trống"}</button>
      </div>

      {emptyPreview ? (
        <section className="ml-empty" aria-live="polite">
          <span className="ml-empty-icon">{kind === "photo" ? <ImageIcon size={22} /> : <Video size={22} />}</span>
          <h2>Chưa có {kind === "photo" ? "ảnh" : "video"} mẫu</h2>
          <p>Khi thư viện chưa có nội dung, trạng thái trống sẽ hiển thị tại đây. Bạn vẫn có thể quay lại camera hoặc chọn trải nghiệm khác.</p>
          <button type="button" onClick={() => setEmptyPreview(false)}>Hiển thị nội dung mẫu</button>
        </section>
      ) : (
        <section className="ml-grid" aria-label={kind === "photo" ? "Ảnh mẫu" : "Video mẫu"}>
          {visibleSamples.map((item) => (
            <button type="button" className="ml-item" key={item.id} onClick={() => setSelected(item)} aria-label={`Xem trước ${item.kind === "photo" ? "ảnh" : "video"} mẫu: ${item.title}`}>
              <img src="/__mockup/images/thu365-beauty-portrait.jpg" alt="" style={{ objectPosition: item.position, filter: item.tone }} />
              <span className="ml-item-shade" />
              <span className="ml-kind">{item.kind === "photo" ? <ImageIcon size={12} /> : <Play size={11} fill="currentColor" />}</span>
              {item.duration && <span className="ml-duration">{item.duration}</span>}
              <span className="ml-item-title">{item.title}</span>
            </button>
          ))}
        </section>
      )}

      {!emptyPreview && <p className="ml-sample-note"><Check size={12} /> {visibleSamples.length} mục minh họa · Không phải tệp thật trên thiết bị</p>}

      <footer className="ml-bottom">
        <p className="ml-bottom-note">Bản prototype không mở thư viện hệ thống và không thực hiện thao tác lưu hoặc chia sẻ.</p>
        <button type="button" className="ml-picker-link" onClick={onConceptPicker}>Về chọn trải nghiệm <ChevronRight size={13} /></button>
      </footer>

      {selected && (
        <div className="ml-preview-scrim" role="presentation" onClick={() => setSelected(null)}>
          <section className="ml-preview" role="dialog" aria-modal="true" aria-label={`Xem trước ${selected.kind === "photo" ? "ảnh" : "video"} mẫu`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="ml-preview-close" onClick={() => setSelected(null)} aria-label="Đóng xem trước"><X size={15} /></button>
            <div className="ml-preview-image">
              <img src="/__mockup/images/thu365-beauty-portrait.jpg" alt={selected.title} style={{ objectPosition: selected.position, filter: selected.tone }} />
              {selected.kind === "video" && <span className="ml-preview-play"><Play size={19} fill="white" /></span>}
            </div>
            <div className="ml-preview-meta"><strong>{selected.title}</strong><span>{selected.kind === "photo" ? "Ảnh mẫu" : `Video mẫu · ${selected.duration}`} · {selected.date} · Chỉ xem trước</span></div>
          </section>
        </div>
      )}
    </main>
  );
}
