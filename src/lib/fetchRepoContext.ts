export interface RepoContext {
  fileTree: string
  readme: string
  packageJson: string
}

export async function fetchRepoContext(repoUrl: string, pat: string): Promise<RepoContext> {
  const repo = repoUrl.replace('https://github.com/', '').replace(/\/$/, '')
  const authHeader = pat ? `Bearer ${pat}` : ''

  const fetcher = (params: string) =>
    fetch(`/api/github?repo=${encodeURIComponent(repo)}&${params}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    }).then(r => r.json())

  const [treeData, readmeData, pkgData] = await Promise.allSettled([
    fetcher('type=tree'),
    fetcher('type=readme'),
    fetcher('type=file&path=package.json'),
  ])

  const fileTree = treeData.status === 'fulfilled'
    ? (treeData.value.tree ?? []).map((f: { path: string }) => f.path).join('\n')
    : ''

  const readme = readmeData.status === 'fulfilled'
    ? (readmeData.value.content ?? '').slice(0, 3000)
    : ''

  const packageJson = pkgData.status === 'fulfilled'
    ? (pkgData.value.content ?? '').slice(0, 2000)
    : ''

  return { fileTree, readme, packageJson }
}

export function formatRepoContextForAgent(ctx: RepoContext, label: 'Product' | 'Test'): string {
  const parts: string[] = [`## ${label} Repository Context`]
  if (ctx.fileTree)    parts.push(`### File Structure (top 2 levels)\n${ctx.fileTree}`)
  if (ctx.readme)      parts.push(`### README\n${ctx.readme}`)
  if (ctx.packageJson) parts.push(`### package.json\n${ctx.packageJson}`)
  return parts.join('\n\n')
}
