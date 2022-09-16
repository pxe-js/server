const { fork } = require("child_process");
const bench = require("./src/bench");

fork("./bench/src/index.js");
bench();