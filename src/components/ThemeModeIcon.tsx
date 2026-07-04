type ThemeModeIconProps = {
  mode: "day" | "night";
};

export function ThemeModeIcon({ mode }: ThemeModeIconProps) {
  if (mode === "night") {
    return (
      <svg
        className="theme-mode-icon theme-mode-icon-sun"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
          d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"
        />
      </svg>
    );
  }

  return (
    <svg
      className="theme-mode-icon theme-mode-icon-moon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M20.25 14.55A7.55 7.55 0 0 1 9.45 3.75 8.4 8.4 0 1 0 20.25 14.55Z"
      />
    </svg>
  );
}
