const _ = require("lodash")
const $ = require("gulp-load-plugins")()
const argv = require("yargs").argv
const browserSync = require("browser-sync").create()
const autoprefixer = require("autoprefixer")
const cssnano = require("cssnano")
const gulp = require("gulp")
const del = require("del")
const webpack = require("webpack-stream")
const path = require("path")

const TASKS = require("./tasks.json")
const isProduction = !!argv.production
process.env.NODE_ENV = !isProduction ? "development" : "production"

function buildScripts(done) {
    let webpackConfig = require("./webpack.config.js")
    runTasks(
        "buildScripts",
        "js",
        function(buildScriptsConfig) {
            webpackConfig.output.path = path.parse(path.resolve(__dirname, buildScriptsConfig.output)).dir
            webpackConfig.output.filename = path.parse(buildScriptsConfig.output).base
            return gulp
                .src(buildScriptsConfig.source)
                .pipe(webpack(webpackConfig))
                .pipe(gulp.dest(path.parse(buildScriptsConfig.output).dir))
        },
        done
    )
}

function clean(done) {
    runTasks(
        "clean",
        "clean",
        function(cleanConfig) {
            return del(cleanConfig.source)
        },
        done
    )
}

function copy(done) {
    runTasks(
        "copy",
        "copy",
        function(copyConfig) {
            return gulp.src(copyConfig.source, { dot: true }).pipe(gulp.dest(copyConfig.output))
        },
        done
    )
}

function eslint(done) {
    runTasks(
        "eslint",
        "js",
        function(jsConfig) {
            return gulp
                .src([jsConfig.source])
                .pipe($.plumber())
                .pipe($.eslint())
                .pipe($.eslint.format())
                .pipe($.eslint.failAfterError())
        },
        done
    )
}

function images(done) {
    runTasks(
        "images",
        "images",
        function(imagesConfig) {
            return gulp
                .src(imagesConfig.source)
                .pipe(
                    $.imagemin([
                        $.imagemin.gifsicle({ interlaced: true }),
                        $.imagemin.jpegtran({ progressive: true }),
                        $.imagemin.optipng({ optimizationLevel: 5 }),
                        $.imagemin.svgo({
                            plugins: [{ removeViewBox: false }, { collapseGroups: true }],
                        }),
                    ])
                )
                .pipe(gulp.dest(imagesConfig.output))
        },
        done
    )
}

function sass(done) {
    runTasks(
        "sass",
        "sass",
        function(sassConfig) {
            return gulp
                .src(sassConfig.source)
                .pipe($.plumber())
                .pipe($.sourcemaps.init())
                .pipe(
                    $.sass({
                        includePaths: sassConfig.source,
                    })
                )
                .pipe($.if(!isProduction, $.sourcemaps.write()))
                .pipe($.if(isProduction, $.postcss([autoprefixer(), cssnano()])))
                .pipe(gulp.dest(sassConfig.output))
        },
        done
    )
}

function serve(done) {
    if (isProduction) {
        return done()
    }
    browserSync.init({
        server: {
            baseDir: TASKS.browserSync.baseDir,
        },
        files: TASKS.browserSync.files,
        port: 3000,
        open: false,
    })
    done()
}

// BrowserSync Reload
function reload(done) {
    browserSync.reload()
    done()
}

/**
 * Helper function for running a group of tasks dynamically
 *
 * @param {string} name the name of the group of tasks, ex `buildScripts`
 * @param {string} key the config key in the tasks json file, ex: `js`
 * @param {function} task gulp task that will run for each item
 * @param {function} done callback
 */
function runTasks(name, key, task, done) {
    taskGroup = function() {
        const itemTasks = TASKS.tasks[key].map((taskConfig, i) => {
            function itemTask() {
                return task(taskConfig)
            }
            itemTask.displayName = `${name} task ${i + 1}`
            return itemTask
        })

        return gulp.series(...itemTasks, seriesDone => {
            seriesDone()
            done()
        })()
    }

    taskGroup.displayName = name
    return taskGroup()
}

exports.buildScripts = buildScripts
exports.clean = clean
exports.copy = copy
exports.eslint = eslint
exports.images = images
exports.sass = sass
exports.serve = serve

exports.default = gulp.series(clean, copy, gulp.parallel(sass, eslint, buildScripts, images), serve)
