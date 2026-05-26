import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const repo = searchParams.get('repo')
  const type = searchParams.get('type')
  const path = searchParams.get('path') ?? ''
  const pat  = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''

  if (!repo || !type) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(pat ? { Authorization: `Bearer ${pat}` } : {}),
  }

  try {
    if (type === 'tree') {
      const repoRes = await fetch(`${GITHUB_API}/repos/${repo}`, { headers })
      if (!repoRes.ok) return NextResponse.json({ error: 'Repo not found' }, { status: repoRes.status })
      const repoData = await repoRes.json()
      const branch = repoData.default_branch
      const treeRes = await fetch(`${GITHUB_API}/repos/${repo}/git/trees/${branch}?recursive=1`, { headers })
      const treeData = await treeRes.json()
      const filtered = (treeData.tree ?? []).filter((f: { path: string }) => f.path.split('/').length <= 2)
      return NextResponse.json({ tree: filtered })
    }

    if (type === 'readme') {
      const res = await fetch(`${GITHUB_API}/repos/${repo}/readme`, { headers })
      if (!res.ok) return NextResponse.json({ content: '' })
      const data = await res.json()
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return NextResponse.json({ content })
    }

    if (type === 'file') {
      const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, { headers })
      if (!res.ok) return NextResponse.json({ content: '' })
      const data = await res.json()
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return NextResponse.json({ content })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'GitHub API error' }, { status: 500 })
  }
}
