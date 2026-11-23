const app = require("./server");

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`server start on http://localhost:${PORT}`);
});
