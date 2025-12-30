import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

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
  const previousIndexes = useRef<Record<string, number>>({});

  useEffect(() => {
    const aliveIds = new Set(notifications.map((n) => n.id));
    Object.keys(previousIndexes.current).forEach((id) => {
      if (!aliveIds.has(id)) {
        delete previousIndexes.current[id];
      }
    });
  }, [notifications]);

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

        let activeIndex = 0;
        return bucket.slice(0, 7).map((n) => {
          const currentIndex = n.isExiting
            ? previousIndexes.current[n.id] ?? activeIndex
            : activeIndex;

          if (!n.isExiting) {
            activeIndex += 1;
          }

          previousIndexes.current[n.id] = currentIndex;

          return (
            <Notification
              key={n.id}
              {...n}
              colored={n.colored ?? "full"}
              index={currentIndex}
              onClose={() => exitNotification(n.id)}
            />
          );
        });
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

  const { mode, lightTheme, darkTheme, exitNotification } = useNotifications();

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

  const DRAG_CLOSE_DISTANCE = 100;
  const DRAG_RELEASE_PUSH = 120;
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const clickSuppressedRef = useRef(false);
  const isDraggingOutRef = useRef(false);

  const updateDragOffset = (value: { x: number; y: number }) => {
    dragOffsetRef.current = value;
    setDragOffset(value);
  };

  const finalizeDrag = (shouldClose: boolean) => {
    const { x, y } = dragOffsetRef.current;
    const shouldPushX = Math.abs(x) > 6;
    const shouldPushY = Math.abs(y) > 6;

    if (shouldClose) {
      updateDragOffset({
        x: x + (shouldPushX ? Math.sign(x) * DRAG_RELEASE_PUSH : 0),
        y: y + (shouldPushY ? Math.sign(y) * DRAG_RELEASE_PUSH : 0),
      });
      exitNotification(id);
    } else {
      updateDragOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    clickSuppressedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    updateDragOffset({ x: dx, y: dy });
    if (Math.hypot(dx, dy) > 4) {
      clickSuppressedRef.current = true;
    }

    const distance = Math.hypot(dx, dy);
    if (
      distance > DRAG_CLOSE_DISTANCE &&
      !isDraggingOutRef.current &&
      dragStartRef.current
    ) {
      isDraggingOutRef.current = true;
      finalizeDrag(true);
      const target = event.currentTarget;
      target.releasePointerCapture?.(event.pointerId);
      dragStartRef.current = null;
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const distance = Math.hypot(
      dragOffsetRef.current.x,
      dragOffsetRef.current.y
    );
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    finalizeDrag(distance > DRAG_CLOSE_DISTANCE);
    dragStartRef.current = null;
    isDraggingOutRef.current = false;
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    finalizeDrag(false);
    dragStartRef.current = null;
    isDraggingOutRef.current = false;
  };

  const isAssertive = type === "alert" || type === "error";
  const role = isAssertive ? "alert" : "status";
  const ariaLive = isAssertive ? "assertive" : "polite";

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
      $dragX={dragOffset.x}
      $dragY={dragOffset.y}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      onClick={
        onClick
          ? (e) => {
              if (clickSuppressedRef.current) {
                clickSuppressedRef.current = false;
                return;
              }
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
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
        <button
          type="button"
          className="close-button"
          aria-label="Dismiss notification"
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
        >
          <div className="close-icon">
            <CloseIcon />
          </div>
        </button>
      )}
    </NotificationWrapper>
  );
}
