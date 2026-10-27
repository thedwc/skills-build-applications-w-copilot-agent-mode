import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardItem = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getJson<{ leaderboard?: LeaderboardItem[] }>('/api/leaderboard')
      .then((data) => {
        if (!mounted) return;
        setLeaderboard(data.leaderboard ?? []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load leaderboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} empty={leaderboard.length === 0} emptyMessage="No leaderboard">
      <ol className="mb-0">
        {leaderboard.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`}>
            {entry.teamName}: {entry.totalPoints} pts
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
