import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C24 4 8 18 8 28C8 36.837 15.163 44 24 44C32.837 44 40 36.837 40 28C40 18 24 4 24 4Z" fill="#B91C1C"/>
          </svg>
          <span className="font-display text-xl text-crimson font-bold">City Blood Bank Hospital</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 text-sm">{user?.name}</span>
          <span className="bg-red-100 text-crimson text-xs px-2 py-1 rounded-full capitalize">{user?.role}</span>
          <button
            onClick={handleLogout}
            className="bg-crimson text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
