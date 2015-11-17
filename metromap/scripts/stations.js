/* Stations button */
var stationsButton = function(el, onchange) {
	var that = this;
	this.el = $(el).click(function() {
		that.click();
	});
	this.label = $("dd", this.el).text();
	this.onchange = onchange;
};
stationsButton.prototype = {
click: function() {
	stationsList.control = this;
	stationsList.show(this.el);
},
select: function(station) {
	if (typeof station == "string") {
		station = stationsList.stations[stationsList.index[station]];
	}
	if (station != this.selected) {
		var title = station ? station.title : this.label;
		$("em", this.el).get(0).className = station ? station.lname : "empty";
		$("dl", this.el).toggleClass("selected", Boolean(station));
		$("dd", this.el).text(title);
		$("dt", this.el).text(title);
		this.selected = station;
		if (typeof this.onchange == "function") {
			this.onchange();
		}
	}	
}
};

/* Stations dropdown */
var stationsList = {
init: function(data) {
	var that = this;
	this.el = $("#stations").mousedown(function(event) {
		event.stopPropagation();
	});
	this.field = $(".search input", this.el).data("lastValue", "").val("");
	this.field.keydown(function(event) {
		that.hotkey(event);
	}).keyup(function() {
		that.filter();
	});
	this.clear = $(".search .clear", this.el).click(function() {
		that.reset();
	});
	this.stations = [];
	this.index = {};
	var self = this;
	$(".items li", this.el).each(function(i) {
		var s = {id: data[i]};
		s.lname = s.id.substr(0, 3);
		s.sname = s.id.substr(4);
		s.el = $(this).addClass(s.lname);
		s.title = s.el.text();
		s.sample = self.getSmartSample(s.title);
		self.stations[i] = s;
		self.index[s.id] = i; 
	});
	this.list = $(".list", this.el).click(function(event) {
		var el = $(event.target);
		if (el.is("ul.items li")) {
			that.select(el.get(0));
		} else if (el.is("ul.reset li")) {
			that.select();
		}
	});
	this.empty = $(".empty", this.list);
	this.items = $(".items", this.list);
	this.scroller.init(this.list);
	this.hideSelf = function(event) {event.data.self.hide()};
},
reset: function() {
	this.field.val("");
	this.filter();
	this.field.focus();
},
getSample: function(s) {
	return " " + s.toLowerCase().replace(/\-/g, " ").replace(/ё/g, "е");	
},
getSmartSample: function(str) {
	var s = this.getSample(str);
	if (s.contains('им.')) s = s + s.replace('им.', 'имени');
	if (s.contains('зьм')) s = s + s.replace('зьм', 'зм');
	if (s.contains('1905')) s = s + s.replace('1905', '905');
	return s + s.rus2lat();
},
filter: function() {
	var s = this.field.val();
	if (this.field.data("lastValue") != s) {
		var sample = s ? this.getSample(s).replace('{', '[').replace('"', "'").replace('<', ',').replace('>', ',') : null;
		var amount = 0;
		$(this.stations).each(function(i) {
			var proper = !sample || this.sample.contains(sample);
			$(this.el).css("display", proper ? "" : "none");
			if (proper) amount++;
		});
		this.clear.toggle(Boolean(s));
		this.prefer(null);
		this.empty.toggle(amount == 0);
		this.items.toggle(amount > 0);
		this.scroller.el.scrollTop(0);
		this.scroller.update();
		this.scroller.toggle();
		if (amount == 1) this.pass("next");
	}
	this.field.data("lastValue", s);
},
select: function(item) {
	var selected = null;
	if (typeof item == "string") {
		selected = this.stations[this.index[item]];
	} else if (item) {
		selected = this.stations[$(item).prevAll("li").length];
	}
	var c = this.control;
	if (c && typeof c.select == "function") {
		c.select(selected);
	}
	this.hide();	
},
prefer: function(item) {
	$(this.preferred).removeClass("preferred");
	if (item) {
		$(item).addClass("preferred");
		this.scroller.el.scrollToNode(item, 15);
	}
	this.preferred = item;
},
pass: function(dir) {
	var item, current = this.preferred;
	if (current) {
		item = $(current)[dir + "All"]("li:visible").get(0);
	} else {
		item = $(".items li:visible:first", this.el).get(0);
	}
	if (item) this.prefer(item);
},
hotkey: function(event) {
	var key = event.which;
	if (key == 63232) key = 38;
	if (key == 63233) key = 40;
	switch (key) {
		case 38: this.pass("prev"); event.preventDefault(); break;
		case 40: this.pass("next"); event.preventDefault(); break;
		case 13: if (this.preferred) {this.select(this.preferred);} break;
		case 27: this.field.blur(); this.hide(); break;
	}
},
show: function(reference) {
	this.prefer(null);
	this.scroller.el.scrollTop(0);
	reference = $(reference);
	var roffset = reference.offset();
	var poffset = this.el.offsetParent().offset(); 
	var left = roffset.left + Math.round(reference.width() / 2) - 120 - poffset.left;
	var top = roffset.top + Math.round(reference.height() / 2) - 20 - poffset.top;
	this.el.css("left", left).css("top", top).css("visibility", "visible");
	$("body").bind("mousedown", {self: this}, this.hideSelf);
	this.field.focus();
},
hide: function() {
	$("body").unbind("mousedown", this.hideSelf);
	this.el.css("visibility", "hidden");
	this.field.val("").blur();
	this.filter();
	this.control = null;
},
scroller: {
	init: function(list) {
		var that = this;
		this.el = $(".scroll", list).scroll(function() {
			that.toggle();
		});
		this.up = list.find('.up');
		this.down = list.find('.down'); 
		this.up.add(this.down).mouseover(function(event) {
			that.scroll(event);
		}).mouseout(function() {
			that.stop();
		});
		this.update();
		this.toggle();
	},
	toggle: function() {
		var st = this.el.scrollTop();
		this.up.toggle(st > 0);
		this.down.toggle(st < this.max);
	},
	update: function() {
		this.max = this.el.get(0).scrollHeight - this.el.height();
	},
	stop: function() {
		clearInterval(this.timer);
		this.animation = false;
		this.direction = 0;
	},
	scroll: function(e) {
		var control = $(e.target);
		if (control.hasClass("up")) {
			this.aim = 0;
			this.direction = -1;
		}
		if (control.hasClass("down")) {
			this.aim = this.max;
			this.direction = 1;
		}
		var that = this;
		this.speed = 1;
		this.timer = setInterval(function() {
			that.step();
		}, 25);
	},
	step: function() {
		var st = this.el.scrollTop();
		st = st + Math.round(this.direction * this.speed);
		if (this.speed < 21) {
			this.speed += 0.25;
		}
		if (st <= 0) {
			st = 0;
			this.stop();
		}
		if (st >= this.max) {
			st = this.max;
			this.stop();
		}
		this.el.scrollTop(st);
	}
}
};

/* Keyboard layout correction */
var kbChars = {};
(function() {
	var rus = 'йцукенгшщзхъфывапролджэёячсмитьбю';
	var lat = 'qwertyuiop[]asdfghjkl;\'\\zxcvbnm,.';
	for (var i = rus.length; i--;) {
		kbChars[rus.charAt(i)] = lat.charAt(i);
	}
})();
String.prototype.rus2lat = function() {
	var result = [], s = this.valueOf();
	for (var i = 0, im = s.length; i < im; i++) {
		var c = s.charAt(i);
		result.push(kbChars[c] || c);
	}
	return result.join('');
};

/* Scroll to selected station */
$.fn.scrollToNode = function(node, margin) {
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
};
