# k-tft

Thống kê tỉ lệ thắng và chart leo rank theo đội hình TFT của một người chơi trong mùa hiện tại, dữ liệu lấy từ MetaTFT.

## Sử dụng trực tuyến (GitHub Pages)

Trang web đã được deploy trực tiếp tại:
👉 **https://khuongnmdev.github.io/k-tft/**

## Deploy

Trang chạy tĩnh trên GitHub Pages: không có server, trình duyệt gọi thẳng API MetaTFT (các host `api.metatft.com`, `api-hc.metatft.com`, `data.metatft.com`, `matches3.metatft.com` đều cho phép CORS).

- Mỗi lần push lên `main`, workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) đưa thư mục `public/` lên Pages (xem tiến độ ở tab Actions, thường dưới 1 phút).
- Lần đầu cho repo mới: Settings → Pages → Source chọn **GitHub Actions**.
- `shared.js` tự chọn cách gọi API: trên `*.github.io` / `*.pages.dev` / `file://` thì gọi thẳng MetaTFT; ở nơi khác thì gọi `/api/*` của `server.js`, nếu nhận 404 hoặc lỗi mạng thì chuyển sang gọi thẳng. Vì vậy host tĩnh khác (Cloudflare Pages, Netlify…) cũng chạy được: chỉ cần trỏ thư mục output vào `public/`, không có bước build.
- PWA: có `manifest.webmanifest` và icon nên cài được như app (Chrome/Edge: "Cài đặt ứng dụng", iOS: "Thêm vào màn hình chính"). Service worker [`sw.js`](public/sw.js) cache trọn bộ file của một bản build; workflow deploy thay `__BUILD__` trong `sw.js` bằng mã commit, nên mỗi lần deploy trình duyệt cài bản mới (không qua cache 10 phút của Pages), rồi [`pwa.js`](public/pwa.js) tự tải lại trang. Tab đang mở kiểm tra bản mới mỗi 5 phút và mỗi khi quay lại tab. Không cần tăng số `?v=` nữa.
- Chạy local (`npm start` hoặc python) thì `sw.js` chưa được đóng dấu nên không cache gì, sửa code xong tải lại là thấy. Deploy `server.js` lên host Node thì thêm bước thay `__BUILD__` như trong workflow để có tự cập nhật.
- Thử bản tĩnh trên máy (giống Pages, không có `/api`): `python -m http.server 3001 --directory public` rồi mở http://localhost:3001.
- Muốn chạy kèm server (có cache phía server) thì deploy `server.js` lên host Node bất kỳ (Render, Fly.io, Railway…) với lệnh `npm start`; cổng lấy từ biến môi trường `PORT`.

## Chạy cục bộ (Local)

```bash
npm start
```

Mở http://localhost:3000, nhập `Tên#Tag` (hoặc dán link MetaTFT dạng `metatft.com/player/vn/Tên-Tag`). Cần Node 18 trở lên, không phải cài thêm package nào.

## Có gì

- Bảng đội hình đã chơi: số trận, Top 1, Top 4, hạng trung bình, LP ròng, LP/trận, các trận gần đây.
- Chart leo rank: LP sau mỗi trận xếp hạng, tô màu theo đội hình; bấm một đội để làm nổi bật đội đó.
- LP cộng dồn theo đội hình (nếu chỉ chơi đội đó thì lên được bao nhiêu LP), LP ròng theo đội, phân bố thứ hạng.
- Cách nhóm: theo comp meta của MetaTFT (ghép mỗi trận với comp gần giống nhất), hoặc Tộc/Hệ chính + Carry, chỉ Carry, chỉ Tộc/Hệ.
- Chọn mùa: mùa hiện tại và các mùa trước mà người chơi có rank (Set 9 trở đi).
- URL lưu cả người chơi, mùa, bộ lọc và đội đang chọn (`?r=vn&id=Tên#Tag&s=TFTSet17&lang=vi&team=...`), nên gửi link là người khác mở ra thấy đúng view đó. Tên đội được dịch theo ngôn ngữ, nên link có `team` luôn kèm `lang`.
- Meta Tier List (tab cạnh Hồ sơ kỳ thủ, link `?tab=meta`): các comp của patch mới nhất xếp tier S/A/B/C/D theo hạng trung bình, có màu từng tier; mỗi comp có tướng (★★★ cho tướng hay lên 3 sao, 3 item gợi ý dưới tướng gánh), cách lên cấp, hạng TB, Top 4, Top 1, tỉ lệ chọn và thành tích của người đang xem với comp đó. Lọc theo rank (`mr`) và 1/3/7 ngày gần nhất (`md`).
- So sánh 1v1: chọn đối thủ (gợi ý ưu tiên kỳ thủ đã ghim) rồi mở trang `compare.html?r1=vn&id1=Tên#Tag&r2=na&id2=Tên#Tag&s=TFTSet18` với rank, chỉ số đối đầu, chart leo rank chồng nhau, phân bố thứ hạng, đội hình cả hai cùng chơi, đội tủ và tướng/trang bị của mỗi người. Đổi mùa, chế độ hoặc đổi bên ngay trên trang.

## Ghi chú

- Dùng API không chính thức của MetaTFT, có thể thay đổi bất cứ lúc nào.
- LP mỗi trận được tính từ các mốc rank MetaTFT ghi lại; trận nào thiếu mốc thì không có LP và không được tính vào LP ròng.
- Comp meta: mùa hiện tại dùng bản của patch đang chạy, Set 17 và Set 16 dùng bản cuối mùa; trận ở patch khác có thể rơi vào nhóm "(ngoài meta)". Từ Set 15 trở về trước MetaTFT không còn comp meta nên app nhóm theo Tộc/Hệ chính + Carry.
- Mùa cũ: MetaTFT có thể chỉ còn lưu một phần số trận (vd. Set 9.5 còn 43/110 trận), app ghi rõ con số này ở thẻ người chơi.
