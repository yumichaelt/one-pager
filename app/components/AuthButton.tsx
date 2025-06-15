'use client'

import { useState } from 'react'
import AuthModal from './AuthModal'
import { useAuth } from '../contexts/AuthContext'

export default function AuthButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { session, supabase } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      {session ? (
        <button
          onClick={handleSignOut}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
        >
          Sign Out
        </button>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Login
        </button>
      )}
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
} 