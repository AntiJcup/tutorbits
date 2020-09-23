import gulp from 'gulp';
import parcel from 'gulp-parcel';

async function copyCommonPreview(language, target, stage, mainJSPath) {
    gulp.src('./shared/language-client/previews/preview.html')
        //.pipe(replace(/previews\/src\/main\.js/g, mainJSPath))
        .pipe(gulp.dest(target));

    gulp.src('./shared/language-client/previews/preview.css')
        .pipe(gulp.dest(target));

    gulp.src(`./shared/language-client/previews/languages/${language}/*.ts`, { read: false })
        .pipe(parcel({ logLevel: 4, publicURL: './', outDir: target }, { source: './src/previews' }));
}

export async function previewJS() {
    let target = './src/assets/preview-helpers/js/';
    let stage = './stage/published_previews/js/';
    let mainJSPath = `previews/languages/js/main.js`;
    copyCommonPreview('js', target, stage, mainJSPath)
}

export async function previewPY() {
    try {
        let target = './src/assets/preview-helpers/py/';
        let stage = './stage/published_previews/py/';
        let mainJSPath = `previews/languages/py/main.js`;
        copyCommonPreview('py', target, stage, mainJSPath);
    } catch (e) {
        console.log(`${e}`);
    }
}
