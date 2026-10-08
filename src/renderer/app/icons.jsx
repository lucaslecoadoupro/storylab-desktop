import React from 'react';

// Jeu d'icônes trait (style Lucide), dessinées en SVG inline : aucune dépendance réseau.
const P = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.8c2 .7 3.3 2.4 3.6 5.2" /></>,
  grid: <><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 9.5h17M3.5 15h17M9.5 9.5V20.5" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M8.5 11.5 10.5 13.5 15 9" /><path d="M8.5 17h7" /></>,
  pen: <><path d="M4 20l1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8 18.5 4 20z" /><path d="M14 6.5l3 3" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M7 15l4-4 3 3 5-6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  chevronLeft: <><path d="M15 6l-6 6 6 6" /></>,
  chevronRight: <><path d="M9 6l6 6-6 6" /></>,
  chevronUp: <><path d="M6 15l6-6 6 6" /></>,
  chevronDown: <><path d="M6 9l6 6 6-6" /></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  printer: <><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></>,
  upload: <><path d="M12 15V4M7 9l5-5 5 5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
  file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></>,
  fileText: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9.5" r="1.8" /><path d="M21 16l-5-5-9 9" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M9 7V4h6v3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  more: <><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></>,
  highlighter: <><path d="M9 11l-5 5v4h4l5-5" /><path d="M13 15l7.5-7.5a2.1 2.1 0 0 0-3-3L10 12z" /><path d="M14 20h7" /></>,
  type: <><path d="M5 6V4h14v2M12 4v16M9 20h6" /></>,
  stamp: <><path d="M9 4h6l-1 7h4a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2h4z" /><path d="M5 19h14" /></>,
  eraser: <><path d="M7 21h13" /><path d="M5.5 15.5 14 7l5 5-7.5 7.5a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8z" /><path d="M9.5 11.5l5 5" /></>,
  hand: <><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" /><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14" /><path d="M8 13l-1.6-1.6a1.6 1.6 0 0 0-2.3 2.3L8 18c1.5 1.8 3 3 5.5 3H14a5 5 0 0 0 5-5v-6.5a1.5 1.5 0 0 0-3 0" /></>,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  redo: <><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></>,
  zoomIn: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></>,
  zoomOut: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M8 11h6" /></>,
  rotate: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  maximize: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></>,
  circle: <><circle cx="12" cy="12" r="8" /></>,
  underline: <><path d="M6 4v7a6 6 0 0 0 12 0V4" /><path d="M4 21h16" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  save: <><path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17.5v.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>,
  sparkles: <><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" /></>,
  layers: <><path d="M12 3 2 8l10 5 10-5z" /><path d="M2 13l10 5 10-5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M19 19v2H6" /></>,
  scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.1 8.1 20 20M8.1 15.9 20 4" /></>,
  layout: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M13 4v16" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  wand: <><path d="M15 4V2M15 10V8M11 6h2M17 6h2" /><path d="M3 21 14 10" /><path d="M18.5 13.5v1.5M17.8 14.2h1.5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  sidebar: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  arrowUpDown: <><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" /></>,
  pdf: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 16v-4h1.5a1.3 1.3 0 0 1 0 2.6H8M13 12v4h1a2 2 0 0 0 0-4zM18 12h-2v4M16 14h1.6" strokeWidth="1.3" /></>,

  smartphone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  message: <><path d="M4 5.5h16v10H9l-4.5 4v-4H4z" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  phoneCall: <><path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" /></>,
  story: <><circle cx="12" cy="12" r="8.5" strokeDasharray="4 2.2" /><path d="M10 9l5 3-5 3z" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  branch: <><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="8" r="2" /><path d="M6 7v10" /><path d="M18 10c0 4-6 3-12 7" /></>,
  play: <><path d="M7 4.5v15l12-7.5z" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
  stop: <><rect x="6" y="6" width="12" height="12" rx="2" /></>,
  send: <><path d="M21 3 10 14" /><path d="M21 3l-7 18-4-7-7-4z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5 12 13l8.5-6.5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17.3v.01" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  route: <><circle cx="6" cy="19" r="2.2" /><circle cx="18" cy="5" r="2.2" /><path d="M8.2 19H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.8" /></>,
  graduation: <><path d="M2 9.5 12 5l10 4.5L12 14z" /><path d="M6 11.5V16c2 2 10 2 12 0v-4.5" /><path d="M22 9.5V15" /></>,
  heart: <><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /></>,
  pin: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  photo: <><rect x="3" y="5" width="18" height="15" rx="2" /><circle cx="12" cy="12.5" r="3.5" /><path d="M8 5l1.5-2h5L16 5" /></>,
  quote: <><path d="M5 17c0-4 1-7 5-9M14 17c0-4 1-7 5-9" /><path d="M5 17h4v-4H5zM14 17h4v-4h-4z" /></>,
  thought: <><path d="M7 15a4 4 0 0 1-.8-7.9A5 5 0 0 1 15.7 6 4.5 4.5 0 1 1 17 15z" /><circle cx="7" cy="19" r="1.3" /><circle cx="4" cy="21.5" r=".8" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" /><path d="M4 3v5h5" /><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" /><path d="M20 21v-5h-5" /></>,
  fast: <><path d="M4 6v12l8-6zM12 6v12l8-6z" /></>,
  wandSparkle: <><path d="M4 20 15 9" /><path d="M14 4l.8 2.2L17 7l-2.2.8L14 10l-.8-2.2L11 7l2.2-.8zM19 11l.5 1.5 1.5.5-1.5.5L19 15l-.5-1.5L17 13l1.5-.5z" /></>,
  door: <><path d="M5 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" /><path d="M3 21h18M13.5 12v.01" /></>,
  users2: <><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2.5 19c.5-3 2.7-4.7 5.5-4.7s5 1.7 5.5 4.7M13.5 14.6c.8-.2 1.6-.3 2.5-.3 2.8 0 5 1.7 5.5 4.7" /></>,
  forward: <><path d="M14 5l7 7-7 7" /><path d="M21 12H9a6 6 0 0 0-6 6" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2M9 9.5v.01M15 9.5v.01" /></>,
  power: <><path d="M12 3v8" /><path d="M6.4 6.6a8 8 0 1 0 11.2 0" /></>,
  thumb: <><path d="M7 11v9H4v-9z" /><path d="M7 11l4-7a2 2 0 0 1 2.7 2.4L12.5 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  volume: <><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
};

