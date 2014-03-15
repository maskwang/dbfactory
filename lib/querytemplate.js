(function (exports) {
    var common = require('common');
    var filterHolder = new common.validator.Filter(),
        validatorHolder = new common.validator.Validator();

    //handy tool
    var pad = function (n) {
        return n < 10 ? '0' + n : '' + n;
    };

    // these two method must be called by object ref
    var sanitize = function (str) {
            return filterHolder.sanitize(str);
        },
        check = function (str) {
            return validatorHolder.check(str);
        };

    // Query class
    var Query = exports.Query = function () {
    };

    // Query error tracker
    Query.prototype.error = function (msg) {
        // init errors
        this._errors = this._error || [];
        this._errors.push(new Error(msg));
    };

    Query.prototype.getErrors = function () {
        return this._errors;
    };

    // basic setter
    Query.prototype.setValue = function (index, value) {
        var ref = this._placeholdersRef[index];
        this._paras[index](value, ref);

        return this; // maintain the chain
    };

    Query.prototype.setInt = function (index, value) {
        try {
            check(value).notNull().isInt();
        } catch (e) {
            //record
            this.error(e.message);
            //do nothing
            return this;
        }
        return this.setValue(index, sanitize(value).toInt());
    };

    // should be no convertion-exception
    Query.prototype.setBoolean = function (index, value) {
        try {
            check(value).notNull();
        } catch (e) {
            //record
            this.error(e.message);
            //do nothing
            return this;
        }

        return this.setValue(index, sanitize(value).toBoolean());
    };

    //binary
    Query.prototype.setBinary = function (index, value) {
        try {
            check(value).notNull();
        } catch (e) {
            //record
            this.error(e.message);
            //do nothing
            return this;
        }

        if (!Buffer.isBuffer(value)) {
            this.error('Binary data must be presented as Node.js Buffer Object');
            return this;
        }

        var buffer = value;
        var hex = '';
        try {
            hex = buffer.toString('hex');
        } catch (err) {
            // node v0.4.x does not support hex / throws unknown encoding error
            for (var i = 0; i < buffer.length; i++) {
                var byte = buffer[i];
                hex += pad(byte.toString(16));
            }
        }

        return this.setValue(index, "X'" + hex + "'");
    }

    // Date&Time
    Query.prototype.setDate = function (index, value) {
        try {
            check(value).notNull();
        } catch (e) {
            this.error(e.message); //Invalid
            //do nothing
            return this;
        }

        if (!value.getMonth) {
            this.error('Date value must be presented as Javascript Date Object');
        }

        var d = value;
        var formatted = '' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
            + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());

        return this.setValue(index, '\'' + formatted + '\'');
    }

    Query.prototype.setFloat = function (index, value) {
        try {
            check(value).notNull().isFloat();
        } catch (e) {
            this.error(e.message); //Invalid
            //do nothing
            return this;
        }

        return this.setValue(index, sanitize(value).toFloat());
    };

    // should have no convertion-exception
    Query.prototype.setString = function (index, value) {
        try {
            check(value).notNull();
        } catch (e) {
            this.log(e.message); //Invalid
            //do nothing
            return this;
        }

        //escaping
        value = value.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (s) {
            switch (s) {
                case "\0":
                    return "\\0";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\b":
                    return "\\b";
                case "\t":
                    return "\\t";
                case "\x1a":
                    return "\\Z";
                default:
                    return "\\" + s;
            }
        });

        //override its toString if you want to pass an object
        return this.setValue(index, '\'' + value + '\'');
    };

    Query.prototype.execute = function (db, provider, cb) {

        var sql = '';

        for (var i = 0, j = this._spliced.length; i < j; i++) {
            if (typeof(this._spliced[i]) === 'undefined' || this._spliced[i] === null) {
                cb(new Error("Sql template is not complete properly"), null);

                return;
            }

            sql += this._spliced[i];
        }

        db(provider, function (err, client) {
            if (!err) {
                client.query(sql, function (err, results) {
                    // pass it on
                    cb(err, results);
                });
            }
        });
    };

    exports.compile = function (str) {
        // pass this on, query object
        var query = new Query();
        query._template = typeof( str ) === 'undefined' || str === null
            || (isNaN(str) && str.length === undefined) ? '' : str + '';
        query._spliced = [];
        query._paras = [];
        query._placeholdersRef = [];

        var blockStart = 0;
        for (var i = 0, j = query._template.length;
             i < j;
             i++
            ) {
            var ch = query._template.charAt(i);
            if (ch === '?') {
                query._spliced.push(query._template.substring(blockStart, i));
                blockStart = i + 1;

                //placeholder
                query._spliced.push(null);

                //replacement for placeholder
                query._placeholdersRef.push(query._spliced.length - 1);
                query._paras.push(function (value, placeholderRef) {
                    query._spliced[placeholderRef] = value + '';
                });
            }
        }

        //last part
        if (blockStart < query._template.length) {
            spliced.push(query._template.substring(blockStart));
        }

        return query;
    }
})(typeof(exports) === 'undefined' ? window : exports);