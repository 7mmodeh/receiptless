"use client";

import QRCode from "qrcode";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  token: string;
  domain: string; // e.g. "r.receipt-less.com" or "receipt-less.com"
  onClose: () => void;

  // Branding
  logoUrl: string; // e.g. "https://receipt-less.com/brand/receiptless-logo.png"
  title?: string;
};

type QrState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; dataUrl: string; receiptUrl: string }
  | { status: "error"; message: string; receiptUrl: string };

function buildReceiptUrl(domain: string, token: string) {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const cleanToken = String(token || "").trim();
  return `https://${cleanDomain}/r/${encodeURIComponent(cleanToken)}`;
}

async function loadImageAsDataUrl(url: string): Promise<string> {
  // Loads an image URL into a data URL so QR code can embed it reliably.
  // Requires the logo to be served with proper CORS if hosted on another domain.
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Logo fetch failed (${res.status})`);
  const blob = await res.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Logo read failed"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

async function makeBrandedQrDataUrl(receiptUrl: string, logoDataUrl: string) {
  // 1) Generate QR to an offscreen canvas
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, receiptUrl, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  // 2) Draw logo in center with white background pad
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Logo decode failed"));
    i.src = logoDataUrl;
  });

  const size = canvas.width; // 300
  const logoSize = 54; // safe for 300px QR (≈18%)
  const pad = 10;

  const x = Math.round((size - logoSize) / 2);
  const y = Math.round((size - logoSize) / 2);

  // White rounded background behind logo
  const r = 10;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, r);
  ctx.fill();
  ctx.restore();

  // Draw logo
  ctx.drawImage(img, x, y, logoSize, logoSize);

  // 3) Export as PNG DataURL
  return canvas.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function ReceiptlessQrModal({
  open,
  token,
  domain,
  onClose,
  logoUrl,
  title = "Scan to save your receipt",
}: Props) {
  const receiptUrl = useMemo(
    () => buildReceiptUrl(domain, token),
    [domain, token]
  );
  const [state, setState] = useState<QrState>({ status: "idle" });

  useEffect(() => {
    if (!open) {
      setState({ status: "idle" });
      return;
    }

    let alive = true;
    setState({ status: "loading" });

    (async () => {
      try {
        const logoDataUrl = await loadImageAsDataUrl(logoUrl);
        const dataUrl = await makeBrandedQrDataUrl(receiptUrl, logoDataUrl);
        if (!alive) return;
        setState({ status: "ready", dataUrl, receiptUrl });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "QR generation failed";
        if (!alive) return;
        setState({ status: "error", message: msg, receiptUrl });
      }
    })();

    const t = window.setTimeout(onClose, 12000);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [open, receiptUrl, logoUrl, onClose]);

  if (!open) return null;

  return (
    <div
      style={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>{title}</div>

        {state.status === "loading" ? (
          <div style={styles.loading}>Generating QR…</div>
        ) : null}

        {state.status === "ready" ? (
          <div style={styles.qrWrap}>
            <img
              src={state.dataUrl}
              alt="Receipt QR code"
              width={300}
              height={300}
              style={styles.qrImg}
            />
          </div>
        ) : null}

        {state.status === "error" ? (
          <div style={styles.errorBox}>
            <div style={{ fontWeight: 900 }}>Unable to generate branded QR</div>
            <div style={{ marginTop: 6, opacity: 0.9 }}>{state.message}</div>
            <div style={{ marginTop: 10 }}>
              <a href={receiptUrl} style={styles.link}>
                Open receipt link
              </a>
            </div>
          </div>
        ) : null}

        <div style={styles.url}>{receiptUrl}</div>

        <button style={styles.btn} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.50)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 999999,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 18px 55px rgba(0,0,0,0.25)",
    textAlign: "center",
    border: "1px solid rgba(0,0,0,0.08)",
  },
  title: { fontSize: 16, fontWeight: 900, marginBottom: 12 },
  loading: { padding: "28px 0", color: "rgba(0,0,0,0.70)", fontSize: 14 },
  qrWrap: { display: "flex", justifyContent: "center", paddingBottom: 6 },
  qrImg: {
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fff",
  },
  url: {
    marginTop: 10,
    fontSize: 12,
    color: "rgba(0,0,0,0.55)",
    wordBreak: "break-all",
  },
  btn: {
    marginTop: 14,
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  errorBox: {
    margin: "10px 0",
    padding: 12,
    borderRadius: 12,
    background: "rgba(239, 68, 68, 0.10)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "rgba(0,0,0,0.86)",
    textAlign: "left",
  },
  link: {
    color: "#111827",
    fontWeight: 900,
    textDecoration: "underline",
  },
};