export function Icon({ name, size, className, style, strokeWidth = 1.9 }) {
  const content = P[name] || P.info;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}
      className={className} style={style} aria-hidden="true">
      {content}
    </svg>
  );
}

// Logo StoryLab : même écusson que ClassPro (fond noir, liseré doré),
// avec un téléphone d'où partent deux chemins (une histoire à embranchements).
export function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="dssf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a1a1a" /><stop offset="100%" stopColor="#0d0d0d" /></linearGradient>
        <linearGradient id="dsgs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4b483" /><stop offset="100%" stopColor="#a8864e" /></linearGradient>
        <linearGradient id="dsph" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6b8efb" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient>
      </defs>
      <path d="M50 8 L84 22 L84 58 Q84 80 50 96 Q16 80 16 58 L16 22 Z" fill="url(#dssf)" stroke="url(#dsgs)" strokeWidth="2.8" strokeLinejoin="round" />
      <rect x="36" y="32" width="28" height="48" rx="5.5" fill="url(#dsph)" />
      <rect x="39.5" y="37" width="21" height="36" rx="2.5" fill="#0f1b4d" />
      <circle cx="50" cy="44" r="2.6" fill="#fff" />
      <path d="M50 46.5 V53 M50 53 Q50 58 44 62 M50 53 Q50 58 56 62" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="44" cy="64" r="2.4" fill="#d4b483" />
      <circle cx="56" cy="64" r="2.4" fill="#34d399" />
      <line x1="50" y1="16" x2="50" y2="26" stroke="#d4b483" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="44" y1="21" x2="56" y2="21" stroke="#d4b483" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
