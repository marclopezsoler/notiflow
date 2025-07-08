import { useEffect, useMemo, useState } from "react";

import { useNotifications } from "../../hooks/useNotifications";

import { AlertIcon } from "../../icons/alert.tsx";
import { ErrorIcon } from "../../icons/error.tsx";
import { InfoIcon } from "../../icons/info.tsx";
import { SuccessIcon } from "../../icons/success.tsx";
import { CloseIcon } from "../../icons/x.tsx";

import type {
  ColoredMode,
  NotificationProps,
  NotificationThemeType,
  ThemeMode,
} from "../../types";
import { NotificationWrapper } from "./Notification.style";

const ORDER = [
  "top-left",
  "top-middle",
  "top-right",
  "bottom-left",
  "bottom-middle",
  "bottom-right",
] as const;

export default function NotificationManager() {
  const { mode, notifications, exitNotification } = useNotifications();

  const groups = useMemo(() => {
    const acc: Record<string, NotificationProps[]> = {};
    for (const n of notifications) {
      const [v = "top", h = "middle"] = n.align ?? ["top", "middle"];
      const key = `${v}-${h}`;
      (acc[key] ||= []).push(n);
    }
    return acc;
  }, [notifications, mode]);

  return (
    <>
      {ORDER.map((alignKey) => {
        const bucket = groups[alignKey];
        if (!bucket) return null;
        return bucket
          .slice(0, 7)
          .map((n, idx) => (
            <Notification
              key={n.id}
              {...n}
              colored={n.colored ?? "full"}
              index={idx}
              onClose={() => exitNotification(n.id)}
            />
          ));
      })}
    </>
  );
}

const iconMap: Record<
  NotificationProps["type"],
  React.FC<React.SVGProps<SVGSVGElement>> | null
> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
  alert: AlertIcon,
  none: null,
};

function computeColors(
  colored: ColoredMode,
  type: NotificationProps["type"],
  userTheme: NotificationThemeType | undefined,
  lightTheme: Record<NotificationProps["type"], NotificationThemeType>,
  darkTheme: Record<NotificationProps["type"], NotificationThemeType>,
  mode: ThemeMode
): { bg: string; border: string; color: string } {
  const palette = mode === "light" ? lightTheme : darkTheme;
  const base = userTheme ?? palette[type];
  const none = palette.none;

  switch (colored) {
    case "border":
      return {
        bg: none.backgroundColor,
        border: base.borderColor,
        color: base.fontColor,
      };
    case "none":
      return {
        bg: none.backgroundColor,
        border: none.borderColor,
        color: none.fontColor,
      };
    case "full":
    default:
      return {
        bg: base.backgroundColor,
        border: base.borderColor,
        color: base.fontColor,
      };
  }
}

function Notification(props: NotificationProps) {
  const {
    id,
    message,
    subMessage,
    type,
    theme: userTheme,
    hasIcon,
    isExiting = false,
    index = 0,
    onClick,
    canClose,
    onClose,
    align,
    colored = "full",
    customIcon,
  } = props;

  const { mode, lightTheme, darkTheme } = useNotifications();

  const { bg, border, color } = computeColors(
    colored,
    type,
    userTheme,
    lightTheme,
    darkTheme,
    mode
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const Icon = iconMap[type];

  let veticalAlign: "top" | "bottom" = "top";
  let horizontalAlign: "left" | "middle" | "right" = "middle";
  if (align) {
    veticalAlign = align[0];
    horizontalAlign = align[1];
  }

  return (
    <NotificationWrapper
      $index={index}
      $isExiting={isExiting}
      $mounted={mounted}
      $isClickable={!!onClick}
      $canClose={!!canClose}
      $veticalAlign={veticalAlign}
      $horizontalAlign={horizontalAlign}
      $bg={bg}
      $border={border}
      $color={color}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      {customIcon ? (
        <div className="custom-icon">{customIcon}</div>
      ) : (
        hasIcon &&
        Icon && (
          <div className="icon">
            <Icon />
          </div>
        )
      )}
      <div className="column">
        <span className="message">{message}</span>
        {subMessage && <span className="submessage">{subMessage}</span>}
      </div>
      {canClose && onClose && (
        <div
          className="close-icon-container"
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
        >
          <div className="close-icon">
            <CloseIcon />
          </div>
        </div>
      )}
    </NotificationWrapper>
  );
}
