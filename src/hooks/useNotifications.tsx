import { useContext } from "react";

import { NotificationContext } from "../context/NotificationsContext";

import type {
  NotificationProps,
  NotificationThemeType,
  ThemeMode,
} from "../types";

export function useNotifications(): {
  notifications: NotificationProps[];
  notify: (notif: Omit<NotificationProps, "id" | "isExiting">) => void;
  exitNotification: (id: string) => void;
  mode: ThemeMode;
  toggleMode: () => void;
  lightTheme: Record<NotificationProps["type"], NotificationThemeType>;
  darkTheme: Record<NotificationProps["type"], NotificationThemeType>;
} {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return ctx;
}
