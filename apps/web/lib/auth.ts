const KEY = "tip_token";
export const getToken = (): string | null => (typeof window === "undefined" ? null : window.localStorage.getItem(KEY));
export const setToken = (t: string) => window.localStorage.setItem(KEY, t);
export const clearToken = () => window.localStorage.removeItem(KEY);
