/* Prototypes */
Math.randomInt = function(max) {
	return Math.round(Math.random() * max);
};
Math.rad = function(a) {
	return a / 180 * Math.PI
};

with (Number) {
prototype.inflect = function(w1, w2, w3, complex) {
	var nn = this % 100, n = nn % 10;
	var w = n > 4 || n === 0 || nn - n === 10 ? w3 : (n === 1 ? w1 : w2);
	return complex === false ? w : (this.toString() + '&nbsp;' + w);
};
prototype.constrain = function(min, max) {
	return (this < min) ? min : ((this > max) ? max : this);
};}

with (Array) {
prototype.last = function() {
	return this[this.length - 1];
};
prototype.random = function() {
	return this[Math.randomInt(this.length - 1)];
};
prototype.except = function(value) {
	return $.grep(this, function(item) {
		return item !== value;
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
prototype.absorb = function(data) {
	var h = typeof data === 'object';
	var parts = h ? data : arguments;
	return this.replace(/\$(\w+)/g, function(s, key) {
		var part = parts[h ? key : (parseInt(key, 10) - 1)];
		return part !== undefined ? part : s;
	});
};}

function contentsOf(arr) {
	var hash = {};
	for (var i = arr.length; i--;) {
		hash[arr[i]] = true;
	}
	return hash;
}

/* JQuery extensions */
$.fn.extend({  
sprite: function(l, t) {
	var bpl = l && (-l + 'px');
	var bpt = t && (-t + 'px');
	return this.css('background-position', bpl + ' ' + bpt);
},
substitute: function() {
	var result = [];
	this.each(function() {
		var el = $(this), target = $('#' + el.attr('id'));
		if (target.length) result.push(el.replaceAll(target).get(0));
	});
	return this.pushStack(result, 'substitute');
}
});

/* Ajax */
var ajax = function(fname, options) {
	var request = new ajaxRequest(fname);
	request.options = $.isFunction(options) ? {process: options} : options || {};
	return request;
};
var ajaxRequest = function(fname) {
	var that = this;
	this.fname = fname;
	this.url = '/ajax/' + this.fname;
	this.selfsuccess = function(result) {
		that.requestSuccess(result, that.data);
	};
	this.selferror = function(request, type) {
		that.requestError(request.responseText || 'Не удалось соединиться с сервером');
	};
};
ajaxRequest.prototype = {
send: function(data, title) {
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
	var opts = this.options;
	if (opts.control) {
		opts.control.trigger('send', title || opts.title);
	}
	$.ajax(params);
},
requestSuccess: function(s) {
	var opts = this.options;
	if (opts.control) opts.control.trigger('success', opts.result);
	if (opts.process) opts.process(s);
},
requestError: function(s) {
	var opts = this.options;
	if (opts.control) opts.control.trigger('error', s);
	if ($.isFunction(opts.error)) {
		opts.error(s);
	} else if (opts.error) {
		alert(s);
	}
}
};

/* Ajax controls */
$.fn.extend({ 
simpleButton: function() {
	return this.bind('send', function() {
		this.disabled = true;
	}).bind('success error', function() {
		this.disabled = false;
	});
},
smartButton: function(options) {
	return this.each(function() {
		new $.smartButton($(this), options);
	});
}
});
$.smartButton = function(el, options) {
	var b = el.find('button').get(0);
	var s = el.find('.sb-state');
	var timer, hide = function() {
		s.children().fadeOut(250);
	};
	el.bind('send', function(e, t) {
		b.disabled = true;
		s.children(':animated').stop();
		s.html(t || 'Соединение…').show();
		clearTimeout(timer);
	}).bind('success', function(e, t) {
		b.disabled = false;
		if (t) {
			s.html('<span class="success">' + t + '</span>');
			timer = setTimeout(hide, 3000);
		} else {
			s.hide();
		}
	}).bind('error', function(e, t) {
		b.disabled = false;
		s.html('<span class="error">' + t + '</span>');
	});
};

/* Init functions */
var init = {};

/* Browsers */
var browser = (function() {
	var np = navigator.platform.toLowerCase().match(/mac|win|linux|ipad|iphone/);
	var na = navigator.userAgent.toLowerCase().match(/safari|opera|msie ?\d|firefox|chrome/);
	var browser = {platform: np && np[0], app: na && na[0].replace(/\s/, '')};
	$(document.documentElement).addClass(browser.platform).addClass(browser.app);
	if (browser.app == 'msie6') try {document.execCommand('BackgroundImageCache', false, true);} catch(e) {}
	return browser;
})();

/* Cookies */
var Cookie = function(name, value, date) {
	if (arguments.length > 1) {
		var format = '$1=$2;$3path=/';
		var exp = (value !== undefined) ? (date ? date.toGMTString() : '') : 'Thu, 01-Jan-1970 00:00:01 GMT';
		document.cookie = format.absorb(name, escape(value), exp && ('expires=' + exp + ';'));
		return value;
	} else {
		var pattern = new RegExp('(?:^' + name + '|; ?' + name + ')=([^;]*)');
		var result = pattern.exec(document.cookie);
		return (result) ? unescape(result[1]) : undefined;
	}
}
