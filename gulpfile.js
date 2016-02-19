'use strict';

var gulp = require('gulp'),
    clean = require('gulp-clean'),
    less = require('gulp-less'),
    zip = require('gulp-zip');

gulp.task('clean', function() {
	gulp.src('build/*', {read: false})
		  .pipe(clean());
});

gulp.task('html', function() {
	gulp.src('*.html')
		  .pipe(gulp.dest('build'));
});

gulp.task('styles', function() {
  gulp.src('less/**')
      .pipe(less())
		  .pipe(gulp.dest('build/css'));
});

gulp.task('scripts', function() {
	gulp.src('js/**')
		  .pipe(gulp.dest('build/js'));
});

gulp.task('bower', function() {
  var bower_css_files = [
    'bower_components/angular/angular-csp.css',
    'bower_components/angular-bootstrap/ui-bootstrap-csp.css'
  ];
  var bower_js_files = [
    'bower_components/angular/angular.js',
    'bower_components/angular-bootstrap/ui-bootstrap.js',
    'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
    'bower_components/bootstrap/dist/js/bootstrap.js',
    'bower_components/jquery/dist/jquery.js',
    'bower_components/sipml5/SIPml-api.js'
  ];
  var bower_font_files = [
    'bower_components/bootstrap/dist/fonts/**',
    'bower_components/font-awesome/fonts/**'
  ];
  gulp.src(bower_css_files)
      .pipe(gulp.dest('build/css'));
  gulp.src(bower_js_files)
      .pipe(gulp.dest('build/js'));
  gulp.src(bower_font_files)
      .pipe(gulp.dest('build/fonts'));
});

gulp.task('images', function() {
	gulp.src('img/**')
		  .pipe(gulp.dest('build/img'));
});

gulp.task('sounds', function() {
	gulp.src('wav/**')
		  .pipe(gulp.dest('build/wav'));
});

gulp.task('manifest', function() {
	gulp.src('manifest.json')
		  .pipe(gulp.dest('build'));
});

gulp.task('watch', ['build'], function() {
  gulp.watch('*.html', function(event) {
    gulp.run('html');
  });
  gulp.watch('less/**', function(event) {
    gulp.run('styles');
  });
  gulp.watch('js/**', function(event) {
    gulp.run('scripts');
  });
  gulp.watch('img/**', function(event) {
    gulp.run('images');
  });
  gulp.watch('wav/**', function(event) {
    gulp.run('sounds');
  });
  gulp.watch('manifest.json', function(event) {
    gulp.run('manifest');
  });
});

gulp.task('build', ['html', 'styles', 'scripts', 'bower', 'images', 'sounds', 'manifest']);

gulp.task('zip', ['build'], function() {
	var manifest = require('./manifest'),
		  distFileName = manifest.name + ' v' + manifest.version + '.zip';
	gulp.src(['build/**'])
		  .pipe(zip(distFileName))
		  .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);
