const autocannon = require("autocannon");
const { createWriteStream } = require("fs");
const options = {
    connections: 64,
    duration: 15,
    workers: 8,
    timeout: 8
}

async function bench() {
    const res = await autocannon({
        url: "http://localhost:3000",
        ...options
    });

    const wstr = createWriteStream("./bench/result.txt");
    wstr.write("Average Req/sec: " + res.requests.average + "\n");
    wstr.write("Max Req/sec: " + res.requests.max + "\n");
    wstr.write("Total Req/sec: " + res.requests.total);
    wstr.end();
    wstr.close(() => process.exit());
}

module.exports = bench;