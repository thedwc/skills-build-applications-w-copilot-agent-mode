import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getJson<{ activities?: ActivityItem[] }>('/api/activities')
      .then((data) => {
        if (!mounted) return;
        setActivities(data.activities ?? []);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load activities.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} empty={activities.length === 0} emptyMessage="No activities">
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type}-${index}`} className="list-group-item">
            <strong>{activity.type}</strong> · {activity.minutes} min · {activity.points} pts
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
