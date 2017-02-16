var async = require('async');
var fs = require('fs');
var querystring = require('querystring');
var request = require('request');
var sleep = require('sleep');

module.exports = {

    createBaasGroups: function (baasConfig, callback) {

        var clientId = baasConfig.baasApp.clientId;
        var clientSecret = baasConfig.baasApp.clientSecret;
        
        var apiBaaSHost = baasConfig.baasApp.apiHost;
        var orgName = baasConfig.baasApp.orgName;
        var appName = baasConfig.baasApp.appName;
        
        if (baasConfig.groups && baasConfig.groups.length > 0)
        {
            var groups = baasConfig.groups;
            
            async.each(groups, function (group, callback) {
                var title = group.title;
                var path = group.path;
                
                var uri = apiBaaSHost + '/' + orgName + '/' + 
                    appName + '/groups/' + path + '?client_id=' + 
                    clientId + '&client_secret=' + clientSecret;
                
                // To keep things clean, delete the group if it's there.
                deleteGroup(path, uri, function(error, response){
                    if (error) {
                        callback(error, null);
                    } else {
                        var groupBody = {
                            "path" : path,
                            "title" : title
                        };
                        
                        var uri = apiBaaSHost + '/' + orgName + '/' +
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
                    callback(error, null);
                } else {
                    callback(null, 'Added groups.');
                }
            });
        }        
    },
    
    /**
     * Create roles and permissions in API BaaS according to 
     * roles defined in the config file.
     */
    createBaasRoles: function (baasConfig, callback) {
       
        var clientId = baasConfig.baasApp.clientId;
        var clientSecret = baasConfig.baasApp.clientSecret;
        
        var apiBaaSHost = baasConfig.baasApp.apiHost;
        var orgName = baasConfig.baasApp.orgName;
        var appName = baasConfig.baasApp.appName;
        
        if (baasConfig.roles && baasConfig.roles.length > 0)
        {
            var roles = baasConfig.roles;
            
            async.each(roles, function (role, callback) {
                var roleTitle = role.title;
                var roleName = role.name;
                
                var uri = apiBaaSHost + '/' + orgName + '/' + appName + 
                    '/roles/' + roleName + '?client_id=' + clientId + 
                    '&client_secret=' + clientSecret;
                
                // To keep things clean, delete the role if it's there.
                deleteRole(roleName, uri, function(error, response){
                        if (error)
                        {
                            callback(error, null);
                        } else {
                        var roleBody = {
                            "name" : roleName,
                            "title" : roleTitle
                        };
                        
                        // Now create the new role from the config file.
                        uri = apiBaaSHost + '/' + orgName + '/' + 
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
                                callback(error, null);
                                process.exit();
                            } else {
                                var body = JSON.parse(response.body);
                                var entities = body.entities;
                                var roleName = entities[0].name;
        
                                if (role.permissions && 
                                    (role.permissions.length > 0)) {
                                    var permissions = role.permissions;
                                    
                                    async.each(permissions, function (permission, 
                                        callback) {
                                    
                                        var uri = apiBaaSHost + '/' +
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
                                            if (error && error.statusCode != '200')
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
                    }
                });                
            },
            function (error) {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, 'Added roles.');
                }
            });
        }        
    },
    
    assignBaasRolesToGroups: function (baasConfig, callback) {
    
        var clientId = baasConfig.baasApp.clientId;
        var clientSecret = baasConfig.baasApp.clientSecret;
        var apiBaaSHost = baasConfig.baasApp.apiHost;
        var orgName = baasConfig.baasApp.orgName;
        var appName = baasConfig.baasApp.appName;        
        var groups = baasConfig.groups;
                
        async.each(groups, function (group, callback) {
            var groupPath = group.path;
            var roles = group.roles;
            
            if (group.roles && (group.roles.length > 0)) {
                
                async.each(roles, function (role, callback) {
                    var roleName = role.name;
                    
                    var uri = apiBaaSHost + '/' + orgName + '/' + appName + 
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
                callback(error, null);
            } else {
                callback(null, 'Added groups.');
            }
        });
    },
    
    getAppKeyAndSecret: function (app, options, callback){

        console.log('Getting app key and secret.');

        var host = options.host;
        var org = options.organization;
	
        var keySecret = {
            "consumerKey": "",
            "consumerSecret": ""
        };
        var appName = app.name;
        var developerEmail = app.email;

        var uri = host + '/v1/' +
            'o/' + org + 
            '/developers/' + developerEmail +
            '/apps/' + appName;
    
        var requestOptions = {
            uri: uri,
            auth: {
                user: options.userName,
                password: options.password
            },
            method: "GET"
        };
        makeRequest(requestOptions, function (error, response) {
            if (error) {
                console.log('\nCould not get app for key/secret: ' +
                    error);
                    callback(error, null);
            } else {
                console.log("\nGot consumer key and secret");
                keySecret.consumerKey =
                    JSON.parse(response.body).credentials[0].consumerKey;
                keySecret.consumerSecret = 
                    JSON.parse(response.body).credentials[0].consumerSecret;
    			callback(null, keySecret);
            }
        });
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

function makeRequest(options, callback) {
    
    sleep.sleep(1);
    
    request(options, function (error, response) {
        var errorObject = new Error();
        
        if (error) {
            console.log('\nRequest: ' + options.method + ' ' + options.uri);
            // console.log('\nResponse: ' + JSON.stringify(response));
            // console.log('Status code: ' + response.statusCode);
            
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
            // console.log('\nStatus code: ' + response.statusCode);
            // console.log('\nResponse body: ' + response.body);
            
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