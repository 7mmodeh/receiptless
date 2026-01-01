import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receiptless</Text>

      <Link href="/scan" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Scan a Receipt QR</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/claim" asChild>
        <TouchableOpacity style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonText}>Enter Claim Code</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24 },
  button: { padding: 14, borderRadius: 12, backgroundColor: "#222" },
  secondary: { backgroundColor: "#444" },
  buttonText: { color: "white", fontSize: 16, textAlign: "center" },
});
