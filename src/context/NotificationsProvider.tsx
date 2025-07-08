import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { NotificationContext } from "./NotificationsContext";

import { getNotificationConfig } from "../config";

import type {
  NotificationProps,
  NotificationsProviderProps,
  ThemeMode,
} from "../types";
import { ThemeProvider } from "styled-components";

const STORAGE_KEY = "notiflow-theme";

function detectInitialMode(defaultMode?: ThemeMode): ThemeMode {
  if (defaultMode) return defaultMode;
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved as ThemeMode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function NotificationsProvider({
  children,
  defaultMode,
  lightTheme,
  darkTheme,
}: NotificationsProviderProps & { children: ReactNode }) {
  const globalConfig = getNotificationConfig();

  const [mode, _setMode] = useState<ThemeMode>(() =>
    detectInitialMode(defaultMode)
  );

  const toggleMode = useCallback(() => {
    _setMode((m) => (m === "light" ? "dark" : "light"));
  }, []);

  const themeForMode = useMemo(
    () =>
      mode === "dark"
        ? darkTheme ?? globalConfig.darkTheme
        : lightTheme ?? globalConfig.lightTheme,
    [mode, lightTheme, darkTheme, globalConfig]
  );

  useEffect(() => {
    if (defaultMode) return;
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, defaultMode]);

  useEffect(() => {
    if (defaultMode || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) =>
      !_shouldIgnoreSystem() && _setMode(e.matches ? "dark" : "light");

    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);

    function _shouldIgnoreSystem() {
      return localStorage.getItem(STORAGE_KEY) !== null;
    }
  }, [defaultMode]);

  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const exitNotification = useCallback((id: string) => {
    setNotifications((all) =>
      all.map((n) => (n.id === id ? { ...n, isExiting: true } : n))
    );
    setTimeout(
      () => setNotifications((all) => all.filter((n) => n.id !== id)),
      200
    );
  }, []);

  const notify = useCallback(
    (notif: Omit<NotificationProps, "id" | "isExiting">) => {
      const id = crypto.randomUUID();
      const conf = getNotificationConfig();

      const finalNotif: NotificationProps = {
        ...notif,
        id,
        isExiting: false,
        colored: notif.colored ?? conf.colored,
        hasIcon: notif.hasIcon ?? conf.hasIcon,
        duration: notif.duration ?? conf.duration,
        align: notif.align ?? conf.align,
        canClose: notif.canClose ?? conf.canClose,
      };

      setNotifications((all) => [finalNotif, ...all]);
      finalNotif.duration !== -1 &&
        setTimeout(() => exitNotification(id), finalNotif.duration);
    },
    [exitNotification]
  );

  const ctxValue = useMemo(
    () => ({
      notifications,
      notify,
      exitNotification,
      mode,
      toggleMode,
      lightTheme: lightTheme ?? globalConfig.lightTheme,
      darkTheme: darkTheme ?? globalConfig.darkTheme,
    }),
    [
      notifications,
      notify,
      exitNotification,
      mode,
      toggleMode,
      lightTheme,
      darkTheme,
    ]
  );

  return (
    <NotificationContext.Provider value={ctxValue}>
      <ThemeProvider theme={themeForMode}>{children}</ThemeProvider>
    </NotificationContext.Provider>
  );
}
