const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot]),
);
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  assert: path.resolve(projectRoot, "shims/assert.js"),
};

// Redirect react-native's DOMException (uses private class fields unsupported by older Hermes)
// to a shim that avoids the syntax.
const originalResolveRequest = config.resolver.resolveRequest;
const domExceptionShim = path.resolve(projectRoot, "shims/DOMException.js");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isDomExceptionByName = moduleName.includes(
    "react-native/src/private/webapis/errors/DOMException"
  );
  // Relative imports (e.g. '../errors/DOMException') from within the RN private webapis folder
  const isDomExceptionByContext =
    (moduleName === "../errors/DOMException" ||
      moduleName.endsWith("/errors/DOMException")) &&
    context.originModulePath.includes(
      path.join("react-native", "src", "private", "webapis")
    );
  if (isDomExceptionByName || isDomExceptionByContext) {
    return { filePath: domExceptionShim, type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

if (nativeWindConfig.watcher) {
  delete nativeWindConfig.watcher.unstable_workerThreads;
}

module.exports = nativeWindConfig;
