const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set!');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Dữ liệu cố định
const FIXED_WD = '030307';
const FIXED_NAME = 'LE DONG HA';

// Danh sách ngân hàng phổ biến
const BANKS = [
  'Nam A Bank',
  'Vietcombank',
  'Techcombank',
  'MB Bank',
  'VPBank',
  'BIDV',
  'Agribank',
  'ACB',
  'TPBank',
  'VietinBank',
  'SHB',
  'HDBank',
  'OCB',
  'SeABank',
  'Sacombank',
];

// Trạng thái người dùng
const userState = {};

// ============================================================
// HÀM TẠO USERNAME VÀ PASSWORD NGẪU NHIÊN
// ============================================================

function generateUsername() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const all = letters + digits;

  // Độ dài ngẫu nhiên 8-16
  const length = Math.floor(Math.random() * 9) + 8;

  // Đảm bảo có ít nhất 1 chữ cái và 1 số
  let result = '';
  result += letters[Math.floor(Math.random() * letters.length)];
  result += digits[Math.floor(Math.random() * digits.length)];

  for (let i = 2; i < length; i++) {
    result += all[Math.floor(Math.random() * all.length)];
  }

  // Xáo trộn
  return result.split('').sort(() => Math.random() - 0.5).join('');
}

function generatePassword() {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*_-+=?';

  // Độ dài ngẫu nhiên 10-16
  const length = Math.floor(Math.random() * 7) + 10;

  // Đảm bảo có ít nhất 2 loại trong 3 loại: chữ/số/ký hiệu
  const groups = [lower + upper, digits, symbols];

  // Chọn ít nhất 2 nhóm để lấy ký tự
  const selectedGroups = [];
  const shuffledGroups = [...groups].sort(() => Math.random() - 0.5);
  selectedGroups.push(shuffledGroups[0]);
  selectedGroups.push(shuffledGroups[1]);
  // Có thể thêm nhóm thứ 3
  if (Math.random() > 0.4) selectedGroups.push(shuffledGroups[2]);

  const allChars = selectedGroups.join('');

  let result = '';
  // Đảm bảo mỗi nhóm được chọn có ít nhất 1 ký tự
  for (const group of selectedGroups) {
    result += group[Math.floor(Math.random() * group.length)];
  }

  for (let i = result.length; i < length; i++) {
    result += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Xáo trộn
  return result.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================================
// ENCODE BASE64 (theo chuẩn btoa / Buffer)
// ============================================================
function encodeBase64(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

// ============================================================
// XÂY DỰNG JSON VÀ GỬI KẾT QUẢ
// ============================================================
function buildAndSendResult(bot, chatId, phone, stk, bankname) {
  const username = generateUsername();
  const pw = generatePassword();

  const obj = {
    username,
    pw,
    wd: FIXED_WD,
    name: FIXED_NAME,
    phone,
    stk,
    bankname,
  };

  const jsonStr = JSON.stringify(obj);
  const encoded = encodeBase64(jsonStr);

  const message =
    `✅ *Tạo tài khoản thành công!*\n\n` +
    `👤 Username: \`${username}\`\n` +
    `🔑 Password: \`${pw}\`\n` +
    `📱 Phone: \`${phone}\`\n` +
    `🏦 Ngân hàng: ${bankname}\n` +
    `💳 STK: \`${stk}\`\n\n` +
    `📋 *JSON gốc:*\n\`\`\`\n${jsonStr}\n\`\`\`\n\n` +
    `🔐 *Base64 (bấm để copy):*\n\`${encoded}\``;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// ============================================================
// XỬ LÝ LỆNH /start
// ============================================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'idle' };

  bot.sendMessage(
    chatId,
    `👋 Xin chào! Tôi là bot tạo tài khoản ngẫu nhiên.\n\nGõ /tao để bắt đầu tạo tài khoản mới.`,
    {
      reply_markup: {
        keyboard: [[{ text: '/tao' }]],
        resize_keyboard: true,
      },
    }
  );
});

// ============================================================
// XỬ LÝ LỆNH /tao
// ============================================================
bot.onText(/\/tao/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'wait_phone' };

  bot.sendMessage(
    chatId,
    `📱 *Bước 1/3:* Nhập số điện thoại của bạn:`,
    { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }
  );
});

// ============================================================
// XỬ LÝ TIN NHẮN THEO TỪNG BƯỚC
// ============================================================
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Bỏ qua các lệnh
  if (text.startsWith('/')) return;

  const state = userState[chatId];
  if (!state) return;

  if (state.step === 'wait_phone') {
    // Validate số điện thoại đơn giản
    const phone = text.trim().replace(/\s+/g, '');
    if (!/^\d{9,12}$/.test(phone)) {
      bot.sendMessage(chatId, `❌ Số điện thoại không hợp lệ. Vui lòng nhập lại (chỉ số, 9-12 chữ số):`);
      return;
    }

    userState[chatId] = { step: 'wait_stk', phone };
    bot.sendMessage(
      chatId,
      `💳 *Bước 2/3:* Nhập số tài khoản ngân hàng:`,
      { parse_mode: 'Markdown' }
    );
  } else if (state.step === 'wait_stk') {
    const stk = text.trim().replace(/\s+/g, '');
    if (!/^\d{6,20}$/.test(stk)) {
      bot.sendMessage(chatId, `❌ Số tài khoản không hợp lệ. Vui lòng nhập lại (chỉ số, 6-20 chữ số):`);
      return;
    }

    userState[chatId] = { step: 'wait_bank', phone: state.phone, stk };

    // Tạo keyboard chọn ngân hàng
    const bankKeyboard = [];
    for (let i = 0; i < BANKS.length; i += 2) {
      const row = [{ text: BANKS[i] }];
      if (BANKS[i + 1]) row.push({ text: BANKS[i + 1] });
      bankKeyboard.push(row);
    }

    bot.sendMessage(
      chatId,
      `🏦 *Bước 3/3:* Chọn hoặc nhập tên ngân hàng:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: bankKeyboard,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  } else if (state.step === 'wait_bank') {
    const bankname = text.trim();
    if (!bankname || bankname.length < 2) {
      bot.sendMessage(chatId, `❌ Tên ngân hàng không hợp lệ. Vui lòng chọn hoặc nhập lại:`);
      return;
    }

    userState[chatId] = { step: 'idle' };

    buildAndSendResult(bot, chatId, state.phone, state.stk, bankname);

    // Hỏi có muốn tạo thêm không
    setTimeout(() => {
      bot.sendMessage(
        chatId,
        `🔄 Bạn có muốn tạo tài khoản khác không?`,
        {
          reply_markup: {
            keyboard: [[{ text: '/tao' }], [{ text: '/start' }]],
            resize_keyboard: true,
          },
        }
      );
    }, 1000);
  }
});

// ============================================================
// XỬ LÝ LỆNH /help
// ============================================================
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `📖 *Hướng dẫn sử dụng:*\n\n` +
    `/start - Khởi động bot\n` +
    `/tao - Tạo tài khoản mới\n` +
    `/help - Xem hướng dẫn\n\n` +
    `Bot sẽ:\n` +
    `1. Hỏi số điện thoại\n` +
    `2. Hỏi số tài khoản ngân hàng\n` +
    `3. Hỏi tên ngân hàng (có nút bấm nhanh)\n` +
    `4. Tự động tạo username & password ngẫu nhiên, khó đoán\n` +
    `5. Tạo JSON và mã hóa Base64 để bạn copy`,
    { parse_mode: 'Markdown' }
  );
});

console.log('🤖 Bot đang chạy...');
