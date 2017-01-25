var gulp = require('gulp');
var build = require('gulp-build');
var apigeetool = require('apigeetool');
var gutil = require('gulp-util');
var baasUtil = require('./baas-util.js');
var streetcartsSeed = require('./streetcarts-seed.js');
var request = require('request');

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

var foodcarts = {
    "foodcarts": [
    {
        "cartName": "The Grilled Cheese Grill",
        "url": "http://grilledcheesegrill.com/",
	    "ownerEmail": "lizzie@example.com",
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
        "hours": "Tues-Thurs: 11:30-9; Friday, Saturday: 11:30-late; Sunday: 11:30-8; closed Mondays",
        "items": [
            {
               "itemName": "The Mondo",
               "description": "Tillamook Pepperjack, Avocado, Fresh Red Onion and Roasted Red Peppers on Portland French Bakery Multigrain Wheat",
               "price": 7
            },
            {
               "itemName": "The Moondog",
               "description": "Provolone, Hard Salami and Pepperoni, and Chopped Olives and Peppers on Sourdough.",
               "price": 7
            },
            {
               "itemName": "The Gabby",
               "description": "Four Cheeses on Portland French Bakery White Bread. Tillamook Cheddar,Swiss, Mozzarella, and Colby Jack Cheese.",
               "price": 6
            }
        ],
        "menus": [
            {
                "menuName": "Grilled Cheese Grill Menu"
            }
        ]
    },
    {
        "cartName": "The Whole Bowl",
        "url": "http://www.thewholebowl.com/what.html/",
	    "ownerEmail": "steef@example.com",
        "location": {
            "address": "1100 NW Glisan St",
            "city": " Portland",
            "region": "OR",
            "country": "US",
            "postalCode": "97211",    
            "latitude": 45.526292,
            "longitude": -122.682486,
            "shortAddress": "SW 9th and Alder"
        },
        "phone": "503-757-BOWL",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae lorem placerat, vehicula urna eu, commodo turpis. Curabitur placerat facilisis euismod. Nam aliquet ipsum at libero rutrum dignissim. Nam commodo dui eget ligula luctus, condimentum placerat mi porta.",
        "hours": "Tues-Thurs: 11:30-9; Friday, Saturday: 11:30-late; Sunday: 11:30-8; closed Mondays",
        "items": [
            {
                "itemName": "Big Bowl",
                "description": "Comforting and healthy medley of brown rice, red and black beans, fresh avocado, salsa, black olives, sour cream, Tillamook cheddar, cilantro, Tali Sauce and trace amounts of attitude.",
                "price": 6,
                "cartID": "676bbe6a-6b9d-11e5-b714-15889d18d0b0"    
            },
            {
                "itemName": "Bambino Bowl",
                "description": "Comforting and healthy medley of brown rice, red and black beans, fresh avocado, salsa, black olives, sour cream, Tillamook cheddar, cilantro, Tali Sauce and trace amounts of attitude.",
                "price": 5,
                "cartID": "676bbe6a-6b9d-11e5-b714-15889d18d0b0"    
            },
            {
                "itemName": "Cookie",
                "description": "They're cookies.",
                "price": 1,
                "cartID": "676bbe6a-6b9d-11e5-b714-15889d18d0b0"
            }
        ],
        "menus": [
            {
                "menuName": "Whole Bowl Menu"
            }
        ]
    },
    {
        "cartName": "Korean Twist on 5th",
        "url": "",
	    "ownerEmail": "freewill@example.com",
        "location": {
            "address": "",
            "city": " Portland",
            "region": "OR",
            "country": "US",
            "postalCode": "",    
            "latitude": 45.520675,
            "longitude": -122.681730,
            "shortAddress": "SW 5th and Oak"
        },
        "phone": "503 810 8968",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae lorem placerat, vehicula urna eu, commodo turpis. Curabitur placerat facilisis euismod. Nam aliquet ipsum at libero rutrum dignissim. Nam commodo dui eget ligula luctus, condimentum placerat mi porta.",
        "hours": "Monday thorough Saturday, lunchtime",
        "items": [
           {
               "itemName": "Rice Bowl",
               "description": "Choice of meat with rice.",
               "price": 6,
               "cartID": "6770c77a-6b9d-11e5-8148-e51e4f633e84"
           },
           {
               "itemName": "Pot Stickers",
               "description": "Post stickerishness.",
               "price": 7,
               "cartID": "6770c77a-6b9d-11e5-8148-e51e4f633e84"
           }
        ],
        "menus": [
            {
                "menuName": "Korean Menu"
            }
        ]
    },
    {
        "cartName": "Honkin' Huge Burritos!",
        "url": "http://www.honkinhuge.com/",
	    "ownerEmail": "wilyone@example.com",
        "location": {
            "address": "",
            "city": " Portland",
            "region": "OR",
            "country": "US",
            "postalCode": "",    
            "latitude": 45.519119,
            "longitude": -122.679438,
            "shortAddress": "Pioneer Courthouse Square – Downtown Portland"
        },
        "phone": "",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae lorem placerat, vehicula urna eu, commodo turpis. Curabitur placerat facilisis euismod. Nam aliquet ipsum at libero rutrum dignissim. Nam commodo dui eget ligula luctus, condimentum placerat mi porta.",
        "hours": "Weekdays at lunchtime",
        "items": [
            {
                "itemName": "Small Burrito",
                "description": "",
                "price": 6,
                "cartID": "6775826a-6b9d-11e5-a6ae-f110923f1e50"
            },
            {
                "itemName": "Medium Burrito",
                "description": "",
                "price": 7,
                "cartID": "6775826a-6b9d-11e5-a6ae-f110923f1e50"
            },
            {
                "itemName": "Honkin' Huge Burrito",
                "description": "",
                "price": 8,
                "cartID": "6775826a-6b9d-11e5-a6ae-f110923f1e50"
    }
        ],
        "menus": [
            {
                "menuName": "Honkin' Huge Burritos! Menu"
            }    
        ]
    },
    {
        "cartName": "El Cubo de Cuba",
        "url": "http://www.facebook.com/profile.php?id=100001488674001#!/profile.php?id=100001488674001",
	    "ownerEmail": "floydster@example.com",
        "location": {
            "address": "",
            "city": " Portland",
            "region": "OR",
            "country": "US",
            "postalCode": "",    
            "latitude": 45.519119,
            "longitude": -122.679438,
            "shortAddress": "SW 10th and Alder"
        },
        "phone": "503 894 1525",
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae lorem placerat, vehicula urna eu, commodo turpis. Curabitur placerat facilisis euismod. Nam aliquet ipsum at libero rutrum dignissim. Nam commodo dui eget ligula luctus, condimentum placerat mi porta.",
        "hours": "Tues-Fri, 11:30am-7pm; Sat/Sun, 12-7pm",
        "items": [
           {
               "itemName": "Cuban Sandwich",
               "description": "classic grilled sandwich with thinly sliced mojo marinated pork, ham, baby Swiss cheese and a pickle. Served with tostones, maduros or sweet potato fries",
               "price": 7,
               "cartID": "6779ef3a-6b9d-11e5-b8d2-030c269c9c5e"
           },
           {
               "itemName": "Cubo de Puerco",
               "description": "Mojo Marinated Pork.  Served with rice and black beans, and your choice of tostones, maduros or sweet potato fries. Gluten and Dairy free",
               "price": 8,
               "cartID": "6779ef3a-6b9d-11e5-b8d2-030c269c9c5e"
           },
           {
               "itemName": "Cubo de Pollo",
               "description": "Guava Marinated Chicken.  Served with rice and black beans, and your choice of tostones, maduros or sweet potato fries. Gluten and Dairy free",
               "price": 8,
               "cartID": "6779ef3a-6b9d-11e5-b8d2-030c269c9c5e"
           }
        ],
        "menus": [
            {
                "menuName": "Cuban Menu"
            }
        ]
    }]
};

