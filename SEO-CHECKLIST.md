# SEO checklist — COMPA Architecture Hội An

## 1. Đã xác nhận (20/11/2026)

- Tên miền: `https://compaarchitecture-hoian.vn` (đặt trong `SITE_URL`, `.env.example`).
- Địa chỉ chuẩn: **102/5 Lý Thường Kiệt, Phường Hội An, Thành phố Đà Nẵng** — EN: *102/5 Ly Thuong Kiet, Hoi An Ward, Da Nang City, Vietnam*.
- Tên hiển thị duy nhất: **COMPA Architecture Hội An**. Điện thoại: 077 355 8945 (`+84773558945`). Email: compa.architecture.hoian@gmail.com.
- Chưa có Google Business Profile; chưa xác minh Instagram (không liên kết).

## 2. Còn thiếu — cần khách cung cấp (không tự điền)

- [x] Logo gốc (raster 2048×2048 nền xám) đã dùng cho header, trang chủ, favicon và JSON-LD.
- [ ] Logo **vector hoặc PNG nền trong suốt** (để dùng trên nền sáng và in ấn, nếu khách có).
- [ ] **Mã màu chính thức** từ file thiết kế (hiện lấy mẫu từ ảnh logo: `#535351` / `#CEC09D`).
- [ ] **Danh mục dự án thật** (hiện là mẫu: Biệt thự, Nhà phố, Khách sạn, Homestay, Nhà hàng, Coffee) kèm mô tả ngắn nếu có.
- [ ] **Bảng đơn giá thật** cho từng danh mục (hạng mục, đơn giá/m², điều kiện áp dụng, VAT). Hiện là giá minh họa; sau khi thay, tắt “Hiện ghi chú Đơn giá minh họa” trong admin.
- [ ] **Danh sách dự án thật**: danh mục, tên, địa điểm, năm, hạng mục, mô tả 80–200 từ, ảnh và **quyền sử dụng ảnh**.
- [ ] **Mô tả dịch vụ thật** cho 4 mảng (kiến trúc, nội thất, cảnh quan, thi công) và **khu vực nhận công trình**. Trang Dịch vụ đang ở trạng thái nháp.
- [ ] **Sửa địa chỉ trên fanpage** cho đúng chuỗi chuẩn (fanpage đang ghi “Hội An, Thành Phố Đà Nẵng 51000”).
- [ ] Sau khi tạo Google Business Profile: link địa điểm (`googleMapsPlaceUrl`), toạ độ (`geo`), danh mục chính, giờ làm việc (`openingHours`), link xin đánh giá (`gbpReviewUrl`), URL bản đồ nhúng (`mapEmbedUrl`) → điền trong admin “Thương hiệu & Liên hệ” (hoặc `content/site.json`). Trường trống thì không xuất hiện trong JSON-LD và nút “Chỉ đường” bị ẩn.
- [ ] Mã đo lường nếu dùng: `gtmId` hoặc `ga4Id`, `googleSiteVerification`. Trống thì không tải script nào.

## 3. Quy trình đưa nội dung từ admin vào bản build

Bản build chỉ đọc `content/` trong repo; IndexedDB của admin không lên được website.

1. Admin (`/admin`) → Tổng quan → **Xuất gói nội dung cho website** (ZIP: JSON đã kiểm tra + ảnh đổi tên theo slug/nhóm/thứ tự).
2. `npm run content:import -- <file.zip>` → ghi `content/`, chép ảnh gốc vào `content/images-src/`, tạo WebP 480/960/1600.
3. `npm run build` → `npm run preview` → `npm run check:seo`.
4. Commit và deploy thư mục `dist/`.

Gói này khác “Sao lưu JSON” (chỉ tham chiếu ảnh, không phải sao lưu đầy đủ).

## 4. Đã dựng sẵn

- Prerender mọi trang công khai; title / description / canonical / hreflang vi-en-x-default / Open Graph 1200×630 / Twitter card / `og:locale`.
- JSON-LD `HomeAndConstructionBusiness` + `ProfessionalService` (NAP lấy từ cùng cấu hình với footer và /lien-he); trang dự án có `BreadcrumbList` + `CreativeWork` (dự án minh họa **không** có `creator`).
- `sitemap.xml` (trang danh mục có dự án công khai + dự án công khai, có `lastmod` và `xhtml:link hreflang`), `robots.txt` có dòng `Sitemap:`.
- `_headers`: `/admin*` → `X-Robots-Tag: noindex, nofollow` + `Cache-Control: no-store`; asset có hash cache 1 năm; HTML `must-revalidate`. Khi `allowIndexing: false` có thêm `X-Robots-Tag: noindex` cho toàn site.
- `_redirects`: rewrite admin + 301 cho slug cũ. `404.html` song ngữ, trả mã 404 thật.
- Sự kiện `dataLayer`: `call_click`, `email_click`, `facebook_click`, `directions_click`, `project_view` (kèm slug), `language_switch` — kèm vị trí, không dữ liệu cá nhân.

## 5. Việc làm ngay sau khi có tên miền (không tự làm)

1. Kiểm tra `SITE_URL=https://compaarchitecture-hoian.vn` trong biến môi trường build. **Chỉ bật `allowIndexing`** (admin → Thương hiệu & Liên hệ, hoặc `content/site.json`) khi đã thay toàn bộ dự án minh họa bằng dự án thật và khách duyệt. Build, deploy lên Cloudflare Pages (build command `npm run build`, output `dist`). Cấu hình chuyển hướng **www → không www** ở Cloudflare (Bulk Redirects / Redirect Rules — `_redirects` không xử lý theo tên miền).
   - Lưu ý: Cloudflare Pages tự chuyển `/du-an` → `/du-an/` bằng mã 308 (tương đương 301 về SEO).
2. Xác minh **Google Search Console** và **Bing Webmaster Tools**, gửi `https://compaarchitecture-hoian.vn/sitemap.xml`.
3. Tạo **Google Business Profile** với đúng tên “COMPA Architecture Hội An”, địa chỉ chuẩn ở mục 1 và số 077 355 8945. Link website trên GBP dùng UTM:
   `https://compaarchitecture-hoian.vn/?utm_source=google&utm_medium=organic&utm_campaign=gbp`
   Sửa địa chỉ fanpage cho khớp. Sau khi hồ sơ được xác minh, điền link địa điểm / toạ độ / giờ làm việc vào cấu hình và build lại để JSON-LD và nút “Chỉ đường” hoạt động. Mỗi dịch vụ khai báo trên GBP trỏ về đúng trang `/dich-vu/<slug>/` (sau khi công khai trang dịch vụ).
4. Dán link trang chủ và một trang dự án vào **Facebook Sharing Debugger** và **Zalo** để kiểm tra ảnh/tiêu đề xem trước.
5. Chạy **PageSpeed Insights** trên URL thật, lưu số đo làm mốc cho báo cáo tháng (số Lighthouse trong README là số đo lab trên máy local).
