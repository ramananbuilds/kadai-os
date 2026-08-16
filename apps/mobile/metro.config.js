const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

// Monorepo wiring: Metro must watch and resolve from the workspace root so
// @kadai-os/* packages (symlinked into node_modules by pnpm) compile as
// source. This is Expo's documented monorepo setup.
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
