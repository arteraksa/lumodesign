export function SocialIcon({ name }: { name: "whatsapp" | "instagram" | "facebook" | "linkedin" }) {
  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <g transform="translate(1.2 1.2) scale(.9)">
          <path d="M20.5 3.5A11.3 11.3 0 0 0 12.4.2C6.1.2 1 5.3 1 11.6c0 2 .5 3.9 1.5 5.6L1 23l5.9-1.5a11.4 11.4 0 0 0 5.5 1.4h.1c6.3 0 11.4-5.1 11.4-11.4 0-3-1.2-5.9-3.4-8Z" />
          <path d="M8.1 6.8c.2-.3.4-.3.7-.3h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.6.8c-.1.2-.1.4 0 .6.4.8 1.1 1.5 1.8 2 .7.5 1.6.9 2.5 1.1.2 0 .4 0 .5-.2l.8-1c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.6 0 .5-.2 1.5-.6 1.8-.4.4-1.1.6-1.7.6-.5 0-1.1-.2-1.5-.4-1.2-.5-2.3-1.2-3.3-2.1-.8-.7-1.5-1.5-2.1-2.4-.7-1-1.2-2.1-1.4-3.3-.1-.6 0-1.3.4-1.8Z" />
        </g>
      </svg>
    );
  }

  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M13.5 17v-4h1.8l.4-2h-2.2V9.8c0-.7.3-1.1 1.1-1.1h1.2V7h-1.9c-2 0-3 1-3 3v1h-1.7v2h1.7v4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M8 10.5v6.2M8 7.4v.1M11.5 16.7v-3.3a2.4 2.4 0 0 1 4.8 0v3.3M11.5 10.5v6.2" />
    </svg>
  );
}
