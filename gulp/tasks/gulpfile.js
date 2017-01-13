var gulp = require('gulp');
var build = require('gulp-build')
var apigeetool = require('apigeetool')
var gutil = require('gulp-util')
var baasUtil = require('./baas-util.js')
var streetcartsSeed = require('./streetcarts-seed.js')
var request = require('request')

var groups = [
    {
        "title":"Foodcart Owners",
        "path": "owners",
        "roles": [
            { "name": "owners" }
        ],
        "permissions": [
            {
                "verbs": "",
                "path": ""
            }
        ]
    },
    {
        "title":"Members",
        "path": "members",
        "roles": [
            { "name": "default" }
        ],
        "permissions": [
            {
                "verbs": "",
                "path": ""
            }
        ]
    }
];

var roles = [
    {
        "title": "Foodcart Owners",
        "name": "owners",
        "permissions": [
            {
                "path": "/foodcarts/*",
                "verbs":"post"
            },
            {
                "path": "/foodcarts",
                "verbs":"post"
            }
        ]
    },
    {
        "title": "Default",
        "name": "default",
        "permissions": [
            {
                "path": "/groups/owners/users/*",
                "verbs":"post,put"
            },
            {
                "path": "/reviews/*",
                "verbs":"post,put"
            }
        ]
    },
    {
        "title": "Guest",
        "name": "guest",
        "permissions": [
            {
                "path":"/foodcarts",
                "verbs": "get"
            },
            {
                "path":"/foodcarts/*",
                "verbs": "get"
            },
            {
                "path":"/foodcarts/*/offers/*",
                "verbs": "get"
            },
            {
                "path":"/foodcarts/*/publishes/*",
                "verbs": "get"
            },
            {
                "path":"/items",
                "verbs": "get"
            },
            {
                "path":"/items/*",
                "verbs": "get"
            },
            {
                "path":"/menus",
                "verbs": "get"
            },
            {
                "path":"/menus/*",
                "verbs": "get"
            },
            {
                "path":"/menus/*/includes/*",
                "verbs": "get"
            },
            {
                "path": "/reviews/*",
                "verbs":"get"
            },
            {
                "path":"/devices",
                "verbs": "post"
            },
            {
                "path":"/groups/*/users/*",
                "verbs": "post"
            },
            {
                "path":"/users",
                "verbs": "post"
            },
            {
                "path":"/users/*",
                "verbs": "post"
            },
            {
                "path":"/devices/*",
                "verbs": "put"
            }
        ]
    }
];

var users = [
    {
        "firstName": "Liz",
        "lastName": "Lynch",
        "address": "Ap #614-3294 Arcu Street",
        "city": "Grand Island",
        "region": "NE",
        "postalCode": "69010",
        "email": "lizzie@example.com",
        "username": "Liz456",
        "password": "Password1"
    },
    {
        "firstName": "Stephen",
        "lastName": "Gilson",
        "address": "1098 Pede. St.",
        "city": "Virginia Beach",
        "region": "VA",
        "postalCode": "17855",
        "email": "steffen@example.com",
        "username": "steffen111",
        "password": "Password1"
    },
    {
        "firstName": "Will",
        "lastName": "Witman",
        "address": "270-8243 Tempor St.",
        "city": "Fort Worth",
        "region": "TX",
        "postalCode": "86519",
        "email": "freewill@example.com",
        "username": "freewill444",
        "password": "Password1"
    },
    {
        "firstName": "Floyd",
        "lastName": "Jones",
        "address": "3695 Auctor Street",
        "city": "Gresham",
        "region": "OR",
        "postalCode": "12693",
        "email": "floydster@example.com",
        "username": "jonesy42",
        "password": "Password1"
    },
    {
        "firstName": "Alex",
        "lastName": "Muramoto",
        "address": "Ap #461-8529 Nec St.",
        "city": "New Haven",
        "region": "CT",
        "postalCode": "61595",
        "email": "wilyone@example.com",
        "username": "Alex666",
        "password": "Password1"
    },
    {
        "firstName": "Steve",
        "lastName": "Traut",
        "address": "Ap #461-8529 Nec St.",
        "city": "New Haven",
        "region": "CT",
        "postalCode": "61595",
        "email": "steef@example.com",
        "username": "steve303",
        "password": "Password1"
    }
];

var foodcarts = [
    {
        "cartName": "The Grilled Cheese Grill",
        "url": "http://grilledcheesegrill.com/",
        "location": {
            "address": "1027 NE Alberta St",
            "city": " Portland",
            "region": "OR",
            "country": "US",
            "postalCode": "97211",    
            "latitude": 45.559216,
            "longitude": -122.654941,
            "shortAddress": "NE 11th and Alberta"
        },
        "phone": "503 206 8959",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae lorem placerat, vehicula urna eu, commodo turpis. Curabitur placerat facilisis euismod. Nam aliquet ipsum at libero rutrum dignissim. Nam commodo dui eget ligula luctus, condimentum placerat mi porta.",
        "hours": "Tues-Thurs: 11:30-9; Friday, Saturday: 11:30-late; Sunday: 11:30-8; closed Mondays"
    }
]


// This code should check first to make sure that the Edge pieces
// have been set up -- as in:
// gulp.task('seed',['configure-permissions','verify-api'], function(){

/**
	// create owners
	- add owner user accounts
		- get owner emails from user JSON, create account as each
	
	// create foodcarts
	- add foodcart for each owner
		- for each foodcart, get owner email from JSON, log in as that owner, 
			then create the foodcart
	- add items, menus for each foodcart
		- create items.then
		- create menus
	
	// create users
	- add other non-owners as users of a foodcart
	
*/

gulp.task('configure-baas', function() {
    return baasUtil.createGroups(groups)
	.then(
        function() {
            console.log('Created groups');
            return baasUtil.createRoles(roles)
        },
        function(error) { 
            console.log('Failed to create groups: ' + error);
            return baasUtil.createRoles(roles)
        }
	).then(
        function() {
            console.log('Created roles');
            return baasUtil.assignRolesToGroups(groups)
        },
        function(error) { 
            console.log('Failed to create roles: ' + error);
            return baasUtil.assignRolesToGroups(groups)
        }
    ).then(
        function () {
            console.log('Assigned roles to groups.')
            console.log('All done.')
        },
        function (error) {
            console.log('Failed to assign roles to groups.')
            console.log(error)
        }
    )
})

gulp.task('clean-baas', function() {
    return baasUtil.deleteGroups(groups)
	.then(
        function() {
            console.log('Deleted groups');
            return baasUtil.deleteRoles(roles)
        },
        function(error) { 
            console.log('Failed to delete groups: ' + error);
            return baasUtil.deleteRoles(roles)
        }
	).then(
        function() {
            console.log('Deleted roles');
            console.log('All done.')
        },
        function(error) { 
            console.log('Failed to delete roles: ' + error);
            console.log('All done.')
        }
    )
})


gulp.task('seed', function(){
    return streetcartsSeed.createUserAccounts(users)
    // .then(
    //     function () {
    //         return edge.run(developers, edge.createDevelopers)
    //     },
    //     function (error) {
    //         console.log('Unable to deploy APIs. ' +
    //             'Moving on to create developers.\n' +
    //             error);
    //         return edge.run(developers, edge.createDevelopers)
    //     }
    ).then(
        function () {
            console.log('All done')
        },
        function (error) {
            console.log('\nError: ')
            console.log(error)
        }
    )
})


gulp.task('baas', function(){
    return baas.createCollections(collections)
    .then(
    ).then(
        function () {
            console.log('All done')
        },
        function (error) {
            console.log(error)
        }
    )
})

