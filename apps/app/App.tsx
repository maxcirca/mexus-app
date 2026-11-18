import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";
import { type BuildStamp, shortSha, stampFromExtra, withRuntimeConfig } from "./src/build-stamp";

const builtIn = stampFromExtra(Constants.expoConfig?.extra);

/** Day 4 placeholder: proves the app runs and knows its environment. */
export default function App() {
  const [stamp, setStamp] = useState<BuildStamp>(builtIn);
  const dark = useColorScheme() === "dark";

  useEffect(() => {
    if (Platform.OS !== "web") return;
    fetch("/config.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => setStamp((current) => withRuntimeConfig(current, config)))
      .catch(() => undefined);
  }, []);

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <Text style={[styles.title, dark && styles.textDark]}>Mexus</Text>
      <Text style={styles.environment}>{stamp.environment.toUpperCase()}</Text>
      <Text style={styles.detail}>Version {shortSha(stamp.gitSha)}</Text>
      <Text style={styles.detail}>Built {stamp.buildTime}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f5f2", alignItems: "center", justifyContent: "center", padding: 16 },
  containerDark: { backgroundColor: "#1b1b1a" },
  title: { fontSize: 32, fontWeight: "700", color: "#222", marginBottom: 12 },
  textDark: { color: "#eee" },
  environment: {
    backgroundColor: "#e8a33d",
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 16,
  },
  detail: { fontSize: 14, color: "#888", fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
});
