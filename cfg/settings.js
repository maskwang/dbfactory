
module.exports = {
	servers : {
		svr01 : {
			host: 'localhost',
		    port: 3306,
		    user: 'test',
		    password: 'test',
		    database: 'test'
		}
	},
	
	providers : {
		'testsvc' : {
			server : 'svr01'
		}
	}
};