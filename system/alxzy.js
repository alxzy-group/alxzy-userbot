await import("../config.js?v=" + Date.now())
import { Telegraf, Markup } from 'telegraf';
import os from 'os';
import path from "path";
import fs from "fs";
const BOT_TOKEN = global.botfather.token;
if (BOT_TOKEN === '') {
  console.error("Kesalahan: Harap ganti BOT_TOKEN dengan token bot Anda!");
  process.exit(1);
}
export default async function () {
const bot = new Telegraf(BOT_TOKEN);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const menuText = {
  tools: `
<b>• ━━━[ Tools ]━━━ •</b>
<code>/cvaudio</code>
<code>/info</code> — Info pengguna singkat
<code>/user</code> — Info lengkap pengguna
`,
  downloader: `
<b>• ━━━[ Downloader ]━━━ •</b>
<code>/tiktok</code> — Download video tiktok
`,
  game: `
<b>• ━━━[ Game ]━━━ •</b>
<code>/tictactoe</code> — Main TicTacToe
`,
  owner: `
<b>• ━━━[ Owner ]━━━ •</b>
<code>/addseller</code>
<code>/blacklist</code>
<code>/broadcast</code>
<code>/cpanel</code>
`
};
function getSystemStats() {
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const usedMem = (totalMem - freeMem).toFixed(2);
  const percent = ((usedMem / totalMem) * 100).toFixed(0);
  const cpus = os.cpus() || [];
  const cpuModel = cpus.length ? cpus[0].model : "Tidak diketahui";
  const uptime = Math.floor(process.uptime() / 60);
  const ramBar =
    "▓".repeat(Math.round(percent / 10)) +
    "░".repeat(10 - Math.round(percent / 10));

  return `
<blockquote>
<b><u>Informasi Sistem:</u></b>
<b>CPU:</b> ${cpuModel}
<b>RAM:</b> ${usedMem}/${totalMem} GB
<b>Penggunaan:</b> <code>${ramBar} ${percent}%</code>
<b>Uptime:</b> ${uptime} menit
</blockquote>
`;
}
function getMainMenu() {
  const stats = getSystemStats();
  const text = `
<b>╔══ 𝗨𝗕𝗢T 𝗔𝗟XZ𝗬 ══╗</b>

<i>Jangan pernah menyerah apapun yang terjadi karna mungkin akan datang saatnya untuk bangkit</i>

${stats}

<blockquote><b>Pilih kategori di bawah ini:</b></blockquote>

<blockquote><b>This bot Created by Alxzy t.me/alxzy_beginner</b></blockquote>
`;

  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🛠️ Tools', 'menu_tools'), Markup.button.callback('📥 Downloader', 'menu_downloader')],
    [Markup.button.callback('🎮 Game', 'menu_game'), Markup.button.callback('👑 Owner', 'menu_owner')],
  ]);

  return { text, buttons };
}

function getCategoryMenu(title, textContent) {
  const text = `
<b>${title}</b>
<blockquote>
${textContent}
</blockquote>
<blockquote><b>This bot Created by Alxzy t.me/alxzy_beginner</b></blockquote>
`;

  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Kembali ke Menu Utama', 'main_menu')]
  ]);

  return { text, buttons };
}

bot.command(['start', 'menu'], async (ctx) => {
  const photoPath = path.resolve("image.png");
  if (!fs.existsSync(photoPath)) {
    return ctx.reply("Gagal memuat menu: file image.png tidak ditemukan.");
  }

  let menuMsg;
  try {
    menuMsg = await ctx.replyWithPhoto(
      { source: photoPath },
      {
        caption: "<b><i>Memuat menu... 0%</i></b>",
        parse_mode: 'HTML'
      }
    );

    for (let i = 1; i <= 10; i++) {
      await sleep(2000);
      const percent = i * 10;
      const filled = "█".repeat(i);
      const empty = "░".repeat(10 - i);
      const progressBar = `[${filled}${empty}]`;
      const loadingCaption = `<b><i>Memuat menu...</i></b>\n${progressBar} ${percent}%`;

      try {
        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          menuMsg.message_id,
          undefined,
          loadingCaption,
          { parse_mode: 'HTML' }
        );
      } catch (err) {
        if (!err.message.includes("message is not modified")) {
          console.warn(err.message);
        }
      }
    }

    const { text, buttons } = getMainMenu();
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      menuMsg.message_id,
      undefined,
      text,
      { parse_mode: 'HTML', reply_markup: buttons.reply_markup }
    );

  } catch (err) {
    console.error("Gagal mengirim menu:", err);
    await ctx.reply(`<b>❌ Gagal memuat menu.</b>\n\n<pre>${err.message}</pre>`, {
      parse_mode: "HTML",
    });
    if (menuMsg) {
      try {
        await ctx.deleteMessage(menuMsg.message_id);
      } catch { }
    }
  }
});

bot.action('main_menu', async (ctx) => {
  const { text, buttons } = getMainMenu();
  try {
    await ctx.editMessageCaption(text, {
      parse_mode: 'HTML',
      reply_markup: buttons.reply_markup
    });
  } catch (err) { console.error(err); }
  await ctx.answerCbQuery();
});

bot.action('menu_tools', async (ctx) => {
  const { text, buttons } = getCategoryMenu('🛠️ Tools', menuText.tools);
  try {
    await ctx.editMessageCaption(text, {
      parse_mode: 'HTML',
      reply_markup: buttons.reply_markup
    });
  } catch (err) { console.error(err); }
  await ctx.answerCbQuery('Menampilkan menu Tools');
});

bot.action('menu_downloader', async (ctx) => {
  const { text, buttons } = getCategoryMenu('📥 Downloader', menuText.downloader);
  try {
    await ctx.editMessageCaption(text, {
      parse_mode: 'HTML',
      reply_markup: buttons.reply_markup
    });
  } catch (err) { console.error(err); }
  await ctx.answerCbQuery('Menampilkan menu Downloader');
});

bot.action('menu_game', async (ctx) => {
  const { text, buttons } = getCategoryMenu('🎮 Game', menuText.game);
  try {
    await ctx.editMessageCaption(text, {
      parse_mode: 'HTML',
      reply_markup: buttons.reply_markup
    });
  } catch (err) { console.error(err); }
  await ctx.answerCbQuery('Menampilkan menu Game');
});

bot.action('menu_owner', async (ctx) => {
  const { text, buttons } = getCategoryMenu('👑 Owner', menuText.owner);
  try {
    await ctx.editMessageCaption(text, {
      parse_mode: 'HTML',
      reply_markup: buttons.reply_markup
    });
  } catch (err) { console.error(err); }
  await ctx.answerCbQuery('Menampilkan menu Owner');
});

bot.on('inline_query', (ctx) => {
  const { text, buttons } = getMainMenu();
  const results = [
    {
      type: 'article',
      id: 'main_menu_1',
      title: 'Tampilkan Menu Utama',
      description: 'Menampilkan menu interaktif.',
      input_message_content: {
        message_text: text,
        parse_mode: 'HTML',
      },
      reply_markup: buttons.reply_markup
    }
  ];
  ctx.answerInlineQuery(results, { cache_time: 0 });
});

bot.launch();
console.log('telegraf running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
}