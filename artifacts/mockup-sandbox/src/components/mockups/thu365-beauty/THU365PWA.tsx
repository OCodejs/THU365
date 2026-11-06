import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X, ExternalLink, WifiOff } from "lucide-react";
import { AnhThuWebApp } from "./AnhThuWebApp";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isIOSDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isSafariBrowser(): boolean {
  return /Safari/i.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function AnhThuPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const ios = isIOSDevice();
  const safari = isSafariBrowser();

  useEffect(() => {
    document.title = "AnhThu Beauty Camera";
    document.documentElement.lang = "vi";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0a0a0b");

    let manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement("link");
      manifest.rel = "manifest";
      document.head.appendChild(manifest);
    }
    manifest.href = "/thu365/manifest.webmanifest";

    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = "/thu365/app-icon.svg";

    if ("serviceWorker" in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register("/thu365/sw.js", { scope: "/thu365/" })
        .catch((error: unknown) => console.warn("AnhThu offline support unavailable:", error));
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setShowGuide(false);
    };
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setInstalled(isStandalone());

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
      return;
    }
    setShowGuide(true);
  }

  if (installed) {
    return <AnhThuWebApp />;
  }

  return (
    <>
      <AnhThuWebApp />
      <div className="thu365-pwa-install" role="region" aria-label="Cài đặt AnhThu">
        {!online && <span className="thu365-pwa-offline"><WifiOff size={13} /> Đang ngoại tuyến</span>}
        <div className="thu365-pwa-install-copy">
          <strong>AnhThu trên màn hình chính</strong>
          <span>Cài như một ứng dụng, mở toàn màn hình.</span>
        </div>
        <button type="button" onClick={() => void installApp()}>
          <Download size={15} /> Cài đặt
        </button>
      </div>

      {showGuide && (
        <div className="thu365-pwa-backdrop" role="presentation" onClick={() => setShowGuide(false)}>
          <section
            className="thu365-pwa-guide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="thu365-pwa-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="thu365-pwa-close" type="button" aria-label="Đóng hướng dẫn" onClick={() => setShowGuide(false)}>
              <X size={19} />
            </button>
            <div className="thu365-pwa-mark">THU<span>365</span></div>
            <h2 id="thu365-pwa-title">Đưa AnhThu lên màn hình chính</h2>
            {ios && !safari ? (
              <ol>
                <li><ExternalLink size={18} /><span>Mở menu chia sẻ của trình duyệt này và chọn <b>Mở trong Safari</b>.</span></li>
                <li><Share size={18} /><span>Trong Safari, chạm nút <b>Chia sẻ</b> ở thanh công cụ.</span></li>
                <li><PlusSquare size={18} /><span>Chọn <b>Thêm vào Màn hình chính</b>, sau đó chạm <b>Thêm</b>.</span></li>
              </ol>
            ) : ios ? (
              <ol>
                <li><Share size={18} /><span>Chạm nút <b>Chia sẻ</b> ở thanh công cụ Safari.</span></li>
                <li><PlusSquare size={18} /><span>Cuộn xuống và chọn <b>Thêm vào Màn hình chính</b>.</span></li>
                <li><Download size={18} /><span>Bật <b>Mở dưới dạng ứng dụng web</b> nếu tùy chọn xuất hiện, rồi chạm <b>Thêm</b>.</span></li>
              </ol>
            ) : (
              <ol>
                <li><span>Mở menu trình duyệt (dấu ba chấm).</span></li>
                <li><span>Chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.</span></li>
                <li><span>Xác nhận cài đặt AnhThu.</span></li>
              </ol>
            )}
            <p>AnhThu chỉ lưu bộ khung ứng dụng để mở lại nhanh. Ảnh và video không được tải lên máy chủ bởi bản PWA này.</p>
            <button className="thu365-pwa-done" type="button" onClick={() => setShowGuide(false)}>Đã hiểu</button>
          </section>
        </div>
      )}

      <style>{`
        .thu365-pwa-install{position:fixed;z-index:50;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;padding:11px 12px 11px 15px;border:1px solid rgba(229,182,170,.23);border-radius:16px;background:rgba(19,17,17,.96);color:#f6f0ec;box-shadow:0 12px 38px rgba(0,0,0,.4);backdrop-filter:blur(18px);font-family:Arial,sans-serif}
        .thu365-pwa-install-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}
        .thu365-pwa-install-copy strong{font-size:12px;letter-spacing:-.02em}
        .thu365-pwa-install-copy span{font-size:10px;color:#aaa09c}
        .thu365-pwa-install button,.thu365-pwa-done{display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:11px;background:#e5b6aa;color:#211715;padding:11px 13px;font-size:11px;font-weight:700;white-space:nowrap}
        .thu365-pwa-offline{position:absolute;right:12px;top:-25px;display:flex;align-items:center;gap:5px;color:#f0c6a5;font-size:10px}
        .thu365-pwa-backdrop{position:fixed;z-index:100;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:16px;background:rgba(0,0,0,.68);backdrop-filter:blur(7px)}
        .thu365-pwa-guide{position:relative;width:min(100%,480px);padding:27px 22px max(22px,env(safe-area-inset-bottom));border:1px solid rgba(229,182,170,.2);border-radius:24px;background:#151313;color:#f6f0ec;font-family:Arial,sans-serif;box-shadow:0 20px 70px rgba(0,0,0,.5)}
        .thu365-pwa-close{position:absolute;top:17px;right:17px;padding:7px;border:0;border-radius:50%;background:#282323;color:#f6f0ec}
        .thu365-pwa-mark{font-size:12px;font-weight:800;letter-spacing:.2em}.thu365-pwa-mark span{color:#e5b6aa}
        .thu365-pwa-guide h2{max-width:290px;margin:14px 0 20px;font:500 27px/1.08 Georgia,serif;letter-spacing:-.04em}
        .thu365-pwa-guide ol{display:grid;gap:15px;margin:0;padding:0;list-style:none}
        .thu365-pwa-guide li{display:flex;align-items:flex-start;gap:12px;color:#cfc4bf;font-size:13px;line-height:1.5}
        .thu365-pwa-guide li svg{flex:0 0 auto;color:#e5b6aa;margin-top:1px}
        .thu365-pwa-guide li b{color:#fff}
        .thu365-pwa-guide p{margin:19px 0;color:#928783;font-size:10px;line-height:1.5}
        .thu365-pwa-done{width:100%;padding:14px}
        @media(prefers-reduced-motion:reduce){.thu365-pwa-install,.thu365-pwa-guide{scroll-behavior:auto}}
      `}</style>
    </>
  );
}
