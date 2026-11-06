import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  CirclePlay,
  Compass,
  Heart,
  Search,
  Sparkles,
  X,
} from "lucide-react";

type Effect = {
  id: string;
  name: string;
  creator: string;
  category: string;
  uses: string;
  note: string;
  tone: string;
  filter: string;
  featured?: boolean;
};

const effects: Effect[] = [
  {
    id: "saigon-sun",
    name: "Nắng xiên Sài Gòn",
    creator: "Mây Lê",
    category: "Film",
    uses: "24,6K",
    note: "Nắng cuối chiều, màu phim hạt mịn.",
    tone: "#c88062",
    filter: "sepia(.19) saturate(1.2) contrast(.92) brightness(1.08)",
    featured: true,
  },
  {
    id: "mot-chut-hong",
    name: "Một chút hồng",
    creator: "Linh Nhi",
    category: "Chân dung",
    uses: "18,2K",
    note: "Má hồng nhẹ, da vẫn là da của bạn.",
    tone: "#e894a2",
    filter: "saturate(1.16) hue-rotate(-8deg) brightness(1.05)",
  },
  {
    id: "dem-da-lat",
    name: "Đêm Đà Lạt",
    creator: "Khoa Phạm",
    category: "Film",
    uses: "12,8K",
    note: "Một chút lạnh và màu đèn phố.",
    tone: "#7891a0",
    filter: "saturate(.82) hue-rotate(8deg) contrast(1.08) brightness(.91)",
  },
  {
    id: "may-tang",
    name: "Mây tầng",
    creator: "An Nhiên",
    category: "Ánh sáng",
    uses: "9,4K",
    note: "Ánh sáng mềm như vừa chạm mây.",
    tone: "#c5a6bb",
    filter: "brightness(1.15) saturate(.83) contrast(.9)",
  },
  {
    id: "bep-nha",
    name: "Bếp nhà chủ nhật",
    creator: "Quỳnh Trần",
    category: "Đời thường",
    uses: "8,1K",
    note: "Ấm vừa đủ cho những ngày bình thường.",
    tone: "#d6a573",
    filter: "sepia(.14) saturate(1.08) contrast(.95)",
  },
  {
    id: "nuoc-len",
    name: "Nước lên",
    creator: "Bảo Vy",
    category: "Chân dung",
    uses: "6,7K",
    note: "Bắt sáng trong, giữ nét tự nhiên.",
    tone: "#87a9ac",
    filter: "saturate(1.05) brightness(1.08) hue-rotate(-5deg)",
  },
];

