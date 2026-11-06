import { useState } from "react";
import { Aperture, ArrowUpRight, Camera, Clapperboard, ScanFace, Sparkles } from "lucide-react";
import { BeautyCamera } from "./BeautyCamera";
import { AIBeautyStudio } from "./AIBeautyStudio";
import { CreatorStudio } from "./CreatorStudio";

type Experience = "camera" | "portrait" | "video";

const options: {
  id: Experience;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Camera;
  imagePosition: string;
  tint: string;
}[] = [
  {
    id: "camera",
    number: "01",
    eyebrow: "MỞ CAMERA",
    title: "Chụp tức thì",
    description: "Thử sắc thái, tìm đúng ánh sáng của bạn.",
    icon: Camera,
    imagePosition: "50% 35%",
    tint: "rgba(194,133,119,.12)",
  },
  {
    id: "portrait",
    number: "02",
    eyebrow: "PHÒNG LÀM ĐẸP",
    title: "Chỉnh chân dung",
    description: "Tinh chỉnh từng nét, vẫn giữ chất riêng.",
    icon: ScanFace,
    imagePosition: "50% 44%",
    tint: "rgba(194,133,119,.22)",
  },
  {
    id: "video",
    number: "03",
    eyebrow: "STUDIO SÁNG TẠO",
    title: "Dựng video dọc",
    description: "Xếp cảnh, thêm chữ và xem trước khung 9:16.",
    icon: Clapperboard,
    imagePosition: "54% 29%",
    tint: "rgba(90,64,63,.32)",
  },
];

const pickerStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .thu365-picker, .thu365-picker * { box-sizing:border-box; }
  .thu365-picker {
    --pick-ink:#f6f0ec; --pick-muted:#aaa09c; --pick-rose:#e5b6aa; --pick-line:rgba(255,255,255,.11);
    min-height:100dvh; width:100%; max-width:520px; margin:0 auto; position:relative; isolation:isolate;
    overflow:hidden; color:var(--pick-ink); background:#0a0a0b; font-family:'DM Sans',sans-serif;
    padding: max(18px,env(safe-area-inset-top)) 22px max(22px,env(safe-area-inset-bottom));
  }
  .thu365-picker:before { content:""; position:fixed; z-index:-1; inset:0; pointer-events:none; opacity:.12;
    background:radial-gradient(ellipse at 68% 13%,rgba(185,112,98,.3),transparent 38%),
      url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.3'/%3E%3C/svg%3E");
  }
  .tp-header { height:34px; display:flex; justify-content:space-between; align-items:center; }
  .tp-wordmark { font:800 15px/1 'Manrope',sans-serif; letter-spacing:.2em; }
  .tp-wordmark span { color:var(--pick-rose); }
  .tp-private { display:flex; align-items:center; gap:6px; padding:7px 10px; border:1px solid var(--pick-line);
    border-radius:99px; color:#d6cbc7; background:rgba(255,255,255,.035); font-size:9px; letter-spacing:.02em; }
  .tp-hero { position:relative; height:204px; margin:21px -22px 0; overflow:hidden; }
  .tp-hero-image { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 40%; opacity:.63; }
  .tp-hero-shade { position:absolute; inset:0; background:linear-gradient(90deg,#0a0a0b 1%,rgba(10,10,11,.64) 43%,rgba(10,10,11,.02) 100%),linear-gradient(0deg,#0a0a0b 0%,transparent 48%); }
  .tp-hero-copy { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; padding:5px 22px 20px; }
  .tp-kicker { display:flex; align-items:center; gap:7px; color:#e9bcb0; font-size:9px; font-weight:700; letter-spacing:.2em; }
  .tp-headline { margin:12px 0 0; font:500 clamp(34px,10vw,43px)/.99 Georgia,serif; letter-spacing:-.055em; }
  .tp-headline em { color:#e9bcb0; font-weight:400; }
  .tp-intro { margin:10px 0 0; max-width:235px; color:rgba(246,240,236,.7); font-size:11px; line-height:1.55; }
  .tp-section-label { display:flex; align-items:center; justify-content:space-between; margin:6px 0 11px; }
  .tp-section-label strong { font:600 12px 'Manrope',sans-serif; }
  .tp-section-label span { color:#77716f; font-size:9px; }
  .tp-options { display:grid; gap:9px; }
  .tp-option {
    position:relative; min-height:106px; width:100%; overflow:hidden; display:flex; align-items:center; text-align:left;
    padding:13px 14px; border:1px solid rgba(255,255,255,.105); border-radius:15px;
    color:var(--pick-ink); background:#151414; cursor:pointer; -webkit-tap-highlight-color:transparent;
    transition:transform .18s ease,border-color .18s ease;
  }
  .tp-option:active { transform:scale(.985); }
  .tp-option:hover { border-color:rgba(229,182,170,.46); }
  .tp-option-photo { position:absolute; right:0; top:0; width:43%; height:100%; object-fit:cover; opacity:.55; }
  .tp-option-tint { position:absolute; inset:0; background:linear-gradient(90deg,#151414 20%,rgba(21,20,20,.93) 48%,transparent 100%); }
  .tp-option-content { position:relative; z-index:1; display:flex; align-items:center; width:100%; gap:12px; }
  .tp-icon { width:37px; height:37px; flex:0 0 37px; display:grid; place-items:center; border-radius:12px;
    color:#efc2b5; border:1px solid rgba(229,182,170,.2); background:rgba(229,182,170,.09); }
  .tp-copy { min-width:0; }
  .tp-eyebrow { display:block; color:#bd9388; font-size:8px; letter-spacing:.16em; font-weight:700; }
  .tp-title { display:block; margin-top:4px; font:650 15px/1.15 'Manrope',sans-serif; letter-spacing:-.035em; }
  .tp-description { display:block; max-width:225px; margin-top:5px; color:#aaa09c; font-size:9px; line-height:1.35; }
  .tp-arrow { margin-left:auto; align-self:flex-start; padding:5px; color:#c9a89f; }
  .tp-footnote { display:flex; gap:9px; align-items:flex-start; margin:14px 2px 0; color:#77716f; font-size:9px; line-height:1.45; }
  .tp-footnote svg { flex:0 0 auto; color:#c99c91; margin-top:1px; }
  @media(max-height:760px) {
    .thu365-picker { padding-top:max(12px,env(safe-area-inset-top)); }
    .tp-hero { height:170px; margin-top:12px; }
    .tp-options { gap:7px; }
    .tp-option { min-height:92px; }
  }
  @media(prefers-reduced-motion:reduce) { .tp-option { transition:none; } }
`;

export function THU365Prototype() {
  const [experience, setExperience] = useState<Experience | null>(null);

  if (experience === "camera") return <BeautyCamera onExit={() => setExperience(null)} />;
  if (experience === "portrait") return <AIBeautyStudio onExit={() => setExperience(null)} />;
  if (experience === "video") return <CreatorStudio onExit={() => setExperience(null)} />;

  return (
    <main className="thu365-picker">
      <style>{pickerStyles}</style>
      <header className="tp-header">
        <div className="tp-wordmark">THU<span>365</span></div>
        <div className="tp-private"><Aperture size={11} /> BEAUTY · RIÊNG TƯ</div>
      </header>

      <section className="tp-hero" aria-label="Giới thiệu THU365 Beauty">
        <img className="tp-hero-image" src="/__mockup/images/thu365-beauty-portrait.jpg" alt="" />
        <div className="tp-hero-shade" />
        <div className="tp-hero-copy">
          <div className="tp-kicker"><Sparkles size={12} /> MỘT KHÔNG GIAN CỦA RIÊNG BẠN</div>
          <h1 className="tp-headline">Đẹp theo<br /><em>cách của bạn.</em></h1>
          <p className="tp-intro">Chọn một cách bắt đầu. Thử nghiệm nhẹ nhàng, không áp lực.</p>
        </div>
      </section>

      <section aria-labelledby="tp-choose-title">
        <div className="tp-section-label">
          <strong id="tp-choose-title">Bạn muốn làm gì hôm nay?</strong>
          <span>CHỌN MỘT TRẢI NGHIỆM</span>
        </div>
        <div className="tp-options">
          {options.map(({ id, number, eyebrow, title, description, icon: Icon, imagePosition, tint }) => (
            <button key={id} className="tp-option" onClick={() => setExperience(id)} aria-label={`${title}: ${description}`}>
              <img
                className="tp-option-photo"
                src="/__mockup/images/thu365-beauty-portrait.jpg"
                alt=""
                style={{ objectPosition: imagePosition, filter: `saturate(.72) ${id === "video" ? "sepia(.2)" : ""}` }}
              />
              <span className="tp-option-tint" style={{ background: `linear-gradient(90deg,#151414 17%,rgba(21,20,20,.92) 49%,${tint})` }} />
              <span className="tp-option-content">
                <span className="tp-icon"><Icon size={17} strokeWidth={1.7} /></span>
                <span className="tp-copy">
                  <span className="tp-eyebrow">{number} / {eyebrow}</span>
                  <span className="tp-title">{title}</span>
                  <span className="tp-description">{description}</span>
                </span>
                <span className="tp-arrow"><ArrowUpRight size={16} /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="tp-footnote"><Aperture size={12} /> Bản xem trước giao diện · chưa chụp, xử lý hay lưu nội dung thật.</p>
    </main>
  );
}
