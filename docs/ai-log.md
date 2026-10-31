# Nhật ký AI

## 2026-10-31: thử nghiệm Gemini API thất bại, chuyển sang chạy thủ công

### Mục tiêu ban đầu

Gọi Gemini API (gói miễn phí) từ script để trích xuất thông tin từ 25 tin nhắn khách, mỗi case 3 lần, tổng cộng 75 lần gọi, rồi đưa kết quả qua rules engine và chấm theo đáp án.

### Đã làm được

- Gọi `gemini-3.8-flash` qua SDK `@google/genai` với structured output, validate bằng zod.
- Script có delay, retry khi gặp 429/503, và lưu tiến độ để chạy tiếp.

### Vì sao thất bại

| Vấn đề | Quan sát thực tế |
|---|---|
| Quota | API báo `gemini-3.8-flash` free tier giới hạn **20 request/ngày**. 75 lần gọi cần khoảng 4 ngày nếu dùng một model. |
| Latency | **70–184 giây** mỗi lần gọi `gemini-3.8-flash`: khoảng 70 giây với prompt "Say hello", 184 giây với TC01. Chưa xác định được nguyên nhân. |
| Quá tải | Nhiều lỗi 503 `UNAVAILABLE` ("high demand") trên `gemini-3.8-flash` và `gemini-3.1-flash-lite`. |
| Model cũ | `gemini-2.5-flash` và `gemini-2.5-flash-lite` trả 404 "no longer available to new users" với key này. |

`gemini-3-flash-preview` có chạy được, rồi cũng báo hết quota ngày sau khoảng 20 lần gọi. Con số giới hạn của model này không được ghi lại, nên "khoảng 20" là suy ra từ số lần đã gọi.

### Kết quả thật duy nhất còn lại

TC01 trên `gemini-3.8-flash`, chạy một lần: đúng **10/11 field**. `affected_sku` ra `null`, nên rules trả `needs_info` thay vì `eligible`.

Nguyên nhân là prompt v1 lúc đó không có danh mục sản phẩm và dặn model để `affected_sku` là null. Rules cần SKU để tìm sản phẩm trong đơn, nên lỗi này do thiết kế prompt, không do model.

### Sai sót trong quá trình làm

- Quota bị tiêu vào các lần thử model và thử kết nối trước khi biết giới hạn 20 request/ngày.
- Khoảng 19 run thành công trên `gemini-3-flash-preview` bị mất: file kết quả bị xoá để chạy lại cho sạch, trong khi xoá file local không hoàn lại quota, và lần chạy lại hết quota ngay. Các run này chưa từng được phân tích.
- Script từng in "Results saved" dù không ghi file nào. Lỗi này đã được phát hiện khi kiểm tra.

### Quyết định

Bỏ gọi API. AI được chạy thủ công trong cửa sổ chat, với `policy.md` và `orders.json` được upload vào chat. JSON trả về được dán vào trang `/run` để chấm ngay trong trình duyệt, nên team không biết code cũng tự chạy được. Vẫn có thể chấm bằng `npm run eval:manual` nếu muốn lưu kết quả vào repo.

Lý do:

- Eval không còn phụ thuộc quota và độ ổn định của free tier.
- Web app không cần API key, nên không có rủi ro lộ key.
- Mỗi lần chạy xử lý đủ 25 case trong một tin nhắn.

Đánh đổi:

- Mỗi run phải thao tác tay, và kết quả có thể phụ thuộc vào công cụ và model đang chọn.
- Đáp án nằm trong code gửi xuống trình duyệt để `/run` chấm được mà không cần server. Người cố tình tìm có thể đọc được, điều này chấp nhận được vì dữ liệu là giả.
- AI có thể dùng thông tin giữa các case trong cùng một lần chạy, vì 25 case được gửi chung. Đây là khác biệt so với gọi API từng case.
- Sản phẩm chưa có bước trích xuất tự động: kết quả là đánh giá prompt, không phải một pipeline chạy thật.

Code Gemini chưa từng được commit và đã bị gỡ khỏi repo.
