var gulp = require('gulp');
var build = require('gulp-build')
var apigeetool = require('apigeetool')
var async = require('async')
var gutil = require('gulp-util')
var edge = require('./edge.js')
var request = require('request');
var requireDir = require('require-dir')
var tasksDir = requireDir('./tasks')

gulp.task('default', function () {
    // place code for your default task here
});

var apilist =[
    { dir: 'build/gateway/accesstoken', proxy: 'accesstoken' }, 
    { dir: 'build/gateway/data-manager', proxy: 'data-manager' }, 
    { dir: 'build/gateway/foodcarts', proxy: 'foodcarts' }, 
    { dir: 'build/gateway/items', proxy: 'items' }, 
    { dir: 'build/gateway/menus', proxy: 'menus' }, 
    { dir: 'build/gateway/reviews', proxy: 'reviews' }, 
    { dir: 'build/gateway/users', proxy: 'users' }
]

var apiProducts =[ {
    "apiResources":[ "/"],
    "approvalType": "auto",
    "attributes":[ {
        "name": "access",
        "value": "public"
    }],
    "displayName": "SC-PRODUCT-UNLIMITED",
    "name": "SC-PRODUCT-UNLIMITED",
    "environments":[ 
        "test", 
        "prod"
    ],
    "quota": "1000000",
    "quotaInterval": "1",
    "quotaTimeUnit": "second",
    "scopes":[
        "owner.read",
        "owner.create",
        "owner.update",
        "owner.delete",
        "reviewer.create",
        "reviewer.read",
        "manager.update",
        "manager.read"
    ],
    "proxies":[
        "foodcarts",
        "menus",
        "items",
        "users",
        "accesstoken"
    ]
}, {
    "apiResources":["/"],
    "approvalType": "auto",
    "attributes":[ {
        "name": "access",
        "value": "public"
    }],
    "displayName": "SC-PRODUCT-TRIAL",
    "name": "SC-PRODUCT-TRIAL",
    "environments":[
        "test",
        "prod"
    ],
    "scopes":[
        "openid",
        "atms",
        "branches"
    ],
    "proxies":[
        "foodcarts",
        "menus",
        "items",
        "users",
        "accesstoken"
    ],
    "quota": "1000",
    "quotaInterval": "1",
    "quotaTimeUnit": "day",
    "scopes":[
        "owner.read",
        "owner.create",
        "owner.update",
        "owner.delete",
        "reviewer.create",
        "reviewer.read",
        "manager.update",
        "manager.read"
    ]
}, {
    "apiResources":[
        "/PUT/v1/streetcarts/data-manager/**",
        "/DELETE/v1/streetcarts/data-manager/**",
        "/POST/v1/streetcarts/data-manager/**",
        "/GET/v1/streetcarts/data-manager/**"
    ],
    "approvalType": "auto",
    "attributes":[ {
        "name": "access",
        "value": "public"
    }],
    "description": "",
    "displayName": "SC-DATA-MANAGER-PRODUCT",
    "environments":[
        "test",
        "prod"
    ],
    "name": "SC-DATA-MANAGER-PRODUCT",
    "proxies":[
        "data-manager"
    ],
    "scopes":[""]
}]

var developers =[ {
    "email": "streetcarts-developer@example.com",
    "firstName": "StreetCarts",
    "lastName": "Developer",
    "userName": "streetcartsdev",
    "status": "active"
}]

