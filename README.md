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
| Dự án — danh mục cha (Biệt thự, Khách sạn, Nhà hàng, Coffee…) | `/du-an/` | `/en/projects/` |
| Dự án thuộc một danh mục | `/du-an/:danh-muc/` (vd. `/du-an/khach-san/`) | `/en/projects/:type/` (vd. `/en/projects/hotels/`) |
| Chi tiết dự án | `/du-an/:danh-muc/:slug/` | `/en/projects/:type/:slug/` |
| Đơn giá (không có trên menu; vào từ dòng “Đơn giá từ …” dưới thẻ danh mục) | `/don-gia/` (mỗi danh mục có neo, vd. `/don-gia/#biet-thu`) | `/en/pricing/` |
| Về COMPA | `/gioi-thieu/` | `/en/studio/` |
| Liên hệ | `/lien-he/` | `/en/contact/` |
| Dịch vụ (khi công khai) | `/dich-vu/`, `/dich-vu/:slug/` | `/en/services/`, `/en/services/:slug/` |

**Trang quản trị: http://127.0.0.1:5173/admin** — không có liên kết trong menu khách.

## Trang quản trị (bản thử nghiệm trên thiết bị)

Tổng quan · Danh mục dự án · Dự án · Ảnh mở đầu · Thương hiệu & Liên hệ · Nội dung Việt–Anh.

- **Danh mục dự án** (`/admin/danh-muc`): thêm, đổi tên vi/en, slug, mô tả, ảnh đại diện, sắp xếp. Danh mục chưa có dự án công khai tự ẩn trên website. Muốn xóa danh mục còn dự án thì chuyển dự án sang danh mục khác trước (có nút chuyển hàng loạt).
- **Đơn giá**: mỗi danh mục có bảng giá riêng (hạng mục vi/en, đơn giá VNĐ, đơn vị, ghi chú) nhập ngay trong “Danh mục dự án”. Dòng thấp nhất hiện dưới thẻ danh mục ở trang Dự án (“Đơn giá từ 300.000 đ/m²”, bấm vào sang đúng mục trên trang Đơn giá). Tiêu đề, giới thiệu, ghi chú cuối trang, bật/tắt trang và bật/tắt ghi chú “Đơn giá minh họa” nằm ở “Nội dung Việt–Anh”.
- Mỗi dự án thuộc **đúng một danh mục** (chọn trong form dự án, bắt buộc trước khi công khai). “Hạng mục” (Kiến trúc / Nội thất / Cảnh quan / Thi công) là trường riêng.

- Dữ liệu lưu trong **IndexedDB** của trình duyệt (ảnh tải lên lưu dạng Blob). Lần đầu mở admin, nội dung trong `content/` được chép vào IndexedDB; sau đó không bao giờ bị ghi đè trừ khi bấm “Khôi phục dữ liệu demo”.
- Khi chạy `npm run dev`, website đọc IndexedDB nếu admin đã được dùng, nếu chưa thì đọc `content/`. Thay đổi còn sau khi reload.
- **Mỗi địa chỉ là một vùng dữ liệu riêng**: đổi cổng (5173 → 5174) hay đổi trình duyệt sẽ thấy dữ liệu khác.
- Gallery theo không gian: nhóm Ngoại thất / Nội thất / Sân vườn (thêm, đổi tên, sắp xếp được), khu “Chưa phân loại”, tải nhiều ảnh, chọn nhiều + “Chuyển vào nhóm”, kéo thả, nút ←/→/↑/↓ cho bàn phím. Còn ảnh chưa phân loại thì lưu nháp được, công khai bị chặn.
- Đường dẫn của dự án đã công khai thay đổi (đổi slug, đổi danh mục, hoặc đổi slug của danh mục) → tự ghi chuyển hướng 301 cho cả bản Việt và Anh (xuất ra `_redirects` khi build).
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
| Thương hiệu, NAP (tên/địa chỉ/điện thoại), danh mục dự án (`projectTypes`), slide, nội dung giới thiệu, dịch vụ, cờ SEO | `content/site.json` (hoặc admin) |
| Dự án (nhóm, ảnh, thứ tự, SEO) | `content/projects/<slug>.json` (hoặc admin) |
| Danh mục ảnh: đường dẫn, kích thước, nguồn, giấy phép, `isDemo` | `content/assets.json` |
| Ảnh gốc (giữ để xuất lại) | `content/images-src/` → tự sinh `public/images/*.webp` |
| Chuyển hướng slug cũ | `content/redirects.json` |
| Bảng màu, font, khoảng cách | `src/styles/tokens.css` |
| Chuỗi giao diện Việt / Anh | `src/i18n/vi.ts`, `src/i18n/en.ts` |
| Tên miền | biến `SITE_URL` trong `.env` (mẫu ở `.env.example`) |
| Logo | `content/images-src/brand/logo-original.jpg` (xem bên dưới) |

Các component chính: `BrandLogo`, `SiteHeader`, `LanguageSwitcher`, `ProjectGrid`, `ProjectCard`, `ProjectGallery`, `Lightbox`, `SiteFooter`, `AdminLayout`. Dữ liệu admin đi qua `src/admin/data/repository.ts` để sau này thay bằng API.

### Logo

Đang dùng **logo gốc của khách**: `content/images-src/brand/logo-original.jpg` (2048×2048, nền xám than; file gốc tên `logo.webp` nhưng dữ liệu là JPEG). Khi build, `scripts/build-images.mjs` tạo:

