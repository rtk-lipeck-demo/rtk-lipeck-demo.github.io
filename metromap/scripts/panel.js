var fastroutes = false;

var fixedHeader = {
init: function() {
	var that = this;
	this.el = $("#header");
	this.window = $(window);
	this.size = $("#header").height() - $("#panel-canvas").height();
	this.last = this.window.scrollTop();
	$(window).scroll(function() {
		that.toggle();
	});
},
toggle: function() {
	var st = this.window.scrollTop();
	if ((st > this.size) != (this.last > this.size)) {
		this.el.toggleClass("fixed", st > this.size);
	}
	this.last = st;
}
};

var panel = {
init: function() {
	this.start = new stationsButton("#start", function() {
		panel.update();
		duration.reset();
		markers.filter("finish");
		if (this.selected) {
			if (panel.finish.selected == this.selected) panel.finish.select();
			scroller.scroll(subway.stations[this.selected.id].y);
			subway.spreadFrom(this.selected.id, !fastroutes);
			panel.check("start");
		} else {
			subway.repeatSpread = undefined;
			subway.reset();
		}
	});
	this.finish = new stationsButton("#finish", function() {
		panel.update();
		duration.reset();
		markers.filter("start");
		if (this.selected) {
			if (panel.start.selected == this.selected) panel.start.select();
			scroller.scroll(subway.stations[this.selected.id].y);			
			panel.check("finish");
		}
	});
	var that = this;
	$('#begin div, #middle div, #end div').click(function(event) {
		that.change($(event.target).parent("div").attr("id"));
	});
	$('#map').next('map').click(function(event) {
		event.preventDefault();
		that.select($(event.target).attr("href").substr(1));
	});
	this.update();
	duration.init();
	tooltip.init();
	markers.init();
	if (document.location.hash) {
		this.finish.select(document.location.hash.substr(1));
	}
},
select: function(id) {
	var s = this.start.selected;
	var f = this.finish.selected;
	if (s && s.id == id) {
		this.start.select();
	} else if (f && f.id == id) {
		this.finish.select();
	} else if (s) {
		if (f) {
			this.finish.select();
			this.start.select(f.id);
		}
		this.finish.select(id);
	} else {
		this.start.select(id);
	}
	tooltip.update();
},
lucky: function() {
	var s = this.start, f = this.finish, rs = "", rf = "";
	var cs = s.selected ? s.selected.id : "";
	var cf = f.selected ? f.selected.id : "";
	if (!cs) {do {rs = stationsList.stations.random().id} while (rs == cf);}
	if (!cf) {do {rf = stationsList.stations.random().id} while (rf == cs || rf == rs);}
	if (rs) this.start.select(rs);
	if (rf) this.finish.select(rf);
},
check: function(type) {
	var types = {};
	for (var i = arguments.length; i--;) {
		types[arguments[i]] = true;
	};
	var f = this.finish.selected;
	var route = f && subway.routeTo(f.id);
	if (route) {
		var nostart = types["finish"];
		var nofinish = types["start"];
		var items = route.items, stations = subway.stations, cs, ns, mt;
		for (var i = 0, lim = items.length; i < lim; i++) {
			mt = "station";
			cs = stations[items[i]];
			ns = stations[items[i + 1]];
			if (i == 0) mt = nostart ? "" : "start";
			if (ns && (ns.lid != cs.lid || ns.id == cs.id)) {
				if (++i != 1) mt = "transfer";
			}
			if (i == lim - 1) mt = nofinish ? "" : "finish";
			if (mt) {
				markers.add(cs, mt, -Math.round(cs.point.time / 80));
			}
		}
		duration.show(route.time, route.fault);
	} else if (arguments.length == 1) {
		markers.add(subway.stations[this[type].selected.id], type, 0);
	}
	markers.animate();
},
change: function(type) {
	switch (type) {
	case "begin":
		this.start.select();
		this.start.click();
		break;
	case "middle":
		this.finish.select();
		this.finish.click();
		break;
	case "end":
		var f = this.finish.selected;	
		this.finish.select();
		if (f) this.start.select(f.id);
		this.finish.click();
		break;
	}
},
update: function() {
	var s = this.start.selected;
	var f = this.finish.selected;
	$("#begin").toggleClass("active", !s).children("div").attr("title", (s ? "Изменить" : "Выбрать") + " начальную станцию");
	$("#middle").toggleClass("active", Boolean(s && !f)).children("div").attr("title", (f ? "Изменить" : "Выбрать") + " конечную станцию");
	var str = f ? ("Сделать станцию «" + f.title + "» начальной и выбрать новую конечную") : "Выбрать конечную станцию";
	$("#end").toggleClass("active", Boolean(s && f)).children("div").attr("title", str);
}
};

