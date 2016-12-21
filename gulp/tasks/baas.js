var q = require('q');
var async = require('async');
var gutil = require('gulp-util');
var baasConfig = require('./apigee-app-config.js');

function createCollections(collections){
    var opts = baseopts();
    opts.collections = collections;
    var callback = q.defer();
    
    baasConfig.createBaasCollections(opts, 
        function (error, response) {
            if (error) {
                console.log('\nGot create collections error: \n' + 
                    JSON.stringify(error));
                callback.reject(error);
            } else {
                callback.resolve(response);
            }
        }
    );
    return callback.promise
}

function createFoodcarts(foodcarts){
    var opts = baseopts();
    opts.foodcarts = foodcarts;
    var callback = q.defer();
    
    baasConfig.createFoodcarts(opts, 
        function (error, response) {
            if (error) {
                console.log('\nGot create collections error: \n' + 
                    JSON.stringify(error));
                callback.reject(error);
            } else {
                callback.resolve(response);
            }
        }
    );
    return callback.promise
}

function deleteCollections(prod, cb) {
}

function createGroups (groups, cb) {
}

function deleteGroups (groups, cb) {
}

function createRoles (roles, cb) {
}

function deleteRoles (roles, cb) {
}

function assignRoles (roles, cb) {
    var cb = q.defer()

    assignBaasRolesToGroups
    return cb.promise;  
}


function run(arr, func){ 
    var defer = q.defer();
    async.mapSeries(arr, function(c, cb) {
            func(c, cb)
    },
        function(err, results) {
            if(err) {
                console.log(err)
                defer.reject(err)
            }
            q.all(results).then(
                function() {
                    console.log('done')
                    defer.resolve()
                },
                function(err) {
                    console.log(err)
                    defer.reject(err)
                }
            )
        }
    )
    return defer.promise
}


function runCommand(cmd, opts, cb) {
    cmd.run(opts, function(runerr,response){
      if(runerr){cb.reject(runerr)}
      else { cb.resolve(response)} 
    });
}


function baseopts () {
    console.log('gutil-baas2: ' + JSON.stringify(gutil.env));
    var opts = {
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
    console.log('opts: ' + JSON.stringify(opts));
    return opts
}

module.exports = {
    run:run,
    createCollections: createCollections
//    deleteCaches: deleteCaches,
//    deployApis: deployApis,    
//    deleteApis: deleteApis,
//    createProducts: createProducts,
//    createDevelopers: createDevelopers,
//    createApp: createApp,
//    createApps: createApps,
//    deleteProducts: deleteProducts,
//    deleteDevelopers: deleteDevelopers,
//    deleteApps: deleteApps,
//    createKVMs: createKVMs,
//    deleteKVMs: deleteKVMs,
//    createKVMEntries: createKVMEntries

}
