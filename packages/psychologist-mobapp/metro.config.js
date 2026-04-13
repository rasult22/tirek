const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Allow importing from @tirek/shared
config.watchFolders = [path.resolve(__dirname, "../shared")];

module.exports = config;
