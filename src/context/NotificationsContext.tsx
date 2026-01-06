import { createContext } from "react";
import type {
  NotificationProps,
  NotificationThemeType,
  ThemeMode,
} from "../types";

interface NotificationContextValue {
  notifications: NotificationProps[];
  notify: (n: Omit<NotificationProps, "id" | "isExiting">) => void;
  exitNotification: (id: string) => void;
  mode: ThemeMode;
  toggleMode: () => void;
  lightTheme: Record<NotificationProps["type"], NotificationThemeType>;
  darkTheme: Record<NotificationProps["type"], NotificationThemeType>;
  pauseAutoClose: (id: string) => void;
  resumeAutoClose: (id: string) => void;
}

export const NotificationContext =
  createContext<NotificationContextValue | null>(null);
