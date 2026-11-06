import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Image, LockKeyhole, Mic, ShieldCheck, X } from "lucide-react";

const permissionStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .t365-permissions, .t365-permissions * { box-sizing:border-box; }
  .t365-permissions {
    --perm-ink:#f6f0ec; --perm-muted:#aaa09c; --perm-rose:#e5b6aa; --perm-line:rgba(255,255,255,.1);
    width:100%; max-width:430px; min-height:100dvh; margin:0 auto; padding:max(18px,env(safe-area-inset-top)) 22px max(22px,env(safe-area-inset-bottom));
    display:flex; flex-direction:column; color:var(--perm-ink); background:#0a0a0b; font-family:'DM Sans',sans-serif;
    position:relative; isolation:isolate; overflow-x:hidden; overflow-y:auto;
  }
  .t365-permissions:before { content:""; position:fixed; z-index:-1; inset:0; pointer-events:none; opacity:.13;
    background:radial-gradient(ellipse at 76% 9%,rgba(185,112,98,.33),transparent 38%),
      url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.3'/%3E%3C/svg%3E");
  }
  .t365-perm-header { display:flex; align-items:center; justify-content:space-between; min-height:36px; }
  .t365-perm-back { width:36px; height:36px; display:grid; place-items:center; border:1px solid var(--perm-line); border-radius:50%;
    color:var(--perm-ink); background:rgba(255,255,255,.035); cursor:pointer; }
  .t365-perm-brand { margin-left:9px; margin-right:auto; font:800 14px/1 'Manrope',sans-serif; letter-spacing:.18em; }
  .t365-perm-brand span { color:var(--perm-rose); }
  .t365-perm-private { display:flex; align-items:center; gap:6px; padding:7px 10px; border:1px solid var(--perm-line);
    border-radius:99px; color:#d6cbc7; background:rgba(255,255,255,.035); font-size:8px; letter-spacing:.06em; }
  .t365-perm-hero { margin:31px 0 21px; }
  .t365-perm-eyebrow { display:flex; align-items:center; gap:7px; color:#e9bcb0; font-size:9px; font-weight:700; letter-spacing:.17em; }
  .t365-perm-title { margin:13px 0 9px; font:500 clamp(31px,9vw,39px)/1.03 Georgia,serif; letter-spacing:-.05em; }
  .t365-perm-title em { color:#e9bcb0; font-weight:400; }
  .t365-perm-lead { max-width:330px; margin:0; color:rgba(246,240,236,.68); font-size:11px; line-height:1.6; }
  .t365-perm-list { display:grid; gap:8px; }
  .t365-perm-card { min-height:71px; padding:11px 12px; display:flex; align-items:center; gap:12px;
    border:1px solid rgba(255,255,255,.095); border-radius:14px; background:linear-gradient(135deg,rgba(255,255,255,.052),rgba(255,255,255,.018)); }
  .t365-perm-icon { width:36px; height:36px; flex:0 0 36px; display:grid; place-items:center; border:1px solid rgba(229,182,170,.18);
    border-radius:12px; color:#efc2b5; background:rgba(229,182,170,.08); }
  .t365-perm-copy { min-width:0; flex:1; }
  .t365-perm-name-row { display:flex; align-items:center; gap:7px; }
  .t365-perm-name { font:650 12px/1.2 'Manrope',sans-serif; }
  .t365-perm-tag { color:#d8b7a9; font-size:8px; }
  .t365-perm-description { display:block; margin-top:4px; color:var(--perm-muted); font-size:9px; line-height:1.4; }
  .t365-perm-context { display:flex; align-items:flex-start; gap:8px; margin:12px 1px 14px; color:#a79c98; font-size:9px; line-height:1.5; }
  .t365-perm-context svg { flex:0 0 auto; margin-top:1px; color:#d2a69b; }
  .t365-perm-actions { display:grid; gap:7px; margin-top:auto; }
  .t365-perm-primary { min-height:47px; border:0; border-radius:13px; color:#1a1210; background:linear-gradient(110deg,#f0d2c8,#d8a99c);
    font:700 12px 'Manrope',sans-serif; cursor:pointer; box-shadow:0 7px 22px rgba(205,145,129,.14); }
  .t365-perm-secondary, .t365-perm-review { min-height:38px; border:0; color:#d8c8c2; background:transparent; font:600 10px 'DM Sans',sans-serif; cursor:pointer; }
  .t365-perm-review { min-height:34px; display:flex; align-items:center; justify-content:center; gap:7px; color:#c7a69d; }
  .t365-perm-footnote { margin:10px 5px 0; color:#77716f; font-size:8px; line-height:1.5; text-align:center; }
  .t365-perm-back:focus-visible, .t365-perm-primary:focus-visible, .t365-perm-secondary:focus-visible, .t365-perm-review:focus-visible, .t365-perm-close:focus-visible {
    outline:2px solid #e5b6aa; outline-offset:3px;
  }
  .t365-perm-scrim { position:fixed; z-index:20; inset:0; display:flex; align-items:flex-end; justify-content:center; padding-top:20px; background:rgba(0,0,0,.64); }
  .t365-perm-dialog { width:min(100%,430px); max-height:85dvh; overflow:auto; padding:22px 21px max(24px,env(safe-area-inset-bottom));
    border:1px solid rgba(255,255,255,.12); border-radius:23px 23px 0 0; background:#171615; box-shadow:0 -14px 60px rgba(0,0,0,.4); }
  .t365-perm-dialog-top { display:flex; align-items:center; justify-content:space-between; }
  .t365-perm-dialog h2 { margin:0; font:700 17px 'Manrope',sans-serif; letter-spacing:-.04em; }
  .t365-perm-close { width:32px; height:32px; display:grid; place-items:center; border:0; border-radius:50%; color:white; background:rgba(255,255,255,.09); cursor:pointer; }
  .t365-perm-dialog-intro { margin:9px 0 15px; color:rgba(255,255,255,.65); font-size:10px; line-height:1.55; }
  .t365-perm-review-list { display:grid; gap:10px; }
  .t365-perm-review-item { display:flex; align-items:flex-start; gap:10px; padding:11px; border:1px solid rgba(255,255,255,.08); border-radius:12px; color:#e9ded9; }
  .t365-perm-review-item svg { flex:0 0 auto; color:#e5b6aa; margin-top:1px; }
  .t365-perm-review-item strong { display:block; font-size:10px; }
  .t365-perm-review-item span { display:block; margin-top:3px; color:#aaa09c; font-size:9px; line-height:1.4; }
  .t365-perm-done { width:100%; min-height:42px; margin-top:15px; border:1px solid rgba(229,182,170,.2); border-radius:12px;
    color:#efd4cb; background:rgba(229,182,170,.08); font:600 11px 'Manrope',sans-serif; cursor:pointer; }
  @media(max-height:760px) {
    .t365-perm-hero { margin:21px 0 15px; }
    .t365-perm-title { margin-top:10px; font-size:32px; }
    .t365-perm-card { min-height:64px; }
    .t365-perm-context { margin:9px 1px 10px; }
  }
  @media(max-height:600px) {
    .t365-permissions { padding-top:max(8px,env(safe-area-inset-top)); padding-bottom:max(12px,env(safe-area-inset-bottom)); }
    .t365-perm-hero { margin:12px 0 10px; }
    .t365-perm-title { margin:8px 0 6px; font-size:29px; }
    .t365-perm-list { gap:6px; }
    .t365-perm-card { min-height:56px; padding:8px 10px; }
    .t365-perm-context { margin:7px 1px 8px; }
    .t365-perm-primary { min-height:43px; }
  }
  @media(max-width:350px) {
    .t365-permissions { padding-left:15px; padding-right:15px; }
    .t365-perm-card { gap:9px; padding-left:9px; padding-right:9px; }
    .t365-perm-icon { width:32px; height:32px; flex-basis:32px; }
    .t365-perm-name { font-size:11px; }
    .t365-perm-description { font-size:8px; }
  }
  @media(prefers-reduced-motion:reduce) { .t365-perm-scrim *, .t365-perm-dialog * { scroll-behavior:auto; } }
`;

type CameraPermissionsProps = {
  onBack: () => void;
  onContinue: () => void;
  onSkipOptional: () => void;
};

export function CameraPermissions({ onBack, onContinue, onSkipOptional }: CameraPermissionsProps) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (privacyOpen) dialogRef.current?.focus();
    else reviewButtonRef.current?.focus();
  }, [privacyOpen]);

  return (
    <main className="t365-permissions">
      <style>{permissionStyles}</style>
      <header className="t365-perm-header">
        <button type="button" className="t365-perm-back" onClick={onBack} aria-label="Về chọn trải nghiệm">
          <ArrowLeft size={16} />
        </button>
        <div className="t365-perm-brand">THU<span>365</span></div>
        <div className="t365-perm-private"><LockKeyhole size={11} /> RIÊNG TƯ TRƯỚC TIÊN</div>
      </header>

      <section className="t365-perm-hero" aria-labelledby="t365-perm-title">
        <div className="t365-perm-eyebrow"><ShieldCheck size={13} /> BẠN LUÔN CÓ QUYỀN CHỌN</div>
        <h1 className="t365-perm-title" id="t365-perm-title">Quyền truy cập,<br /><em>lựa chọn của bạn.</em></h1>
        <p className="t365-perm-lead">Trước khi bắt đầu, đây là lý do THU365 cần từng quyền. Bạn có thể bỏ qua các quyền không bắt buộc.</p>
      </section>

      <section className="t365-perm-list" aria-label="Các quyền truy cập">
        <div className="t365-perm-card">
          <span className="t365-perm-icon"><Camera size={17} /></span>
          <span className="t365-perm-copy">
            <span className="t365-perm-name-row"><strong className="t365-perm-name">Camera</strong><span className="t365-perm-tag">Cần cho chụp ảnh</span></span>
            <span className="t365-perm-description">Hiển thị khung hình để bạn căn góc và chụp khi sẵn sàng.</span>
          </span>
        </div>
        <div className="t365-perm-card">
          <span className="t365-perm-icon"><Mic size={17} /></span>
          <span className="t365-perm-copy">
            <span className="t365-perm-name-row"><strong className="t365-perm-name">Microphone</strong><span className="t365-perm-tag">Tùy chọn</span></span>
            <span className="t365-perm-description">Chỉ dùng khi bạn quay video có âm thanh.</span>
          </span>
        </div>
        <div className="t365-perm-card">
          <span className="t365-perm-icon"><Image size={17} /></span>
          <span className="t365-perm-copy">
            <span className="t365-perm-name-row"><strong className="t365-perm-name">Thư viện ảnh</strong><span className="t365-perm-tag">Tùy chọn</span></span>
            <span className="t365-perm-description">Dùng để chọn ảnh có sẵn trong thư viện khi bạn muốn chỉnh sửa.</span>
          </span>
        </div>
      </section>

      <p className="t365-perm-context"><LockKeyhole size={12} /> Mic và thư viện ảnh có thể bỏ qua. Bạn có thể xem lại lựa chọn bất cứ lúc nào.</p>

      <div className="t365-perm-actions">
        <button type="button" className="t365-perm-primary" onClick={onContinue}>Tiếp tục</button>
        <button type="button" className="t365-perm-secondary" onClick={onSkipOptional}>Bỏ qua quyền tùy chọn</button>
        <button ref={reviewButtonRef} type="button" className="t365-perm-review" onClick={() => setPrivacyOpen(true)} aria-haspopup="dialog" aria-expanded={privacyOpen}>
          <ShieldCheck size={13} /> Xem lựa chọn riêng tư
        </button>
      </div>
      <p className="t365-perm-footnote">Bản web preview chỉ minh họa giao diện. Luồng xin quyền thiết bị thật nằm trong ứng dụng native tại apps/thu365-mobile.</p>

      {privacyOpen && (
        <div className="t365-perm-scrim" onClick={() => setPrivacyOpen(false)}>
          <section
            className="t365-perm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="t365-perm-dialog-title"
            aria-describedby="t365-perm-dialog-description"
            tabIndex={-1}
            ref={dialogRef}
            onKeyDown={(event) => {
              if (event.key === "Escape") setPrivacyOpen(false);
              if (event.key === "Tab") {
                const focusable = event.currentTarget.querySelectorAll<HTMLElement>("button");
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
              }
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="t365-perm-dialog-top">
              <h2 id="t365-perm-dialog-title">Lựa chọn riêng tư</h2>
              <button type="button" className="t365-perm-close" onClick={() => setPrivacyOpen(false)} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <p className="t365-perm-dialog-intro" id="t365-perm-dialog-description">Trong ứng dụng thật, bạn có thể cho phép hoặc từ chối từng quyền khi hệ điều hành hỏi. Mic và thư viện ảnh không bắt buộc để xem giao diện camera.</p>
            <div className="t365-perm-review-list">
              <div className="t365-perm-review-item">
                <Camera size={15} />
                <div><strong>Camera · cần cho chụp ảnh</strong><span>Chỉ cần khi bạn muốn dùng tính năng chụp.</span></div>
              </div>
              <div className="t365-perm-review-item">
                <Mic size={15} />
                <div><strong>Microphone · tùy chọn</strong><span>Bỏ qua nếu bạn không cần âm thanh trong video.</span></div>
              </div>
              <div className="t365-perm-review-item">
                <Image size={15} />
                <div><strong>Thư viện ảnh · tùy chọn</strong><span>Bỏ qua nếu bạn chưa muốn chọn ảnh từ thư viện.</span></div>
              </div>
            </div>
            <button type="button" className="t365-perm-done" onClick={() => setPrivacyOpen(false)}>Đã hiểu</button>
          </section>
        </div>
      )}
    </main>
  );
}
