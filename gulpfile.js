'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.previewJS = previewJS;
exports.previewPY = previewPY;

var _gulp = require('gulp');

var _gulp2 = _interopRequireDefault(_gulp);

var _gulpParcel = require('gulp-parcel');

var _gulpParcel2 = _interopRequireDefault(_gulpParcel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function copyCommonPreview(language, target, stage, mainJSPath) {
    _gulp2.default.src('./shared/language-client/previews/preview.html')
    //.pipe(replace(/previews\/src\/main\.js/g, mainJSPath))
    .pipe(_gulp2.default.dest(target));

    _gulp2.default.src('./shared/language-client/previews/preview.css').pipe(_gulp2.default.dest(target));

    _gulp2.default.src('./shared/language-client/previews/languages/' + language + '/*.ts', { read: false }).pipe((0, _gulpParcel2.default)({ logLevel: 4, publicURL: './', outDir: target }, { source: './src/previews' }));
}

async function previewJS() {
    var target = './src/assets/preview-helpers/js/';
    var stage = './stage/published_previews/js/';
    var mainJSPath = 'previews/languages/js/main.js';
    copyCommonPreview('js', target, stage, mainJSPath);
}

async function previewPY() {
    try {
        var target = './src/assets/preview-helpers/py/';
        var stage = './stage/published_previews/py/';
        var mainJSPath = 'previews/languages/py/main.js';
        copyCommonPreview('py', target, stage, mainJSPath);
    } catch (e) {
        console.log('' + e);
    }
}
