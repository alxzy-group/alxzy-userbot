await import("./config.js?v=" + Date.now());
global.gameTimers = new Map();
global.db = {};

import axios from "axios";
import os from "os";
import process from "process";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import fs from "fs";
import util from "util";
import lodash from "lodash";
import { Low, JSONFile } from "lowdb";
import { CustomFile } from "telegram/client/uploads.js";
import AdmZip from 'adm-zip';
import { Api } from 'telegram/tl/index.js';
import { renderBoard, checkWinner, resetInactivityTimer, clearInactivityTimer, handleGameMove } from "./lib/game.js";
import Pterodactyl from "./lib/pterodactyl.js";
import scraper from "./lib/scraper.js";

const blpath = "./database/blacklist.json";
const resellerPath = "./database/reseller.json";
global.db = new Low(new JSONFile("database/database.json"));
global.DATABASE = global.db;

const getBlacklist = () => {
    if (!fs.existsSync(blpath)) return [];
    try { return JSON.parse(fs.readFileSync(blpath, "utf-8")).map(String); } catch { return []; }
};

global.loadDatabase = async () => {
    if (global.db.READ) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!global.db.READ) {
                    clearInterval(interval);
                    resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
                }
            }, 1000);
        });
    }
    if (global.db.data !== null) return;
    global.db.READ = true;
    await global.db.read();
    global.db.READ = false;
    global.db.data = { settings: {}, users: {}, game: {}, ...(global.db.data || {}) };
    global.db.chain = lodash.chain(global.db.data);
};

