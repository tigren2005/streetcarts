var q = require('q');
var async = require('async');
var gutil = require('gulp-util');
var request = require('request');
var sleep = require('sleep');
var util = require('util');

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
            console.log('\nCould not install node modules: ' + 
                error.message);
			defer.reject(error);
        } else {
			defer.resolve(response);
        }
    });
    return defer.promise;
}

function redeployProxy(proxyName) {

	var opts = baseopts();
	var defer = q.defer();
	
    var host = opts.host;
    var org = opts.organization;
    var env = opts.environment;
    var rev = '1';
    
	var uri = util.format('%s/v1/o/%s/e/%s/apis/%s/revisions/%s/deployments', host, org, 
        env, proxyName, rev);
        
    var options = {
        uri: uri,
        auth: {
            'bearer': opts.token
        },
        method: "DELETE"
    };

    makeRequest(options, function (error, response) {
        if (error) {
            console.log('\nCould not undeploy proxy: ' + proxyName + 
                '\n' + error.message);
			defer.reject(error);
        } else {
            console.log('\nUndeployed proxy: ' + proxyName);
            
        	var uri = util.format('%s/v1/o/%s/e/%s/apis/%s/revisions/%s/deployments?override=true', 
                host, org, env, proxyName, rev);
        
            var options = {
                uri: uri,
                auth: {
                    'bearer': opts.token
                },
                method: "POST"
            };

            makeRequest(options, function (error, response) {
                if (error) {
                    console.log('\nCould not deploy proxy: ' + proxyName + 
                        '\n' + error.message);
        			defer.reject(error);
                } else {
                    console.log('\nDeployed proxy: ' + proxyName);            
        			defer.resolve(response);
                }
            });            
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
    
    var requestOptions = {
        uri: uri,
        auth: {
            'bearer': options.token
        },
        method: "GET"
    };
    makeRequest(requestOptions, function (error, response) {
        if (error) {
            console.log('\nCould not get app for key/secret: ' +
                error);
                callback(error, null);
        } else {
            console.log('\nGot consumer key and secret');
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
    
    // sleep.sleep(1);
    
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
	getAppKeyAndSecret: getAppKeyAndSecret,
    redeployProxy: redeployProxy
}

