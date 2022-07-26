const fs = require("fs");

fs.rmSync("types", { recursive: true });

require("child_process").exec("npx tsc", () => {
    fs.rm("types/bodyParser.d.ts", () => {});
    fs.rm("types/createContext.d.ts", () => {});
    fs.rm("types/finishResponse.d.ts", () => {});
    fs.rm("types/crypt.d.ts", () => {});
}).stderr.on("data", console.log);

require("esbuild").build({
    entryPoints: ["./src/index.ts"],
    loader: {
        ".ts": "ts",
    },
    bundle: true,
    outfile: "./index.js",
    platform: "node",
    minify: true,
    legalComments: "none"
});

