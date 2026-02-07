// OmniAI - Hook de gestion des crédits/points
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface CreditsData {
  balance: number
  totalEarned: number
  totalSpent: number
  plan: string
  unlimited: boolean
}

export function useCredits() {
  const { session, user } = useAuth()
  const [balance, setBalance] = useState<number>(0)
  const [unlimited, setUnlimited] = useState(false)
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/credits/balance`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (!res.ok) throw new Error('Failed to fetch credits')

      const data: CreditsData = await res.json()
      setBalance(data.balance)
      setUnlimited(data.unlimited)
      setPlan(data.plan)
    } catch (err) {
      console.error('Error fetching credits:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (user) {
      refresh()
    } else {
      setLoading(false)
    }
  }, [user, refresh])

  const hasSufficientCredits = useCallback(
    (cost: number) => unlimited || balance >= cost,
    [balance, unlimited]
  )

  return {
    balance,
    unlimited,
    plan,
    loading,
    refresh,
    hasSufficientCredits
  }
}