/* Scroller */
var scroller = {
scroll: function(y) {
	var top = y + $("#overlay").offset().top;
	var current = $(window).scrollTop();
	var height = $(window).height();
	var aim = -1;
	if (top < current + 110) aim = Math.max(0, top - 110);
	if (top > current + height - 40) aim = top - height + 40;
	if (aim > -1) {
		var that = this;
		this.st = current;
		$(this).animate({
			st: aim
		}, {
			duration: Math.abs(current - aim),
			step: function() {
				that.apply();
			}
		});
	}
},
apply: function() {
	$(window).scrollTop(this.st);
}
};

/* Exit switch */
var exit = {
init: function() {
	this.el = $("#exit");
	this.sprites = {
		max: 8,
		cur: 0,
		el: this.el
	};
	this.enabled = true;
	$(".lever", this.el).draggable({
		containment: "parent",
		cursor: "default",
		start: this.sprites.stop,
		drag: $.proxy(this, 'move'),
		stop: $.proxy(this, 'automove')
	});
	var that = this;
	var f = function(event) {
		that.toggle(event.data.mode);
	};
	$(".platform", this.el).bind("click", {mode: false}, f);
	$(".street", this.el).bind("click", {mode: true}, f);
},
move: function(event, ui) {
	var p = ui.position;
	var s = Math.round((8 - p.left + p.top) / 2);
	this.sprites.cur = s.constrain(0, 8);
	this.update();
},
update: function() {
	this.sprites.cur = Math.round(this.sprites.cur);
	this.el.sprite(0, this.sprites.cur * 30);
},
toggle: function(mode) {
	this.enabled = mode;
	var aim = mode ? 0 : this.sprites.max;
	$(this.sprites).animate({
		cur: aim
	}, {
		duration: Math.abs(this.sprites.cur - aim) * 30,
		complete: $.proxy(this, 'complete'),
		step: $.proxy(this, 'update')
	});
	duration.update();
},
automove: function() {
	var mode = !this.enabled;
	if (this.sprites.cur < 3) mode = true;
	if (this.sprites.cur > 5) mode = false;
	this.toggle(mode);
},
complete: function() {
	$(".lever").css({
		left: this.enabled ? 8 : 0,
		top: this.enabled ? 0 : 8
	});
}
};

/* Duration */
var duration = {
init: function() {
	this.el = $("#duration div").eq(0);
	this.reset();
},
reset: function() {
	this.value = "";
	this.time = 0;
	this.fault = 0;
	this.el.hide();
	$("#lucky").show();
},
show: function(time, fault) {
	this.time = time;
	this.fault = fault;
	this.update();
},
update: function() {
	if (this.time) {
		var ratio = exit.enabled ? 2 : 1;
		var min = Math.floor((this.time - this.fault + 15 + subwayOptions.entranceMin * ratio) / 60);
		var max = Math.floor((this.time + this.fault - 15 + subwayOptions.entranceMax * ratio) / 60);
		var str = min + "<span>&ndash;</span>" + (min == max ? max : max++) + " мин.";
		if (this.value != str) {
			$("#lucky").hide();
			this.el.css("left", "-150px").show().html(str).animate({"left": "0"}, 300);
			this.value = str;
		}
	} else {
		this.el.hide();
		$("#lucky").show();		
	}
}
};

/* Prefpane */
var prefpane = {
init: function() {
	var that = this;
	this.city = subwayData.city;
	this.el = $("#prefpane").hide().css("visibility", "inherit").mousedown(
		function(event) {event.stopPropagation();
	});
	$("#fastroutes").click(this.applyFastroutes).get(0).checked = Boolean(Cookie("fastroutes"));
	$("#preferences div").click($.proxy(this, 'open'));
	$("#default-start").nextAll(".reset").children("span").click($.proxy(this, 'resetDefaultStart'));	
	$("#default-start").nextAll(".save").children("span").click($.proxy(this, 'saveDefaultStart'));
	var ds = Cookie(this.city + "start");
	this.defaultStart = ds ? stationsList.stations[stationsList.index[ds]] : null;
	this.updateDefaultStart();
	$("#reset-dropdowns").click($.proxy(this, 'resetDropdowns'));	
	$(".close", this.el).click($.proxy(this, 'close'));
	this.closeSelf = function(event) {event.data.self.close()};
},
open: function() {
	$("body").bind("mousedown", {self: this}, this.closeSelf);
	this.el.show();
},
close: function() {
	this.el.hide();
	$("body").unbind("mousedown", this.closeSelf);
},
applyFastroutes: function() {
	var checkbox = $("#fastroutes").get(0), tip;
	var tips = {
		on: "Выключите, чтобы получить оптимальные по времени и количеству пересадок маршруты.",
		off: "Включите, чтобы получить маршруты с минимальным временем без учета количества пересадок."
	};
	$(checkbox).parent("p").next("http://www.metromap.ru/scripts/p.hint").html(tips[checkbox.checked ? "on" : "off"]);
	Cookie("fastroutes", checkbox.checked ? 1 : null, new Date(2015, 0, 1));
	if (panel.start.selected) {
		duration.reset();
		markers.filter("start", "finish");
		subway.spreadFrom(panel.start.selected.id, !checkbox.checked);
		panel.check("start", "finish");
	}
},
resetDropdowns: function() {
	var ds = this.defaultStart;
	panel.start.select(ds && ds.id);
	panel.finish.select();
},
saveDefaultStart: function() {
	this.defaultStart = panel.start.selected;
	if (this.defaultStart) {
		Cookie(this.city + "start", this.defaultStart.id, new Date(2015, 0, 1));
	}
	this.updateDefaultStart();
},
resetDefaultStart: function() {
	this.defaultStart = null;
	Cookie(this.city + "start", null);
	this.updateDefaultStart();
},
updateDefaultStart: function() {
	var el = $("#default-start"), ds = this.defaultStart;
	if (ds) {
		el.html("Начальная станция по умолчанию: ").append($("<span/>").addClass(ds.lname).html(ds.title));
	} else {
		el.html("Начальная станция по умолчанию не выбрана");
	}
	el.nextAll(".save").toggle(Boolean(!ds && panel.start.selected));
	el.nextAll(".reset").toggle(Boolean(ds));
}
};

