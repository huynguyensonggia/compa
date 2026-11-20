# COMPA Architecture Hội An — website portfolio

Website portfolio kiến trúc cho **COMPA Architecture Hội An** (“Đồng hành từ bản vẽ đến tổ ấm.”).
React + TypeScript + Vite, CSS thuần, React Router. Mỗi trang công khai được **prerender thành HTML tĩnh** khi build (sẵn title, meta, canonical, hreflang, Open Graph, JSON-LD và nội dung), sẵn sàng deploy lên Cloudflare Pages.

> Giai đoạn hiện tại là **bản demo**: 12 dự án đều là “Dự án minh họa”, ảnh mẫu từ Unsplash (Unsplash License), website đặt `noindex`.

## Chạy trên máy

Yêu cầu Node.js 20+.

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
```

| Lệnh | Việc làm |
|---|---|
| `npm run dev` | Dev server chỉ trên localhost, cổng **5173** (tự tạo ảnh WebP trước khi chạy) |
| `npm run build` | Typecheck → tạo ảnh WebP → build → prerender toàn bộ trang vào `dist/` |
| `npm run preview` | Phục vụ `dist/` tại http://127.0.0.1:4173/ (giả lập Cloudflare Pages: 301, `_redirects`, `_headers`, 404 thật) |
| `npm run check:seo` | Kiểm tra SEO tự động trên `dist/` |
| `npm run content:import -- <file.zip>` | Nhập gói nội dung xuất từ trang quản trị |
| `npm run images` | Tạo lại ảnh WebP 480/960/1600 (`-- --force` để tạo lại toàn bộ) |

## Địa chỉ

| Trang | Tiếng Việt | English |
|---|---|---|
| Trang chủ | `/` | `/en/` |
| Dự án | `/du-an/` | `/en/projects/` |
| Chi tiết dự án | `/du-an/:slug/` | `/en/projects/:slug/` |
| Về COMPA | `/gioi-thieu/` | `/en/studio/` |
| Liên hệ | `/lien-he/` | `/en/contact/` |
| Dịch vụ (khi công khai) | `/dich-vu/`, `/dich-vu/:slug/` | `/en/services/`, `/en/services/:slug/` |

**Trang quản trị: http://127.0.0.1:5173/admin** — không có liên kết trong menu khách.

## Trang quản trị (bản thử nghiệm trên thiết bị)

Tổng quan · Dự án · Ảnh mở đầu · Thương hiệu & Liên hệ · Nội dung Việt–Anh.

- Dữ liệu lưu trong **IndexedDB** của trình duyệt (ảnh tải lên lưu dạng Blob). Lần đầu mở admin, nội dung trong `content/` được chép vào IndexedDB; sau đó không bao giờ bị ghi đè trừ khi bấm “Khôi phục dữ liệu demo”.
- Khi chạy `npm run dev`, website đọc IndexedDB nếu admin đã được dùng, nếu chưa thì đọc `content/`. Thay đổi còn sau khi reload.
- **Mỗi địa chỉ là một vùng dữ liệu riêng**: đổi cổng (5173 → 5174) hay đổi trình duyệt sẽ thấy dữ liệu khác.
- Gallery theo không gian: nhóm Ngoại thất / Nội thất / Sân vườn (thêm, đổi tên, sắp xếp được), khu “Chưa phân loại”, tải nhiều ảnh, chọn nhiều + “Chuyển vào nhóm”, kéo thả, nút ←/→/↑/↓ cho bàn phím. Còn ảnh chưa phân loại thì lưu nháp được, công khai bị chặn.
- Đổi slug dự án đã công khai → tự ghi chuyển hướng 301 (xuất ra `_redirects` khi build).
- “Sao lưu JSON” chỉ chứa **tham chiếu ảnh**, không phải sao lưu đầy đủ ảnh.
- **Chưa có xác thực.** Không dùng như hệ thống quản trị production.

### Đưa nội dung từ admin vào bản build (bắt buộc trước khi deploy)

IndexedDB chỉ nằm trong trình duyệt của người quản trị; bản build chỉ đọc thư mục `content/`.

1. Admin → Tổng quan → **Xuất gói nội dung cho website** → tải file `compa-goi-noi-dung-YYYY-MM-DD.zip`.
2. `npm run content:import -- đường/dẫn/compa-goi-noi-dung-YYYY-MM-DD.zip` — kiểm tra dữ liệu, ghi `content/*.json`, chép ảnh gốc (đã đổi tên theo slug/nhóm/thứ tự, ví dụ `du-an/nha-vuon-cam-thanh/noi-that-03.jpg`) vào `content/images-src/`, tạo ảnh WebP.
3. `npm run build`, kiểm tra bằng `npm run preview` và `npm run check:seo`, rồi commit và deploy.

## Cấu trúc & nơi chỉnh sửa

| Cần sửa | Ở đâu |
|---|---|
| Thương hiệu, NAP (tên/địa chỉ/điện thoại), slide, nội dung giới thiệu, dịch vụ, cờ SEO | `content/site.json` (hoặc admin) |
| Dự án (nhóm, ảnh, thứ tự, SEO) | `content/projects/<slug>.json` (hoặc admin) |
| Danh mục ảnh: đường dẫn, kích thước, nguồn, giấy phép, `isDemo` | `content/assets.json` |
| Ảnh gốc (giữ để xuất lại) | `content/images-src/` → tự sinh `public/images/*.webp` |
| Chuyển hướng slug cũ | `content/redirects.json` |
| Bảng màu, font, khoảng cách | `src/styles/tokens.css` |
| Chuỗi giao diện Việt / Anh | `src/i18n/vi.ts`, `src/i18n/en.ts` |
| Tên miền | biến `SITE_URL` trong `.env` (mẫu ở `.env.example`) |
| Logo | `src/components/BrandLogo.tsx` (xem bên dưới) |

Các component chính: `BrandLogo`, `SiteHeader`, `LanguageSwitcher`, `ProjectGrid`, `ProjectCard`, `ProjectGallery`, `Lightbox`, `SiteFooter`, `AdminLayout`. Dữ liệu admin đi qua `src/admin/data/repository.ts` để sau này thay bằng API.

### Thay logo gốc

Hiện đang dùng **wordmark “COMPA” tạm** (SVG chữ trên nền xám than) — *không phải logo gốc*, không có biểu tượng compa trong chữ O.
Khi có file của khách:
1. Đặt file tại `public/brand/logo.png` (PNG nền trong suốt hoặc ảnh vuông nền xám nguyên bản).
2. Trong `content/site.json` đặt `"logoFile": "/brand/logo.png"`.
3. `npm run build` — favicon và apple-touch-icon được tạo lại từ logo; JSON-LD `logo` trỏ về file này.

Hoặc tải logo trong admin (Thương hiệu & Liên hệ) rồi xuất gói nội dung.

### Thay ảnh dự án

Qua admin (khuyến nghị) rồi xuất gói. Ảnh mẫu hiện tại có `isDemo: true` và `sourceUrl` trong `content/assets.json`; không gán là công trình COMPA.

## Ghi chú bàn giao

**Còn tạm / xấp xỉ**

- Logo: wordmark tạm (xem trên). Favicon cũng tạm (chữ “C”).
- Mã màu trong `tokens.css` là **xấp xỉ** theo logo quan sát trên Facebook, chưa phải mã chính thức.
- Font: Montserrat (OFL, tự host WOFF2, subset Việt + Latin, 300/400/600) thay thế tạm cho proxima-nova.
- Toàn bộ 12 dự án là minh họa; dự án 01 có đủ 20 ảnh (5 Ngoại thất + 10 Nội thất + 5 Sân vườn) để kiểm tra gallery.
- Trang Dịch vụ ở trạng thái nháp, cần khách cung cấp mô tả.
- `allowIndexing: false` → mọi trang `noindex` + header `X-Robots-Tag` cho tới khi có dự án thật.

**Đã kiểm tra (ngày 20/11/2026, trên máy local)**

- Typecheck và build thành công; 32 trang prerender; `npm run check:seo` đạt toàn bộ.
- Chrome headless ở 1440 / 768 / 390px: không tràn ngang, mỗi trang đúng một `<h1>`, không lỗi hydration.
- Kiểm thử tự động 35 bước: nhóm 5/10/5, lightbox giữ trong nhóm (“Nội thất — 3/10”, dừng ở đầu/cuối, Escape trả focus), đổi ngôn ngữ giữ trang, menu bằng bàn phím, tải thẳng/refresh trang chi tiết, luồng admin (tải 20 ảnh giữ thứ tự chọn, chặn công khai khi còn ảnh chưa phân loại, phân nhóm không mất/không trùng, công khai, hiện trên web, reload còn, đổi thứ tự nhóm/chuyển ảnh phản ánh ở bản EN, đổi slug tạo chuyển hướng, xóa nhóm có ảnh, JSON xuất/nhập giữ cấu trúc và từ chối tham chiếu hỏng, xóa dự án).
- Luồng xuất gói → `content:import` → build → dòng 301 trong `_redirects`.
- `/du-an` → 301 `/du-an/`; URL sai → 404 thật; `/admin` có `X-Robots-Tag: noindex, nofollow` và `Cache-Control: no-store`.

**Lighthouse mobile (số đo lab trên máy local, `npm run preview`)**

| Trang | Performance | Accessibility | Best Practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 90 | 100 | 100 | 69* | 3,2 s | 0 |
| `/du-an/` | 86 | 100 | 100 | 69* | 3,8 s | 0 |
| `/du-an/du-an-minh-hoa-01/` | 94 | 100 | 100 | 69* | 2,6 s | 0 |
| `/lien-he/` | 96 | 100 | 100 | 66* | 2,4 s | 0 |
| `/en/projects/` | 81 | 100 | 100 | 69* | 4,7 s | 0 |

\* SEO thấp **chỉ vì `noindex` có chủ đích** (audit “is-crawlable”). Bản build thử với `allowIndexing: true` đạt **SEO 100** trên `/`, `/lien-he/` và trang dự án. LCP mobile mô phỏng 4G dao động 2,4–4,9 s giữa các lần đo, **chưa đạt mục tiêu < 2,5 s ở mọi trang**; đo lại trên tên miền thật bằng PageSpeed Insights (CDN Cloudflare sẽ khác máy local).

**Khi triển khai thật cần bổ sung**: backend/CMS, xác thực và phân quyền cho admin, lưu trữ ảnh phía server (thay IndexedDB + bước xuất gói thủ công).

Danh sách việc cần khách xác nhận và việc làm sau khi có tên miền: xem [SEO-CHECKLIST.md](SEO-CHECKLIST.md).
