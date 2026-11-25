const app = require("./server");

const PORT = 5000;

app.listen(PORT,"0.0.0.0", () => {
    console.log(`server start on http://localhost:${PORT}`);
});
