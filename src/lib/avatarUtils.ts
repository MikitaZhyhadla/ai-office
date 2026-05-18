export function getInitials(fullName: string): string {
  if (!fullName?.trim()) return '??'
  return fullName
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