var apps =[ {
    "name": "SC-APP-UNLIMITED",
    "apiProducts": "SC-PRODUCT-UNLIMITED",
    "attributes":[ {
        "name": "DisplayName",
        "value": "SC-APP-UNLIMITED"
    }],
    "callbackUrl": 'http://streetcarts.com',
    "email": "streetcarts-developer@example.com",
    "keyExpiresIn": "100000000000",
    "scopes":[]
}, {
    "name": "SC-APP-TRIAL",
    "apiProducts": "SC-PRODUCT-TRIAL",
    "attributes":[ {
        "name": "DisplayName",
        "value": "SC-APP-TRIAL"
    }],
    "callbackUrl": "http://streetcarts.com",
    "email": "streetcarts-developer@example.com",
    "keyExpiresIn": "100000000000",
    "scopes":[]
}, {
    "name": "SC-DATA-MANAGER-APP",
    "apiProducts": "SC-DATA-MANAGER-PRODUCT",
    "attributes":[ {
        "name": "DisplayName",
        "value": "SC-DATA-MANAGER-APP"
    }],
    "callbackUrl": "http://streetcarts.com",
    "email": "streetcarts-developer@example.com",
    "keyExpiresIn": "100000000000",
    "scopes":[]
}]

var kvms = [ {
    "name": "DATA-MANAGER-API-KEY"
}]

var kvmEntries = [ {
    "name": "X-DATA-MANAGER-KEY",
    "value": "",
    "mapName": "DATA-MANAGER-API-KEY"
}]

var vaultEntries = [
    {
        "name": "streetcarts",
        "scope": "environment",
        "entries" :[
            {
                "name": "datastore-client-id",
                "value": gutil.env.usergrid_client_id
            },
            {
                "name": "datastore-client-secret",
                "value": gutil.env.usergrid_secret
            },
            {
                "name": "datastore-client-token",
                "value": ""
            }
        ]
    }
]

//    dir: '../streetcarts/proxies/src/gateway/data-manager', proxy: 'data-manager'


gulp.task('build',function(){    
//    var opts = baseopts()
    var baas_org = gutil.env.usergrid_org;
    var baas_app = gutil.env.usergrid_app;
    var baas_api = gutil.env.baas_api;
    
    console.log('BaaS org: ' + baas_org);
    
    var replace_opts = {
        BAASAPIREPLACE: baas_api,
        BAASORGREPLACE: baas_org,
        BAASAPPREPLACE: baas_app
    }
    new Promise(function(resolve,reject){
        gulp.src('../streetcarts/proxies/src/gateway/**/*')
        .pipe(gulp.dest('build/gateway'))
        .on('end',resolve)
    }).then(function(){
        gulp.src('build/gateway/data-manager/apiproxy/resources/node/data-manager.js')        
        .pipe(build(replace_opts))
        .pipe(gulp.dest('build/gateway/data-manager/apiproxy/resources/node'))
    })        
})

