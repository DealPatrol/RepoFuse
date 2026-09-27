import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(packageRoot, '..')
const dist = path.join(packageRoot, 'dist')

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

const cli = await readFile(path.join(packageRoot, 'repofuse.mjs'), 'utf8')
await writeFile(
  path.join(dist, 'repofuse.mjs'),
  cli
    .replace('../lib/repofuse-core.js', './repofuse-core.js')
    .replace('../lib/repofuse-mcp.js', './repofuse-mcp.js'),
  { mode: 0o755 },
)

await Promise.all([
  cp(
    path.join(repositoryRoot, 'lib/repofuse-core.js'),
    path.join(dist, 'repofuse-core.js'),
  ),
  cp(
    path.join(repositoryRoot, 'lib/repofuse-mcp.js'),
    path.join(dist, 'repofuse-mcp.js'),
  ),
])