/* Tooltip */
var tooltip = {
init: function() {
	this.el = $("#tooltip").hide();
	this.title = $("dt", this.el);
	this.tip = $("dd", this.el);
	var map = $("#map").next("map");
	map.mouseover($.proxy(this, 'show'));
	map.mousemove($.proxy(this, 'move'));
	map.mouseout($.proxy(this, 'hide'));
	this.self_doShow = $.proxy(this, 'doShow');
	this.self_doHide = $.proxy(this, 'doHide');
	this.offset = 10;
},
move: function(event) {
	this.el.css({
		left: event.pageX + this.offset + "px",
		top: event.pageY - 2 + "px"
	});
},
show: function(event) {
	clearTimeout(this.timer);
	this.id = $(event.target).attr("href").substr(1);
	this.update();
	this.offset = ($(window).width() + $(window).scrollLeft() - event.pageX < 260) ? -245 : 10;
	this.timer = setTimeout(this.self_doShow, 500, event);
	this.move(event);
},
update: function() {
	var station = stationsList.stations[stationsList.index[this.id]];
	this.title.html(station.title).removeClass().addClass(station.lname);
	var s = panel.start.selected;
	var f = panel.finish.selected;
	if (s && s.id == this.id) {
		this.tip.html("Начальная станция. Кликните, чтобы отменить выбор.");
	} else if (f && f.id == this.id) {
		this.tip.html("Конечная станция. Кликните, чтобы отменить выбор.");
	} else if (s) {
		this.tip.html("Кликните, чтобы сделать эту станцию конечной.");
	} else {
		this.tip.html("Кликните, чтобы сделать эту станцию начальной.");
	}
},
doShow: function(event) {
	if (browser.app == 'msie6' || browser.app == 'msie7') {
		this.el.show();
	} else {
		this.el.fadeIn(100);
	}
},
hide: function() {
	clearTimeout(this.timer);
	this.timer = setTimeout(this.self_doHide, 20);
},
doHide: function() {
	this.el.hide();
}
};

/* Markers */
var markers = {
init: function() {
	this.box = $("#route").html("");
	var all = ["0 0", "-100px 0", "-200px 0", "0 -100px", "-100px -100px", "-200px -100px", "0 -200px"];
	var edges = all.concat(["-100px -200px", "-200px -200px"]);
	this.frames = {
		station: all.concat(["-100px -600px", "-200px -600px", "0 -700px", "-100px -700px", "-200px -700px"]),
		start: edges.concat(["0 -300px", "-100px -300px", "-200px -300px"]),
		finish: edges.concat(["0 -400px", "-100px -400px", "-200px -400px"]),
		transfer: edges.concat(["0 -500px", "-100px -500px", "-200px -500px"])
	};
	this.items = [];
	this.self_step = $.proxy(this, 'step');
},
add: function(station, type, state) {
	var frames = this.frames[type];
	var m = {
		type: type,
		frames: frames,
		state: state,
		aim: frames.length - 1
	};
	m.el = $("<div/>").addClass("marker").css({
		left: station.x - 50,
		top: station.y - 50
	}).get(0);
	m.active = true;
	this.box.append(m.el);
	this.items.push(m);
},
filter: function() {
	var types = {};
	for (var i = arguments.length; i--;) {
		types[arguments[i]] = true;
	};
	this.items = $.grep(this.items, function(m) {
		var f = types[m.type];
		if (!f) $(m.el).remove();
		return f;
	}); 		
},
animate: function() {
	if (!this.timer) {
		this.timer = setInterval(this.self_step, 40);
	}
},
step: function() {
	var items = this.items, stop = true;
	for (var i = items.length; i--;) {
		var m = items[i];
		if (m.active) {
			if (++m.state == m.aim) m.active = false; else stop = false;
			if (m.state > 0) m.el.style.backgroundPosition = m.frames[m.state];
		}
	}
	if (stop) {
		clearInterval(this.timer);
		this.timer = null;
	}
}	
};
