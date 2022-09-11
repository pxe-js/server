// Get OS details
const os = require('os');

const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

function convertBytes(x) {
    let l = 0, n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l)
        n /= 1024;

    return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l]);
}

function getCPU() {
    const cpus = os.cpus();

    return cpus.length + " Cores (" + cpus[0].model + ")";
};

function getDetails() {
    return "CPU: " + getCPU() + "\n" + "RAM: " + convertBytes(os.totalmem()) + "\n" + "OS: " + os.type() + "\n\n";
}

// Utils
function parseOptions(options) {
    let str = "";

    for (const key in options)
        str += "--" + key + " " + options[key] + " ";

    return str;
}

function escapeColor(text) {
    return text.replaceAll(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

// Benchmarking
const { exec } = require("child_process");
const { writeFile, readFile } = require("fs/promises");

async function bench() {
    console.log("Start benchmarking...");
    const proc = exec("npx autocannon http://localhost:3000 " + parseOptions(
        await readFile("./bench/config.json")
            .then(t => JSON.parse(t.toString()))
    ));

    let data = "";

    proc.stderr.on("data", d => data += d);

    proc.on("exit", () => {
        console.log("Writing result to file...");
        writeFile("./bench/result.txt", getDetails() + escapeColor(data))
            .then(() => {
                console.log("Done!");
                process.exit();
            })
    });
}

module.exports = bench;