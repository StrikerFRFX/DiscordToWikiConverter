import { useEffect, useState } from "react";
import consola from "consola";

export function useDiscordUser(userId?: string) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    consola.info({
      message: "Fetching Discord user info",
      userId,
    });
    fetch(`/api/discord/user/${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        consola.success({
          message: "Discord user fetched successfully",
          user: data,
        });
        setUser(data);
      })
      .catch((e) => {
        consola.error({
          message: "Failed to fetch Discord user",
          error: e,
        });
        setError(e.message);
      })
      .finally(() => {
        consola.info({
          message: "Discord user fetch complete",
          loading: false,
          error,
        });
        setLoading(false);
      });
  }, [userId]);

  return { user, loading, error };
}
