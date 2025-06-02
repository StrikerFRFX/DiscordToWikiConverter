import { useEffect, useState } from "react";

export function useDiscordUsers(userIds: string[]) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all(
      userIds.map((id) =>
        fetch(`/api/discord/user/${id}`)
          .then(async (res) => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
          })
          .catch((e) => ({ error: e.message, id }))
      )
    )
      .then((results) => {
        // Always return an array of the same length as userIds
        setUsers(results);
      })
      .catch((e) => {
        setError(e.message);
        setUsers(userIds.map((id) => ({ error: e.message, id })));
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(userIds) ? userIds.join(",") : ""]);

  return { users, loading, error };
}
