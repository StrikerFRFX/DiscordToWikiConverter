import { useEffect, useState } from "react";

export function useDiscordUser(userId?: string) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    console.log("Fetching Discord user info", { userId });
    fetch(`/api/discord/user/${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        console.log("Discord user fetched successfully", { user: data });
        setUser(data);
      })
      .catch((e) => {
        console.error("Failed to fetch Discord user", { error: e });
        setError(e.message);
      })
      .finally(() => {
        console.log("Discord user fetch complete", { loading: false, error });
        setLoading(false);
      });
  }, [userId]);

  return { user, loading, error };
}
