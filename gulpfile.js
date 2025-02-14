import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import { src, dest, watch, series } from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import terser from 'gulp-terser';
import sharp from 'sharp';

const sass = gulpSass(dartSass);

export function js(done) {
    src('src/js/app.js')
        .pipe(terser())
        .pipe(dest('build/js'));
    
    done();
}

export function css(done) {
    src('src/scss/app.scss', { sourcemaps: true })
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(dest('build/css', { sourcemaps: '.' }));
    
    done();
}

export async function crop(done) {
    const inputFolder = 'src/img/gallery/full';
    const outputFolder = 'src/img/gallery/thumb';
    const width = 250;
    const height = 180;
    
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }
    
    const images = fs.readdirSync(inputFolder).filter(file => {
        return /\.(jpg)$/i.test(path.extname(file));
    });

    try {
        // Procesar todas las imágenes en paralelo
        await Promise.all(images.map(file => {
            const inputFile = path.join(inputFolder, file);
            const outputFile = path.join(outputFolder, file);
            return sharp(inputFile)
                .resize(width, height, {
                    position: 'centre'
                })
                .toFile(outputFile);
        }));
        
        done();
    } catch (error) {
        console.error('Error al procesar imágenes:', error);
        done(error); // Pasar el error a Gulp
    }
}

export function dev() {
    watch('src/scss/**/*.scss', css);
    watch('src/js/**/*.js', js);
    watch('src/js/**/*.{png,jpg}', js)
}

export default series(crop, js, css, dev);
