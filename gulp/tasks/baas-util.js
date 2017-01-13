var async = require('async');
var fs = require('fs');
var gutil = require('gulp-util');
var q = require('q');
var querystring = require('querystring');
var request = require('request');
var sleep = require('sleep');

module.exports = {

    createGroups: function (groups) {

		var opts = baseopts();
		var callback = q.defer();

		var opts = baseopts();
		var defer = q.defer();
		
        var clientId = opts.usergrid_client_id;
        var clientSecret = opts.usergrid_secret;
        
        var baasHost = opts.usergrid_host;
        var orgName = opts.usergrid_org;
        var appName = opts.usergrid_app;
		
        if (groups && groups.length > 0)
        {
            async.each(groups, function (group, callback) {
                var title = group.title;
                var path = group.path;
                
                var uri = baasHost + '/' + orgName + '/' + 
                    appName + '/groups/' + path + '?client_id=' + 
                    clientId + '&client_secret=' + clientSecret;
                
				deleteGroup(path, uri, function(error, response){
                    if (error) {
                        callback(error, null);
                    } else {
                        var groupBody = {
                            "path" : path,
                            "title" : title
                        };
                        
                        var uri = baasHost + '/' + orgName + '/' +
                            appName + '/groups?client_id=' + clientId + 
                            '&client_secret=' + clientSecret;
                            
                        var options = {
                            uri: uri,
                            body: JSON.stringify(groupBody),
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            method: "POST"
                        };
                        console.log('\nCreating group: ' + path);
                        return makeRequest(options, function (error, response) {
                            if (error && error.statusCode != '201')
                            {
                                callback(error, null);
                            } else if (response.statusCode == 400) {
                                var body = response.body;
                                var error = JSON.parse(body).error;
                                callback(error, null);
                            } else {
                                var body = JSON.parse(response.body);
                                var entities = body.entities;
                                var groupPath = entities[0].path;
                                callback(null, response);                        
                            }
                        });
                    }
                });                        
            },
            function (error) {
	            if (error) {
	                console.log("Could not create groups: " + 
	                    error.message);
					defer.reject(error)
	            } else {
	                console.log("Created groups.");
					defer.resolve()
	            }
            });
        }        
		return defer.promise;		
    },

    deleteGroups: function (groups) {
		var opts = baseopts();
		var defer = q.defer();
		
        var clientId = opts.usergrid_client_id;
        var clientSecret = opts.usergrid_secret;
        
        var baasHost = opts.usergrid_host;
        var orgName = opts.usergrid_org;
        var appName = opts.usergrid_app;
        
        if (groups && groups.length > 0)
        {
            async.each(groups, function (group, callback) {
                var title = group.title;
                var path = group.path;
                
                var uri = baasHost + '/' + orgName + '/' + 
                    appName + '/groups/' + path + '?client_id=' + 
                    clientId + '&client_secret=' + clientSecret;
                
				deleteGroup(path, uri, function(error, response){
                    if (error) {
                        callback(error, null);
                    } else {
						callback(null, response);
                    }
                });                        
            },
            function (error) {
	            if (error) {
	                console.log("Could not delete groups: " + 
	                    error.message);
					defer.reject(error)
	            } else {
	                console.log("Deleted groups.");
					defer.resolve()
	            }
            });
        }
		return defer.promise;		
	},
    
    createRoles: function (roles) {
		var opts = baseopts();
		var defer = q.defer();
		
        var clientId = opts.usergrid_client_id;
        var clientSecret = opts.usergrid_secret;
        
        var baasHost = opts.usergrid_host;
        var orgName = opts.usergrid_org;
        var appName = opts.usergrid_app;
		       
        if (roles && roles.length > 0)
        {			
            async.each(roles, function (role, callback) {
			
            var roleTitle = role.title;
            var roleName = role.name;
			
            var roleBody = {
                "name" : roleName,
                "title" : roleTitle
            };
            
            // Now create the new role from the config file.
            uri = baasHost + '/' + orgName + '/' + 
                appName + '/roles?client_id=' + clientId +
                '&client_secret=' + clientSecret;
            
            var options = {
                uri: uri,
                body: JSON.stringify(roleBody),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: "POST"
            };
            console.log('\nCreating role: ' + roleName);
            return makeRequest(options, function (error, response) {
                if (error)
                {
	                console.log('\nCould not create role: ' + 
	                    error.message);
					defer.reject(error)
                    // callback(error, null);
                } else {
                    var body = JSON.parse(response.body);
                    var entities = body.entities;
                    var roleName = entities[0].name;

                    if (role.permissions && 
                        (role.permissions.length > 0)) {
                        var permissions = role.permissions;
                        
                        async.each(permissions, function (permission, 
                            callback) {
                        
                            var uri = baasHost + '/' +
                                orgName + '/' + appName + 
                                '/roles/' + roleName + 
                                '/permissions?client_id=' + clientId +
                                '&client_secret=' + clientSecret;

                            var verbs = permission.verbs;
                            var path = permission.path;
                            
                            var permissionsBody = { 
                                "permission" : verbs + ':' + path
                            };
                            
                            var options = {
                                uri: uri,
                                body: JSON.stringify(permissionsBody),
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                method: "POST"
                            };
                            return makeRequest(options, function (error, 
                                response) {
                                if (error && error.statusCode != 200)
                                {
                                    callback(error, null);
                                    process.exit();
                                } else {
                                    var body = response.body;
                                    var data = JSON.parse(body).data;    
                                    callback(null, response);
                                }
                            });
                        }, 
                        
                        function (error) {
                            if (error) { 
                                callback(error, null);                                    
                            } else {
                                callback(null, 'Added role: ' + 
                                    roleName);
                            }
                        });
                    }
                }
            });			
        },
        function (error) {
            if (error) {
                console.log("Could not create roles: " + 
                    error.message);
				defer.reject(error)
            } else {
                console.log("Created roles.");
				defer.resolve();
            }
        });
	}
		return defer.promise;			
    },

    deleteRoles: function (roles) {
		var opts = baseopts();
		var defer = q.defer();
		
        var clientId = opts.usergrid_client_id;
        var clientSecret = opts.usergrid_secret;
        
        var baasHost = opts.usergrid_host;
        var orgName = opts.usergrid_org;
        var appName = opts.usergrid_app;


        if (roles && roles.length > 0)
        {
            async.each(roles, function (role, callback) {
                var roleTitle = role.title;
                var roleName = role.name;
                
                var uri = baasHost + '/' + orgName + '/' + 
				appName + '/roles/' + roleName + '?client_id=' + clientId + 
                    '&client_secret=' + clientSecret;
                
                // To keep things clean, delete the role if it's there.
                deleteRole(roleName, uri, function(error, response){
                    if (error) {
                        callback(error, null);
                    } else {
						callback(null, response);
                    }
                });                
            },
            function (error) {
	            if (error) {
	                console.log("Could not delete groups: " + 
	                    error.message);
					defer.reject(error)
	            } else {
	                console.log("Deleted groups.");
					defer.resolve()
	            }
            });
        }
		return defer.promise;		
	},

    
    assignRolesToGroups: function (groups) {

		var opts = baseopts();
		var defer = q.defer();
		
        var clientId = opts.usergrid_client_id;
        var clientSecret = opts.usergrid_secret;
        
        var baasHost = opts.usergrid_host;
        var orgName = opts.usergrid_org;
        var appName = opts.usergrid_app;
		           
        async.each(groups, function (group, callback) {
            var groupPath = group.path;
            var roles = group.roles;
            
            if (group.roles && (group.roles.length > 0)) {
                
                async.each(roles, function (role, callback) {
                    var roleName = role.name;
                    
                    var uri = baasHost + '/' + orgName + '/' + appName + 
                        '/roles/' + roleName + '/groups/' + groupPath + '?client_id=' +
                            clientId + '&client_secret=' + clientSecret;
    
                    var options = {
                        uri: uri,
                        method: "POST"
                    };
                    console.log('\nAssigning ' + roleName + ' role to ' + 
                        groupPath + ' group.' );
                    return makeRequest(options, function (error, response) {
                        if (error && (error.statusCode != '201') && 
                            (error.statusCode != '200'))
                        {
                            callback(error, null);
                            process.exit();
                        } else {
                            var body = response.body;
                            var entities = JSON.parse(body).entities;    
          
                            callback(null, response);
                        }
                    });
                },
                function (error) {
                    if (error) {
                        callback(error, null);
                    } else {
                        callback(null, 'Assigned roles to groups.');
                    }
                });
            }
        },
        function (error) {
            if (error) {
                console.log("Could not create roles: " + 
                    error.message);
				defer.reject(error)
            } else {
                console.log("Created roles.");
				defer.resolve();
            }
        });
		return defer.promise;			
    }
}

