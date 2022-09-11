const autocannon = require("autocannon");
const { createWriteStream } = require("fs");
const os = require("os");
const convert = require("./convert");
const options = {
    connections: 64,
    duration: 15,
    workers: 8,
    timeout: 8
}

function getCPU() {
    const cpus = os.cpus();

    return cpus.length + " Cores (" + cpus[0].model + ")";
}

async function bench() {
    const res = await autocannon({
        url: "http://localhost:3000",
        ...options
    });

    const wstr = createWriteStream("./bench/result.txt");

    wstr.write("Platform: " + os.type() + "\n");
    wstr.write("RAM: " + convert(os.totalmem()) + "\n");
    wstr.write("CPU: " + getCPU() + "\n\n");

    wstr.write("Average Req/sec: " + res.requests.average + "\n");
    wstr.write("Max Req/sec: " + res.requests.max + "\n");
    wstr.write("Total Req/sec: " + res.requests.total);

    wstr.end();
    wstr.close(() => process.exit());
}

module.exports = bench;