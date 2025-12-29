import { useEffect, useState } from "react";
import { Alert, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

function extractTokenId(data: string): string | null {
  try {
    const u = new URL(data);
    const parts = u.pathname.split("/").filter(Boolean);
    const rIndex = parts.indexOf("r");
    if (rIndex >= 0 && parts[rIndex + 1]) return parts[rIndex + 1];
    if (parts.length === 1) return parts[0];
  } catch {
    const maybeUuid = data.trim();
    if (maybeUuid.length >= 32) return maybeUuid;
  }
  return null;
}

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 12 }}>Camera permission denied.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
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
        onBarcodeScanned={({ data }) => {
          if (scanned) return;
          setScanned(true);

          const tokenId = extractTokenId(data);
          if (!tokenId) {
            Alert.alert(
              "Invalid QR",
              "Could not read a receipt token from this QR."
            );
            setScanned(false);
            return;
          }

          router.push(`/r/${tokenId}`);
        }}
      />

      {scanned && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={() => setScanned(false)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
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
  bottomBar: { position: "absolute", bottom: 24, left: 16, right: 16 },
  button: { backgroundColor: "#111", padding: 14, borderRadius: 12 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "600" },
});
