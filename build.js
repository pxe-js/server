require("fs").rmSync("types", { recursive: true });

require("child_process").exec("npx tsc");

require("esbuild").buildSync({
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