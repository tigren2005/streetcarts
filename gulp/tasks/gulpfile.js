var gulp = require('gulp');
var build = require('gulp-build')
var apigeetool = require('apigeetool')
var gutil = require('gulp-util')
var baas = require('./baas.js')
var request = require('request')

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

//var collections = [
//        { "name":"foodcarts" }
//];

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

gulp.task('seed', function(){
    return baas.createUsers(users)
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
            console.log('All done')
        },
        function (error) {
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

