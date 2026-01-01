import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

function extractTokenId(scanned: string): string | null {
  const s = (scanned || "").trim();

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Direct UUID
  if (UUID_RE.test(s)) return s;

  // URL with uuid at end (e.g. https://receipt-less.com/r/<uuid>)
  try {
    const u = new URL(s);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (UUID_RE.test(last)) return last;
  } catch {
    // Not a URL
  }

  return null;
}

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasPermission = useMemo(
    () => permission?.granted === true,
    [permission]
  );

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permission…</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: "700", marginBottom: 10 }}>
          Camera permission is required to scan.
        </Text>
        <Button title="Grant permission" onPress={() => requestPermission()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={(result) => {
          if (scanned) return;

          const raw = String(result?.data ?? "").trim();
          const tokenId = extractTokenId(raw);

          if (!tokenId) {
            setScanned(true);
            setErr("Unrecognized QR. Expected a Receiptless token.");
            return;
          }

          setErr(null);
          setScanned(true);
          router.replace(`/r/${tokenId}`);
        }}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Scan Receiptless QR</Text>
        <Text style={styles.overlayHint}>
          Point the camera at the QR code. We accept:
          {"\n"}- https://receipt-less.com/r/&lt;token_id&gt;
          {"\n"}- token UUID directly
        </Text>

        {err ? <Text style={styles.err}>{err}</Text> : null}

        {scanned ? (
          <View style={{ marginTop: 10 }}>
            <Button
              title="Scan again"
              onPress={() => {
                setScanned(false);
                setErr(null);
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  overlayTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  overlayHint: { color: "white", marginTop: 6, opacity: 0.9 },
  err: { color: "white", marginTop: 10, fontWeight: "700" },
});
