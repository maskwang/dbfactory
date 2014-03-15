var mysql = require('mysql'),
	settings = require('../cfg/settings'),
	connections = {},
	connectionWaitings = {};

module.exports = function(name, partitionkey, cb) {
	//TODO : Support partition
	
	if(toString.call(partitionkey) === '[object Function]') {
		cb = partitionkey;
		partitionkey = undefined;
	}
	
	var providerSetting = settings.providers[name]?settings.providers[name]:settings.providers['*'];
	if(providerSetting) {
		
		// Get connection from pool first.
		if( connections[providerSetting.server] ) {
			cb(false,connections[providerSetting.server]);
		}else if(connectionWaitings[providerSetting.server]){
			// If waiting list is already there. add callback into it
			connectionWaitings[providerSetting.server].push(cb);
		}else{
			// Prepare waiting list.
			connectionWaitings[providerSetting.server] = [cb];

			// Connect server and cache connection.
			var svrSetting = settings.servers[providerSetting.server];
		    var client = mysql.createConnection(svrSetting);
		    client.connect(function(err){
		    	if(err) {
		    		cb(err, 'Failed To Connect Db');
		    	}else {
                    console.log('Success To Connect Db',providerSetting.server);
			    	connections[providerSetting.server] = client;

			    	var waitings = connectionWaitings[providerSetting.server];
			    	connectionWaitings[providerSetting.server] = undefined;

			    	for(var k in waitings){
			    		waitings[k](0, client);
			    	}
		    	}
		    });
	    	
		    var cb0 = cb;
		    client.on('error', function(){
		    	console.error.apply(console, arguments);
		    	if( connections[providerSetting.server] === client ) {
		    		connections[providerSetting.server] = undefined;
		    	}
		    	if(cb0) {
		    		cb0 = undefined;

			    	var waitings = connectionWaitings[providerSetting.server];
			    	connectionWaitings[providerSetting.server] = undefined;

			    	for(var k in waitings){
			    		waitings[k](arguments[0]);
			    	}
		    	}
		    	client.end();
		    });
		    
		    client.on('end', function(){
		    	console.log('Db Connection End : ' + providerSetting.server);
		    	if( connections[providerSetting.server] === client ) {
		    		connections[providerSetting.server] = undefined;
		    	}
		    });
		    
		}
	}else{
		cb(true,'Connection Setting Not Found');
	}
};

module.exports.setSettings = function(stgs) {
	settings = stgs;
	return module.exports;
};