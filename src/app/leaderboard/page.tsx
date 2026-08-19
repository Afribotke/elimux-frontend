import { redirect } from 'next/navigation'

export default function LeaderboardRedirect() {
  redirect('/achievements?tab=leaderboard')
}