const categories = ["Tất cả", "Film", "Chân dung", "Ánh sáng", "Đời thường"];
const portrait = "/__mockup/images/thu365-beauty-portrait.jpg";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .led-root, .led-root * { box-sizing:border-box; }
  .led-root {
    --paper:#f3eee8; --ink:#f7f0e9; --muted:rgba(247,240,233,.58);
    --soft:rgba(255,255,255,.09); --line:rgba(255,255,255,.1); --accent:#e4a794;
    position:relative; isolation:isolate; width:100%; max-width:430px; min-height:100dvh;
    margin:0 auto; overflow:hidden; color:var(--ink); background:#141312;
    font-family:'DM Sans',sans-serif; padding-bottom:83px;
  }
  .led-root:before { content:''; position:fixed; inset:0; z-index:-1; pointer-events:none; opacity:.12;
    background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E\"); }
  .led-page { padding: max(17px,env(safe-area-inset-top)) 20px 28px; animation:led-arrive .38s ease both; }
  .led-top { height:38px; display:flex; align-items:center; justify-content:space-between; }
  .led-brand { font:800 17px/1 'Manrope',sans-serif; letter-spacing:.16em; }
  .led-brand span { color:var(--accent); }
  .led-avatar { width:35px; height:35px; display:grid; place-items:center; border:1px solid rgba(255,255,255,.16);
    border-radius:50%; color:#f2dbd1; background:#302623; font-size:10px; font-weight:700; }
  .led-title-row { display:flex; align-items:flex-end; justify-content:space-between; margin:28px 0 15px; }
  .led-eyebrow { display:flex; gap:7px; align-items:center; color:#e9b7a8; font-size:9px; font-weight:700; letter-spacing:.17em; text-transform:uppercase; }
  .led-title { margin:8px 0 0; font:700 29px/.99 'Manrope',sans-serif; letter-spacing:-.065em; }
  .led-title em { color:#e9b7a8; font-weight:500; }
  .led-count { padding:7px 9px; border-radius:20px; color:rgba(255,255,255,.68); background:rgba(255,255,255,.06); font-size:9px; white-space:nowrap; }
  .led-feature { position:relative; height:290px; overflow:hidden; border-radius:20px; background:#40342e; box-shadow:0 14px 36px rgba(0,0,0,.2); }
  .led-feature-img { width:100%; height:100%; display:block; object-fit:cover; object-position:center 36%; filter:sepia(.13) saturate(1.12) brightness(.92); }
  .led-feature-wash { position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(180deg,rgba(21,17,16,.32),transparent 34%,rgba(14,12,12,.08) 48%,rgba(14,12,12,.9) 100%); }
  .led-feature-top { position:absolute; top:14px; left:14px; right:14px; display:flex; align-items:center; justify-content:space-between; }
  .led-pick { display:flex; gap:6px; align-items:center; padding:7px 9px; border:1px solid rgba(255,255,255,.22); border-radius:30px;
    background:rgba(20,17,16,.43); backdrop-filter:blur(12px); color:#fff2eb; font-size:9px; font-weight:700; letter-spacing:.04em; }
  .led-save { width:34px; height:34px; display:grid; place-items:center; border:1px solid rgba(255,255,255,.26);
    border-radius:50%; background:rgba(20,17,16,.42); color:white; cursor:pointer; }
  .led-save.saved { color:#f1b2a7; background:rgba(53,30,28,.72); }
  .led-feature-copy { position:absolute; left:17px; right:16px; bottom:16px; }
  .led-feature-meta { display:flex; align-items:center; gap:7px; margin-bottom:7px; color:rgba(255,255,255,.76); font-size:9px; }
  .led-mini-avatar { width:20px; height:20px; display:grid; place-items:center; border-radius:50%; background:#c58f80; color:#281d1a; font-size:8px; font-weight:800; }
  .led-feature-name { margin:0; font:700 22px/1.05 'Manrope',sans-serif; letter-spacing:-.045em; }
  .led-feature-bottom { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-top:7px; }
  .led-feature-note { max-width:200px; margin:0; color:rgba(255,255,255,.73); font-size:10px; line-height:1.5; }
  .led-try { display:flex; align-items:center; gap:7px; padding:10px 12px; border:0; border-radius:22px; color:#251b18;
    background:#f0c5b4; font-size:10px; font-weight:700; white-space:nowrap; cursor:pointer; transition:transform .2s ease; }
  .led-try:active { transform:scale(.96); }
  .led-search { display:flex; align-items:center; gap:10px; height:43px; margin:18px 0 17px; padding:0 13px;
    border:1px solid rgba(255,255,255,.1); border-radius:13px; background:#201e1c; color:rgba(255,255,255,.53); }
  .led-search input { width:100%; border:0; outline:0; color:#f7f0e9; background:transparent; font:500 11px 'DM Sans',sans-serif; }
  .led-search input::placeholder { color:rgba(255,255,255,.43); }
  .led-section-head { display:flex; align-items:center; justify-content:space-between; margin:0 0 11px; }
  .led-section-title { margin:0; font:700 14px 'Manrope',sans-serif; letter-spacing:-.03em; }
  .led-section-link { display:flex; align-items:center; gap:2px; padding:3px 0; border:0; color:#e7b4a5; background:none; font:600 9px 'DM Sans',sans-serif; cursor:pointer; }
  .led-chips { display:flex; gap:7px; overflow-x:auto; margin:0 -20px 17px; padding:0 20px 3px; scrollbar-width:none; }
  .led-chips::-webkit-scrollbar { display:none; }
  .led-chip { padding:8px 12px; border:1px solid rgba(255,255,255,.1); border-radius:30px; color:rgba(255,255,255,.67);
    background:transparent; font:600 9px 'DM Sans',sans-serif; white-space:nowrap; cursor:pointer; }
  .led-chip.active { border-color:#e5b09f; color:#2a1f1c; background:#e5b09f; }
  .led-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .led-card { position:relative; min-width:0; padding:0; overflow:hidden; border:1px solid rgba(255,255,255,.09);
    border-radius:14px; background:#211f1d; color:var(--ink); text-align:left; cursor:pointer; }
  .led-card-art { position:relative; height:130px; overflow:hidden; background:#3a312e; }
  .led-card-art img { display:block; width:100%; height:100%; object-fit:cover; object-position:center 37%; }
  .led-card-art:after { content:''; position:absolute; inset:36% 0 0; background:linear-gradient(transparent,rgba(19,17,16,.55)); }
  .led-card-category { position:absolute; top:9px; left:9px; z-index:1; padding:5px 7px; border:1px solid rgba(255,255,255,.2);
    border-radius:20px; color:#fff2eb; background:rgba(19,17,16,.45); backdrop-filter:blur(8px); font-size:8px; }
  .led-card-play { position:absolute; right:9px; bottom:9px; z-index:1; display:grid; width:27px; height:27px; place-items:center;
    border:1px solid rgba(255,255,255,.35); border-radius:50%; color:white; background:rgba(20,17,16,.35); }
  .led-card-info { padding:10px 10px 11px; }
  .led-card-name { margin:0; overflow:hidden; font:700 11px 'Manrope',sans-serif; letter-spacing:-.02em; text-overflow:ellipsis; white-space:nowrap; }
  .led-card-byline { display:flex; justify-content:space-between; gap:4px; margin-top:5px; color:rgba(255,255,255,.48); font-size:8px; }
  .led-card-byline span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .led-empty { padding:22px 16px; border:1px dashed rgba(255,255,255,.16); border-radius:14px; color:rgba(255,255,255,.63); font-size:11px; line-height:1.6; text-align:center; }
  .led-empty strong { display:block; margin-bottom:4px; color:#f3e9e2; font:700 13px 'Manrope',sans-serif; }
  .led-dock { position:fixed; z-index:4; bottom:0; left:50%; transform:translateX(-50%); width:min(100%,430px);
    display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:11px 28px max(13px,env(safe-area-inset-bottom));
    border-top:1px solid rgba(255,255,255,.08); background:rgba(20,19,18,.93); backdrop-filter:blur(18px); }
  .led-dock-button { display:flex; align-items:center; justify-content:center; gap:7px; min-height:38px; border:0; border-radius:12px;
    color:rgba(255,255,255,.48); background:transparent; font:600 10px 'DM Sans',sans-serif; cursor:pointer; }
  .led-dock-button.active { color:#e9b7a8; background:rgba(228,167,148,.1); }
  .led-notice { position:fixed; z-index:9; left:50%; bottom:82px; transform:translateX(-50%); max-width:calc(100% - 32px);
    padding:10px 14px; border:1px solid rgba(255,255,255,.14); border-radius:22px; color:#f8eee7; background:#302a27;
    box-shadow:0 8px 28px rgba(0,0,0,.35); font-size:10px; white-space:nowrap; animation:led-pop .2s ease both; }
  .led-modal-scrim { position:fixed; z-index:8; inset:0; display:flex; align-items:flex-end; justify-content:center; background:rgba(0,0,0,.65); }
  .led-modal { width:min(100%,430px); max-height:92dvh; overflow:auto; padding:15px 20px max(24px,env(safe-area-inset-bottom));
    border:1px solid rgba(255,255,255,.12); border-radius:24px 24px 0 0; color:#f7f0e9; background:#1b1918; animation:led-rise .24s ease both; }
  .led-modal-grip { width:34px; height:3px; margin:0 auto 14px; border-radius:3px; background:rgba(255,255,255,.25); }
  .led-modal-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:13px; }
  .led-modal-label { color:#e9b7a8; font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
  .led-close { width:30px; height:30px; display:grid; place-items:center; border:0; border-radius:50%; color:#fff; background:rgba(255,255,255,.09); cursor:pointer; }
  .led-modal-art { position:relative; height:250px; overflow:hidden; border-radius:16px; background:#39302c; }
  .led-modal-art img { width:100%; height:100%; display:block; object-fit:cover; object-position:center 35%; }
  .led-preview-label { position:absolute; top:11px; left:11px; display:flex; align-items:center; gap:6px; padding:7px 9px;
    border:1px solid rgba(255,255,255,.2); border-radius:30px; background:rgba(15,13,12,.46); font-size:9px; }
  .led-modal-name { margin:16px 0 5px; font:700 23px/1.05 'Manrope',sans-serif; letter-spacing:-.05em; }
  .led-modal-byline { display:flex; align-items:center; gap:7px; color:rgba(255,255,255,.61); font-size:10px; }
  .led-modal-note { margin:12px 0 14px; color:rgba(255,255,255,.69); font-size:11px; line-height:1.55; }
  .led-modal-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .led-usage { display:flex; align-items:center; gap:6px; color:rgba(255,255,255,.58); font-size:9px; }
  .led-modal-try { min-height:40px; display:flex; align-items:center; justify-content:center; gap:7px; padding:0 15px; border:0; border-radius:22px;
    color:#281e1a; background:#edc0ae; font:700 10px 'DM Sans',sans-serif; cursor:pointer; }
  .led-modal-try.done { color:#f6e8df; background:#4b6c5a; }
  @keyframes led-arrive { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
  @keyframes led-pop { from { opacity:0; transform:translate(-50%,8px); } to { opacity:1; transform:translate(-50%,0); } }
  @keyframes led-rise { from { opacity:.7; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @media (max-width:360px) {
    .led-page { padding-left:16px; padding-right:16px; }
    .led-chips { margin-left:-16px; margin-right:-16px; padding-left:16px; padding-right:16px; }
    .led-feature { height:270px; }
    .led-card-art { height:116px; }
  }
  @media (prefers-reduced-motion:reduce) {
    .led-page,.led-modal,.led-notice { animation:none; }
    .led-try { transition:none; }
  }
`;

export function LiveEffectsDiscovery() {
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"discover" | "saved">("discover");
  const [savedIds, setSavedIds] = useState<string[]>(["dem-da-lat"]);
  const [selected, setSelected] = useState<Effect | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [notice, setNotice] = useState("");

  const featured = effects[0];
  const shownEffects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return effects.filter((effect) => {
      const matchesCategory = category === "Tất cả" || effect.category === category;
      const matchesTab = activeTab === "discover" || savedIds.includes(effect.id);
      const matchesSearch = !normalized || `${effect.name} ${effect.creator} ${effect.category}`.toLocaleLowerCase("vi").includes(normalized);
      return matchesCategory && matchesTab && matchesSearch;
    });
  }, [activeTab, category, query, savedIds]);

  const toast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const toggleSaved = (id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((saved) => saved !== id) : [...current, id]);
  };

  const openEffect = (effect: Effect) => {
    setSelected(effect);
    setPreviewing(false);
  };

  const closeEffect = () => {
    setSelected(null);
    setPreviewing(false);
  };

  const imageStyle = (effect: Effect): CSSProperties => ({ filter: effect.filter });

  return (
    <div className="led-root">
      <style>{styles}</style>
      <main className="led-page">
        <header className="led-top">
          <div className="led-brand">THU<span>365</span></div>
          <div className="led-avatar" aria-label="Hồ sơ người dùng">MN</div>
        </header>

        <div className="led-title-row">
          <div>
            <div className="led-eyebrow"><Sparkles size={11} /> Góc sáng tạo Việt</div>
            <h1 className="led-title">Lên mood<br /><em>của bạn.</em></h1>
          </div>
          <div className="led-count">128 hiệu ứng mới</div>
        </div>

        <section className="led-feature" aria-label="Hiệu ứng nổi bật">
          <img className="led-feature-img" src={portrait} alt="Chân dung minh họa hiệu ứng Nắng xiên Sài Gòn" style={imageStyle(featured)} />
          <div className="led-feature-wash" />
          <div className="led-feature-top">
            <div className="led-pick"><Sparkles size={11} /> LỰA CHỌN CỦA THU365</div>
            <button
              className={`led-save${savedIds.includes(featured.id) ? " saved" : ""}`}
              aria-label={savedIds.includes(featured.id) ? "Bỏ lưu hiệu ứng" : "Lưu hiệu ứng"}
              aria-pressed={savedIds.includes(featured.id)}
              onClick={() => toggleSaved(featured.id)}
            >
              <Bookmark size={15} fill={savedIds.includes(featured.id) ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="led-feature-copy">
            <div className="led-feature-meta"><span className="led-mini-avatar">ML</span> Mây Lê · creator Việt</div>
            <h2 className="led-feature-name">{featured.name}</h2>
            <div className="led-feature-bottom">
              <p className="led-feature-note">{featured.note}<br />Lấy cảm hứng từ nắng đường Nguyễn Huệ.</p>
              <button className="led-try" onClick={() => openEffect(featured)}>Khám phá <ArrowUpRight size={13} /></button>
            </div>
          </div>
        </section>

        <label className="led-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm hiệu ứng hoặc creator"
            aria-label="Tìm hiệu ứng hoặc creator"
          />
          {query && <button onClick={() => setQuery("")} aria-label="Xóa tìm kiếm" style={{ border: 0, padding: 0, color: "inherit", background: "none", cursor: "pointer" }}><X size={14} /></button>}
        </label>

        <section aria-labelledby="led-browse-title">
          <div className="led-section-head">
            <h2 className="led-section-title" id="led-browse-title">{activeTab === "saved" ? "Kho đã lưu" : "Khám phá hiệu ứng"}</h2>
            <button className="led-section-link" onClick={() => { setActiveTab("discover"); setCategory("Tất cả"); setQuery(""); }}>
              {activeTab === "saved" ? "Xem tất cả" : "Mới mỗi tuần"} <ChevronRight size={13} />
            </button>
          </div>
          <div className="led-chips" role="tablist" aria-label="Lọc theo phong cách">
            {categories.map((item) => (
              <button
                key={item}
                className={`led-chip${category === item ? " active" : ""}`}
                role="tab"
                aria-selected={category === item}
                onClick={() => setCategory(item)}
              >{item}</button>
            ))}
          </div>

          {shownEffects.length > 0 ? (
            <div className="led-grid">
              {shownEffects.map((effect) => (
                <button className="led-card" key={effect.id} onClick={() => openEffect(effect)} aria-label={`Xem hiệu ứng ${effect.name}`}>
                  <div className="led-card-art">
                    <img src={portrait} alt="" style={imageStyle(effect)} />
                    <span className="led-card-category">{effect.category}</span>
                    <span className="led-card-play"><CirclePlay size={15} /></span>
                  </div>
                  <div className="led-card-info">
                    <h3 className="led-card-name">{effect.name}</h3>
                    <div className="led-card-byline"><span>{effect.creator} · {effect.uses} lượt dùng</span><ArrowUpRight size={11} /></div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="led-empty">
              <strong>{activeTab === "saved" ? "Chưa có hiệu ứng đã lưu" : "Chưa tìm thấy hiệu ứng này"}</strong>
              {activeTab === "saved" ? "Chạm biểu tượng lưu trên hiệu ứng bạn muốn giữ lại." : "Thử một từ khóa khác hoặc chọn phong cách khác nhé."}
            </div>
          )}
        </section>
      </main>

      <nav className="led-dock" aria-label="Điều hướng hiệu ứng">
        <button className={`led-dock-button${activeTab === "discover" ? " active" : ""}`} onClick={() => setActiveTab("discover")} aria-current={activeTab === "discover" ? "page" : undefined}>
          <Compass size={15} /> Khám phá
        </button>
        <button className={`led-dock-button${activeTab === "saved" ? " active" : ""}`} onClick={() => setActiveTab("saved")} aria-current={activeTab === "saved" ? "page" : undefined}>
          <Bookmark size={14} /> Đã lưu {savedIds.length > 0 && <span>· {savedIds.length}</span>}
        </button>
      </nav>

      {notice && <div className="led-notice" role="status">{notice}</div>}

      {selected && (
        <div className="led-modal-scrim" onClick={closeEffect}>
          <section className="led-modal" role="dialog" aria-modal="true" aria-labelledby="led-modal-name" onClick={(event) => event.stopPropagation()}>
            <div className="led-modal-grip" />
            <div className="led-modal-top">
              <span className="led-modal-label">{previewing ? "Bản xem trước hiệu ứng" : "Hiệu ứng từ creator Việt"}</span>
              <button className="led-close" onClick={closeEffect} aria-label="Đóng chi tiết"><X size={15} /></button>
            </div>
            <div className="led-modal-art">
              <img src={portrait} alt={`Chân dung minh họa hiệu ứng ${selected.name}`} style={imageStyle(selected)} />
              <span className="led-preview-label"><Sparkles size={11} /> {previewing ? "Đang xem thử · chỉ minh họa" : selected.category}</span>
            </div>
            <h2 className="led-modal-name" id="led-modal-name">{selected.name}</h2>
            <div className="led-modal-byline"><span className="led-mini-avatar">{selected.creator.split(" ").map((part) => part[0]).join("")}</span> {selected.creator} · creator cộng đồng THU365</div>
            <p className="led-modal-note">{selected.note} Hiệu ứng được chia sẻ bởi cộng đồng; bản xem trước này chỉ là minh họa trên ảnh mẫu.</p>
            <div className="led-modal-footer">
              <span className="led-usage"><Heart size={12} /> {selected.uses} lượt thử</span>
              <button
                className={`led-modal-try${previewing ? " done" : ""}`}
                onClick={() => {
                  setPreviewing(true);
                  toast(`Đang xem thử “${selected.name}”`);
                }}
              >
                {previewing ? <><Check size={14} /> Đang xem thử</> : <><ArrowDownToLine size={14} /> Thử hiệu ứng</>}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
