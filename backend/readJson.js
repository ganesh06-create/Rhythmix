const fs = require("fs").promises;
const path = require("path");

async function getSongs() {
    const filePath = path.join(__dirname, "../database/songs.json");

    const data = await fs.readFile(filePath, "utf-8");

    return JSON.parse(data);
}

module.exports = { getSongs };