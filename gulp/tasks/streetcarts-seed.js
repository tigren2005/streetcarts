var async = require('async');
var fs = require('fs');
var gutil = require('gulp-util');
var q = require('q');
var querystring = require('querystring');
var request = require('request');
var sleep = require('sleep');
// var apigeeAppConfig = require('./apigee-app-config');
// var prompt = require('prompt');

// Edge app
var orgName = '';
var envName = '';
var domain = '';
var appName = '';
var appUri = '';

var consumerKey = '';
var consumerSecret = '';

module.exports = {

	createUserAccounts: function(users) {
    
		var opts = baseopts();
		var defer = q.defer();
		
        var domain = opts.app_domain;
        var org = opts.organization;
        var env = opts.environment;
        var rev = '1';
        var appName = 'streetcarts';

        var appUri = 'https://' + org + '-' + env + '.' + domain +
        '/v1/' + appName;

        consumerKey = opts.app_consumer_key;
        consumerSecret = opts.app_consumer_secret;
		
	    endpointPath = '/users';
	    var uri = appUri + endpointPath;
		
	    if (users.length > 0) {
        
	        async.each(users, function (user, callback) {	            
	            console.log('\nCreating user ' + user.username);
	            var options = {
	                uri: uri,
	                body: JSON.stringify(user),
	                headers: {
	                    'Content-Type': 'application/json',
	                    'x-api-key': consumerKey
	                },
	                method: "POST"
	            };
	            return makeRequest(options, function (error, response) {
	                if (error) {
	                    if ((error.statusCode === 400) && error.message.indexOf('exists')) {
	                        console.log('\nError: ' + error.message);
	                    } else if (error.statusCode === 200){
	                        // Do nothing.
	                    } else {
	                        callback(error, null);                        
	                    }
	                } else {
	                    // var body = JSON.parse(response.body);
	                    // if ((body.statusCode === 400) && body.message.indexOf('exists')) {
	                    //     console.log('\nBody: ' + body.message);
	                    // }
	                    callback(null, response);
	                }
	            });
	        },
	        function (error) {
	            if (error) {
	                console.log("Could not create user accounts: " + 
	                    error.message);
					defer.reject(error);
	            } else {
	                console.log("Created user accounts.");
					defer.resolve();
	            }
	        });
	    }
		return defer.promise;
	},

	createFoodcarts: function(foodcartsData, usersData) {
	    console.log('\n\Creating foodcarts.');

		var opts = baseopts();
		var defer = q.defer();

        var domain = opts.app_domain;
        var org = opts.organization;
        var env = opts.environment;
        var rev = '1';
        var appName = 'streetcarts';

        appUri = 'https://' + org + '-' + env + '.' + domain +
        '/v1/' + appName;

        consumerKey = opts.app_consumer_key;
        consumerSecret = opts.app_consumer_secret;
		
	    endpointPath = '/foodcarts';
	    var uri = appUri + endpointPath;
    
	    if (foodcartsData.foodcarts.length > 0) {
        
	        async.forEachOf(foodcartsData.foodcarts, function (foodcarts, key, callback) {
	            var foodcart = JSON.stringify(foodcarts);
            
	            // grab a user and log in to get a token
	            var userData = usersData[key];
	            var username = userData.username;
	            var password = userData.password;
            
	            console.log('\nAuthenticating: ' + username);
	            authenticateUser(username, password, function (error, response) {
	                if (error) {
	                    console.log('\nError authenticating user: ' + username + '\n ' +
	                        JSON.stringify(error));
	                    callback(error, null);
	                } else {
	                    var access_token = JSON.parse(response.body).access_token;
	                    console.log(username + ' authenticated with token: ' + access_token);
                    
	                    var foodcartEntity = JSON.parse(foodcart);
	                    var itemsData = foodcartEntity.items;
	                    var menusData = foodcartEntity.menus;
                    
	                    delete foodcartEntity.items;
	                    delete foodcartEntity.menus;
                    
	                    var options = {
	                        uri: uri,
	                        body: JSON.stringify(foodcartEntity),
	                        headers: {
	                            'Content-Type': 'application/json',
	                            'Authorization': 'Bearer ' + access_token
	                        },
	                        method: "POST"
	                    };

	                    makeRequest(options, function (error, response) {
	                        if (error) {
	                            console.log('\nError creating foodcart "' + 
									foodcartEntity.cartName + '"\n ' + 
	                                JSON.stringify(error));
	                            callback(error, null);
	                        } else {
	                            var foodcart;
	                            try {
	                               foodcart = JSON.parse(response.body);
	                            } catch (exception) {
	                               foodcart = response.body;
	                            }                        
	                            var foodcartUUID = foodcart.uuid;
                            
	                            // Reuse the options object because it has the 
	                            // token in it.
	                            createItemsForFoodcart(foodcartUUID, itemsData, options,
	                            function (error, itemsResponse) {
                                
	                                if (error) {
	                                    console.log('\nError creating an item: \n' + 
	                                        JSON.stringify(error));
	                                    callback(error, null);
	                                } else {
	                                    var itemsUUIDs = itemsResponse;
                                    
	                                    createMenusForFoodcart(foodcartUUID, menusData, options,
	                                    function (error, menusResponse) {
	                                        if (error) {
	                                            callback(error);
	                                        } else {
	                                            var menusUUIDs = menusResponse;
	                                            addItemsToMenu(menusUUIDs[0], itemsUUIDs, options,
	                                            function (error, response) {
	                                                if (error) {
	                                                    callback(error, null);
	                                                } else {
	                                                    callback(null, response);
	                                                }
	                                            });
	                                        }
	                                    });
	                                }
	                            });
	                        }
	                    });
	                }
	            });
	        },
	        function (error) {
	            if (error) {
	                console.log("Could not import foodcart data: " + 
	                    error.message);
						defer.reject(error);
	            } else {
	                console.log("Imported foodcart data.");
					defer.resolve();
	            }
	        });
	    }
		return defer.promise;
	}
}

