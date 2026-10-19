/** Ícones de traço, simples e amigáveis. 24px, herdam a cor do texto. */
type P = { size?: number };
const base = (size = 24) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.9,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
});

export const IconHome = ({ size }: P) => (
  <svg {...base(size)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" /></svg>
);
export const IconTimeline = ({ size }: P) => (
  <svg {...base(size)}><circle cx="5" cy="6" r="1.6" /><circle cx="5" cy="18" r="1.6" />
    <path d="M5 7.5v9" /><path d="M10 6h9" /><path d="M10 18h9" /></svg>
);
export const IconAlbum = ({ size }: P) => (
  <svg {...base(size)}><rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 17 5-4.5 4 3.3L16 13l4 3.5" /></svg>
);
export const IconResumo = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 3v3" /><path d="M12 3 9.6 5.4" />
    <path d="M12 3l2.4 2.4" /><path d="M5 13c0-3.9 3.1-7 7-7s7 3.1 7 7a7 7 0 0 1-3 5.7V21H8v-2.3A7 7 0 0 1 5 13Z" />
    <path d="M9 21h6" /></svg>
);
export const IconGear = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="3" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" /></svg>
);
export const IconCamera = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.2" /></svg>
);
export const IconPlus = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconPlay = ({ size }: P) => (
  <svg {...base(size)}><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
);
export const IconBack = ({ size }: P) => (
  <svg {...base(size)}><path d="M15 5l-7 7 7 7" /></svg>
);
