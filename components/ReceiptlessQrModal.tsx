"use client";

import QRCode from "qrcode";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  token: string; // your opaque token (uuid or short token)
  domain: string; // e.g. "receipt-less.com" or "r.receipt-less.com"
  onClose: () => void;
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

async function makeQrDataUrl(receiptUrl: string) {
  // PNG DataURL
  return QRCode.toDataURL(receiptUrl, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 2,
    type: "image/png",
  });
}

export function ReceiptlessQrModal({
  open,
  token,
  domain,
  onClose,
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
        const dataUrl = await makeQrDataUrl(receiptUrl);
        if (!alive) return;
        setState({ status: "ready", dataUrl, receiptUrl });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "QR generation failed";
        if (!alive) return;
        setState({ status: "error", message: msg, receiptUrl });
      }
    })();

    const t = window.setTimeout(onClose, 12000); // auto-close
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [open, receiptUrl, onClose]);

  if (!open) return null;

  const close = () => onClose();

  return (
    <div
      style={styles.backdrop}
      onClick={close}
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
            <div style={{ fontWeight: 800 }}>Unable to generate QR</div>
            <div style={{ marginTop: 6, opacity: 0.9 }}>{state.message}</div>
            <div style={{ marginTop: 10 }}>
              <a href={state.receiptUrl} style={styles.link}>
                Open receipt link
              </a>
            </div>
          </div>
        ) : null}

        <div style={styles.url}>{receiptUrl}</div>

        <button style={styles.btn} onClick={close}>
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
    fontWeight: 800,
    textDecoration: "underline",
  },
};
