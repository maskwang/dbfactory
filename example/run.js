var db = require('dbfactory');

db.setSettings({
	servers : {
		svr01 : {
			host: 'localhost',
		    port: 3306,
		    user: 'dev',
		    password: 'test',
		    database: 'test'
		}
	},
	
	providers : {
		'example' : {
			server : 'svr01'
		}
	}
});

db('example', function(err, client) {
	console.log(err);
	if( !err ) {
		client.query('SELECT * FROM user_base', function(err, results) {
			console.log(err);
			console.log(results);
		});
	}
});

