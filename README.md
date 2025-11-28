# Alxzy Userbot

**Alxzy Userbot** adalah simple Telegram **userbot** berbasis **Node.js** menggunakan **GramJS**. Dibuat sebagai base ringan, mudah dikembangkan, dan fleksibel.

> ⚠️ **Peringatan:**
> Proyek ini **tidak untuk diperjualbelikan**. Dilarang keras menjual ulang, membuat versi premium, atau memperjualbelikan dalam bentuk apapun. Hormati developer & open‑source!

---

## ✨ Fitur Utama

* 🚀 Simple & lightweight base
* ⚡ Menggunakan GramJS
* 🔧 Mudah dikembangkan (modular)
* 📁 File & struktur rapih
* 📡 Handler pesan simple & efektif

---

## 📁 Struktur Folder

Struktur nya rapi dan telah menggunakan format es6/esm
```
root/
├── config.js
├── index.js
├── pesan.js
├── image.png
├── package.json
├── database/
│   └── blacklist.json
├── lib/
│   ├── converter.js
│   ├── database.js
│   ├── game.js
│   ├── pterodactyl.js
│   └── scraper.js
└── system/
    └── alxzy.js
```

---

## ⚙️ Konfigurasi (config.js)

Tidak menggunakan `.env`.
Semua API disimpan dalam **config.js** dengan format:

```js
global.api_id: "api id dari my.telegram.org"
global.api_hash = "api hash dari my.telegram.org"
```
silahkan atur semua
---

## 📦 Instalasi

### 1. Clone repo

```bash
git clone https://github.com/alxzy-group/alxzy-userbot.git
cd alxzy-userbot
```

### 2. Install dependencies

```bash
npm install
```

---

## ▶️ Menjalankan Bot

```bash
npm start
```

---

## 🛠 Membuat Command / Fitur Baru

Contoh menambah fitur di `pesan.js` menggunakan if:

```js
if (text === ".ping") {
  return event.message.reply("Pong!");
}
```
---

## 💡 Contoh Penggunaan Command di `pesan.js`

Contoh penambahan fitur di pesan.js menggunakan switch - case:
```js
  case "hai":
    await event.client.sendMessage(event.chatId, "Hai! Ada yang bisa dibantu?");
    break;

  case "ping":
    await event.client.sendMessage(event.chatId, "Pong!");
    break;
```

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan fork lalu buat pull request.

---

## ⚖️ Lisensi

Proyek ini memakai **MIT License**.

---

## ⭐ Support Project

Kasih **star** di GitHub kalau suka project ini!

**Author:** Alxzy

> "Build, explore, and automate everything."
