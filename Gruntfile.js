module.exports = function(grunt) {

	var exec = require('child_process').exec,
		handlebars = require('handlebars'),
		moment = require('moment'),
		pkg = grunt.file.readJSON('package.json'),
		semver = require('semver'),
		path = require('path');

	// TODO: Remove Handlebars dependency and use the built-in grunt templating
	// Handlebars helpers
	handlebars.registerHelper('if', function(conditional, options) {
		if (options.hash.desired === options.hash.test) {
			return options.fn(this);
		}
	});

	// Project config
	grunt.initConfig({
		pkg: pkg,
		clean: {
			'github-pages': {
				options: { force: true },
				src: ['../gh-pages/src']
			},
			'F2-examples': {
				options: { force: true },
				src: ['./F2-examples.zip']
			}
		},
		copy: {
			'github-pages': {
				files: [
					{
						expand: true,
						cwd: 'docs/',
						src: ['**'],
						dest: '../gh-pages'
					},
					{
						expand: true,
						cwd: 'dist/',
						src: ['f2.latest.js'],
						rename: function(dest, src){
							return '../gh-pages/js/f2.min.js';//See #35
						}
					}
				]
			},
			'F2-examples': {
				files: [
					{
						expand: true,
						cwd: './',
						src: ['F2-examples.zip'],
						dest: '../gh-pages'
					}
				]
			}
		},
		compress: {
			main: {
				options: {
					archive: 'F2-examples.zip',
					pretty: true
				},
				files: [
					{
						expand: true,
						cwd: 'examples/',
						src: ['**'],
						dest: 'examples/'
					},
					{
						expand: true,
						cwd: 'dist/',
						src: ['f2.debug.js'],
						dest: 'dist/'
					},
					{
						expand: true,
						src: ['tests/require.min.js'],
						dest: 'dist/'
					}
				]
			}
		},
		concat: {
			options: {
				process: { data: pkg },
				separator: '\n',
				stripBanners: false
			},
			dist: {
				src: [
					'src/lib/template/header.js.tmpl',
					'src/vendor/jquery.js',
					'src/vendor/jquery.noconflict.js',
					'src/vendor/bootstrap-modal.js',
					'src/vendor/eventemitter2.js',
					'src/vendor/easyXDM/easyXDM.js',
					'<%= jshint.files %>',
					'src/lib/template/footer.js.tmpl'
				],
				dest: 'dist/f2.debug.js'
			},
			'no-third-party': {
				src: [
					'src/lib/template/header.js.tmpl',
					'<%= jshint.files %>',
					'src/lib/template/footer.js.tmpl'
				],
				dest: 'dist/f2.no-third-party.js'
			},
			'no-jquery-or-bootstrap': {
				src: [
					'src/lib/template/header.js.tmpl',
					'src/vendor/eventemitter2.js',
					'src/vendor/easyXDM/easyXDM.js',
					'<%= jshint.files %>',
					'src/lib/template/footer.js.tmpl'
				],
				dest: 'dist/packages/f2.no-jquery-or-bootstrap.js'
			},
			'no-bootstrap': {
				src: [
					'src/lib/template/header.js.tmpl',
					'src/vendor/jquery.js',
					'src/vendor/jquery.noconflict.js',
					'src/vendor/eventemitter2.js',
					'src/vendor/easyXDM/easyXDM.js',
					'<%= jshint.files %>',
					'src/lib/template/footer.js.tmpl'
				],
				dest: 'dist/packages/f2.no-bootstrap.js'
			},
			'no-easyXDM': {
				src: [
					'src/lib/template/header.js.tmpl',
					'src/vendor/jquery.js',
					'src/vendor/bootstrap-modal.js',
					'src/vendor/jquery.noconflict.js',
					'src/vendor/eventemitter2.js',
					'<%= jshint.files %>',
					'src/lib/template/footer.js.tmpl'
				],
				dest: 'dist/packages/f2.no-easyXDM.js'
			},
			'basic': { //reminiscent of F2 1.0, no secure apps and Container Provide must have jQuery & Bootstrap on page before F2.
				src: [
					'src/lib/template/header.js.tmpl',
					'src/vendor/eventemitter2.js',
					'<%= jshint.files %>',
					'src/lib/template/footer.js.tmpl'
				],
				dest: 'dist/packages/f2.basic.js'
			},
		},
		/**
		 * Need to downgrade forever-monitor to v1.1 because of:
		 * https://github.com/blai/grunt-express/issues/12
		 * cd node_modules/grunt-express; npm uninstall forever-monitor; npm install forever-monitor@1.1;
		 */
		express: {
			server: {
				options: {
					bases: './',
					port: 8080,
					server: (require('path')).resolve('./tests/server')
				}
			}
		},
		jasmine: {
			'non-amd': {
				options: {
					host: 'http://localhost:8080/tests/',
					outfile: 'index.html'
				}
			},
			'amd': {
				options: {
					host: 'http://localhost:8080/tests/',
					outfile: 'index-amd.html'
				}
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			files: [
				'src/lib/F2.js',
				'src/lib/app_handlers.js',
				'src/lib/classes.js',
				'src/lib/constants.js',
				'src/lib/events.js',
				'src/lib/rpc.js',
				'src/lib/ui.js',
				'src/lib/container.js'
			]
		},
		uglify: {
			options: {
				preserveComments: 'some',
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("mm-dd-yyyy") %> - See below for copyright and license */\n'
			},
			dist: {
				files: {'dist/f2.min.js': ['dist/f2.debug.js']},
				options: {
					report: 'gzip'
				}
			},
			sourcemap: {
				files: '<%= uglify.dist.files %>',
				options: {
					sourceMap: function(fileName) {
						return fileName.replace(/\.js$/, '.js.map');
					},
					sourceMapPrefix: 1,
					sourceMappingURL: function(path) {
						return path.replace(grunt.config('sourcemap.options.prefix'), '').replace(/\.js$/, '.js.map');
					}
				}
			},
			'package-no-jquery-or-bootstrap': {
				files: { 'dist/packages/f2.no-jquery-or-bootstrap.min.js' : ['dist/packages/f2.no-jquery-or-bootstrap.js'] },
				options: { report: 'gzip' }
			},
			'package-no-bootstrap': {
				files: { 'dist/packages/f2.no-bootstrap.min.js' : ['dist/packages/f2.no-bootstrap.js'] },
				options: { report: 'gzip' }
			},
			'package-no-easyXDM': {
				files: { 'dist/packages/f2.no-easyXDM.min.js' : ['dist/packages/f2.no-easyXDM.js'] },
				options: { report: 'gzip' }
			},
			'package-basic': {
				files: { 'dist/packages/f2.basic.min.js' : ['dist/packages/f2.basic.js'] },
				options: { report: 'gzip' }
			}
		},
		sourcemap: {
			options: {
				src: 'dist/f2.min.js',
				prefix: './dist/'
			}
		},
		watch: {
			docs: {
				files: ['docs/src/**/*.*', 'package.json', 'docs/bin/gen-docs.js'],
				tasks: ['docs'],
				options: {
					spawn: false,
				}
			},
			scripts: {
				files: ['./src/lib/**/*.js'],
				tasks: ['js'],
				options: {
					spawn: false,
				}
			}
		},
		http: {
			getDocsLayout: {
				options: {
					url: 'http://www.openf2.org/api/layout/docs',
					json: true,
					strictSSL: false,
					callback: function(err, res, response){
						var log = grunt.log.write('Retrieved doc layout...')
						grunt.config.set('docs-layout',response);
						log.ok();
						log = grunt.log.write('Saving templates as HTML...');
						//save as HTML for gen-docs step
						grunt.file.write('./docs/src/template/head.html', response.head);
						grunt.file.write('./docs/src/template/nav.html', response.nav);
						grunt.file.write('./docs/src/template/footer.html', response.footer);
						log.ok();
					}
				}
			}
		}
	});

	// Register tasks
	grunt.registerTask('fix-sourcemap', 'Fixes the source map file', function() {
		var uglifyOptions = grunt.config('uglify.sourcemap.options');
		var options = grunt.config('sourcemap.options');
		var dest = uglifyOptions.sourceMap(options.src);
		var rawMap = grunt.file.read(dest);

		rawMap = rawMap.replace(options.prefix, '');
		grunt.file.write(dest, rawMap);
	});

	grunt.registerTask('generate-docs', 'Generate docs', function() {
		var done = this.async(),
		log = grunt.log.write('Generating docs...');

		exec('node ' + path.join(__dirname, 'docs/bin/gen-docs'), function(err, stdout, stderr) {
		  if (err) {
		    grunt.log.error(err.message);
		    grunt.fail.fatal('Docs generation aborted.');
		    return;
		  }
		  grunt.log.write(stdout);
		  log.ok();
		  done();
		});
	});

	grunt.registerTask('yuidoc', 'Builds the reference docs with YUIDocJS', function() {

		var builder,
			docOptions = {
				quiet: true,
				norecurse: true,
				paths: ['./src/lib'],
				outdir: './docs/dist/sdk/',
				themedir: './docs/src/sdk-template',
				helpers: ['./docs/src/sdk-template/helpers/helpers.js']
			},
			done = this.async(),
			json,
			log = grunt.log.write('Generating reference docs...'),
			Y = require('yuidocjs');

		json = (new Y.YUIDoc(docOptions)).run();
		// massage in some meta information from F2.json
		json.project = {
			docsAssets: '../',
			version: pkg.version,
			releaseDateFormatted: pkg._releaseDateFormatted
		};
		docOptions = Y.Project.mix(json, docOptions);

		// ensures that the class has members and isn't just an empty namespace
		// used in sidebar.handlebars
		Y.Handlebars.registerHelper('hasClassMembers', function() {
			for (var i = 0, len = json.classitems.length; i < len; i++) {
				//console.log(json.classitems[i].class, this.name);
				if (json.classitems[i].class === this.name) {
					return '';
				}
			}
			return 'hidden';
		});

		builder = new Y.DocBuilder(docOptions, json);
		builder.compile(function() {
			log.ok();
			done();
		});
	});

	grunt.registerTask('nuget', 'Builds the NuGet package for distribution on NuGet.org', function() {
		var done = this.async(),
			log = grunt.log.write('Creating NuSpec file...'),
			nuspec = grunt.file.read('./dist/f2.nuspec.tmpl');

		nuspec = grunt.template.process(nuspec, { data: pkg });
		grunt.file.write('./dist/f2.nuspec', nuspec);
		log.ok();

		log = grunt.log.write('Creating NuGet package...');
		grunt.util.spawn(
			{
				cmd: 'nuget',
				args: ['pack', 'f2.nuspec'],
				opts: {
					cwd: './dist'
				}
			},
			function(error, result, code){
				if (error){
					grunt.fail.fatal(error);
				} else {
					grunt.file.delete('./dist/f2.nuspec');
					log.ok();
					done();
				}
			}
		);
	});

	grunt.registerTask('release', 'Prepares the code for release (merge into master)', function(releaseType) {
		if (!/^major|minor|patch$/i.test(releaseType) && !semver.valid(releaseType)) {
			grunt.log.error('"' + releaseType + '" is not a valid release type (major, minor, or patch) or SemVer version');
			return;
		}

		pkg.version = semver.valid(releaseType) ? releaseType : String(semver.inc(pkg.version, releaseType)).replace(/\-\w+$/, '');
		pkg._releaseDate = new Date().toJSON();
		pkg._releaseDateFormatted = moment(pkg._releaseDate).format('D MMMM YYYY');

		grunt.file.write('./package.json', JSON.stringify(pkg, null, '\t'));
		grunt.config.set('pkg', pkg);

		grunt.task.run('version');
	});

	grunt.registerTask('version', 'Displays version information for F2', function() {
		grunt.log.writeln(grunt.template.process(
			'This copy of F2 is at version <%= version %> with a release date of <%= _releaseDateFormatted %>',
			{ data: pkg }
		));
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-express');
	grunt.loadNpmTasks('grunt-http');

	grunt.registerTask('docs', ['http','generate-docs', 'yuidoc']);
	grunt.registerTask('github-pages', ['copy:github-pages', 'clean:github-pages']);
	grunt.registerTask('zip', ['compress', 'copy:F2-examples', 'clean:F2-examples']);
	grunt.registerTask('js', ['concat:dist', 'concat:no-third-party', 'uglify:dist', 'sourcemap']);
	grunt.registerTask('sourcemap', ['uglify:sourcemap', 'fix-sourcemap']);
	grunt.registerTask('packages', [
		'concat:no-jquery-or-bootstrap',
		'concat:no-bootstrap',
		'concat:no-easyXDM',
		'concat:basic',
		'uglify:package-no-jquery-or-bootstrap',
		'uglify:package-no-bootstrap',
		'uglify:package-no-easyXDM',
		'uglify:package-basic'
	]);
	grunt.registerTask('test', ['jshint', 'express', 'jasmine']);
	grunt.registerTask('test-live', ['jshint', 'express', 'express-keepalive']);
	grunt.registerTask('travis', ['test']);
	grunt.registerTask('default', ['test', 'js', 'docs', 'zip']);
};
