# k-tft

Thống kê tỉ lệ thắng và chart leo rank theo đội hình TFT của một người chơi trong mùa hiện tại, dữ liệu lấy từ MetaTFT.

## Sử dụng trực tuyến (GitHub Pages)

Trang web đã được deploy trực tiếp tại:
👉 **https://khuongnmdev.github.io/k-tft/**

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
- URL lưu cả người chơi, mùa, bộ lọc và đội đang chọn (`?r=vn&id=Tên#Tag&s=TFTSet17&team=...`), nên gửi link là người khác mở ra thấy đúng view đó.

## Ghi chú

- Dùng API không chính thức của MetaTFT, có thể thay đổi bất cứ lúc nào.
- LP mỗi trận được tính từ các mốc rank MetaTFT ghi lại; trận nào thiếu mốc thì không có LP và không được tính vào LP ròng.
- Comp meta: mùa hiện tại dùng bản của patch đang chạy, Set 17 và Set 16 dùng bản cuối mùa; trận ở patch khác có thể rơi vào nhóm "(ngoài meta)". Từ Set 15 trở về trước MetaTFT không còn comp meta nên app nhóm theo Tộc/Hệ chính + Carry.
- Mùa cũ: MetaTFT có thể chỉ còn lưu một phần số trận (vd. Set 9.5 còn 43/110 trận), app ghi rõ con số này ở thẻ người chơi.
