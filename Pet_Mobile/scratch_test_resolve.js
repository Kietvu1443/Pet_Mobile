const MetroResolver = require('metro-resolver');
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(process.cwd());

const context = {
  allowHMR: true,
  customResolverOptions: {},
  dev: true,
  doesFileExist: (filePath) => fs.existsSync(filePath),
  fileSystemLookup: (filePath) => {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      return { exists: true, type: stat.isFile() ? 'f' : 'd', realPath: fs.realpathSync(filePath) };
    }
    return { exists: false };
  },
  assetExts: new Set(config.resolver.assetExts),
  isAssetFile: (filePath) => false,
  nodeModulesPaths: [path.resolve(process.cwd(), 'node_modules')],
  preferNativePlatform: true,
  resolveAsset: () => null,
  resolveRequest: config.resolver.resolveRequest || null,
  sourceExts: config.resolver.sourceExts,
  mainFields: ['react-native', 'browser', 'main'],
  getPackage: (pkgPath) => {
    try {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      return null;
    }
  },
  getPackageForModule: (modulePath) => {
    let curr = path.dirname(modulePath);
    while (curr !== path.dirname(curr)) {
      const pkg = path.join(curr, 'package.json');
      if (fs.existsSync(pkg)) {
        try {
          return {
            rootPath: curr,
            packageJson: JSON.parse(fs.readFileSync(pkg, 'utf8')),
            packageRelativePath: path.relative(curr, modulePath),
          };
        } catch {
          return null;
        }
      }
      curr = path.dirname(curr);
    }
    return null;
  },
  unstable_enablePackageExports: config.resolver.unstable_enablePackageExports,
  unstable_conditionsByPlatform: {
    android: ['react-native', 'browser', 'require'],
  },
  originModulePath: 'C:\\Hope\\Pet_Helper_Mobile\\Pet_Mobile\\node_modules\\@maplibre\\maplibre-react-native\\lib\\module\\components\\annotations\\view-annotation\\ViewAnnotation.js'
};

try {
  const res = MetroResolver.resolve(context, '../../../types/Anchor.js', 'android');
  console.log('SUCCESS:', res);
} catch (err) {
  console.error('FAILED:', err);
}
