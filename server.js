require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// ── DB (JSON-файл, не требует нативных модулей) ──────────────────────────
const DB_PATH = path.join(__dirname, 'orders.json');

function readOrders() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveOrder(order) {
  const orders = readOrders();
  orders.push(order);
  fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2));
}

// ── Telegram ─────────────────────────────────────────────────────────────
async function sendToTelegram(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы в .env');
    return;
  }

  const text =
    `📋 *Новая заявка с сайта BioDezKZ*\n\n` +
    `👤 *Имя:* ${order.name}\n` +
    `🏢 *Компания:* ${order.company}\n` +
    `📞 *Телефон:* ${order.phone}\n` +
    `✉️ *Email:* ${order.email || 'не указан'}\n` +
    `💬 *Комментарий:* ${order.message || 'не указан'}\n\n` +
    `🕐 ${new Date(order.createdAt).toLocaleString('ru-KZ', { timeZone: 'Asia/Almaty' })}`;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });

  const data = await res.json();
  if (!data.ok) console.error('Telegram error:', data.description);
  else console.log('✅ Уведомление отправлено в Telegram');
}

// ── POST /api/order ───────────────────────────────────────────────────────
app.post('/api/order', async (req, res) => {
  const { name, company, phone, email, message } = req.body;

  if (!name || !company || !phone) {
    return res.status(400).json({ error: 'Заполните обязательные поля: имя, компания, телефон' });
  }

  const order = {
    id: Date.now(),
    name: name.trim(),
    company: company.trim(),
    phone: phone.trim(),
    email: email?.trim() || '',
    message: message?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  saveOrder(order);
  console.log(`📥 Новая заявка #${order.id} от ${order.name} (${order.company})`);

  // Отправляем в Telegram (не блокируем ответ)
  sendToTelegram(order).catch(err => console.error('Telegram send failed:', err));

  res.json({ ok: true, message: 'Заявка принята! Мы свяжемся с вами в течение 1 часа.' });
});

// ── GET /api/orders ───────────────────────────────────────────────────────
// Простая защита: ?secret=YOUR_SECRET из .env
app.get('/api/orders', (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.query.secret !== secret) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  const orders = readOrders();
  res.json({ total: orders.length, orders });
});

// ── Запуск ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BioDezKZ backend запущен на порту ${PORT}`);
});
