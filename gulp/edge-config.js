var q = require('q');
var async = require('async');
var gutil = require('gulp-util');
var request = require('request');
var sleep = require('sleep');

function installNodeModules() {
	
	var opts = baseopts();
	var defer = q.defer();
	
    var host = opts.host;
    var org = opts.organization;
    var env = opts.environment;
    var rev = '1';
    
    var uri = host + 'v1/o/' + org + 
        '/apis/data-manager/revisions/' + rev + '/npm';
    
    var options = {
        uri: uri,
        auth: {
            'bearer': opts.token
        },
        method: "POST",
        form: { command:'install' }
    };

    makeRequest(options, function (error, response) {
        if (error) {
            console.log("Could not install node modules: " + 
                error.message);
			defer.reject(error);
        } else {
            console.log("Installed node modules.");
			defer.resolve(response);
        }
    });
    return defer.promise;
}

function createVaults(vaults) {
	
	var options = baseopts();
	var defer = q.defer();
	
    var host = options.host;
    var org = options.organization;
    var env = options.environment;
	
    var uri = host + 'v1/' +
        'o/' + org + 
        '/e/' + env +
        '/vaults';
        
    async.each(vaults, function (vault, callback) {
        
        var vaultBody = {
            "name": vault.name
        };
	
        options = {
            uri: uri,
            body: JSON.stringify(vaultBody),
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                'bearer': options.token
            },
            method: "POST"
        };
    
        // console.log('\nCreating vault: ' + JSON.stringify(options));
		
        makeRequest(options, function (error, response) {
            if (error) {
                console.log("Could not create vault: " + 
                    error.message);
				defer.reject(error);
            } else {
                console.log("Created vault.");
									
				addVaultEntries(vault, function (error, response){
					if (error) {
		                console.log("Could not add vault entries: " + 
		                    error.message);
							defer.reject(error);
					} else {
		                console.log("Added vault entries.");
		                console.log('\n' + JSON.stringify(response));
						defer.resolve(response);
					}
				})					
				defer.resolve(response);
            }
        });
    },
    function (error) {
        if (error) {
			defer.reject(error);
        } else {
			defer.resolve(response);
        }
    });
    return defer.promise;
}

function addVaultEntries(vault, callback) {
	
	console.log('\nAdding vault entries: ' + JSON.stringify(vault));

	var options = baseopts();
	var defer = q.defer();
	
    var host = options.host;
    var org = options.organization;
    var env = options.environment;
	
	var vaultName = vault.name;
	var entries = vault.entries;
	
    async.each(entries, function (entry, callback) {
		console.log('\nEntry: ' + JSON.stringify(entry));
        var entryName = entry.name;
        var entryValue = entry.value;
        
	    var uri = host + 'v1/' +
	        'o/' + org + 
	        '/e/' + env +
	        '/vaults/' + vaultName +
			'/entries';
    
        var body = {
            "name": entryName,
            "value": entryValue
        };
        var requestOptions = {
            uri: uri,
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                'bearer': options.token
            },
            method: "POST"
        };
		console.log('\nAdding vault entry: ' + JSON.stringify(requestOptions));
		
	    // sleep.sleep(3);
        
        makeRequest(requestOptions, function (error,
            response) {
            if (error) {
                console.log("Could not add vault entry: " + 
                    error.message);
	            callback(error, null);
            } else {
                console.log("Added vault entry.");
				console.log('\n' + JSON.stringify(response));
	            callback(null, response);
            }
        });
    },
    function (error) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, 'Added vault entries.');
        }
    });
}

function deleteVaults(vaults) {
	
	var options = baseopts();
	var defer = q.defer();
	
    var host = options.host;
    var org = options.organization;
    var env = options.environment;
	
    var uri = host + 'v1/' +
        'o/' + org + 
        '/e/' + env +
        '/vaults';
        
    async.each(vaults, function (vault, callback) {
        
        var vaultName = vault.name;
		
		uri = uri + '/' + vaultName;
	
        options = {
            uri: uri,
            auth: {
                'bearer': options.token
            },
            method: "DELETE"
        };
    
        console.log('\nDeleting vault: ' + JSON.stringify(options));
		
        makeRequest(options, function (error, response) {
            if (error) {
                console.log("Could not delete vault: " + 
                    error.message);
				defer.reject(error);
            } else {
                console.log("Deleted vault.");
			}
        });
    },
    function (error) {
        if (error) {
			defer.reject(error);
        } else {
			defer.resolve(response);
        }
    });
    return defer.promise;
}

function getAppKeyAndSecret(app, callback){

	var options = baseopts();
	var defer = q.defer();
	
    var host = options.host;
    var org = options.organization;
    var env = options.environment;
	
    var keySecret = {
        "consumerKey": "",
        "consumerSecret": ""
    };
    var appName = app.name;
    var developerEmail = app.email;        
    var host = gutil.env.host;
    var org = gutil.env.org;
    var env = gutil.env.env;
    
    var uri = host + 'v1/' +
        'o/' + org + 
        '/developers/' + developerEmail +
        '/apps/' + appName;
    
    var options = {
        uri: uri,
        auth: {
            'bearer': options.token
        },
        method: "GET"
    };
    makeRequest(options, function (error, response) {
        if (error) {
            console.log('\nCould not get app for key/secret: ' +
                error);
                callback(error, null);
        } else {
            console.log("\nGot consumer key and secret");
            keySecret.consumerKey =
                response.credentials[0].consumerKey;
            keySecret.consumerSecret = 
                response.credentials[0].consumerSecret;
			callback(null, keySecret);
        }
    });
}

function baseopts () {
    var opts = {
        host: gutil.env.host,
        organization: gutil.env.org,
        token: gutil.env.token,
        environments: gutil.env.env,    
        environment: gutil.env.env,
        debug: gutil.env.debug,
        usergrid_org: gutil.env.usergrid_org,   
        usergrid_app: gutil.env.usergrid_app,
        usergrid_client_id: gutil.env.usergrid_client_id,
        usergrid_secret: gutil.env.usergrid_secret,
        usergrid_host: gutil.env.usergrid_host
    };
    return opts;
}

function makeRequest(options, callback) {
    
    sleep.sleep(1);
    
    request(options, function (error, response) {
        var errorObject = new Error();
        if (error) {
            console.log('\nError: ' + error);
            callback(error, null);
        } else if (response.statusCode !== 200 && response.statusCode !== 201) {
			if (response.body && response.body.length > 0 ) {
	            var bodyObj = JSON.parse(response.body);
	            if (bodyObj.fault) {				
	                var fault = bodyObj.fault;
	                errorObject.message = fault.faultstring;
				}				
            } else if (response.statusMessage) {
                errorObject.message = response.statusMessage;
            }
            errorObject.statusCode = response.statusCode;
            callback(errorObject, null);
        } else {            
            if (response.body) {
                try {
                    var bodyObj = JSON.parse(response.body);
                    callback(null, bodyObj);                    
                } catch (exception) {
                    callback(null, response);                    
                }
            }
        }
    });
}

module.exports = {
    installNodeModules: installNodeModules,
    createVaults: createVaults,
	deleteVaults: deleteVaults,
	getAppKeyAndSecret: getAppKeyAndSecret
}

