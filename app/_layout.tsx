import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Receiptless" }} />
      <Stack.Screen name="scan" options={{ title: "Scan Receipt" }} />
      <Stack.Screen name="r/[tokenId]" options={{ title: "Receipt" }} />
      <Stack.Screen name="claim" options={{ title: "Claim Receipt" }} />
    </Stack>
  );
}
