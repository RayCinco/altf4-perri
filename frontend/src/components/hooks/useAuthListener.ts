import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export const useAuthListener = () => {
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(event, session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
};
