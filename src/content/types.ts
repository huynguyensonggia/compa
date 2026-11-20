export type Lang = 'vi' | 'en';
export const LANGS: Lang[] = ['vi', 'en'];

/** A bilingual text value. */
export interface Bi {
  vi: string;
  en: string;
}

export type FocalPoint = { x: number; y: number } | null;

export type Category = 'architecture' | 'interior' | 'landscape' | 'construction';
export const CATEGORIES: Category[] = ['architecture', 'interior', 'landscape', 'construction'];

export type PublishStatus = 'draft' | 'published';

/**
 * Stored image asset. Static assets live in content/images-src and are served as
 * /images/{src}-{480|960|1600}.webp. Blob assets exist only in the admin's IndexedDB.
 */
export interface AssetRecord {
  id: string;
  width: number;
  height: number;
  src?: string;
  ext?: string;
  blob?: Blob;
  mime?: string;
  fileName?: string;
  alt?: Bi;
  sourceUrl?: string;
  license?: string;
  isDemo?: boolean;
  createdAt?: string;
}

/** Asset ready for rendering. */
export interface ResolvedAsset {
  id: string;
  width: number;
  height: number;
  src: string;
  srcSet?: string;
  isBlob: boolean;
  sourceUrl?: string;
  license?: string;
  isDemo?: boolean;
}

export type AssetMap = Record<string, ResolvedAsset>;

export interface SpaceGroup {
  id: string;
  projectId?: string;
  title: Bi;
  sortOrder: number;
}

export interface GalleryImage {
  id: string;
  projectId?: string;
  /** null = "Chưa phân loại" (only allowed while the project is a draft). */
  groupId: string | null;
  assetId: string;
  sortOrder: number;
  alt: Bi;
  focalPoint: FocalPoint;
}

export interface ProjectSeo {
  title: Bi;
  description: Bi;
  ogAssetId: string | null;
}

export interface Project {
  id: string;
  slug: string;
  status: PublishStatus;
  sortOrder: number;
  isDemo: boolean;
  title: Bi;
  location: Bi;
  year: number | null;
  categories: Category[];
  description: Bi;
  coverAssetId: string | null;
  seo: ProjectSeo;
  updatedAt: string;
  /** Project type (danh mục cha: Biệt thự, Khách sạn…). Exactly one per project. */
  typeId: string | null;
  /** Public URLs at the last publish; used to create 301 redirects when slug or type changes. */
  publishedPaths?: Record<Lang, string> | null;
}

export interface ProjectFull extends Project {
  groups: SpaceGroup[];
  images: GalleryImage[];
}

export interface HeroSlide {
  id: string;
  assetId: string;
  alt: Bi;
  focalPoint: FocalPoint;
}

export interface PostalAddress {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
  display: Bi;
}

/** One line of a category's price table, e.g. Thiết kế kiến trúc — 300.000 đ/m². */
export interface PriceItem {
  id: string;
  label: Bi;
  /** Amount in VND; null = “Liên hệ”. */
  amount: number | null;
  unit: Bi;
  note: Bi;
}

/** Parent category shown on /du-an/ (Khách sạn, Biệt thự, Nhà hàng, Coffee…). */
export interface ProjectType {
  id: string;
  slug: Bi;
  title: Bi;
  description: Bi;
  coverAssetId: string | null;
  sortOrder: number;
  /** Price table shown on /don-gia/ and as “Đơn giá từ …” under the category card. */
  prices: PriceItem[];
}

export interface ServiceItem {
  key: Category;
  slug: Bi;
  title: Bi;
  body: Bi;
  status: PublishStatus;
}

export interface SiteContent {
  brand: {
    name: string;
    shortName: string;
    logoText: string;
    logoSubline: string;
    /** Path of the original logo in /public (e.g. /brand/logo.png). Empty = temporary wordmark. */
    logoFile: string;
    logoAssetId: string | null;
    tagline: Bi;
    description: Bi;
  };
  contact: {
    phone: string;
    phoneE164: string;
    email: string;
    address: PostalAddress;
    facebook: string;
    /** Leave empty until the account is verified — empty = no button/link anywhere. */
    instagram: string;
    tiktok: string;
    areaServed: string[];
    googleMapsPlaceUrl: string;
    mapEmbedUrl: string;
    geo: { lat: number; lng: number } | null;
    openingHours: string[];
    gbpReviewUrl: string;
  };
  hero: { slides: HeroSlide[] };
  projectTypes: ProjectType[];
  pages: {
    studio: { title: Bi; body: Bi; imageAssetId: string | null };
    contact: { title: Bi; intro: Bi };
    notFound: Bi;
  };
  pricing: {
    status: PublishStatus;
    title: Bi;
    intro: Bi;
    /** Footnote, e.g. prices exclude VAT, final quote after survey. */
    note: Bi;
    /** Show the “sample prices” notice until the client confirms real prices. */
    isDemo: boolean;
  };
  services: {
    status: PublishStatus;
    title: Bi;
    intro: Bi;
    items: ServiceItem[];
  };
  seo: {
    allowIndexing: boolean;
    homeTitle: Bi;
    defaultDescription: Bi;
    defaultOgAssetId: string | null;
    gtmId: string;
    ga4Id: string;
    googleSiteVerification: string;
  };
  updatedAt: string;
}

/** Permanent redirect between public paths (with trailing slash), e.g. after a slug or type change. */
export interface Redirect {
  from: string;
  to: string;
  createdAt: string;
}

export interface ContentState {
  site: SiteContent;
  projects: ProjectFull[];
  assets: AssetMap;
  redirects: Redirect[];
  source: 'static' | 'local';
}
