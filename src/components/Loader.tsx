import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
}

export const Loader: React.FC<LoaderProps> = ({ size = "md" }) => {
  const sizeMap = { sm: 16, md: 32, lg: 48 };
  const px = sizeMap[size];
  return (
    <div
      style={{
        width: px,
        height: px,
        border: `3px solid rgba(45, 90, 39, 0.2)`,
        borderTopColor: "#2d5a27",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
        display: "inline-block",
      }}
    />
  );
};

// inject keyframes once
if (typeof document !== "undefined" && !document.getElementById("loader-keyframes")) {
  const style = document.createElement("style");
  style.id = "loader-keyframes";
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
