dbfactory主要用于提供数据库连接服务
	
(1)使用

	var db = require('dbfactory');
	
	db('[provider name]', function(err, client) {
		client.query('[sql]', function(err, results, fields) {
		});
	})
		
(2)配置

	配置文件地址在：'./cfg/settings.js', 参考配置文件内的具体说明

(3)范例

	参考'./example/run.js'

querytemplate用来参数化sql语句, 避免拼接sql, 解决sql注入的问题
使用依赖于dbfactory
类似上面的例子
var db = require('dbfactory');
db.compile('select * from some_table where some_key = ?').setInt(0, "1").execute(db, 'provider', function(err, results){
// deal with errs and results
});

compile()的参数为一个模板, 其中的参数用?替代.
之后使用setInt, setFloat, setBoolean和setString方式设置参数, 这几个方法的第一个参数为index, 含义是第几个?(start from 0)
第二个参数为参数的值, 字符串或者数值都可以
使用链式调用
例如
db.compile('?,?,?').setInt(0,0).setBoolean(1,'true').setString(2,"value").execute(...)