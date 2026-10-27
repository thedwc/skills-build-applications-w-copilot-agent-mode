import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getJson<{ teams?: TeamItem[] }>('/api/teams')
      .then((data) => {
        if (!mounted) return;
        setTeams(data.teams ?? []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load teams.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} empty={teams.length === 0} emptyMessage="No teams">
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name}-${index}`} className="list-group-item">
            <strong>{team.name}</strong> · members: {team.members.join(', ') || 'none'}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
