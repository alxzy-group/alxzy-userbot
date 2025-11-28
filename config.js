/*Bot created by alxzy
Chat: https://t.me/alxzy_beginner for report issue for this bot
If you like use this bot please give me coffee
*/
global.api_id = Number(1234);
global.api_hash = "";
global.owner = ["idowner"]; 

global.panel = {
  apiKey: "apikey ptla",
  url: "urlpterodactyl",
  nestId: 5,
  eggId: 15,
  locId: 1
};

global.botfather = {
  token: "token",
  username: "alxzy_menu_bot"
};

global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.mess = {
  wait: "⏳ <b>Memproses permintaan kamu...</b>\n✨ <i>Mohon tunggu sebentar</i> ✨",

  error: "❌ <b>Terjadi kesalahan!</b>\n<i>Silakan coba lagi nanti atau laporkan ke <a href='https://t.me/alxzy_beginner'>Developer</a>.</i>",

  done: "✅ <b>Berhasil!</b>\n<i>Perintah kamu sudah dieksekusi tanpa error.</i>",

  ownerOnly: `
🚫 <b>Akses Ditolak!</b>
<blockquote>Perintah ini hanya dapat digunakan oleh <b>Owner</b> bot.</blockquote>
<i>Hubungi <a href="https://t.me/alxzy_beginner">Owner Bot</a> jika kamu memerlukan izin khusus.</i>
`,

  adminOnly: `
⚠️ <b>Fitur Ini Hanya Untuk Admin Grup!</b>
<blockquote>Beberapa perintah memerlukan hak admin untuk menjaga keamanan bot.</blockquote>
`,

  groupOnly: `
👥 <b>Fitur Ini Hanya Bisa Digunakan di Grup!</b>
<blockquote>Tambahkan bot ke grup kamu untuk menggunakan fitur ini.</blockquote>
`,

  privateOnly: `
💬 <b>Fitur Ini Hanya Bisa Digunakan di Chat Pribadi!</b>
<blockquote>Kirim pesan langsung ke bot untuk melanjutkan.</blockquote>
`,

  botAdmin: `
🧩 <b>Bot Belum Jadi Admin!</b>
<blockquote>Berikan bot hak admin agar fitur ini dapat bekerja dengan sempurna.</blockquote>
`,

  premiumOnly: `
💎 <b>Fitur Premium</b>
<blockquote>Fitur ini hanya tersedia untuk <b>Pengguna Premium</b>.</blockquote>
✨ <i>Tingkatkan ke versi premium untuk membuka semua fitur eksklusif!</i>
`,

  info: `
📜 <b>Informasi Bot</b>

<blockquote>
🤖 Nama Bot: <b>ALXZY UBOT</b>
👑 Developer: <a href="https://t.me/alxzy_beginner">Alxzy</a>
💾 Database: JSON Local Storage
⚙️ Framework: Telegram · GramJS
🕒 Status: Online & Siap Melayani
</blockquote>

💖 <i>Dibuat dengan cinta oleh Alxzy Store ✨</i>
`,
};