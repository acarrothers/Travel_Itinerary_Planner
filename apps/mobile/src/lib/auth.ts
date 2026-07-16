import * as SecureStore from "expo-secure-store";

const KEY = "tip_token";
let current: string | null = null;

export const getToken = (): string | null => current;
export async function loadToken(): Promise<string | null> {
  try { current = await SecureStore.getItemAsync(KEY); } catch { current = null; }
  return current;
}
export async function setToken(t: string): Promise<void> { current = t; try { await SecureStore.setItemAsync(KEY, t); } catch { /* ignore */ } }
export async function clearToken(): Promise<void> { current = null; try { await SecureStore.deleteItemAsync(KEY); } catch { /* ignore */ } }
