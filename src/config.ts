import { DEFAULT_DARK, DEFAULT_LIGHT } from "./theme";

import type { ColoredMode, NotificationThemeType, ThemeMode } from "./types";

export type NotificationConfig = {
  defaultMode: ThemeMode;
  lightTheme: Record<
    "success" | "error" | "info" | "alert" | "none",
    NotificationThemeType
  >;
  darkTheme: Record<
    "success" | "error" | "info" | "alert" | "none",
    NotificationThemeType
  >;
  colored?: ColoredMode;
  hasIcon?: boolean;
  duration?: number;
  align?: ["top" | "bottom", "left" | "middle" | "right"];
  canClose?: boolean;
};

let config: NotificationConfig = {
  defaultMode: "light",
  lightTheme: DEFAULT_LIGHT,
  darkTheme: DEFAULT_DARK,
  colored: "full",
  hasIcon: true,
  duration: 5000,
  align: ["top", "middle"],
  canClose: true,
};

export function setupNotificationConfig(
  partialConfig: Partial<NotificationConfig>
) {
  config = { ...config, ...partialConfig };
}

export function getNotificationConfig(): NotificationConfig {
  return config;
}
