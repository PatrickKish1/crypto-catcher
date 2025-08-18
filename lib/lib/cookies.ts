// Cookie/localStorage utilities for token scores

export interface TokenScores {
  BTC: number
  ETH: number
  SOL: number
  DOGE: number
  RED: number
  BOMB: number
  total: number
}

const STORAGE_KEY = 'crypto_catcher_scores'

export const getTokenScores = (): TokenScores => {
  if (typeof window === 'undefined') {
    return {
      BTC: 0,
      ETH: 0,
      SOL: 0,
      DOGE: 0,
      RED: 0,
      BOMB: 0,
      total: 0
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error reading token scores from localStorage:', error)
  }

  return {
    BTC: 0,
    ETH: 0,
    SOL: 0,
    DOGE: 0,
    RED: 0,
    BOMB: 0,
    total: 0
  }
}

export const saveTokenScore = (tokenSymbol: string, score: number) => {
  if (typeof window === 'undefined') return

  try {
    const currentScores = getTokenScores()
    const updatedScores = {
      ...currentScores,
      [tokenSymbol]: score,
      total: Object.values({ ...currentScores, [tokenSymbol]: score })
        .filter(val => typeof val === 'number' && val > 0)
        .reduce((sum, val) => sum + val, 0)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScores))
  } catch (error) {
    console.error('Error saving token score to localStorage:', error)
  }
}

export const resetTokenScores = () => {
  if (typeof window === 'undefined') return

  try {
    const defaultScores = {
      BTC: 0,
      ETH: 0,
      SOL: 0,
      DOGE: 0,
      RED: 0,
      BOMB: 0,
      total: 0
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultScores))
  } catch (error) {
    console.error('Error resetting token scores in localStorage:', error)
  }
}