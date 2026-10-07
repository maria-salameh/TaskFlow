import { useEffect, useState } from "react";
import { useAuth } from "./useAuth.js";
import { countTasks } from "../services/taskServices.js";

// Bonus B1 : compteurs globaux (GET /api/tasks/count), rechargés quand `version` change
export function useTaskCounts(version) {
  const { token } = useAuth();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    countTasks(token)
      .then((data) => !cancelled && setCounts(data))
      .catch(() => !cancelled && setCounts(null));
    return () => {
      cancelled = true;
    };
  }, [token, version]);

  return counts;
}
