// Patch console.warn before ANY module loads.
// NativeWind (jsxImportSource: "nativewind") injects react-native-css-interop
// into every JSX file at Babel transform time, which accesses the deprecated
// SafeAreaView getter from react-native before app code runs.
// This is a known bug in react-native-css-interop v0.2.2.
const _originalWarn = console.warn;
console.warn = function (...args) {
  if (
    typeof args[0] === "string" &&
    args[0].includes("SafeAreaView has been deprecated")
  ) {
    return;
  }
  _originalWarn.apply(console, args);
};

// Use require (not import) so this runs AFTER the patch above, not hoisted
require("expo-router/entry");
