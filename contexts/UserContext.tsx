import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

const supabase = createSupabaseClient(true);
const UserContext = createContext<any>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true); // ✅ ให้แน่ใจว่า loading = true ทันที
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // console.log("👤 [fetchProfile] user:", user);

      if (userError || !user) {
        console.warn("⚠️ No user or error:", userError);
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, title, first_name, last_name, nickname, phone, year_level, avatar_url")
        .eq("id", user.id)
        .single();

      // console.log("📄 [fetchProfile] profile:", data);

      if (error || !data) {
        console.warn("⚠️ Profile fetch error:", error);
        setProfile(null);
        return;
      }

      setProfile({
        ...data,
        email: user.email ?? "",
      });
    } catch (err) {
      console.error("❌ Unexpected error in fetchProfile:", err);
      setProfile(null);
    } finally {
      setLoading(false); // ✅ เสมอ
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <UserContext.Provider value={{ profile, setProfile, fetchProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
