import { useEffect, useMemo, useState } from "react";

function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  return prefersLight ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState(() => getPreferredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const actions = useMemo(() => {
    return {
      setLight: () => setTheme("light"),
      setDark: () => setTheme("dark"),
      toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    };
  }, []);

  return { theme, ...actions };
}
