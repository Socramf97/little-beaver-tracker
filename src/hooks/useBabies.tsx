import { BabyRef } from "@/features/voice/types";
import { useEffect, useState } from "react";
import { getAllBabies } from "../../services/database/babies";

export function useBabies() {
  const [babies, setBabies] = useState<BabyRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getAllBabies()
      .then((rows) => {
        if (cancelled) return;

        setBabies(rows.map((b) => ({ id: b.id, name: b.name })));
      })
      .catch((err) => console.log("couldn't load babies:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // this is set incase we leave the screen, we want to cancel the fetch instead of still fetching.
    return () => {
      cancelled = true;
    };
  }, []);

  return { babies, loading };
}