export async function pesan(event) {
    try {
        await global.loadDatabase();
        const text = event.message?.message?.trim();
        if (!text) return;

        const parts = text.startsWith("/") ? text.slice(1).split(" ").filter(Boolean) : [];
        const cmd = parts[0] || "";
        const args = parts.slice(1);
        const command = cmd.toLowerCase();
        
        const sender = await event.message.getSender();
        const replyMessage = event.message.replyToMsgId ? await event.message.getReplyMessage() : null;

        let user_q = null;
        if (replyMessage) {
            const sq = await replyMessage.getSender();
            user_q = { id: Number(sq?.id) || 0, username: sq?.username || "", firstName: sq?.firstName || "", lastName: sq?.lastName || "", isBot: sq?.bot || false };
        }

        const user = {
            id: sender?.id ? Number(sender.id) : Number(event.chatId),
            username: sender?.username || "Unknown",
            firstName: sender?.firstName || sender?.title || "User",
            lastName: sender?.lastName || "",
            isBot: sender?.bot || false
        };

        await (await import("./lib/database.js?v=" + Date.now())).default(user);
        
        let _reseller = fs.existsSync(resellerPath) ? JSON.parse(fs.readFileSync(resellerPath, "utf-8")) : [];
        const hasAccess = global.owner.map(String).includes(String(user.id));
        const isSeller = _reseller.map(String).includes(String(user.id));
        
        const send = async (msg, opts = {}) => event.client.sendMessage(event.chatId, { message: msg, ...opts });
        const reply = async (msg, opts = {}, replyTo = event.message.id) => event.client.sendMessage(event.chatId, { message: msg, replyTo, ...opts });
if ([String(event.chatId), `-100${event.chatId}`, `-${event.chatId}`].some(id => getBlacklist().includes(id))) return;
        switch (command) {
            case "start":
            case "menu": {
                const botName = global.botfather.username;
                try {
                    await event.message.delete();
                    const results = await event.client.invoke(new Api.messages.GetInlineBotResults({ bot: botName, peer: event.chatId, query: '', offset: '' }));
                    if (!results?.results?.length) throw new Error("Bot inline tidak merespon.");
                    await event.client.invoke(new Api.messages.SendInlineBotResult({ peer: event.chatId, queryId: results.queryId, id: results.results[0].id, clearDraft: true }));
                } catch (err) {
                    await send(`<b>❌ Gagal memuat menu.</b>\n<pre>${err.message}</pre>`, { parseMode: "html" });
                }
                break;
            }
            case "addseller": {
                if (!hasAccess) return await send(mess.ownerOnly, { parseMode: "html" });
                const uid = args[0];
                if (!uid) return await send("Contoh: /addseller <id>");
                if (_reseller.includes(uid)) return await send(`ID ${uid} sudah reseller.`);
                _reseller.push(uid);
                try {
                    fs.writeFileSync(resellerPath, JSON.stringify(_reseller, null, 2));
                    await send(`Berhasil menambahkan reseller ${uid}`);
                } catch (e) { await send(`Gagal simpan: ${e.message}`); }
                break;
            }
            case "cpanel": {
                if (!(isSeller || hasAccess)) return await send("Akses ditolak.");
                const panel = new Pterodactyl(global.panel.apiKey, global.panel.url, global.panel.nestId, global.panel.eggId, global.panel.locId);
                const sub = args[0]?.toLowerCase(), name = args[1], target = args[2] || event.chatId;
                const RAM_OPS = { "1gb":{ram:1024,disk:10240,cpu:50}, "2gb":{ram:2048,disk:20480,cpu:60}, "3gb":{ram:3072,disk:30720,cpu:70}, "4gb":{ram:4096,disk:40960,cpu:80}, "5gb":{ram:5120,disk:51200,cpu:90}, "unli":{ram:0,disk:0,cpu:0} };
                
                if (!sub) return await send("Format: /cpanel <ram/admin> <nama> [id]");
                if (!name) return await send("Nama diperlukan.");
                if (!panel) return await send("Panel error.");
                
                const pwd = generatePassword(12), email = `${name.toLowerCase().replace(/[^a-z0-9]/g,'')}@bot.com`;
                if (sub === 'admin') {
                    await send(`⏳ Membuat admin ${name}...`);
                    const res = await panel.createAdmin({ username: name.replace(/[^a-z0-9]/g,''), email, firstName: name, lastName: 'Admin', password: pwd });
                    if (res.message) return await send(`❌ Gagal: ${res.message}`);
                    await event.client.sendMessage(target, { message: `✅ Admin Created\nUser: \`${res.username}\`\nPass: \`${pwd}\`\nUrl: ${panel.panelUrl}`, parseMode: 'markdown' });
                    if (target !== event.chatId) await send("✅ Terkirim.");
                } else if (RAM_OPS[sub]) {
                    const sp = RAM_OPS[sub];
                    await send(`⏳ Membuat server ${sub}...`);
                    const res = await panel.createServer({ name, password: pwd, ram: sp.ram, disk: sp.disk, cpuPercent: sp.cpu, admin: false });
                    if (res.message) return await send(`❌ Gagal: ${res.message}`);
                    await event.client.sendMessage(target, { message: `✅ Server Created\nUser: \`${res.username}\`\nPass: \`${pwd}\`\nID: \`${res.serverIdentifier}\`\nUrl: ${res.panelUrl}`, parseMode: 'markdown' });
                    if (target !== event.chatId) await send("✅ Terkirim.");
                } else await send("Opsi tidak valid.");
                break;
            }
            case "broadcast":
            case "bc": {
                if (!hasAccess) return await reply(mess.ownerOnly, { parseMode: "html" });
                const replied = await event.message.getReplyMessage();
                const txt = args.join(" ");
                if (!replied && !txt) return await reply("Reply pesan atau ketik teks.");
                
                const blSet = new Set(getBlacklist());
                const msg = await send("<i>Mengambil daftar chat...</i>", { parseMode: "html" });
                const chats = (await event.client.getDialogs({})).map(d => d.entity).filter(e => (e.className === "Channel" && e.megagroup) || (e.className === "Chat" && e.participantsCount > 0));
                
                if (!chats.length) return await msg.edit({ text: "Tidak ada grup.", parseMode: "html" });
                await msg.edit({ text: `<i>Broadcast ke ${chats.length} chat...</i>`, parseMode: "html" });
                
                let s = 0, f = 0, b = 0;
                for (const c of chats) {
                    const rawId = c.id.toString();
                    const checkIds = [rawId, `-100${rawId}`, `-${rawId}`]; 
                    
                    if (checkIds.some(id => blSet.has(id))) { 
                        b++; 
                        continue; 
                    }
                    
                    try {
                        if (replied) await event.client.forwardMessages(c.id, { messages: replied.id, fromPeer: event.chatId });
                        else await event.client.sendMessage(c.id, { message: txt, parseMode: "html" });
                        s++;
                        await new Promise(r => setTimeout(r, 2000));
                    } catch { f++; }
                }
                await msg.edit({ text: `✅ <b>Selesai</b>\nSent: ${s}\nFail: ${f}\nBL: ${b}`, parseMode: "html" });
                break;
            }
            case "tiktok":
            case "tt": {
                if ((db.data.users?.[user.id]?.limit || 0) < 1) return await reply("Limit habis.");
                if (!args[0]) return await reply("Mana linknya?");
                try {
                    await reply("Processing...");
                    const d = await scraper.tiktok(args[0]);
                    if (!d || d.no_watermark.startsWith("Gagal")) return await reply("Gagal fetch.");
                    await event.client.sendFile(event.chatId, { file: d.cover, caption: d.title });
                    await event.client.sendFile(event.chatId, { file: d.no_watermark, caption: "No WM" });
                    db.data.users[user.id].limit -= 1;
                } catch (e) { await reply("Error internal."); }
                break;
            }
            case "cvaudio": {
                try {
                    fs.mkdirSync('./tmp', { recursive: true });
                    const r = await event.message.getReplyMessage();
                    const [opt = "", val = ""] = args;
                    const num = parseFloat(val);
                    if (!r || opt === "help") return await reply("Reply media.\n/cvaudio [speed/slow/enchanted-audio/enchanted-video]");
                    const msg = await reply("<i>Processing...</i>", { parseMode: "html" });
                    const mime = r.media.document.mimeType;
                    const fname = r.media.document.attributes.find(a => a.className === 'DocumentAttributeFilename')?.fileName || "f.tmp";
                    const buf = await event.client.downloadMedia(r.media);
                    let res, ext = fname.split('.').pop();

                    if (mime.startsWith('audio/') || mime.startsWith('video/')) {
                         const safe = isNaN(num) ? (opt === 'speed' ? 1.5 : (opt === 'slow' ? 0.8 : num)) : num;
                         if (opt === 'enchanted-audio') res = await scraper.ffmpeg(buf, ["-vn", "-af", "acompressor=threshold=-20dB:ratio=4:attack=200:release=1000,volume=1.2", "-c:a", "libmp3lame"], ext, "mp3");
                         else if (opt === 'enchanted-video' && mime.startsWith('video/')) res = await scraper.ffmpeg(buf, ["-vf", "eq=contrast=1.2:brightness=0.05:saturation=1.3", "-c:v", "libx264"], ext, "mp4");
                         else if (opt === 'speed' || opt === 'slow') res = await scraper.ffmpeg(buf, ["-filter:a", `atempo=${safe.toFixed(2)}`], ext, "mp3");
                         else res = await scraper.toSpeakerMP3(buf, ext);
                         
                         await event.client.sendFile(event.chatId, { file: res.filename, caption: "Done", attributes: [new Api.DocumentAttributeFilename({ fileName: "converted.mp3" })] });
                         await res.delete(); await msg.delete();
                    } else if (mime.includes('zip')) {
                        const zip = new AdmZip(buf), entries = zip.getEntries().filter(e => !e.isDirectory && ['mp3','wav','ogg'].includes(e.name.split('.').pop()));
                        if (!entries.length) return await msg.edit({ text: "No audio in zip." });
                        for (const e of entries) {
                            try {
                                const c = await scraper.toSpeakerMP3(e.getData(), e.name.split('.').pop());
                                await event.client.sendFile(event.chatId, { file: c.filename, caption: e.name });
                                await c.delete();
                            } catch {}
                        }
                        await msg.delete();
                    }
                } catch (e) { await reply(`Error: ${e.message}`); }
                break;
            }
            case "blacklist":
            case "bl": {
                if (!hasAccess) return await reply("❌ Akses ditolak.");
                const cid = String(event.chatId);
                const list = getBlacklist();
                if (list.includes(cid)) return await reply("Sudah blacklist.");
                list.push(cid);
                fs.writeFileSync(blpath, JSON.stringify(list, null, 2));
                await reply("✅ Blacklisted.");
                break;
            }
            case "info": {
                const t = user_q || user;
                await send(`ID: ${t.id}\nNama: ${t.firstName}\nUser: @${t.username}\nBot: ${t.isBot}`);
                break;
            }
            case "tictactoe": {
                const cid = String(event.chatId);
                global.db.data.game[cid] ??= {};
                if (global.db.data.game[cid].status === "playing") return reply("Game sedang berjalan.");
                const gid = Math.random().toString(36).slice(2, 8);
                global.db.data.game[cid] = { id: gid, board: Array(9).fill(null), player1: user, player2: null, turn: 1, status: "waiting" };
                await send(`🎮 TT Dibuat ID: ${gid}\nJoin: /jointictactoe ${gid}`);
                await resetInactivityTimer(cid, event.client);
                break;
            }
            case "jointictactoe": {
                const cid = String(event.chatId), gid = args[0];
                const g = global.db.data.game[cid];
                if (!g || g.id !== gid) return reply("Game tidak valid.");
                if (g.status !== "waiting" || g.player1.id === user.id) return reply("Gagal join.");
                g.player2 = user; g.status = "playing";
                await send(`✅ Mulai!\n${renderBoard(g.board)}\nGiliran: ${g.player1.firstName}`);
                await resetInactivityTimer(cid, event.client);
                break;
            }
            case "eval":
            case ">": {
                if (!hasAccess) return await reply("Owner only.");
                let code = args.join(" ") || (replyMessage?.message);
                if (!code) return;
                try {
                    let e = await eval(`(async () => { ${code} })()`);
                    await reply(util.inspect(e, { depth: 2 }));
                } catch (err) { await reply(String(err)); }
                break;
            }
        }

        if (!text.startsWith("/")) {
            const cid = String(event.chatId), g = global.db.data.game[cid];
            if (g && g.status === "playing" && event.message.replyToMsgId && (await event.message.getReplyMessage()).message.includes("Giliran:")) {
                await handleGameMove(g, user, parseInt(text), cid, event.client, reply, send);
            }
        }
        await global.db.write();
    } catch (err) { console.error(err); }
}

function generatePassword(len = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}