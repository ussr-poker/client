module.exports = {
    devServer: {
        watchOptions: {
            poll: 600,
            aggregateTimeout: 600,
            ignored: "/node_modules/"
        }
    }
    // chainWebpack: config => {
    //     config.resolve.symlinks(true);
    //
    //     return config;
    // }
};