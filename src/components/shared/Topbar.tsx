"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { getInitials } from "@/lib/avatarUtils"

const tabs = [
  { label: "Pipeline",     href: "/" },
  { label: "Pixel Office", href: "/office" },
  { label: "Backlog",      href: "/backlog" },
  { label: "Kanban",       href: "/kanban" },
  { label: "Settings",     href: "/settings" },
]

export function Topbar() {
  const path = usePathname()
  const currentUser = useAuthStore(s => s.currentUser)
  const logout = useAuthStore(s => s.logout)
  const projectName = useSettingsStore(s => s.projectName)

  const userInitials = getInitials(currentUser?.displayName ?? '')

  return (
    <nav style={{ display:"flex", alignItems:"center", height:48,
                  borderBottom:"1px solid #e8e8f0", padding:"0 20px", background:"#fff" }}>
      <span style={{ fontWeight:700, color:"#534AB7", marginRight:28 }}>AI Office</span>
      {tabs.map(t => (
        <Link key={t.href} href={t.href}
          style={{ fontSize:12, padding:"5px 14px", borderRadius:6, marginRight:2,
                   color: path===t.href ? "#534AB7" : "#888",
                   background: path===t.href ? "#f0eff7" : "none",
                   textDecoration:"none", fontWeight: path===t.href ? 500 : 400 }}>
          {t.label}
        </Link>
      ))}

      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {projectName && (
            <span style={{ fontSize: 12, color: '#534AB7', fontWeight: 600 }}>
              {projectName}
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px',
            borderRadius: 4,
            background: currentUser.role === 'Admin'     ? '#EEEDFE' :
                        currentUser.role === 'QA'         ? '#E1F5EE' : '#FAEEDA',
            color:      currentUser.role === 'Admin'     ? '#3C3489' :
                        currentUser.role === 'QA'         ? '#085041' : '#633806',
          }}>
            {currentUser.role}
          </span>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#534AB7', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {userInitials}
          </div>
          <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>
            {currentUser.displayName}
          </span>
          <button
            onClick={logout}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 6,
              border: '1px solid #e8e8f0', background: '#fff',
              color: '#888', cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
