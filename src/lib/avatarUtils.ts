export const ROLE_COLORS: Record<string, string> = {
  BA:             '#534AB7',
  QA:             '#2E74B5',
  Dev:            '#27500A',
  Developer:      '#27500A',
  Manager:        '#854F0B',
  Administration: '#555555',
  Admin:          '#555555',
  default:        '#534AB7',
}

export function getRoleColor(role?: string): string {
  if (!role) return ROLE_COLORS.default
  return ROLE_COLORS[role] ?? ROLE_COLORS.default
}

export function getInitials(fullName?: string): string {
  if (!fullName?.trim()) return '??'
  return fullName
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
