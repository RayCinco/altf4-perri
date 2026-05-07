import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

import { User } from "@supabase/supabase-js";

export const getUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const saveHistory = async (userId: string, analysisResult: any) => {
  const { data, error } = await supabase.from("history").insert({
    user_id: userId,
    classification: analysisResult.classification,
    analysisResult: analysisResult,
  });
  if (error) throw error;
  return data;
};

export const getRecentHistories = async (userId: string) => {
  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data;
};

export const getUserHistories = async (userId: string) => {
  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
};
