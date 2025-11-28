await import("./config.js?v=" + Date.now());

import { TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { pesan } from "./pesan.js";
import readline from "readline";

const auth = new StoreSession("sessions");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function sendErrorLog(client, err) {
    try {
        const fullLog = `❌ ERROR REPORT\n${new Date().toLocaleString()}\n\n${err.stack || err}`;
        if (fullLog.length <= 4090) {
            await client.sendMessage("me", { message: fullLog });
        } else {
            const chunks = fullLog.match(/.{1,4000}/g) || [];
            for (let i = 0; i < chunks.length; i++) {
                await client.sendMessage("me", { message: `[Log Part ${i + 1}/${chunks.length}]\n${chunks[i]}` });
            }
        }
    } catch (e) { console.error(e); }
}

(async () => {
    let client;
    try {
        console.log("Menghubungkan bot...");
        client = new TelegramClient(auth, api_id, api_hash, { connectionRetries: 5 });

        await client.start({
            phoneNumber: async () => {
                console.log("➡️ Masukkan Nomor HP:");
                return new Promise((r) => rl.question("", r));
            },
            password: async () => {
                console.log("➡️ Masukkan Password 2FA:");
                return new Promise((r) => rl.question("", r));
            },
            phoneCode: async () => {
                console.log("➡️ Masukkan Kode OTP:");
                return new Promise((r) => rl.question("", r));
            },
            onError: (err) => console.log(err),
        });

        console.log("Bot Connected.");
        await client.sendMessage("me", { message: "Bot Online" });
        await (await import("./system/alxzy.js?v=" + Date.now())).default();

        client.addEventHandler(async (event) => {
            try {
                await pesan(event);
            } catch (err) {
                console.error(err);
                if (client) await sendErrorLog(client, err);
            }
        }, new NewMessage({}));

    } catch (err) {
        console.error("Fatal Error:", err);
        if (client?.connected) await sendErrorLog(client, err);
    }
})();