// The fingerprint decides whether a change needs a new APK or can ship as an
// over-the-air update, and it must come out the same on GitHub and on EAS.
// - `extra` holds the build stamp (commit, build time), which differs on
//   every machine and is not a native change.
// - `android/` is generated during the EAS build (it's never committed), so
//   it is ignored rather than counted as a hand-written native folder.
/** @type {import('expo/fingerprint').Config} */
const { SourceSkips } = require("expo/fingerprint");

module.exports = {
  sourceSkips: SourceSkips.ExpoConfigExtraSection,
  ignorePaths: ["android", "android/**/*"],
};
