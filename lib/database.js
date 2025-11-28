export default async function users(data) {
  try {
    if (!global.db?.data?.users) global.db.data.users = {};
    
    if (!global.db.data.users[data.id]) {
      global.db.data.users[data.id] = {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        isBot: data.isBot,
        limit: 15,
      };
    } else {
      const u = global.db.data.users[data.id];
      u.username ??= data.username;
      u.firstName ??= data.firstName;
      u.lastName ??= data.lastName;
      u.limit ??= data.limit ?? 15;
      u.isBot ??= data.isBot;
    }

    await global.db.write();

    return global;
  } catch (e) {
    console.error("Database update error:", e);
  }
}