function createItemsForFoodcart(foodcartUUID, itemsData, options, callback) {
    console.log('\nCreating menu items.');

    endpointPath = '/foodcarts/' + foodcartUUID + '/items';
    var uri = appUri + endpointPath;

    var itemsUUIDs = [];

    if (itemsData.length > 0) {
    
        async.each(itemsData, function (itemData, callback) {
            var item = JSON.stringify(itemData);
        
            options.uri = uri;
            options.body = item;
        
            makeRequest(options, function (error, response) {
                if (error) {
                    callback(error, null);
                } else {
                    var item;
                    try {
                       item = JSON.parse(response.body);
                    } catch (exception) {
                       item = response.body;
                    }
                    itemsUUIDs.push(item.uuid);
                    callback(null, '');
                }
            });
        },
        function (error) {
            if (error) {
                callback(error, null);
            } else {                
                callback(null, itemsUUIDs);
            }
        });
    } else {
        callback('No data about items was provided.', null);
    }
}

function createMenusForFoodcart(foodcartUUID, menusData, options, callback) {
    console.log('\nCreating menus.');

    endpointPath = '/foodcarts/' + foodcartUUID + '/menus';
    var uri = appUri + endpointPath;

    var menusUUIDs = [];

    if (menusData.length > 0) {
    
        async.each(menusData, function (menuData, callback) {
            options.uri = uri;
            options.body = JSON.stringify(menuData);
        
            return makeRequest(options, function (error, response) {
                if (error) {
                    callback(error, null);
                } else {
                    menu = JSON.parse(response.body);
                    menusUUIDs.push(menu.uuid);
                    callback(null, '');
                }
            });
        },
        function (error) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, menusUUIDs);
            }
        });
    } else {
        callback('No data about menus was provided.', null);
    }
}

