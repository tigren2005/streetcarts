/*

This file seeds the data store with code that calls APIs
that would be used by app clients in less batch-y ways.
*/

var q = require('q');
var async = require('async');
var gutil = require('gulp-util');
var request = require('request');
var sleep = require('sleep');

module.exports = {

	installNodeModules: function () {
		
		var opts = baseopts();
		var callback = q.defer();
		
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
				callback.reject(error)
            } else {
                console.log("Installed node modules.");
				callback.resolve(response)
            }
        });
	    return callback.promise;
	},
	
	createVaults: function (vaults) {
		
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
	                console.log("Could not create vaults: " + 
	                    error.message);
					defer.reject(error)
	            } else {
	                console.log("Created vault.");
										
					addVaultEntries(vault, function (error, response){
						if (error) {
			                console.log("Could not add vault entries: " + 
			                    error.message);
			                console.log("Could not add vault entries: " + 
			                    JSON.stringify(error));
							defer.reject(error)
						} else {
			                console.log("Added vault entries.");
							defer.resolve(response)
						}
					})					
					defer.resolve(response)
	            }
	        });
        },
        function (error) {
            if (error) {
				defer.reject(error)
            } else {
				defer.resolve(response)
            }
        });
	    return defer.promise;
	}
}

function addVaultEntries(vault, callback) {

	var options = baseopts();
	var defer = q.defer();
	
    var host = options.host;
    var org = options.organization;
    var env = options.environment;
	
	var vaultName = vault.name;
	var entries = vault.entries;
	
    async.each(entries, function (entry,
        callback) {

		console.log('\nentry config: ' + JSON.stringify(entry));
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
        
        console.log('\nAdding vault entry: ' +
			entryName + ' : ' + entryValue);       
		console.log(JSON.stringify(requestOptions));
		
        makeRequest(requestOptions, function (error,
            response) {
            if (error) {
                console.log("Could not add vault entry: " + 
                    error.message);
		            callback(error, null);
            } else {
                console.log("Added vault entry.");
                console.log("\n" + JSON.stringify(response));
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



function baseopts () {
    // console.log('gutil-baas2: ' + JSON.stringify(gutil.env));
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
    }
    // console.log('opts: ' + JSON.stringify(opts));
    return opts
}

function makeRequest(options, callback) {
    
    sleep.sleep(1);
    
    request(options, function (error, response) {
        var errorObject = new Error();
        
		// console.log('\nresponse: ' + JSON.stringify(response))
		
        if (error) {
            console.log('\nError: ' + error);
            // console.log('Status code: ' + response.statusCode);
            
            // errorObject.message = error.message;
            // errorObject.statusCode = error.statusCode;
            callback(error, null);
        } else if (response.statusCode !== 200 && response.statusCode !== 201) {
            // console.log('\nRequest -- not success: ' + options.method + ' ' + options.uri);
			
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
            // console.log('\nError object -- not success: ' + JSON.stringify(errorObject));
            callback(errorObject, null);
        } else {            
            // console.log('\nRequest: ' + options.method + ' ' + options.uri);
            // console.log('Status code: ' + response.statusCode);
            // console.log('Response body: ' + response.body);
            
            if (response.body) {
                var callbackResponse;
                try {
                    var bodyObj = JSON.parse(response.body);
                    callbackResponse = bodyObject
                    callback(null, bodyObj);                    
                } catch (exception) {
                    callback(null, response);                    
                }
            }
        }
    });
}
