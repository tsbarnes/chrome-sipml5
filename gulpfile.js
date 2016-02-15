var gulp = require('gulp');
var less = require('gulp-less');

gulp.task('options.css', function() {
    gulp.src(['less/options.less'])
        .pipe(less())
        .pipe(gulp.dest('css/'));
});

gulp.task('popup.css', function() {
    gulp.src(['less/popup.less'])
        .pipe(less())
        .pipe(gulp.dest('css/'));
});

gulp.task('watch', function() {
    gulp.watch('less/options.less', function(event) {
        gulp.run('options.css');
    });

    gulp.watch('less/popup.less', function(event) {
        gulp.run('popup.css');
    });
});

gulp.task('default', ['options.css', 'popup.css', 'watch']);
