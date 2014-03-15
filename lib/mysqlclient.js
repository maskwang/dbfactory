var mysql = require('mysql-libmysqlclient'),
	domain = require('domain'),
	settings = require('../cfg/settings'),
	connections = {},
	connectionWaitings = {};
	client;

module.exports = function(name, partitionkey, cb) {
	if(toString.call(partitionkey) === '[object Function]') {
		cb = partitionkey;
		partitionkey = undefined;
	}
	
	var providerSetting = settings.providers[name]?settings.providers[name]:settings.providers['*'];
	if(providerSetting) {
			var svrSetting = settings.servers[providerSetting.server];
		    client = connect(svrSetting);

		    if (!client.connectedSync()) {
			  console.log("Connection error " + client.connectErrno + ": " + client.connectError);
			  process.exit(1);
			}
	}else{
		cb(true,'Connection Setting Not Found');
	}
};

module.exports.setSettings = function(stgs) {
	settings = stgs;
	return module.exports;
};

var connect = function(setting) {
	var host = setting.host ? setting.host:'127.0.0.1';
	var conn = mysql.createConnectionSync();
	conn.connectSync(host, setting.user, setting.password, setting.database);
	return conn;
}

process.on('exit', function () {
  client.closeSync();
});
