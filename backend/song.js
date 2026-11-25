const express = require("express");

const { getSongs } = require("./readJson");

const router = express.Router();

// Ye filler words search me ignore hote hain
// ("pop songs" -> sirf "pop" se match hoga)
const STOP_WORDS = new Set(["song", "songs", "gaane", "gana", "music"]);


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


// Query ko words me todo aur filler words hata do
function getTokens(query) {

    const tokens = query
        .split(/\s+/)
        .filter(word => word && !STOP_WORDS.has(word));

    // Agar sab filler nikal gaye (jaise sirf "songs"), to original query use karo
    return tokens.length ? tokens : [query];
}


// Common Search Function
async function searchSongs(query) {

    const songs = await getSongs();
    const tokens = getTokens(query);

    // Har token kisi na kisi field me milna chahiye
    const result = songs.filter(song =>
        tokens.every(token =>
            matchField(song.id, token) ||
            matchField(song.title, token) ||
            matchField(song.artists, token) ||
            matchField(song.album, token) ||
            matchField(song.language, token) ||
            matchField(song.categories, token)
        )
    );

    // Relevance-based sorting: jis song ka title pehle token se shuru ho wo upar
    const first = tokens[0];

    result.sort((a, b) => {

        const titleA = String(a.title || "").toLowerCase();
        const titleB = String(b.title || "").toLowerCase();

        const startsA = titleA.startsWith(first);
        const startsB = titleB.startsWith(first);

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


// POST Search (frontend yahi use karta hai: search bar + categories)
router.post("/search", async (req, res) => {

    try {

        const query = req.body?.message?.trim().toLowerCase();

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


// ---------------- MADE FOR YOU ----------------

// artists/categories/language kisi bhi shape me ho (string, array, object) -> lowercase names ki list
const nameOf = v =>
    String(v && typeof v === "object" ? (v.name || "") : v || "").toLowerCase();

const listOf = v =>
    (Array.isArray(v) ? v : v ? [v] : []).map(nameOf).filter(Boolean);


router.post("/made-for-you", async (req, res) => {

    try {

        const history = Array.isArray(req.body?.history) ? req.body.history : [];
        const songs = await getSongs();

        // History khaali hai -> random picks
        if (!history.length) {

            const shuffled = [...songs].sort(() => Math.random() - 0.5);

            return res.json({
                success: true,
                mixes: [{ title: "Popular Picks", songs: shuffled.slice(0, 12) }]
            });
        }

        // Taste profile: kaunsa artist/category/language kitna suna (recent = zyada weight)
        const artistW = {}, catW = {}, langW = {};
        const played = new Set();

        history.forEach((h, i) => {

            const w = 1 + (history.length - i) / history.length;

            played.add(String(h.id));

            listOf(h.artists).forEach(a => artistW[a] = (artistW[a] || 0) + w);
            listOf(h.categories).forEach(c => catW[c] = (catW[c] || 0) + w);
            listOf(h.language).forEach(l => langW[l] = (langW[l] || 0) + w);
        });

        const score = s =>
            listOf(s.artists).reduce((t, a) => t + (artistW[a] || 0) * 3, 0) +
            listOf(s.categories).reduce((t, c) => t + (catW[c] || 0) * 2, 0) +
            listOf(s.language).reduce((t, l) => t + (langW[l] || 0), 0) +
            Math.random() * 0.5; // thodi variety

        const fresh = songs.filter(s => !played.has(String(s.id)));
        const ranked = [...fresh].sort((a, b) => score(b) - score(a));

        const mixes = [{ title: "Your Daily Mix", songs: ranked.slice(0, 12) }];

        // Discover: pasand wali category, par naye artists
        const discover = ranked.filter(s =>
            !listOf(s.artists).some(a => artistW[a]) &&
            listOf(s.categories).some(c => catW[c])
        );

        if (discover.length) {
            mixes.push({ title: "Discover Something New", songs: discover.slice(0, 12) });
        }

        // Sabse zyada suni hui language ka mix
        const topLang = Object.entries(langW).sort((a, b) => b[1] - a[1])[0]?.[0];

        if (topLang) {

            const langSongs = ranked.filter(s => listOf(s.language).includes(topLang));

            if (langSongs.length) {
                mixes.push({
                    title: topLang.charAt(0).toUpperCase() + topLang.slice(1) + " Mix",
                    songs: langSongs.slice(0, 12)
                });
            }
        }

        res.json({ success: true, mixes });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;
