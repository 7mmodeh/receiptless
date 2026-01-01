import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CONFIG } from "../../src/config";

type PreviewItem = {
  line_no: number;
  sku: string | null;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  vat_rate: number | null;
  vat_amount: number | null;
};

type TokenPreviewResponse = {
  token: {
    token_id: string;
    status: "active" | "consumed";
    consumed_at: string | null;
  };
  receipt: {
    issued_at: string;
    retailer_id: string;
    store_id: string;
    currency: string;
    subtotal: number;
    vat_total: number;
    total: number;
    items: PreviewItem[];
  };
};

export default function ReceiptScreen() {
  const { tokenId } = useLocalSearchParams<{ tokenId: string }>();
  const token_id = useMemo(() => String(tokenId || "").trim(), [tokenId]);

  const [data, setData] = useState<TokenPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);

      try {
        const url = `${
          CONFIG.supabaseFunctionsBaseUrl
        }/token-preview?token_id=${encodeURIComponent(token_id)}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Failed to load receipt");
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token_id) run();
    return () => {
      cancelled = true;
    };
  }, [token_id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading receipt…</Text>
      </View>
    );
  }

  if (err || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load receipt.</Text>
        <Text style={{ marginTop: 8 }}>{err ?? "Unknown error"}</Text>
      </View>
    );
  }

  const { token, receipt } = data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Receipt</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Token Status</Text>
        <Text style={styles.value}>{token.status}</Text>

        <Text style={styles.label}>Issued At</Text>
        <Text style={styles.value}>
          {new Date(receipt.issued_at).toLocaleString()}
        </Text>

        <Text style={styles.label}>Total</Text>
        <Text style={styles.total}>
          {receipt.currency} {Number(receipt.total).toFixed(2)}
        </Text>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>
              {receipt.currency} {Number(receipt.subtotal).toFixed(2)}
            </Text>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>VAT</Text>
            <Text style={styles.value}>
              {receipt.currency} {Number(receipt.vat_total).toFixed(2)}
            </Text>
          </View>
        </View>

        {token.consumed_at ? (
          <>
            <Text style={styles.label}>Consumed At</Text>
            <Text style={styles.value}>
              {new Date(token.consumed_at).toLocaleString()}
            </Text>
          </>
        ) : null}
      </View>

      <Text style={[styles.h2, { marginTop: 16 }]}>Items</Text>
      <View style={styles.itemsCard}>
        {receipt.items.map((it) => (
          <View key={it.line_no} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.itemMeta}>
                Qty {Number(it.qty)} · {receipt.currency}{" "}
                {Number(it.unit_price).toFixed(2)}
                {it.sku ? ` · ${it.sku}` : ""}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              {receipt.currency} {Number(it.line_total).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.small}>Token ID: {token.token_id}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: { padding: 18 },
  h1: { fontSize: 26, fontWeight: "800", marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: "800" },
  card: { borderWidth: 1, borderColor: "#ddd", borderRadius: 14, padding: 14 },
  label: { marginTop: 10, fontSize: 12, color: "#666" },
  value: { fontSize: 16, fontWeight: "600" },
  total: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  row: { flexDirection: "row", gap: 12, marginTop: 8 },
  half: { flex: 1 },
  itemsCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 12,
  },
  itemName: { fontSize: 15, fontWeight: "700" },
  itemMeta: { marginTop: 4, fontSize: 12, color: "#666" },
  itemTotal: { fontSize: 14, fontWeight: "800" },
  errorText: { fontSize: 16, fontWeight: "700" },
  small: { marginTop: 16, fontSize: 12, color: "#666" },
});
