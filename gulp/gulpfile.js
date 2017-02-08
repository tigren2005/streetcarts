var apigeetool = require('apigeetool');
var async = require('async');
var baasConfig = require('./baas-config.js');
var build = require('gulp-build');
var del = require('del');
var edge = require('./edge.js');
var edgeConfig = require('./edge-config.js');
var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jsonQuery = require('json-query');
var request = require('request');
var requireDir = require('require-dir');
var runSequence = require('run-sequence');
var streetcartsSeed = require('./streetcarts-seed.js');
// var tasksDir = requireDir('./tasks');

var configFile = './streetcarts-config.json';
var seedFile = './combined-seed-data.json';

// Config variables
var streetcartsConfig = null;
var apilist = null;
var apiProducts = null;
var developers = null;
var apps = null;
var kvms = null;
var kvmEntries = null;
var groups = null;
var roles = null;

// Seed variables
var users = null;
var foodcarts = null;

// Import the configuration file and set variables from it.
gulp.task('init-config', function(callback){

    return fs.readFile(configFile, 'utf8', function (error, data) {
        if (error) {
            console.log('\nCould not read the config file: \n' + error);  
			callback(error);          
        } else {
            streetcartsConfig = JSON.parse(data);
			
			// Grab the config info from the config file.
			apilist = streetcartsConfig.apilist;
			apiProducts = streetcartsConfig.apiProducts;
			developers = streetcartsConfig.developers;
			apps = streetcartsConfig.apps;
			kvms = streetcartsConfig.kvms;
			kvmEntries = streetcartsConfig.kvmEntries;
			groups = streetcartsConfig.groups;
			roles = streetcartsConfig.roles;
			callback();
        }
    });
});

// Import the seed data file and set values from it
gulp.task('init-seed', ['init-config'], function(callback){

    return fs.readFile(seedFile, 'utf8', function (error, data) {
        if (error) {
            console.log('\nCould not read the seed file: \n' + error);  
			callback(error);
        } else {
			// Grab the config info from the config file.
            streetcartsSeedData = JSON.parse(data);			
			users = streetcartsSeedData.users;
			foodcarts = streetcartsSeedData.foodcarts;
			
			var app = jsonQuery('[name=SC-APP-UNLIMITED]', {data: apps}).value;
			
			var keySecret = null;

			edgeConfig.getAppKeyAndSecret(app, function (error, response){
				if (error){
					callback(error);
				} else {
					gutil.env.consumer_key = response.consumerKey;
					gutil.env.consumer_secret = response.consumerSecret;
					callback();
				}
			})
        }
    });
});

// Remove the Edge pieces from Edge. This includes the proxies, products, 
// developer, apps, KVMs and that this script creates.
gulp.task('clean-edge', ['init-config'], function(callback){
    return edge.run(apps, edge.deleteApps).then(
        function(){ 
            return edge.run(developers, edge.deleteDevelopers);
        },
        function(error){ 
            console.log('\nApp delete failed: ' + error);
            return edge.run(developers, edge.deleteDevelopers);
        })
	.then(
        function(){ 
			console.log('\nDeleting products');
            return edge.run(apiProducts, edge.deleteProducts);
        },
        function(error){
            console.log('\nApp delete failed: ' + error);
            return edge.run(apiProducts, edge.deleteProducts);
        })
	.then(
        function(){
			console.log('\nDeleting APIs');
            return edge.run(apilist, edge.deleteApis);
        },
        function(error){ 
            console.log('\nProduct delete failed: ' + error);
            return edge.run(apilist, edge.deleteApis);
        })
	.then(
        function () {
            console.log('\nDeleting KVMs');
            return edge.run(kvms, edge.deleteKVMs);
        },
        function (error) {
            console.log('\nAPI delete failed: ' + error);
            return edge.run(kvms, edge.deleteKVMs);
        })
	.then(
        function () {
            console.log('\nAll done cleaning Edge.');
			// callback();
        },
        function (error) {
            console.log('\nKVM delete failed: ' + error);
			// callback(error);
        }
    )
});