gulp.task('deploy',['build'], function(){
            return edge.run(apilist, edge.deployApis)
    .then(
        function () {
            return edge.run(developers, edge.createDevelopers)
        },
        function (err) {
            console.log('Unable to deploy APIs. ' + 
                'Moving on to create developers.\n' + 
                err);
            return edge.run(developers, edge.createDevelopers)            
        }
    ).then(
        function () {
            return edge.run(apiProducts, edge.createProducts)
        },
        function (err) {
            console.log('Unable to create developers. ' + 
                'Moving on to create create products.\n' + 
                err);
            return edge.run(apiProducts, edge.createProducts)
        }
    ).then(
        function () {
            return edge.run(apps, edge.createApps)
        },
        function (err) {
            console.log('Unable to create products. ' + 
                'Moving on to create apps.\n' + 
                err);
            return edge.run(apps, edge.createApps)
        }
    ).then(
        function () {
            return edge.run(kvms, edge.createKVMs)
        },
        function (err) {
            console.log('Unable to create apps. ' + 
                'Moving on to create key-value maps.\n' + 
                err);
            return edge.run(kvms, edge.createKVMs)
        }
    ).then(
        function () {
            var host = "http://api.enterprise.apigee.com/";
            var org = gutil.env.org;
            var env = gutil.env.env;
            var uri = host + "v1/o/" + org +
                "/developers/streetcarts-developer@example.com/apps/SC-DATA-MANAGER-APP";
            console.log("GET from uri: " + uri);
            var options = {
                uri: uri,
                auth: {
                    'bearer': gutil.env.token
                },
                method: "GET"
            };
            makeRequest(options, function (error, response) {
                if (error) {
                    console.log("\nCould not get data manager app: " +
                        error);
                } else {
                    console.log("\nGot data manager app");
                    var consumerKey =
                        JSON.parse(response).credentials[0].consumerKey;
                    kvmEntries[0].value = consumerKey;
                    return edge.run(kvmEntries, edge.createKVMEntries)
                }
            });
        },
        function (err) {
            console.log('\nUnable to create KVM: ' + err);            
//            return edge.run(kvmEntries, edge.createKVMEntries)
        }
    ).then(
        function () {
            var host = "http://api.enterprise.apigee.com/";
            var org = gutil.env.org;
            var env = gutil.env.env;
            var rev = '1';
            
            var uri = host + 'v1/o/' + org + 
                '/apis/data-manager/revisions/' + rev + '/npm';
            
            var options = {
                uri: uri,
                auth: {
                    'bearer': gutil.env.token
                },
                method: "POST",
                form: { command:'install' }
            };

            makeRequest(options, function (error, response) {
                if (error) {
                    console.log("Could not install node modules: " + 
                        error.message);
                } else {
                    console.log("Installed node modules.");
                }
            });
        },
        function (err) {
            console.log('Unable to create KVM entries: ' + 
                'Moving on to create vaults.\n' + err);
        }
    ).then(
        function () {
            var host = "http://api.enterprise.apigee.com/";
            var org = gutil.env.org;
            var env = '/vaults';
            var vaultName = '/entries';
            
            var uri = host + 'v1/' +
                'o/' + org + 
                'e' + env + 
                vaultName + '/entries';
            
            var options = {
                uri: uri,
                auth: {
                    'bearer': gutil.env.token
                },
                method: "POST"
            };

            async.each(vaultEntries, function (vaultEntry,
                callback) {
            
                var entryName = vaultEntry.name;
                var entryValue = vaultEntry.value;
                
                var body = {
                    "name": entryName,
                    "value": entryValue
                };
                
                var options = {
                    uri: uri,
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    auth: {
                        'bearer': gutil.env.token
                    },
                    method: "POST"
                };
                
                console.log('\nAdding vault entry: ' +
                    entryName);
                
                makeRequest(options, function (error,
                    response) {
                    if (error && error.statusCode != '201')
                    {
                        callback(error, null);
                    } else {
                        var responseBody = response.body;
                        callback(null, responseBody);
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
        },
        function (err) {
            console.log('Unable to install node modules. ' + 
                err);
            return edge.run(kvms, edge.createKVMs)
        }
    ).then(
        function () {
            console.log('all done')
        },
        function (err) {
            console.log(err)
        }
    )
})

gulp.task('clean',function() {    
    return edge.run(apps,edge.deleteApps).then(
        function(){ 
            return edge.run(developers, edge.deleteDevelopers)
        },
        function(err){ 
            console.log('App delete failed: ' + err);
            return edge.run(developers, edge.deleteDevelopers)
        }
    ).then(
        function(){ 
            return edge.run(apiProducts, edge.deleteProducts)
        },
        function(err){
            console.log('Developer delete failed: ' + err);
            return edge.run(apiProducts, edge.deleteProducts)
        }
    ).then(
        function(){ 
            return edge.run(apilist, edge.deleteApis)
        },
        function(err){ 
            console.log('Product delete failed: ' + err);
            return edge.run(apilist, edge.deleteApis)
        }
    ).then(
        function () {
            return edge.run(kvms, edge.deleteKVMs)
        },
        function (err) {
            console.log('API delete failed: ' + err);
            return edge.run(kvms, edge.deleteKVMs)
        }
    )
})


function makeRequest(options, callback) {

    console.log("Making an API request: " + JSON.stringify(options));

    request(options, function (error, response, body) {
            console.log("error: " + error);
//            console.log("response: " + JSON.stringify(response));
            console.log("body: " + body);
        
        var errorObject = new Error();
        
        if (error) {
            errorObject.message = error.message;
            callback(errorObject, null);
        } else if (response && response.statusCode != 200) {
            console.log(body);
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

