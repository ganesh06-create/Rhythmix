const express = require("express");
const { getsong } = require("./readJson");

const router = express.Router();

router.get("/src", (req, res)=>{
    const query = req.query.query;

    // const songs = getsong();

    res.send(query);
    
})

module.exports = router;