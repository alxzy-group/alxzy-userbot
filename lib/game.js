function renderBoard(board) {
  let str = "";
  for (let i = 0; i < 9; i++) {
    str += board[i] ? board[i] : i + 1;
    if ((i + 1) % 3 === 0) str += "\n";
    else str += " | ";
  }
  return `<pre>${str}</pre>`;
}

function checkWinner(b) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

async function resetInactivityTimer(chatId, client) {
  if (global.gameTimers.has(chatId)) {
    clearTimeout(global.gameTimers.get(chatId));
  }

  const newTimer = setTimeout(async () => {
    if (global.db.data.game[chatId]) {
      console.log(`[TTT] Menghapus sesi game ${chatId} karena tidak aktif.`);
      delete global.db.data.game[chatId];
      
      global.gameTimers.delete(chatId);

      try {
        await client.sendMessage(chatId, {
          message:
            "🎮 Permainan TicTacToe dibatalkan karena tidak ada aktivitas selama 2 menit.",
        });
      } catch (e) {
        console.error(
          `[TTT] Gagal mengirim pesan batal ke chat ${chatId}: ${e.message}`
        );
      }
    }
  }, 120 * 1000);

  global.gameTimers.set(chatId, newTimer);
}

function clearInactivityTimer(chatId) {
  if (global.gameTimers.has(chatId)) {
    clearTimeout(global.gameTimers.get(chatId));
    global.gameTimers.delete(chatId);
  }
}

async function handleGameMove(
  game,
  user,
  position,
  chatId,
  client,
  reply,
  send
) {
  if (isNaN(position) || position < 1 || position > 9) {
    await reply("❌ Posisi harus angka 1–9.");
    return;
  }

  const currentPlayer = game.turn === 1 ? game.player1 : game.player2;
  if (user.id !== currentPlayer.id) {
    await reply("⏳ Bukan giliran kamu!");
    return;
  }
  if (game.board[position - 1]) {
    await reply("⚠️ Posisi sudah diisi.");
    return;
  }

  game.board[position - 1] = game.turn === 1 ? "❌" : "⭕";
  const winner = checkWinner(game.board);

  if (winner) {
    game.status = "finished";
    const winnerUser = currentPlayer;
    global.db.data.users[winnerUser.id] ??= { limit: 0 };
    global.db.data.users[winnerUser.id].limit =
      (global.db.data.users[winnerUser.id].limit || 0) + 5;
    await send(
      `🏁 <b>Permainan Selesai!</b>\n\n${renderBoard(game.board)}\n\n` +
        `🎉 Pemenang: <b>${winnerUser.firstName}</b> (${
          game.turn === 1 ? "❌" : "⭕"
        })\n` +
        `🎁 Hadiah: +5 Limit`,
      { parseMode: "html" }
    );
    delete global.db.data.game[chatId];
    clearInactivityTimer(chatId);
    
    return;
  }

  if (game.board.every((c) => c !== null)) {
    game.status = "finished";
    await send(`🤝 <b>Seri!</b>\n\n${renderBoard(game.board)}`, {
      parseMode: "html",
    });
    delete global.db.data.game[chatId];
    clearInactivityTimer(chatId);
    
    return;
  }

  game.turn = game.turn === 1 ? 2 : 1;
  const nextPlayer = game.turn === 1 ? game.player1 : game.player2;
  await send(
    `${renderBoard(game.board)}\n\nGiliran: <b>${nextPlayer.firstName}</b> (${
      game.turn === 1 ? "❌" : "⭕"
    })\nBalas pesan ini dengan angka 1–9.`,
    { parseMode: "html" }
  );
  await resetInactivityTimer(chatId, client);
  
}

export { renderBoard, checkWinner, resetInactivityTimer, clearInactivityTimer, handleGameMove }