- `public/brand/logo.webp` (640px) — hiển thị ở header và trang chủ, nguyên bản, không đổi màu, không cắt chữ phụ;
- `public/brand/logo.png` (512px) — dùng cho JSON-LD `logo`;
- `public/brand/logo-transparent.webp` (960×304) — logo **tách nền** dùng trên ảnh trang chủ: nền xám than phẳng của file gốc được tách theo từng điểm ảnh, giữ nguyên màu vàng be và viền mềm, không vẽ lại. Nếu khách gửi PNG nền trong suốt chính thức, đặt tại `content/images-src/brand/logo-transparent.png` để dùng thay;
- `favicon-32.png`, `apple-touch-icon.png` — cắt từ biểu tượng chữ O + compa trong logo (thu nhỏ, không vẽ lại).

Thay logo: ghi đè `content/images-src/brand/logo-original.jpg` rồi `npm run build`. Đường dẫn hiển thị khai báo ở `brand.logoFile` trong `content/site.json`.

### Thay ảnh dự án

Qua admin (khuyến nghị) rồi xuất gói. Ảnh mẫu hiện tại có `isDemo: true` và `sourceUrl` trong `content/assets.json`; không gán là công trình COMPA.

## Ghi chú bàn giao

**Nhận diện COMPA trên các trang bên trong**: header là dải xám than (logo gốc hòa vào nền, menu chữ vàng be nhạt, vạch vàng be dưới header), nền trang trắng ấm `#F6F4EF`, footer xám than có vạch vàng be — theo quy tắc màu ở mục 3 của prompt. Màu chữ trên nền xám than dùng `--on-charcoal` / `--on-charcoal-strong` (đạt WCAG AA); vàng be thuần chỉ dùng cho logo và đường kẻ.

**Mạng xã hội**: trang chủ có hàng nút vuông Facebook / Instagram / TikTok (rà chuột: nút đổi sang màu thương hiệu, biểu tượng trượt xuống). Cả 3 nút luôn hiện trên trang chủ; nút chưa có link (Instagram, TikTok) chưa bấm được cho tới khi nhập link trong admin → Thương hiệu & Liên hệ. Footer, trang Liên hệ và JSON-LD chỉ hiện các tài khoản đã có link. Footer, trang Liên hệ và JSON-LD (`sameAs`) dùng cùng nguồn link.

**Còn tạm / xấp xỉ**

- Logo: đã dùng file gốc của khách (ảnh raster nền xám). Chưa có bản vector / PNG nền trong suốt.
- Mã màu trong `tokens.css` lấy mẫu từ file logo (xám than `#535351`, vàng be `#CEC09D`), chưa đối chiếu với file nhận diện chính thức.
- Font: Montserrat (OFL, tự host WOFF2, subset Việt + Latin, 300/400/600) thay thế tạm cho proxima-nova.
- Toàn bộ 12 dự án là minh họa, chia vào 6 danh mục mẫu (Biệt thự, Nhà phố, Khách sạn, Homestay, Nhà hàng, Coffee — mỗi danh mục 2 dự án); dự án 01 có đủ 20 ảnh (5 Ngoại thất + 10 Nội thất + 5 Sân vườn) để kiểm tra gallery. Danh sách danh mục thật cần khách xác nhận.
- **Đơn giá đang là số minh họa** (riêng biệt thự 300.000 đ/m² theo ví dụ yêu cầu); trang hiện ghi chú “Đơn giá minh họa — chưa phải báo giá chính thức”. Thay bằng giá thật của khách rồi tắt ghi chú trong admin.
- Trang Dịch vụ ở trạng thái nháp, cần khách cung cấp mô tả.
- `allowIndexing: false` → mọi trang `noindex` + header `X-Robots-Tag` cho tới khi có dự án thật.

**Đã kiểm tra (ngày 20/11/2026, trên máy local)**

- Typecheck và build thành công; 46 trang prerender; `npm run check:seo` đạt toàn bộ.
- Chrome headless ở 1440 / 768 / 390px: không tràn ngang, mỗi trang đúng một `<h1>`, không lỗi hydration.
- Kiểm thử tự động 56 bước: dòng đơn giá dưới thẻ danh mục và liên kết sang đúng mục, bảng giá vi/en (300.000 đ/m² ↔ 300,000 VND/m²), sửa giá trong admin hiện ngay ngoài web, điều hướng 3 cấp (danh mục → dự án → chi tiết, breadcrumb, đổi ngôn ngữ giữ đúng trang, sai danh mục tự về URL chuẩn), đổi slug danh mục tạo chuyển hướng, chặn xóa danh mục còn dự án, nhóm 5/10/5, lightbox giữ trong nhóm (“Nội thất — 3/10”, dừng ở đầu/cuối, Escape trả focus), đổi ngôn ngữ giữ trang, menu bằng bàn phím, tải thẳng/refresh trang chi tiết, luồng admin (tải 20 ảnh giữ thứ tự chọn, chặn công khai khi còn ảnh chưa phân loại, phân nhóm không mất/không trùng, công khai, hiện trên web, reload còn, đổi thứ tự nhóm/chuyển ảnh phản ánh ở bản EN, đổi slug tạo chuyển hướng, xóa nhóm có ảnh, JSON xuất/nhập giữ cấu trúc và từ chối tham chiếu hỏng, xóa dự án).
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
