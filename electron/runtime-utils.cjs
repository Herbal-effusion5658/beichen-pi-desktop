"use strict";

const path = require("node:path");

function comparablePath(inputPath, platform = process.platform) {
  if (typeof inputPath !== "string" || !inputPath) return "";
  const resolver = platform === "win32" ? path.win32 : path.posix;
  const resolved = resolver.resolve(inputPath);
  return platform === "win32" ? resolved.toLocaleLowerCase("en-US") : resolved;
}

function pathsEqual(left, right, platform = process.platform) {
  return Boolean(left && right) && comparablePath(left, platform) === comparablePath(right, platform);
}

function isPathInside(rootPath, targetPath, platform = process.platform) {
  if (!rootPath || !targetPath) return false;
  const resolver = platform === "win32" ? path.win32 : path.posix;
  const root = comparablePath(rootPath, platform);
  const target = comparablePath(targetPath, platform);
  const relative = resolver.relative(root, target);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${resolver.sep}`) && !resolver.isAbsolute(relative);
}

module.exports = {
  comparablePath,
  isPathInside,
  pathsEqual,
};
