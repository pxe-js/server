const { fork } = require("child_process");
const bench = require("./src/run");

fork("./bench/src/index.js");
bench();