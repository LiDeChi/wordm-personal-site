import type { ReactNode } from "react";

type SocialLink = {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
};

type SocialLinksProps = {
  ariaLabel: string;
  className?: string;
  linkClassName?: string;
};

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M21.72 4.47 18.45 19.9c-.25 1.09-.9 1.35-1.82.84l-4.98-3.67-2.4 2.31c-.27.27-.49.49-1 .49l.35-5.08 9.25-8.36c.4-.35-.09-.55-.62-.2L5.79 13.45.86 11.9c-1.07-.33-1.09-1.07.22-1.58L20.36 2.9c.9-.33 1.68.2 1.36 1.57Z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M18.47 3h2.94l-6.42 7.34L22.55 21h-5.91l-4.63-6.07L6.7 21H3.75l6.87-7.85L1.36 3h6.06l4.18 5.52zm-1.04 16h1.63L6.54 4.9H4.8z"
      />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M21.5 11.97c0-1.2-.98-2.18-2.18-2.18-.59 0-1.13.24-1.52.62-1.35-.86-3.17-1.42-5.19-1.5l.88-4.13 2.87.61a1.72 1.72 0 1 0 .18-.85l-3.33-.71a.43.43 0 0 0-.51.33l-1.01 4.74c-2.13.04-4.06.6-5.48 1.51a2.18 2.18 0 1 0-2.36 3.56 4.04 4.04 0 0 0-.06.69c0 3.18 3.69 5.76 8.24 5.76s8.24-2.58 8.24-5.76c0-.23-.02-.46-.06-.69.77-.33 1.3-1.1 1.3-2Zm-14.3 1.64a1.28 1.28 0 1 1 2.56 0 1.28 1.28 0 0 1-2.56 0Zm7.85 3.55c-.86.86-2.5.92-3.05.92s-2.19-.06-3.05-.92a.42.42 0 1 1 .6-.6c.54.54 1.72.67 2.45.67s1.91-.13 2.45-.67a.42.42 0 0 1 .6.6Zm-.82-2.27a1.28 1.28 0 1 1 0-2.56 1.28 1.28 0 0 1 0 2.56Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M14.05 22v-8.5h2.85l.43-3.31h-3.28V8.07c0-.96.27-1.61 1.64-1.61h1.75V3.5c-.3-.04-1.34-.13-2.55-.13-2.52 0-4.25 1.54-4.25 4.37v2.45H7.8v3.31h2.84V22z"
      />
    </svg>
  );
}

function SubstackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 4.5h16v1.8H4zm0 4.1h16v1.8H4zm0 4.1h16V20H4z"
      />
    </svg>
  );
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    key: "telegram",
    label: "Telegram",
    href: "https://t.me/fount_ai",
    icon: <TelegramIcon />,
  },
  {
    key: "x",
    label: "X",
    href: "https://x.com/parsonjian",
    icon: <XIcon />,
  },
  {
    key: "reddit",
    label: "Reddit",
    href: "https://www.reddit.com/r/Fount/",
    icon: <RedditIcon />,
  },
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/groups/1734944400854875",
    icon: <FacebookIcon />,
  },
  {
    key: "substack",
    label: "Substack",
    href: "https://substack.com/@parson1",
    icon: <SubstackIcon />,
  },
];

export function SocialLinks({
  ariaLabel,
  className,
  linkClassName,
}: SocialLinksProps) {
  const rootClassName = ["social-links", className].filter(Boolean).join(" ");
  const itemClassName = ["social-link", linkClassName].filter(Boolean).join(" ");

  return (
    <div className={rootClassName} role="group" aria-label={ariaLabel}>
      {SOCIAL_LINKS.map((link) => (
        <a
          className={itemClassName}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.label}
          title={link.label}
          key={link.key}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
