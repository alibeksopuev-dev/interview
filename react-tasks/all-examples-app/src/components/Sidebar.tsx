import { NavLink } from 'react-router-dom'

export interface NavItem {
  to: string
  label: string
  badge: string
}

interface SidebarProps {
  items: NavItem[]
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ items, isOpen, onToggle }: SidebarProps) {
  return (
    <aside className={`app-sidebar${isOpen ? '' : ' app-sidebar-collapsed'}`}>
      <button
        onClick={onToggle}
        className='toggle-button'
      >
        Toggle menu
      </button>
      {isOpen ? (
        <>
          <div className='sidebar-logo'>Interview</div>
          <nav className='sidebar-nav'>
            {items.map(({ to, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' sidebar-link-active' : ''}`
                }
              >
                <span className='sidebar-link-label'>{label}</span>
                <span className='sidebar-link-badge'>{badge}</span>
              </NavLink>
            ))}
          </nav>
        </>
      ) : null}
    </aside>
  )
}