// Clean the build directory created by this script.
gulp.task('clean-build', function () {

    // Delete Temp Files & Folders
    return del(['./build/**']);
});

// Create a build directory and put the source artifacts into it,
// replacing placeholder values where needed.
gulp.task('build',function(callback){
    var baas_org = gutil.env.usergrid_org;
    var baas_app = gutil.env.usergrid_app;
    var baas_api = gutil.env.usergrid_host;
    
    var replace_opts = {
        BAASAPIREPLACE: baas_api,
        BAASORGREPLACE: baas_org,
        BAASAPPREPLACE: baas_app
    };
    return new Promise(function(resolve, reject){
        gulp.src('../streetcarts/proxies/src/gateway/**/*')
        // .pipe(build(replace_opts))
        .pipe(gulp.dest('./build/gateway/'))
        .on('end', resolve)
		.on('error', reject);
	})
	.then(
		function() {
	        gulp.src('./build/gateway/data-manager/apiproxy/resources/node/data-manager.js')
	        .pipe(build(replace_opts))
	        .pipe(gulp.dest('./build/gateway/data-manager/apiproxy/resources/node/'))
    	},
		function (error) {
			console.log('\nBuild error: ' + error);
			callback(error);
		}
	);
});

// Run the other tasks that clean and deploy.
gulp.task('deploy', function(callback){
	// Gulp runs dependencies in parallel. Make sure these are run sequentially.
    runSequence('clean-build', 'build', 'init-config', 'deploy-app',
            'configure-baas', callback);
    // runSequence('clean-build', 'build', 'init-config', 'deploy-app',
    //         'configure-baas', 'seed-streetcarts', callback);
    // runSequence('clean-build', 'build', 'init-config', 'deploy-app', callback);
});

// Set up the Edge pieces. Import proxies, products, developer, 
// apps, KVMS, then deploy.
gulp.task('deploy-app', function(callback) {    
    console.log('\nCreating API proxies.');
    return edge.run(apilist, edge.deployApis)
    .then(
		function () {
            console.log('\nCreating developers.');
	        return edge.run(developers, edge.createDevelopers);
	    },
	    function (error) {
	        console.log('\nUnable to deploy APIs. ' +
	            'Moving on to create developers.\n' +
	            error);
			return edge.run(developers, edge.createDevelopers);
	    })
	.then(
		function () {
            console.log('\nCreating API products.');
	        return edge.run(apiProducts, edge.createProducts);
	    },
	    function (error) {
	    	console.log('\nUnable to create developers. ' +
	        	'Moving on to create create products.\n' +
	        	error);
			return edge.run(apiProducts, edge.createProducts);
	    })
	.then(
		function () {
            console.log('\nCreating developer apps.');
	        return edge.run(apps, edge.createApps);
	    },
	    function (error) {
			console.log('\nUnable to create products. ' +
	    		'Moving on to create apps.\n' +
	    		error);
			return edge.run(apps, edge.createApps);
	    })
	.then(
		function () {
            console.log('\nCreating KVMs.');
            return edge.run(kvms, edge.createKVMs);
        },
        function (error) {
            console.log('\nUnable to create apps. ' +
                'Moving on to create key-value maps.\n' +
                error);
			return edge.run(kvms, edge.createKVMs);
        }
    ).then(
        function () {
            console.log('\nCreating KVM entries.');
            
            var host = gutil.env.host;
            var org = gutil.env.org;
            var env = gutil.env.env;
            var uri = host + "v1/o/" + org +
                "/developers/streetcarts-developer@example.com/apps/SC-DATA-MANAGER-APP";
            var options = {
                uri: uri,
                auth: {
                    'bearer': gutil.env.token
                },
                method: "GET"
            };
            
            // console.log('\nGetting data manager app: ' + JSON.stringify(options));

            makeRequest(options, function (error, response) {
                if (error) {
                    console.log("\nCould not get data manager app: " +
                        error);
                } else {
                    var consumerKey =
                        JSON.parse(response).credentials[0].consumerKey;
                        
                    async.each(kvmEntries, function(kvmEntry, callback){
                        if (kvmEntry.name === 'X-DATA-MANAGER-KEY'){
                            kvmEntry.value = consumerKey;
                        } else if (kvmEntry.name === 'datastore-client-id'){
                            kvmEntry.value = gutil.env.usergrid_client_id;
                        } else if (kvmEntry.name === 'datastore-client-secret'){
                            kvmEntry.value = gutil.env.usergrid_secret;
                        }
                        callback();
                    },
                    function (error) {
                        if (error) {
                            console.log("\nCould not create KVM entries: " + 
                                error.message);
                        } else {
                            console.log("\nCreated KVM entries.");
                        }
                    });
                    return edge.run(kvmEntries, edge.createKVMEntries)
                }
            });
        },
        function (error) {
           console.log('\nUnable to create KVM: ' + error);
           return edge.run(kvmEntries, edge.createKVMEntries);
        })
	.then(
        function () {
            console.log('Installing Node modules.');
            return edgeConfig.installNodeModules();
        },
        function (error) {
            console.log('\nUnable to create apps. ' +
                'Moving on to create key-value maps.\n' +
                error);
			return edgeConfig.installNodeModules();
        })
	.then(
        function () {
            console.log('\nInstalled Node modules.');
            console.log('\nAll done deploying to Edge.');
        },
        function (error) {
            console.log('\nUnable to install Node modules.\n: ' +
                error);
        }
    )	
});

