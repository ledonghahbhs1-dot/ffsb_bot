# Telegram Account Generator Bot

Bot Telegram tạo tài khoản ngẫu nhiên và mã hóa base64.

## Hướng dẫn deploy lên Railway

### Bước 1: Tạo tài khoản Railway
- Vào [railway.app](https://railway.app) và đăng ký tài khoản

### Bước 2: Tạo project mới
1. Nhấn **New Project**
2. Chọn **Deploy from GitHub repo** (hoặc **Empty Project**)
3. Nếu dùng GitHub: push thư mục `telegram-bot` lên GitHub rồi chọn repo đó

### Bước 3: Nếu không dùng GitHub (dùng Railway CLI)
```bash
npm install -g @railway/cli
railway login
cd telegram-bot
railway init
railway up
```

### Bước 4: Thêm biến môi trường
Trong Railway Dashboard → project của bạn → **Variables**:
```
TELEGRAM_BOT_TOKEN = <token bot của bạn>
```

### Bước 5: Deploy
Railway sẽ tự động deploy. Bot sẽ chạy 24/7.

## Tính năng

- `/start` - Khởi động bot
- `/tao` - Tạo tài khoản mới (hỏi 3 bước: phone, STK, ngân hàng)
- `/help` - Xem hướng dẫn

## Format output

Bot tạo JSON theo format:
```json
{
  "username": "abc123xyz",
  "pw": "Pass@1234!",
  "wd": "030307",
  "name": "LE DONG HA",
  "phone": "0901234567",
  "stk": "1234567890",
  "bankname": "Vietcombank"
}
```
Sau đó encode Base64 và gửi cho người dùng dạng dễ copy.
