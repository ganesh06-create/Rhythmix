
const express = require("express");
const { getSongs } = require("./readJson");

const router = express.Router();


function matchField(value, query) {

    if (value === null || value === undefined) {
        return false;
    }

    if (Array.isArray(value)) {
        return value.some(item => matchField(item, query));
    }

    if (typeof value === "object") {
        return Object.values(value).some(item =>
            matchField(item, query)
        );
    }

    return String(value).toLowerCase().includes(query);
}


// Common Search Function
async function searchSongs(query) {
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

    // Relevance-based sorting
    result.sort((a, b) => {

        const titleA = String(a.title || "").toLowerCase();
        const titleB = String(b.title || "").toLowerCase();

        const startsA = titleA.startsWith(query);
        const startsB = titleB.startsWith(query);

        if (startsA && !startsB) return -1;
        if (!startsA && startsB) return 1;

        return 0;
    });

    return result;
}

// GET Search
router.get("/src", async (req, res) => {
    try {
        const query = req.query.query?.trim().toLowerCase();

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const result = await searchSongs(query);

        res.json({
            success: true,
            total: result.length,
            songs: result.slice(0, 1)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST Search
router.post("/search", async (req, res) => {
    try {
        const query = req.body.message?.trim().toLowerCase();

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const result = await searchSongs(query);

        res.json({
            success: true,
            total: result.length,
            songs: result.slice(0, 15)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
