const path = require("path")

const TerserPlugin = require("terser-webpack-plugin")
let optimisation = {
    minimize: false,
}

if (!process.env.NODE_ENV !== "development") {
    optimisation = {
        minimizer: [
            new TerserPlugin({
                test: /\.js$/,
                sourceMap: true,
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
            }),
        ],
    }
}

module.exports = {
    mode: process.env.NODE_ENV === "development" ? "development" : "production",
    output: {},
    optimization: optimisation,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [path.resolve(__dirname, "node_modules")],
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env"],
                },
            },
        ],
    },
    resolve: {
        modules: [path.resolve(__dirname, "node_modules")],
    },
}
