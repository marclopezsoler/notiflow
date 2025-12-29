import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useEffect } from "react";
import NotificationManager from "../components/NotificationManager/NotificationManager";
import { NotificationsProvider } from "../context/NotificationsProvider";
import { useNotifications } from "../hooks/useNotifications";

const CUSTOM_THEME = {
  backgroundColor: "#101010",
  borderColor: "#ff00ff",
  fontColor: "#00ff00",
};

function TestConsumer() {
  const { notifications, notify, toggleMode, mode } = useNotifications();

  return (
    <div>
      <button
        data-testid="notify-info"
        onClick={() =>
          notify({
            message: "Info toast",
            type: "info",
            duration: 1000,
          })
        }
      >
        Notify info
      </button>
      <button
        data-testid="notify-alert"
        onClick={() =>
          notify({
            message: "Alert toast",
            type: "alert",
            duration: 1000,
            canClose: true,
          })
        }
      >
        Notify alert
      </button>
      <button
        data-testid="notify-persistent"
        onClick={() =>
          notify({
            message: "Persistent toast",
            type: "info",
            duration: -1,
          })
        }
      >
        Notify persistent
      </button>
      <button
        data-testid="notify-custom"
        onClick={() =>
          notify({
            message: "Custom theme toast",
            type: "info",
            duration: -1,
            theme: CUSTOM_THEME,
            canClose: true,
          })
        }
      >
        Notify custom theme
      </button>
      <button data-testid="toggle-mode" onClick={toggleMode}>
        Toggle mode
      </button>
      <span data-testid="mode-value">{mode}</span>
      <span data-testid="notification-count">{notifications.length}</span>
      {notifications[0] && (
        <span data-testid="latest-message">{notifications[0].message}</span>
      )}
    </div>
  );
}

function renderWithNotifications() {
  return render(
    <NotificationsProvider>
      <TestConsumer />
      <NotificationManager />
    </NotificationsProvider>
  );
}

const ALIGN_SPECS: Array<{
  align: ["top" | "bottom", "left" | "middle" | "right"];
  label: string;
}> = [
  { align: ["top", "left"], label: "top-left" },
  { align: ["top", "middle"], label: "top-middle" },
  { align: ["top", "right"], label: "top-right" },
  { align: ["bottom", "left"], label: "bottom-left" },
  { align: ["bottom", "middle"], label: "bottom-middle" },
  { align: ["bottom", "right"], label: "bottom-right" },
];

function AlignSeeder() {
  const { notify } = useNotifications();

  useEffect(() => {
    ALIGN_SPECS.forEach(({ align, label }) => {
      notify({
        message: `Position ${label}`,
        type: "info",
        duration: -1,
        align,
      });
    });
  }, [notify]);

  return null;
}

describe("NotificationsProvider + NotificationManager", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("adds notifications when `notify` is called", () => {
    renderWithNotifications();

    fireEvent.click(screen.getByTestId("notify-info"));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("notification-count")).toHaveTextContent("1");
    expect(screen.getByTestId("latest-message")).toHaveTextContent(
      "Info toast"
    );
  });

  it("auto-dismisses notifications after the configured duration", () => {
    renderWithNotifications();

    fireEvent.click(screen.getByTestId("notify-info"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.queryByText("Info toast")).not.toBeInTheDocument();
  });

  it("keeps notifications alive when duration is -1", () => {
    renderWithNotifications();

    fireEvent.click(screen.getByTestId("notify-persistent"));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("latest-message")).toHaveTextContent(
      "Persistent toast"
    );
  });

  it("allows closing a notification via the close button", () => {
    renderWithNotifications();

    fireEvent.click(screen.getByTestId("notify-alert"));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const closeButton = screen.getByRole("button", {
      name: /dismiss notification/i,
    });

    fireEvent.click(closeButton);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.queryByText("Alert toast")).not.toBeInTheDocument();
  });

  it("toggles the theme mode", () => {
    renderWithNotifications();

    const mode = screen.getByTestId("mode-value");
    expect(mode).toHaveTextContent("light");

    fireEvent.click(screen.getByTestId("toggle-mode"));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(mode).toHaveTextContent("dark");
  });

  it("applies the correct themed colors to the toast", () => {
    renderWithNotifications();

    fireEvent.click(screen.getByTestId("notify-info"));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const toast = screen.getByRole("status");
    const styles = window.getComputedStyle(toast);

    expect(styles.backgroundColor).toBe("rgba(227, 242, 253, 0.6)");
    expect(styles.borderColor).toBe("rgba(33, 150, 243, 0.6)");
    expect(styles.color).toBe("rgb(21, 101, 192)");
  });

  it("updates colors when the mode switches to dark", () => {
    renderWithNotifications();

    fireEvent.click(screen.getByTestId("notify-info"));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    fireEvent.click(screen.getByTestId("toggle-mode"));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const styles = window.getComputedStyle(screen.getByRole("status"));

    expect(styles.backgroundColor).toBe("rgba(33, 60, 82, 0.6)");
    expect(styles.borderColor).toBe("rgba(100, 181, 246, 0.6)");
    expect(styles.color).toBe("rgb(227, 242, 253)");
  });

  it("applies custom theme colors when provided", () => {
    renderWithNotifications();

    fireEvent.click(screen.getByTestId("notify-custom"));
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const styles = window.getComputedStyle(screen.getByRole("status"));

    expect(styles.backgroundColor).toBe("rgba(16, 16, 16, 0.6)");
    expect(styles.borderColor).toBe("rgba(255, 0, 255, 0.6)");
    expect(styles.color).toBe("rgb(0, 255, 0)");
  });

  it("positions notifications per align bucket", () => {
    render(
      <NotificationsProvider>
        <AlignSeeder />
        <NotificationManager />
      </NotificationsProvider>
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    ALIGN_SPECS.forEach(({ align, label }) => {
      const messageNode = screen.getByText(`Position ${label}`);
      const toastElement = messageNode.closest('[role="status"]');
      if (!toastElement) {
        throw new Error(`Toast for ${label} did not render`);
      }

      const style = window.getComputedStyle(toastElement);

      if (align[0] === "top") {
        expect(style.top).not.toBe("");
        expect(style.bottom).toBe("");
      } else {
        expect(style.bottom).not.toBe("");
        expect(style.top).toBe("");
      }

      switch (align[1]) {
        case "left":
          expect(style.left).not.toBe("");
          expect(style.right).toBe("");
          break;
        case "right":
          expect(style.right).not.toBe("");
          expect(style.left).toBe("");
          break;
        default:
          expect(style.left).toBe("50%");
          expect(style.right).toBe("");
          expect(style.transform).toContain("translateX(-50%)");
          break;
      }
    });
  });
});
