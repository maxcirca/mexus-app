import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * App configuration per environment (ADR-009). Nothing environment-specific
 * lives here as a literal: the build profile in eas.json sets MEXUS_ENV, and
 * EAS sets the git commit. Each environment is its own app on the phone
 * ("Mexus Staging", later "Mexus"), so they can sit side by side.
 */
const environment = process.env.MEXUS_ENV || "local";
const isProduction = environment === "production";
// The Expo project (not a secret): created on Day 4 by the App workflow.
const projectId = "be0b247a-59c7-40cd-ad28-2bdce9029e87";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isProduction ? "Mexus" : `Mexus ${titleCase(environment)}`,
  slug: "mexus",
  scheme: "mexus",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  runtimeVersion: { policy: "fingerprint" },
  updates: { url: `https://u.expo.dev/${projectId}` },
  android: {
    package: isProduction ? "net.boit.mexus" : `net.boit.mexus.${environment}`,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
    output: "single",
  },
  extra: {
    eas: { projectId },
    mexus: {
      environment,
      gitSha: process.env.EAS_BUILD_GIT_COMMIT_HASH || process.env.GITHUB_SHA || "unknown",
      buildTime: new Date().toISOString(),
    },
  },
});
