import React, { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type Props = {
  token: string;
  domain: string;
  size?: number; // default 300
  title?: string;

  // logo can be remote URL or local require()
  logo?: { uri: string } | number;
  logoSize?: number; // safe default 54 for 300px QR
};

function buildReceiptUrl(domain: string, token: string) {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const cleanToken = String(token || "").trim();
  return `https://${cleanDomain}/r/${encodeURIComponent(cleanToken)}`;
}

export function ReceiptlessQrView({
  token,
  domain,
  size = 300,
  title = "Scan to save your receipt",
  logo,
  logoSize = 54,
}: Props) {
  const receiptUrl = useMemo(
    () => buildReceiptUrl(domain, token),
    [domain, token]
  );

  if (!token || token.trim().length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Unable to generate QR</Text>
          <Text style={styles.errorText}>Missing receipt token.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.qrCard}>
        <QRCode
          value={receiptUrl}
          size={size}
          ecl="M"
          quietZone={8}
          logo={logo}
          logoSize={logo ? logoSize : undefined}
          logoBackgroundColor="white"
        />
      </View>

      <Text style={styles.url} numberOfLines={2}>
        {receiptUrl}
      </Text>

      <Pressable
        style={styles.btn}
        onPress={() => Linking.openURL(receiptUrl).catch(() => {})}
      >
        <Text style={styles.btnText}>Open receipt link</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7F9",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 14,
    color: "rgba(0,0,0,0.88)",
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  url: {
    marginTop: 12,
    fontSize: 12,
    color: "rgba(0,0,0,0.55)",
    textAlign: "center",
  },
  btn: {
    marginTop: 14,
    width: "100%",
    maxWidth: 420,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  errorBox: {
    width: "100%",
    maxWidth: 420,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  errorTitle: { fontWeight: "800", marginBottom: 4, color: "rgba(0,0,0,0.86)" },
  errorText: { color: "rgba(0,0,0,0.72)" },
});
