const path = require("path");

module.exports = [
    {
        entry: "./src/index.ts",
        devtool: "source-map",
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        output: {
            filename: "openai-queue.js",
            path: path.resolve(__dirname, "dist"),
            libraryTarget: "umd",
        },
        mode: "production",
    },
];
