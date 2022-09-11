const { exec } = require("child_process");
const { writeFile } = require("fs/promises");
const osDetail = require("./osDetail");

/**
 * @type {import("autocannon").Options}
 */
const options = {
    connections: 64,
    duration: 15,
    workers: 8,
    timeout: 8
}

function parseOptions() {
    let str = "";

    for (const key in options)
        str += "--" + key + " " + options[key] + " ";

    return str;
}

function escapeColor(text) {
    return text.replaceAll(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

async function bench() {
    console.log("Start benchmarking...");
    const proc = exec("npx autocannon http://localhost:3000 " + parseOptions());

    let data = "";

    proc.stderr.on("data", d => data += d);

    proc.on("exit", () => {
        console.log("Writing result to file...");
        writeFile("./bench/result.txt", osDetail + escapeColor(data))
            .then(() => {
                console.log("Done!");
                process.exit();
            })
    });
}

module.exports = bench;