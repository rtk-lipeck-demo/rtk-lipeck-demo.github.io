/* Prototypes */
Math.randomInt = function(max) {
	return Math.round(Math.random() * max);
};
Math.rad = function(a) {
	return a / 180 * Math.PI
};

with (Number) {
prototype.inflect = function(w1, w2, w3, pure) {
	var n = this.toString() + ' ';
	var w = n.match(/([^1]|^)1 /) ? w1 : (n.match(/([^1]|^)[234] /) ? w2 : w3);
	return pure ? w : (n + w);
};
prototype.constrain = function(min, max) {
	return (this < min) ? min : ((this > max) ? max : this);
};
prototype.toPercents = function(n) {
	return (this * 100).toFixed(n) + "%";
};}

with (Array) {
prototype.last = function() {
	return this[this.length - 1];
};
prototype.random = function() {
	return this[Math.randomInt(this.length - 1)];
};
prototype.merge = function(arr) {
	if (typeof arr != "Array") arr = [arr];
	return $.merge(this, arr);
};
prototype.filter = function(value) {
	return $.grep(this, function(item) {
		return item != value;
	});
};}

with (String) {
prototype.contains = function(str) {
	return (this.indexOf(str) > -1);
};
prototype.trim = function() {
	return $.trim(this);
};
prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.substring(1);
};
prototype.substitute = function(data) {
    var h = typeof data === 'object';
    var parts = h ? data : arguments;
    return this.replace(/\$(\w+)/g, function(s, key) {
        return parts[h ? key : (parseInt(key, 10) - 1)] || s;
    });
};}

Function.prototype.use = function(self) {
    var method = this;
    return function() {
        return method.apply(self, arguments);
    }
}
function contentsOf(arr) {
	var hash = {};
	for (var i = arr.length; i--;) {
		hash[arr[i]] = true;
	}
	return hash;
}

/* JQuery extensions */
$.fn.extend({  
scrollToNode: function(node, margin) {
	var offset = margin || 0;
	var box = $(this), node = $(node);
	var nt = node.position().top;
	var mt = box.height() - node.height();
	if (nt < offset) {
		box.scrollTop(box.scrollTop() + nt - offset);
	} else if (nt > mt - offset) {
		box.scrollTop(box.scrollTop() + nt - mt + offset);
	}
	return this;
},
cssSprite: function(l, t) {
	var bpl = -l + (l ? "px" : "");
	var bpt = -t + (t ? "px" : "");
	$(this).css("background-position", bpl + " " + bpt);
	return this;
}
});

/* Ajax */
var ajax = function(fname, options) {
    var request = new ajaxRequest(fname);
    request.options = $.isFunction(options) ? {process: options} : options || {};
	return request;
};
var ajaxRequest = function(fname) {
	var self = this;
	this.fname = fname;
	this.selfsuccess = function(result) {
	   self.requestSuccess(result, this.data);
	};
	this.selferror = function(request, type) {
		self.requestError(request.responseText || 'Не удалось соединиться с сервером');
	};
	this.url = '/ajax/' + this.fname;
	return this;
};
ajaxRequest.prototype = {
send: function(data) {
    var self = this;
    var params = {
		type: 'POST',
		traditional: true,
		timeout: 10000,
		success: this.selfsuccess,
		error: this.selferror
    };
    var dtype = $.type(data);
    if (dtype == 'object') {
        params.url = this.url;
        params.data = data;
    } else {
        var query = dtype === 'array' ? data.join('/') : data.toString();
        params.url = this.url + '/' + query;
    }
    if (this.options.control) {
        this.options.control.trigger('send');
    }
	$.ajax(params);
},
requestSuccess: function(s) {
	var opts = this.options;
	if (opts.control && !opts.preserve) opts.control.trigger('success');
	if (opts.process) opts.process(s);
},
requestError: function(s) {
	var opts = this.options;
    if (opts.control) opts.control.trigger('error', s);
	if (typeof opts.error == 'Function') {
	   opts.error(s);
    } else if (opts.error) {
        alert(s);
    }
}
};

/* Browsers */
var browser = (function() {
	var os = navigator.platform.toLowerCase().match(/mac|win|linux/);
	var agent = navigator.userAgent.toLowerCase().match(/safari|opera|msie 6|msie 7|msie 8|firefox|chrome/);
	agent = agent && agent[0].replace(/\s/, '');
	var browser = os && agent ? os + "-" + agent : undefined;
	if (agent == 'msie6') try {document.execCommand('BackgroundImageCache', false, true);} catch(e) {}
	if (browser) $(document.documentElement).addClass(browser);
	return browser;
})();

/* Cookies */
var Cookie = function(name, value, date) {
	if (arguments.length) {
		var expires = value != undefined ? (date ? date.toGMTString() : '') : 'Thu, 01-Jan-1970 00:00:01 GMT';
		if (expires) expires = 'expires=' + expires + ';';
		document.cookie = name + '=' + escape(value) + ';' + expires + 'path=/';
		return value;
	} else {
		var pattern = new RegExp('(?:^' + name + '|; ?' + name + ')=([^;]*)', 'g');
		var result = pattern.exec(document.cookie);
		return (result) ? unescape(result[1]) : null;
	}
}
