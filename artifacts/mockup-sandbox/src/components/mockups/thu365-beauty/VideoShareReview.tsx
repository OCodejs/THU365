import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  LockKeyhole,
  Play,
  ShieldCheck,
  Video,
} from "lucide-react";

const studioPath = "/__mockup/preview/thu365-beauty/CreatorStudio";
const pickerPath = "/__mockup/preview/thu365-beauty/THU365Prototype";

export function VideoShareReview() {
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <main className="thu-review">
      <style>{`
        .thu-review {
          --ink: #f5eee7;
          --muted: #a9a09a;
          --quiet: #766f6a;
          --panel: #1c1a19;
          --line: rgba(255, 244, 231, .1);
          --peach: #f0b49b;
          --peach-light: #ffd7c1;
          min-height: 100dvh;
          width: 100%;
          padding: max(12px, env(safe-area-inset-top)) 19px max(14px, env(safe-area-inset-bottom));
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          color: var(--ink);
          background:
            radial-gradient(ellipse at 50% 33%, rgba(102, 63, 51, .25), transparent 48%),
            linear-gradient(160deg, #181514 0%, #100f0e 62%, #171310 100%);
          font-family: "DM Sans", "Manrope", sans-serif;
          box-sizing: border-box;
          isolation: isolate;
        }
        .thu-review * { box-sizing: border-box; }
        .thu-review button, .thu-review a { font: inherit; -webkit-tap-highlight-color: transparent; }
        .review-top {
          flex: 0 0 42px;
          display: grid;
          grid-template-columns: 42px 1fr 42px;
          align-items: center;
        }
        .review-back {
          width: 40px; height: 40px; display: grid; place-items: center;
          color: var(--ink); border: 0; background: transparent; border-radius: 50%;
          text-decoration: none;
        }
        .review-back:focus-visible, .picker-link:focus-visible, .review-button:focus-visible,
        .visibility-choice:focus-visible { outline: 2px solid var(--peach-light); outline-offset: 3px; }
        .review-brand { text-align: center; font: 800 12px "Manrope", sans-serif; letter-spacing: .22em; }
        .review-step { color: #bcb1a9; font-size: 9px; text-align: right; letter-spacing: .08em; }
        .review-intro { padding: 9px 0 8px; flex: 0 0 auto; }
        .review-eyebrow {
          display: flex; gap: 7px; align-items: center; color: var(--peach);
          font-size: 9px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
        }
        .review-title {
          margin: 5px 0 2px; font: 700 23px/1.15 "Manrope", sans-serif;
          letter-spacing: -.045em;
        }
        .review-description { margin: 0; color: var(--muted); font-size: 11px; line-height: 1.45; }
        .review-preview-wrap {
          flex: 1 1 auto; min-height: 245px; max-height: 322px; display: flex;
          align-items: center; justify-content: center; position: relative; margin: 0 -6px 8px;
        }
        .review-preview {
          position: relative; height: 100%; max-height: 322px; aspect-ratio: 9 / 16;
          max-width: min(100%, 190px); overflow: hidden; border-radius: 18px;
          background: #342722; border: 1px solid rgba(255,255,255,.15);
          box-shadow: 0 18px 48px rgba(0,0,0,.4), 0 0 0 5px rgba(255,255,255,.025);
        }
        .review-preview img {
          width: 100%; height: 100%; object-fit: cover; object-position: center 38%;
          display: block; filter: sepia(.08) saturate(.9);
        }
        .review-preview::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(15,12,10,.48), transparent 24%, transparent 65%, rgba(13,10,9,.56));
        }
        .preview-topline, .preview-bottomline {
          z-index: 1; position: absolute; left: 10px; right: 10px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .preview-topline { top: 10px; }
        .preview-bottomline { bottom: 10px; }
        .preview-chip {
          min-height: 23px; display: inline-flex; align-items: center; gap: 5px;
          padding: 0 8px; border-radius: 999px; color: #fff4eb;
          background: rgba(19,16,15,.62); border: 1px solid rgba(255,255,255,.18);
          font-size: 8px; letter-spacing: .04em; backdrop-filter: blur(8px);
        }
        .preview-play {
          position: absolute; z-index: 2; left: 50%; top: 50%; transform: translate(-50%,-50%);
          width: 43px; height: 43px; border-radius: 50%; display: grid; place-items: center;
          color: white; background: rgba(22,18,16,.35); border: 1px solid rgba(255,255,255,.72);
        }
        .preview-caption { font: 600 10px "Manrope", sans-serif; text-shadow: 0 1px 8px #000; }
        .review-details {
          min-height: 48px; display: flex; align-items: center; gap: 11px;
          border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
          margin-bottom: 10px; padding: 7px 2px; flex: 0 0 auto;
        }
        .detail-mark {
          width: 31px; height: 31px; flex: 0 0 31px; display: grid; place-items: center;
          color: var(--peach); background: rgba(240,180,155,.1); border-radius: 10px;
        }
        .detail-copy { min-width: 0; flex: 1; }
        .detail-name { font: 600 11px "Manrope", sans-serif; }
        .detail-meta { margin-top: 3px; color: var(--muted); font-size: 9px; }
        .detail-length { display: flex; align-items: center; gap: 4px; color: #d1c5bd; font-size: 9px; white-space: nowrap; }
        .destination-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2px 9px; color: #e3d9d1; font-size: 10px; flex: 0 0 auto;
        }
        .destination-label { color: var(--muted); }
        .destination-value { display: flex; align-items: center; gap: 7px; font-weight: 600; }
        .unconnected {
          padding: 4px 7px; border: 1px solid rgba(240,180,155,.25); border-radius: 999px;
          color: var(--peach-light); font-size: 8px; font-weight: 500;
        }
        .visibility-box {
          flex: 0 0 auto; padding: 10px 11px 9px; border-radius: 15px;
          background: linear-gradient(135deg, rgba(39,34,31,.94), rgba(27,25,24,.96));
          border: 1px solid var(--line); margin-bottom: 8px;
        }
        .visibility-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
        .visibility-title { font: 700 11px "Manrope", sans-serif; }
        .privacy-note { display: flex; align-items: center; gap: 4px; color: #cbbeb4; font-size: 8px; }
        .visibility-options { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .visibility-choice {
          min-height: 48px; display: flex; align-items: center; gap: 7px; padding: 7px 8px;
          border-radius: 11px; text-align: left; color: #e9e1da; background: #211f1d;
          border: 1px solid rgba(255,255,255,.08); cursor: pointer;
        }
        .visibility-choice.selected { border-color: rgba(240,180,155,.74); background: rgba(96,62,49,.28); }
        .radio-mark { width: 15px; height: 15px; display: grid; place-items: center; flex: 0 0 15px; color: var(--peach); }
        .choice-name { display: block; font-size: 9px; font-weight: 700; }
        .choice-hint { display: block; margin-top: 2px; font-size: 8px; color: var(--muted); }
        .visibility-explainer {
          display: flex; align-items: flex-start; gap: 6px; margin: 7px 1px 0;
          color: #aaa19a; font-size: 8px; line-height: 1.35;
        }
        .visibility-explainer svg { color: var(--peach); flex: 0 0 auto; }
        .review-actions { flex: 0 0 auto; padding-top: 1px; }
        .review-button {
          width: 100%; min-height: 47px; display: flex; justify-content: center; align-items: center; gap: 8px;
          border: 0; border-radius: 14px; background: linear-gradient(105deg, #f5c7ae, #eda98f);
          color: #291a15; font: 800 12px "Manrope", sans-serif; cursor: pointer;
          box-shadow: 0 8px 22px rgba(178,103,77,.18);
        }
        .review-button:active { transform: translateY(1px); }
        .review-footnote { margin: 6px 4px 0; color: var(--quiet); text-align: center; font-size: 8px; line-height: 1.35; }
        .review-links {
          min-height: 32px; margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 17px;
          flex: 0 0 auto;
        }
        .picker-link {
          display: inline-flex; min-height: 32px; align-items: center; gap: 5px; color: #b8aea7;
          font-size: 9px; text-decoration: none;
        }
        .picker-link:hover { color: var(--peach-light); }
        .success-card {
          position: absolute; z-index: 5; inset: 0; display: flex; align-items: center; justify-content: center;
          padding: 22px; background: rgba(10,9,9,.76); backdrop-filter: blur(9px);
        }
        .success-inner {
          width: 100%; max-width: 340px; padding: 23px 19px 18px; border-radius: 22px;
          border: 1px solid rgba(255,255,255,.13);
          background: radial-gradient(ellipse at 50% 0%, rgba(128,78,58,.3), transparent 60%), #211e1c;
          box-shadow: 0 22px 60px rgba(0,0,0,.5); text-align: center;
        }
        .success-symbol {
          width: 48px; height: 48px; margin: 0 auto 13px; display: grid; place-items: center;
          border-radius: 50%; color: var(--peach-light); background: rgba(240,180,155,.15);
        }
        .success-heading { margin: 0; font: 700 18px "Manrope", sans-serif; }
        .success-text { margin: 8px 0 17px; color: #c0b5ac; font-size: 11px; line-height: 1.55; }
        .success-inner .review-button { min-height: 44px; }
        .success-secondary {
          width: 100%; min-height: 40px; margin-top: 8px; border-radius: 12px;
          border: 1px solid var(--line); background: transparent; color: #ded5ce;
          font-size: 10px; text-decoration: none; display: flex; align-items: center; justify-content: center;
        }
        @media (max-height: 760px) {
          .thu-review { padding-top: max(8px, env(safe-area-inset-top)); }
          .review-intro { padding-top: 5px; padding-bottom: 5px; }
          .review-title { font-size: 21px; }
          .review-preview-wrap { min-height: 210px; max-height: 270px; }
          .review-preview { max-height: 270px; }
          .visibility-box { padding-top: 8px; padding-bottom: 7px; }
          .visibility-choice { min-height: 43px; }
        }
        @media (max-width: 350px) {
          .thu-review { padding-left: 14px; padding-right: 14px; }
          .review-preview-wrap { max-height: 285px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .review-button { transition: none; }
        }
      `}</style>

      <header className="review-top">
        <a className="review-back" href={studioPath} aria-label="Quay lại Creator Studio">
          <ArrowLeft size={19} />
        </a>
        <div className="review-brand">THU365</div>
        <div className="review-step">BƯỚC 03</div>
      </header>

      <section className="review-intro" aria-labelledby="review-title">
        <div className="review-eyebrow"><ShieldCheck size={12} /> Kiểm tra lần cuối</div>
        <h1 className="review-title" id="review-title">Trước khi chia sẻ</h1>
        <p className="review-description">Xem lại khung hình và chọn ai có thể xem.</p>
      </section>

      <section className="review-preview-wrap" aria-label="Bản xem trước video dọc">
        <div className="review-preview">
          <img src="/__mockup/images/thu365-beauty-portrait.jpg" alt="Khung hình video làm đẹp dọc" />
          <div className="preview-topline">
            <span className="preview-chip"><Video size={10} /> XEM TRƯỚC</span>
            <span className="preview-chip">9:16</span>
          </div>
          <span className="preview-play" aria-hidden="true"><Play size={16} fill="currentColor" /></span>
          <div className="preview-bottomline">
            <span className="preview-caption">một chút dịu dàng</span>
            <span className="preview-chip">00:12</span>
          </div>
        </div>
      </section>

      <section className="review-details" aria-label="Thông tin đoạn video">
        <span className="detail-mark"><Video size={15} /></span>
        <div className="detail-copy">
          <div className="detail-name">Một chút dịu dàng</div>
          <div className="detail-meta">Video dọc · 3 đoạn · Hồng đào</div>
        </div>
        <span className="detail-length"><Clock3 size={11} /> 00:12</span>
      </section>

      <div className="destination-row">
        <span className="destination-label">Điểm đến</span>
        <span className="destination-value">
          TikTok <span className="unconnected">Chưa kết nối</span>
        </span>
      </div>

      <section className="visibility-box" aria-labelledby="visibility-heading">
        <div className="visibility-head">
          <h2 className="visibility-title" id="visibility-heading">Ai có thể xem?</h2>
          <span className="privacy-note"><LockKeyhole size={10} /> Mặc định an toàn</span>
        </div>
        <div className="visibility-options" role="group" aria-label="Chọn chế độ hiển thị">
          <button
            type="button"
            className={`visibility-choice ${visibility === "private" ? "selected" : ""}`}
            aria-pressed={visibility === "private"}
            onClick={() => setVisibility("private")}
          >
            <span className="radio-mark">{visibility === "private" ? <Check size={12} /> : <Circle size={12} />}</span>
            <span><span className="choice-name">Chỉ mình tôi</span><span className="choice-hint">Riêng tư</span></span>
          </button>
          <button
            type="button"
            className={`visibility-choice ${visibility === "public" ? "selected" : ""}`}
            aria-pressed={visibility === "public"}
            onClick={() => setVisibility("public")}
          >
            <span className="radio-mark">{visibility === "public" ? <Check size={12} /> : <Circle size={12} />}</span>
            <span><span className="choice-name">Mọi người</span><span className="choice-hint">Công khai</span></span>
          </button>
        </div>
        <p className="visibility-explainer">
          <LockKeyhole size={10} />
          {visibility === "private"
            ? "Đang chọn riêng tư. Không có tài khoản mạng xã hội nào được kết nối."
            : "Bạn đã chọn công khai cho bước chia sẻ mô phỏng; chưa có dịch vụ nào được kết nối."}
        </p>
      </section>

      <div className="review-actions">
        <button className="review-button" type="button" onClick={() => setConfirmed(true)}>
          Xác nhận lựa chọn <ChevronRight size={15} />
        </button>
        <p className="review-footnote">Chỉ xác nhận trạng thái thử nghiệm trên màn hình này.</p>
      </div>

      <nav className="review-links" aria-label="Điều hướng khác">
        <a className="picker-link" href={studioPath} aria-label="Hủy và quay lại Creator Studio"><ArrowLeft size={12} /> Hủy · Creator Studio</a>
        <a className="picker-link" href={pickerPath}>Chọn concept khác <ChevronRight size={12} /></a>
      </nav>

      {confirmed && (
        <div className="success-card" role="dialog" aria-modal="true" aria-labelledby="success-heading">
          <section className="success-inner">
            <div className="success-symbol"><Check size={22} /></div>
            <h2 className="success-heading" id="success-heading">Đã xác nhận lựa chọn</h2>
            <p className="success-text">
              Đây chỉ là trạng thái thử nghiệm cục bộ. Không có video nào được xuất, lưu, tải lên hoặc đăng.
            </p>
            <button className="review-button" type="button" onClick={() => { setConfirmed(false); window.location.href = studioPath; }}>
              Quay lại Creator Studio <ArrowLeft size={14} />
            </button>
            <a className="success-secondary" href={pickerPath}>Về chọn concept THU365</a>
          </section>
        </div>
      )}
    </main>
  );
}
