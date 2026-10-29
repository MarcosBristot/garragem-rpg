// Silhueta lateral de um esportivo genérico, desenhada para o projeto
// (sem marca, sem traços de um modelo real). Decorativa: aria-hidden.
export function SilhuetaCarro({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 130"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="pintura" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* Carroceria */}
      <path
        d="M12 92 C10 82 18 75 34 72 L118 63 C146 47 176 40 210 39 C240 39 262 45 286 57 L356 66 C380 69 392 78 391 90 L389 98 L346 99 A30 30 0 0 0 290 99 L118 99 A30 30 0 0 0 62 99 L16 98 Z"
        fill="url(#pintura)"
      />
      {/* Vidros */}
      <path
        d="M134 62 C154 51 178 46 206 45 L210 62 Z M220 45 C244 46 262 51 278 59 L222 62 Z"
        fill="#0b0b0d"
        opacity="0.75"
      />
      {/* Luzes */}
      <path d="M364 70 L388 76 L386 80 L362 76 Z" fill="#fff" opacity="0.9" />
      <path d="M14 80 L30 76 L30 82 L13 84 Z" fill="#ef4444" opacity="0.9" />
      {/* Rodas */}
      {[90, 318].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={98} r={25} fill="#0b0b0d" />
          <circle
            cx={cx}
            cy={98}
            r={15}
            fill="none"
            stroke="#8a8f99"
            strokeWidth={4}
          />
          <circle cx={cx} cy={98} r={4} fill="#8a8f99" />
        </g>
      ))}
    </svg>
  );
}
