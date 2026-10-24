# Asset cho landing page hướng 05 · Hai Tông

Thả file vào `site-05/assets/` đúng tên dưới đây. Không cần sửa code: trang tự hiện file khi có, và hiện ô chờ có ghi chú khi chưa có.

Trang tự chuyển mọi ảnh và video sang đen trắng (grayscale, tăng tương phản nhẹ), nên nguồn màu vẫn dùng được. Điều quan trọng là ánh sáng: một nguồn sáng rõ, nhiều vùng tối, tương phản cao.

Không có logo, tên hãng, tên tàu đọc được. Không ảnh stock bóng bẩy, không HDR, không lens flare.

## A1 · Video lặp khu chuyển tải — ĐÃ CÓ (08/10/2026, Higgsfield, có màu; nguồn ở generated-assets/a1/)

| | |
|---|---|
| File | `a1-anchorage.webm` + `a1-anchorage.mp4` (video), `a1-anchorage.webp` (ảnh chờ, lấy từ khung đầu) |
| Kích thước | 2560 × 1080 (21:9), 24 hoặc 25 fps, 6–8 giây, không âm thanh, mỗi file ≤ 5 MB |
| Vị trí | Dải ngang toàn màn hình sau phần "Vấn đề", nền đen, có parallax nhẹ |
| Bố cục | Chủ thể ở hai phần ba bên phải; mép trên và mép dưới tối dần (trang phủ thêm lớp tối ở hai mép) |

Prompt (tiếng Anh):

```text
Seamless looping aerial video, 8 seconds, 21:9. A large bulk carrier at anchor at an offshore transshipment anchorage in northern Vietnam at blue hour, three open-deck barges moored alongside, deck cranes standing still, the ship's deck lights as small points of light. Locked-off aerial hover at a 35-degree angle, no camera movement. Ambient motion only: slow ripples on dark water, barges rising and settling slightly against the hull. Deep shadows, one soft light source from the horizon, high contrast, cinematic black-and-white mood. Ship and barges in the right two thirds of the frame. No logos, no readable text. First and last frames identical.
```

Negative prompt:

```text
camera movement, zoom, pan, birds, moving boats, wake trails, smoke, crane movement, falling cargo, text, logos, watermark, saturated colors, HDR, lens flare, CGI look
```

## A2 · Chân dung chủ sà lan — ĐÃ THAY (08/10/2026)

Dùng ảnh bắt tay **thứ hai** người dùng gửi, giữ màu (không chuyển đen trắng), tách nền bằng Higgsfield `remove_background`, nguồn 626 × 470 cắt còn 626 × 328 rồi phóng 2× → `a2-handshake.webp` 1252 × 656 có alpha (72 KB). Khung `.o-photo` 16:10 nền studio sáng, `object-fit: contain`, filter chỉ `saturate(.95) contrast(1.04)`. Ảnh bắt tay thứ nhất (đen trắng) và prompt chân dung bên dưới chỉ còn để tham khảo.

| | |
|---|---|
| File | `a2-barge-owner.webp` |
| Kích thước | 1200 × 1500 (4:5) |
| Vị trí | Phần "Cho chủ sà lan", nền studio trắng; thẻ hồ sơ màu đen đè lên góc dưới trái |
| Bố cục | Người ở nửa trên, lệch phải; 40% dưới bên trái để yên |

Prompt (tiếng Anh):

```text
Black-and-white documentary portrait of a Vietnamese barge owner in his late 40s on the deck of an open-deck bulk barge at a river wharf in northern Vietnam, work clothes, calm expression, strong side light from the left, deep shadows, natural skin texture, shallow depth of field, no logos, no readable text, person in the upper right of the frame, quiet lower left area, 4:5 vertical.
```

## Không cần asset

Hero, sơ đồ Vấn đề, thiết bị, mạng lưới đều vẽ bằng code (SVG + CSS 3D).
