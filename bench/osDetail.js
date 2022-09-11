const os = require('os');
const convertBytes = require("./convertBytes");

function getCPU() {
    const cpus = os.cpus();

    return cpus.length + " Cores (" + cpus[0].model + ")";
};

function getDetails() {
    return "CPU: " + getCPU() + "\n" + "RAM: " + convertBytes(os.totalmem()) + "\n" + "OS: " + os.type() + "\n\n";
}

module.exports = getDetails();