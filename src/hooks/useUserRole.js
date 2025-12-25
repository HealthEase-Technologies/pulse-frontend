import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/api_calls";

export const USER_ROLES = {
  PATIENT: 1,
  PROVIDER: 2,
  ADMIN: 3,
};

export const useUserRole = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error, role: user?.role };
};
