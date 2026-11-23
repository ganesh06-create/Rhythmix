const express = require("express");
const { getSongs } = require("./readJson");

const router = express.Router();

function matchField(value, query) {
    if (Array.isArray(value)) {
        return value.some(item =>
            String(item).toLowerCase().includes(query)
        );
    }

    return String(value || "").toLowerCase().includes(query);
}

router.get("/src", async (req, res) => {
    try {
        const query = req.query.query?.trim().toLowerCase();

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const songs = await getSongs();

        const result = songs.filter(song => {
            return (
                matchField(song.id, query) ||
                matchField(song.title, query) ||
                matchField(song.artists, query) ||
                matchField(song.album, query) ||
                matchField(song.language, query) ||
                matchField(song.categories, query)
            );
        });

        res.json({
            success: true,
            total: result.length,
            songs: result
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;