// Remove BaaS configuration pieces from BaaS.
gulp.task('clean-baas', ['init-config'], function(callback) {
    return baasConfig.deleteGroups(groups)
	.then(
        function() {
            console.log('\nDeleted groups');
            return baasConfig.deleteRoles(roles);
        },
        function(error) { 
            console.log('\nFailed to delete groups: ' + error);
            return baasConfig.deleteRoles(roles);
        }
	).then(
        function() {
            console.log('\nDeleted roles');
            console.log('\nAll done cleaning API BaaS.');
        },
        function(error) { 
            console.log('\nFailed to delete roles: ' + error);
        }
    )
});

// Add user groups and roles to BaaS.
gulp.task('configure-baas', ['init-config'], function(callback) {
    return baasConfig.createGroups(groups)
	.then(
        function() {
            console.log('\nCreated groups');
            return baasConfig.createRoles(roles);
        },
        function(error) {
            console.log('\nFailed to create groups: ' + error);
            return baasConfig.createRoles(roles);
        })
	.then(
        function() {
            console.log('\nCreated roles');
            return baasConfig.assignRolesToGroups(groups);
        },
        function(error) {
            console.log('\nFailed to create roles: ' + error);
            return baasConfig.assignRolesToGroups(groups);
        })
	.then(
        function () {
            console.log('\nAssigned roles to groups.');
            console.log('\nAll done configuring API BaaS.');
        },
        function (error) {
            console.log('\nFailed to assign roles to groups.');
            console.log(error);
        }
    )
});

// Add seed data to BaaS data store by using the StreetCarts
// API.
gulp.task('seed-streetcarts', ['init-seed'], function(callback){
	return streetcartsSeed.createUserAccounts(users)
	.then( 
        function() {
            console.log('\nCreated user accounts');
            return streetcartsSeed.createFoodcarts(foodcarts, users);
        },
        function(error) { 
            console.log('\nFailed to create user accounts: ' + error);
        })
    .then(
        function () {
            console.log('\nAll done');
        },
        function (error) {
            console.log('\nError: ');
            console.log(error);
        }
    )
});

// Does nothing.
gulp.task('default', function () {
    // place code for your default task here
});

// Make HTTP requests.
function makeRequest(options, callback) {

    request(options, function (error, response, body) {
        
        var errorObject = new Error();
        
        if (error) {
            errorObject.message = error.message;
            callback(errorObject, null);
        } else if (response && response.statusCode != 200) {
            // console.log(body);
            var responseBody = body;
            
            var errorObject = new Error();
            errorObject.message = responseBody.error_description;
            errorObject.statusCode = response.statusCode;
            errorObject.errorType = responseBody.error;
            
            callback(errorObject, response);
        } else {
            callback(null, body);
        }
    });
}

