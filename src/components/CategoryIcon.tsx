/**
 * Category markers shown before a project category name.
 * - "elev-*": architect-style elevation sketches (drawn for COMPA, single 1px-feel stroke, 48×32).
 * - others: thin line icons from Lucide (ISC licence — https://lucide.dev), 24×24.
 * Decorative: the category name next to it carries the meaning.
 */
type IconDef = { label: string; viewBox: string; paths: JSX.Element };

const ELEVATIONS = {
  'elev-villa': {
    label: 'Mặt đứng: Biệt thự',
    viewBox: '0 0 48 32',
    paths: (
      <>
        <path d="M2 30H46" />
        <path d="M6 30V17H36V30" />
        <path d="M3 18L21 8L39 18" />
        <path d="M36 22H44V30" />
        <path d="M12 30V23H18V30" />
        <path d="M24 21H32V26H24Z" />
      </>
    ),
  },
  'elev-townhouse': {
    label: 'Mặt đứng: Nhà phố',
    viewBox: '0 0 48 32',
    paths: (
      <>
        <path d="M8 30H40" />
        <path d="M16 30V3H32V30" />
        <path d="M14 3H34" />
        <path d="M13 12H35" />
        <path d="M13 20H35" />
        <path d="M19 6H29V10H19Z" />
        <path d="M19 14H29V18H19Z" />
        <path d="M22 30V24H26V30" />
      </>
    ),
  },
  'elev-hotel': {
    label: 'Mặt đứng: Khách sạn',
    viewBox: '0 0 48 32',
    paths: (
      <>
        <path d="M4 30H44" />
        <path d="M11 30V5H37V30" />
        <path d="M9 5H39" />
        <path d="M11 11H37M11 17H37M11 23H37" />
        <path d="M17.5 5V23M24 5V23M30.5 5V23" />
        <path d="M19 26H29" />
        <path d="M21 26V30M27 26V30" />
      </>
    ),
  },
  'elev-homestay': {
    label: 'Mặt đứng: Homestay',
    viewBox: '0 0 48 32',
    paths: (
      <>
        <path d="M2 30H46" />
        <path d="M8 30V19H27V30" />
        <path d="M5 20L17.5 9L30 20" />
        <path d="M15 30V24H20V30" />
        <path d="M38 30V22" />
        <circle cx="38" cy="16.5" r="6" />
      </>
    ),
  },
  'elev-restaurant': {
    label: 'Mặt đứng: Nhà hàng',
    viewBox: '0 0 48 32',
    paths: (
      <>
        <path d="M2 30H46" />
        <path d="M8 30V11H40V30" />
        <path d="M6 11H42" />
        <path d="M8 17H40L38 20.5H10Z" />
        <path d="M12 30V24H22V30" />
        <path d="M26 30V24H36V30" />
      </>
    ),
  },
  'elev-coffee': {
    label: 'Mặt đứng: Coffee',
    viewBox: '0 0 48 32',
    paths: (
      <>
        <path d="M4 30H44" />
        <path d="M5 12H43" />
        <path d="M12 30V12M36 30V12" />
        <path d="M12 16H36" />
        <path d="M20 16V30M28 16V30" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

const LINE_ICONS = {
  villa: {
    label: 'Icon: Biệt thự (nhà mái dốc)',
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </>
    ),
  },
  townhouse: {
    label: 'Icon: Nhà phố (toà nhà)',
    viewBox: '0 0 24 24',
    paths: (
      <>
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
      </>
    ),
  },
  hotel: {
    label: 'Icon: Khách sạn (giường)',
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M12 4v6" />
        <path d="M2 18h20" />
      </>
    ),
  },
  homestay: {
    label: 'Icon: Homestay (cây xanh)',
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
        <path d="M7 16v6" />
        <path d="M13 19v3" />
        <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />
      </>
    ),
  },
  restaurant: {
    label: 'Icon: Nhà hàng (dao nĩa)',
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
        <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
        <path d="m2.1 21.8 6.4-6.3" />
        <path d="m19 5-7 7" />
      </>
    ),
  },
  coffee: {
    label: 'Icon: Coffee (tách cà phê)',
    viewBox: '0 0 24 24',
    paths: (
      <>
        <path d="M10 2v2M14 2v2M6 2v2" />
        <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
      </>
    ),
  },
} satisfies Record<string, IconDef>;

export const CATEGORY_ICONS: Record<keyof typeof ELEVATIONS | keyof typeof LINE_ICONS, IconDef> = { ...ELEVATIONS, ...LINE_ICONS };

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export function isCategoryIcon(v: unknown): v is CategoryIconKey {
  return typeof v === 'string' && v in CATEGORY_ICONS;
}

export function CategoryIcon({ kind, className }: { kind: string | null | undefined; className?: string }) {
  if (!isCategoryIcon(kind)) return null;
  const def = CATEGORY_ICONS[kind];
  const [, , w, h] = def.viewBox.split(' ').map(Number);
  const isSketch = kind.startsWith('elev-');
  return (
    <svg
      className={`${className ?? ''}${isSketch ? ' is-sketch' : ''}`}
      viewBox={def.viewBox}
      style={{ aspectRatio: `${w} / ${h}` }}
      fill="none"
      stroke="currentColor"
      strokeWidth={isSketch ? 1.2 : 1.25}
      strokeLinecap={isSketch ? 'square' : 'round'}
      strokeLinejoin={isSketch ? 'miter' : 'round'}
      aria-hidden="true"
      focusable="false"
    >
      {def.paths}
    </svg>
  );
}
