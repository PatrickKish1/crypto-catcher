import Cookies from 'js-cookie'

export interface TokenScore {
  BTC: number
  ETH: number
  SOL: number
  DOGE: number
  total: number
}

const COOKIE_KEY = 'crypto_game_scores'

export const getTokenScores = (): TokenScore => {
  const scores = Cookies.get(COOKIE_KEY)
  if (scores) {
    return JSON.parse(scores)
  }
  return {
    BTC: 0,
    ETH: 0,
    SOL: 0,
    DOGE: 0,
    total: 0
  }
}

export const saveTokenScore = (symbol: string, score: number) => {
  const scores = getTokenScores()
  scores[symbol as keyof TokenScore] = score
  scores.total = Object.values(scores).reduce((a, b) => a + b, 0) - scores.total
  Cookies.set(COOKIE_KEY, JSON.stringify(scores), { expires: 365 })
}