function deleteGroup(groupName, uri, callback) {
    
    var options = {
        uri: uri,
        headers: {
            'Content-Type': 'application/json'
        },
        method: "DELETE"
    };
    console.log('\nDeleting group: ' + groupName)
    return makeRequest(options, function (error, response) {
        if (error)
        {
            if (error.statusCode !== 404){
                callback(error, null);
            } else {
                callback();
            }
        } else {
            callback(null, response);
        }
    });
}

function deleteRole(roleName, uri, callback) {
    
    var options = {
        uri: uri,
        headers: {
            'Content-Type': 'application/json'
        },
        method: "DELETE"
    };
    console.log('\nDeleting role: ' + roleName)
    return makeRequest(options, function (error, response) {
        if (error)
        {
            if (error.statusCode !== 404){
                callback(error, null);
            } else {
                callback();
            }
        } else {
            callback(null, response);
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
        usergrid_host: gutil.env.baas_api
    }
    // console.log('opts: ' + JSON.stringify(opts));
    return opts
}

function makeRequest(options, callback) {
    
    sleep.sleep(1);
    
    request(options, function (error, response) {
        var errorObject = new Error();
        
        if (error) {
            console.log('\nRequest: ' + options.method + ' ' + options.uri);
            console.log('Status code: ' + response.statusCode);
            
            errorObject.message = error.message;
            errorObject.statusCode = error.statusCode;
            callback(errorObject, null);
        } else if (response.statusCode !== 200 && response.statusCode !== 201) {
            console.log('\nRequest: ' + options.method + ' ' + options.uri);
            
            var bodyObj = JSON.parse(response.body);
            if (bodyObj.fault) {
                var fault = bodyObj.fault;
                errorObject.message = fault.faultstring;
            } else if (response.statusMessage) {
                errorObject.message = response.statusMessage;
            }
            errorObject.statusCode = response.statusCode;
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