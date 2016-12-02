var gulp = require('gulp');
var apigeetool = require('apigeetool')
var gutil = require('gulp-util')
var proxy_name = 'fault-handling-apikey'
var edge = require('./edge.js')
var request = require('request');
var 
gulp.task('default', function () {
    // place code for your default task here
});

var apilist =[ {
    dir: '../streetcarts/proxies/src/gateway/accesstoken', proxy: 'accesstoken'
}, {
    dir: '../streetcarts/proxies/src/gateway/data-manager', proxy: 'data-manager'
}, {
    dir: '../streetcarts/proxies/src/gateway/foodcarts', proxy: 'foodcarts'
}, {
    dir: '../streetcarts/proxies/src/gateway/items', proxy: 'items'
}, {
    dir: '../streetcarts/proxies/src/gateway/menus', proxy: 'menus'
}, {
    dir: '../streetcarts/proxies/src/gateway/reviews', proxy: 'reviews'
}, {
    dir: '../streetcarts/proxies/src/gateway/users', proxy: 'users'
}]

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

var kvms =[ {
    "name": "DATA-MANAGER-API-KEY"
}]

var kvmEntries =[ {
    "name": "X-DATA-MANAGER-KEY",
    "value": "foo",
    "mapName": "DATA-MANAGER-API-KEY"
}]

gulp.task('deploy',[], function () {
    return edge.run(apilist, edge.deployApis
    ).then(
        function () {
            return edge.run(developers, edge.createDevelopers)
        },
        function () {
            console.log('API deploy failed: ' + err);
            return edge.run(developers, edge.createDevelopers)
        }
    ).then (
        function () {
            return edge.run(apilist, edge.deployApis)
        },
        function (err) {
            console.log('Developer creation failed: ' + err);
            return edge.run(apilist, edge.deployApis)
        }
    ).then(
        function () {
            return edge.run(apiProducts, edge.createProducts)
        },
        function (err) {
            console.log('API creation failed, continue: ' + err);
            return edge.run(apiProducts, edge.createProducts)
        }
    ).then(
        function () {
            return edge.run(apps, edge.createApps)
        },
        function (err) {
            console.log('Product creation failed: ' + err);
            return edge.run(apps, edge.createApps)
        }
    ).then(
        function (app) {
            console.log('Created app: ' + app);
            return edge.run(kvms, edge.createKVMs)
        },
        function (err) {
            console.log('App creation failed: ' + err);
            return edge.run(kvms, edge.createKVMs)
        }
    ).then(
        function () {
            var host = "http://api.enterprise.apigee.com/";
            var org = gutil.env.org;
            var env = gutil.env.env;
            var uri = host + "v1/o/" + org + "/developers/streetcarts-developer@example.com/apps/SC-DATA-MANAGER-APP";
            console.log("GET from uri: " + uri);
            var options = {
                uri: uri,
                auth: {
                    'bearer': gutil.env.token
                },
                method: "GET"
            };
            var dataManagerApp;
            makeRequest(options, function (error, response) {
                if (error) {
                    console.log("Could not get data manager app: " + error);
                } else {
                    console.log("Got data manager app: " + response);
                    var consumerKey = JSON.parse(response).credentials.consumerKey;
                }
            });
            return edge.run(kvmEntries, edge.createKVMEntries)
        },
        function (err) {
            console.log('Unable to create KVM: ' + err);
            return edge.run(kvmEntries, edge.createKVMEntries)
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
            console.log("response: " + JSON.stringify(response));
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