var collections = [
    {
        "name":"foodcarts"
    },
    {
        "name":"menus"
    },
    {
        "name":"items"
    },
    {
        "name":"reviews"
    }
];

gulp.task('configure-baas', function() {
    return baasUtil.createGroups(groups)
	.then(
        function() {
            console.log('Created groups');
            return baasUtil.createRoles(roles);
        },
        function(error) {
            console.log('Failed to create groups: ' + error);
            return baasUtil.createRoles(roles);
        }
	).then(
        function() {
            console.log('Created roles');
            return baasUtil.assignRolesToGroups(groups);
        },
        function(error) {
            console.log('Failed to create roles: ' + error);
            return baasUtil.assignRolesToGroups(groups);
        }
    ).then(
        function () {
            console.log('Assigned roles to groups.');
            console.log('All done.');
        },
        function (error) {
            console.log('Failed to assign roles to groups.');
            console.log(error);
        }
    )
});

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
});

gulp.task('seed-streetcarts', function(){
	return streetcartsSeed.createUserAccounts(users)
	.then(
        function() {
            console.log('Created user accounts');
            return streetcartsSeed.createFoodcarts(foodcarts, users)
        },
        function(error) { 
            console.log('Failed to create user accounts: ' + error);
            // return baasUtil.deleteRoles(roles)
        })
    .then(
        function () {
            console.log('All done')
        },
        function (error) {
            console.log('\nError: ')
            console.log(error)
        }
    )
});
