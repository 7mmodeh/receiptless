import { useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { CONFIG } from "../src/config";

export default function Claim() {
  const router = useRouter();
  const [code, setCode] = useState("");

  async function onSubmit() {
    const c = code.trim().toUpperCase();
    if (!c) return;

    try {
      const res = await fetch(
        `${CONFIG.supabaseFunctionsBaseUrl}/claim-exchange`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: c }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Claim failed");

      router.push(`/r/${json.token_id}`);
    } catch (e: any) {
      Alert.alert("Claim failed", e?.message || "Error");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter claim code</Text>
      <Text style={styles.sub}>
        If you scanned on the web preview, paste the claim code here.
      </Text>

      <TextInput
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        placeholder="e.g. AB12CD34EF56GH78"
        style={styles.input}
      />

      <TouchableOpacity onPress={onSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Claim Receipt</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { color: "#666" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 12, padding: 12 },
  button: { backgroundColor: "#111", padding: 14, borderRadius: 12 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
});
