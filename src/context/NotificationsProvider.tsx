import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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

function generateNotificationId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `notif-${Math.random().toString(36).slice(2)}-${Date.now()}`
  );
}

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
  const isMounted = useRef(true);
  const autoCloseTimers = useRef<
    Record<
      string,
      {
        timer?: ReturnType<typeof setTimeout>;
        expiresAt: number;
        remaining: number;
      }
    >
  >({});
  const animationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  useEffect(() => {
    return () => {
      isMounted.current = false;
      Object.values(autoCloseTimers.current).forEach((entry) => {
        if (entry.timer) {
          clearTimeout(entry.timer);
        }
      });
      Object.values(animationTimers.current).forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

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
    const autoEntry = autoCloseTimers.current[id];
    if (autoEntry) {
      if (autoEntry.timer) {
        clearTimeout(autoEntry.timer);
      }
      delete autoCloseTimers.current[id];
    }

    setNotifications((all) =>
      all.map((n) => (n.id === id ? { ...n, isExiting: true } : n))
    );
    const animationTimer = animationTimers.current[id];
    if (animationTimer) {
      clearTimeout(animationTimer);
    }

    animationTimers.current[id] = setTimeout(() => {
      if (!isMounted.current) {
        return;
      }
      setNotifications((all) => all.filter((n) => n.id !== id));
      delete animationTimers.current[id];
    }, 200);
  }, []);

  const pauseAutoClose = useCallback((id: string) => {
    const entry = autoCloseTimers.current[id];
    if (!entry || !entry.timer) return;
    const remaining = Math.max(0, entry.expiresAt - Date.now());
    clearTimeout(entry.timer);
    autoCloseTimers.current[id] = {
      ...entry,
      remaining,
      timer: undefined,
    };
  }, []);

  const resumeAutoClose = useCallback(
    (id: string) => {
      const entry = autoCloseTimers.current[id];
      if (!entry || entry.timer) return;
      if (entry.remaining <= 0) {
        exitNotification(id);
        return;
      }
      const timer = setTimeout(() => exitNotification(id), entry.remaining);
      autoCloseTimers.current[id] = {
        ...entry,
        timer,
        expiresAt: Date.now() + entry.remaining,
      };
    },
    [exitNotification]
  );

  const pauseAllAutoClose = useCallback(() => {
    Object.entries(autoCloseTimers.current).forEach(([id, entry]) => {
      if (!entry.timer) return;
      pauseAutoClose(id);
    });
  }, [pauseAutoClose]);

  const resumeAllAutoClose = useCallback(() => {
    Object.entries(autoCloseTimers.current).forEach(([id, entry]) => {
      if (entry.timer) return;
      if (entry.remaining <= 0) {
        exitNotification(id);
        return;
      }
      resumeAutoClose(id);
    });
  }, [exitNotification, resumeAutoClose]);

  const notify = useCallback(
    (notif: Omit<NotificationProps, "id" | "isExiting">) => {
      const id = generateNotificationId();
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

      if (finalNotif.duration !== -1) {
        const expiresAt = Date.now() + (finalNotif.duration ?? 0);
        autoCloseTimers.current[id] = {
          timer: setTimeout(() => exitNotification(id), finalNotif.duration),
          expiresAt,
          remaining: finalNotif.duration ?? 0,
        };
      }
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
      pauseAutoClose,
      resumeAutoClose,
      pauseAllAutoClose,
      resumeAllAutoClose,
    }),
    [
      notifications,
      notify,
      exitNotification,
      mode,
      toggleMode,
      lightTheme,
      darkTheme,
      pauseAutoClose,
      resumeAutoClose,
      pauseAllAutoClose,
      resumeAllAutoClose,
    ]
  );

  return (
    <NotificationContext.Provider value={ctxValue}>
      <ThemeProvider theme={themeForMode}>{children}</ThemeProvider>
    </NotificationContext.Provider>
  );
}
