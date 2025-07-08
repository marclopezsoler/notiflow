import styled, { css } from "styled-components";

function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.replace(/^#/, "");
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const NotificationWrapper = styled.div<{
  $bg: string;
  $border: string;
  $color: string;
  $index: number;
  $isExiting: boolean;
  $mounted: boolean;
  $isClickable: boolean;
  $canClose: boolean;
  $veticalAlign: "top" | "bottom";
  $horizontalAlign: "left" | "middle" | "right";
}>`
  position: fixed;
  z-index: ${({ $index }) => 9999 - $index};
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ $veticalAlign, $index }) => {
    const step = Math.max(4, 16 - $index * 2);
    const offset = step * $index;
    return $veticalAlign === "top"
      ? css`
          top: calc(1rem + ${offset}px);
        `
      : css`
          bottom: calc(1rem + ${offset}px);
        `;
  }}

  ${({ $horizontalAlign }) => {
    switch ($horizontalAlign) {
      case "left":
        return css`
          left: 1rem;
        `;
      case "right":
        return css`
          right: 1rem;
        `;
      default:
        return css`
          left: 50%;
          transform: translateX(-50%);
        `;
    }
  }}

  max-width: min(320px, 90%);
  width: fit-content;
  padding: 12px 20px;
  padding-right: ${({ $canClose }) => ($canClose ? "38px" : "20px")};
  border-radius: 8px;
  user-select: ${({ $isClickable }) => ($isClickable ? "auto" : "none")};
  cursor: ${({ $isClickable }) => ($isClickable ? "pointer" : "default")};

  background: ${({ $bg }) => hexToRgba($bg, 0.6)};
  border: 1px solid ${({ $border }) => hexToRgba($border, 0.6)};
  color: ${({ $color }) => $color};

  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  ${({ $horizontalAlign, $veticalAlign, $mounted, $isExiting, $index }) => {
    const base = 1 - $index * 0.02;
    const entryY = $veticalAlign === "top" ? "-50px" : "50px";
    const exitY = entryY;
    const tx = $horizontalAlign === "middle" ? "-50%" : "0";
    const ty = $isExiting ? exitY : $mounted ? "0" : entryY;
    const scale = $isExiting ? base * 0.975 : $mounted ? base : base * 0.975;
    const opacity = $isExiting ? 0 : $mounted ? 1 : 0;

    return css`
      transform: translateX(${tx}) translateY(${ty}) scale(${scale});
      opacity: ${opacity};
      transition: top 0.3s ease, bottom 0.3s ease, transform 0.2s ease,
        opacity 0.2s ease;
    `;
  }}

  &:hover {
    .close-icon-container {
      opacity: 1;
    }
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .message {
    text-align: left;
    font: 500 14px sans-serif;
  }

  .submessage {
    text-align: left;
    font: 400 12px sans-serif;
    opacity: 0.8;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .custom-icon {
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .custom-icon > * {
    max-width: 100%;
    max-height: 100%;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ $border }) => hexToRgba($border, 0.25)};
    color: ${({ $color }) => $color};
  }

  .close-icon-container {
    position: absolute;
    top: 4px;
    right: 4px;

    opacity: 0;

    transition: 0.25s;

    .close-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      color: ${({ $color }) => $color};
      cursor: pointer;
      transition: background 0.25s ease;
      &:hover {
        background: ${({ $border }) => hexToRgba($border, 0.25)};
      }
    }
  }
`;