function addItemsToMenu(menuUUID, itemsUUIDs, options, callback) {

    endpointPath = '/menus/' + menuUUID + '/items/';

    if (itemsUUIDs.length > 0) {
    
        async.each(itemsUUIDs, function (itemUUID, callback) {
        
            var uri = appUri + endpointPath + itemUUID;
        
            options.uri = uri;
            options.method = 'PUT';
            delete options.body;
        
            return makeRequest(options, function (error, response) {
                if (error) {
					console.log('\nError connecting items to menu' + JSON.stringify(error));
                    callback(error, null);
                } else {
                    callback(null, '');
                }
            });
        },
        function (error) {
            if (error) {
				// console.log('\nError connecting items to menu' + JSON.stringify(error));
                callback(error, null);
            } else {
                callback(null, menuUUID);
            }
        });
    } else {
        callback('No data about menus was provided.', null);
    }
}

function authenticateUser(username, password, callback) {

    endpointPath = '/accesstoken';
    var uri = appUri + endpointPath;

    var auth = "Basic " + new Buffer(consumerKey +
    ":" + consumerSecret).toString("base64");

    var form = {
        username: username,
        password: password,
        grant_type: 'password'
    };

    var formData = querystring.stringify(form);
    var contentLength = formData.length;

    var options = {
        headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': auth,
            'x-api-key': consumerKey
        },
        uri: uri,
        body: formData,
        method: 'POST'
    };

    return makeRequest(options, function (error, response) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, response);
        }
    });
}

function baseopts () {
    var opts = {
        host: gutil.env.host,
        token: gutil.env.token,
        organization: gutil.env.org,
        environments: gutil.env.env,    
        environment: gutil.env.env,
        debug: gutil.env.debug,
        app_domain: gutil.env.domain,
        app_consumer_key: gutil.env.consumer_key,
        app_consumer_secret: gutil.env.consumer_secret,
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

    // Slow the pace of requests to avoid having the 
    // StreetCarts spike arrest shut down access.
    sleep.sleep(1);
    
    request(options, function (error, response) {
        var errorObject = new Error();
        
        if (error) {
            console.log('\nRequest: ' + options.method + ' ' + options.uri +
                '\nHeaders: ' + JSON.stringify(options.headers));
            errorObject.message = error.message;
            errorObject.statusCode = error.statusCode;
            callback(errorObject, null);
            // process.exit();
        } else if (response.statusCode !== 200) {
            console.log('\nRequest: ' + options.method + ' ' + options.uri +
                '\nHeaders: ' + JSON.stringify(options.headers));
            console.log('Status code: ' + response.statusCode);
            
            var bodyObj;
            try {
                bodyObj = JSON.parse(response.body);
            } catch (exception) {
                bodyObj = response.body;
            }
            if (bodyObj.fault) {
                var fault = bodyObj.fault;
                errorObject.message = fault.faultstring;
            } else if (response.statusMessage) {
                errorObject.message = response.statusMessage;
            }
            errorObject.statusCode = response.statusCode;
            callback(errorObject, null);
            // process.exit();
        } else {
            // console.log('\nRequest: ' + options.method + ' ' + options.uri);
            // console.log('\nHeaders: ' + JSON.stringify(options.headers));
            // console.log('\nStatus code: ' + response.statusCode);
            // console.log('\nResponse: ' + JSON.stringify(response));

            if (response.body) {
                var bodyObj = JSON.parse(response.body);
                if ((bodyObj.statusCode) && (bodyObj.statusCode !== 200)) {
					// console.log('\nResponse body status: ' + bodyObj.statusCode);
                    errorObject.statusCode = bodyObj.statusCode;
                    if (bodyObj.fault) {
                        var fault = bodyObj.fault;
                        errorObject.message = fault.faultstring;
	                    callback(errorObject, null);
                    } else if (bodyObj.message) {
						if (bodyObj.message.includes('Entity \"user\" requires ' + 
							'that property named \"email\" be unique')){
							callback(null, response);
						} else {
	                        errorObject.message = bodyObj.message;							
		                    callback(errorObject, null);
						}
                    } else if (response.statusMessage) {
                        errorObject.message = response.statusMessage;
	                    callback(errorObject, null);
                    }
                    // process.exit();
                } else if ((bodyObj.message) && (bodyObj.message.indexOf('OK') < 0)) {
                    errorObject.message = bodyObj.message;
                    callback(errorObject, null);
                    // process.exit();
                } else {
                	callback(null, response);
                }
            }
        }
    });
}