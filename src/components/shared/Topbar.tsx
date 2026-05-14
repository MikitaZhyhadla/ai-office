"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
const tabs = [
  { label: "Pipeline",     href: "/" },
  { label: "Pixel Office", href: "/office" },
  { label: "Backlog",      href: "/backlog" },
  { label: "Kanban",       href: "/kanban" },
]
export function Topbar() {
  const path = usePathname()
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
    </nav>
  )
}
