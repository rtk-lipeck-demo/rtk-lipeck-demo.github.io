/* Subway */
var subway = {
init: function() {
	var platforms = this.platforms = [];
	var stations = this.stations = {};
	var lines = subwayData.lines, prefix, items;
	for (lname in lines) {
		prefix = lname + "-";
		items = lines[lname];
		for (var i = 0, lim = items.length; i < lim; i++) {
			var item = items[i], next = items[i + 1], prev = items[i - 1];
			var s = new Station(prefix + item.id, lname, item.x, item.y);
			platforms.push(s.addPlatform("pn", (next ? (prefix + next.id) : null)));
			platforms.push(s.addPlatform("pp", (prev ? (prefix + prev.id) : null)));
			stations[prefix + item.id] = s;
		}	
	}
	for (var i = subwayData.close.length; i--;) {
		var cs = subwayData.close[i];
		stations[cs.id][cs.side].nid = null;
	}
	for (var i = subwayData.open.length; i--;) {
		var os = subwayData.open[i];
		var from = stations[os.from], to = stations[os.to];
		var fault = os.fault || subwayOptions.stageFault;
		from[os.side].addWay(to[os.side], this.time(from, to), fault, 0);
	}
	this.obstacles = {};
	var today = new Date().getTime();
	var transfers = subwayData.transfers, obstacles = subwayData.obstacles || {};
	var tl = Math.round(subwayOptions.trainLatency / 2);
	var tt = Math.round((subwayOptions.transferMax + subwayOptions.transferMin) / 2) + tl;
	var tf = Math.round((subwayOptions.transferMax - subwayOptions.transferMin) / 2) + tl;
	for (var i = 0, lim = transfers.length; i < lim; i++) {
		var t = transfers[i];
		var s1 = stations[t.s1];
		var s2 = stations[t.s2];
		if (!s1.hasTransfers) {
			s1.pn.addWay(s1.pp, 20 + tl, tl, 1);
			s1.pp.addWay(s1.pn, 20 + tl, tl, 1);
			s1.hasTransfers = true;
		}
		var tways = [];
		var oid = t.s1 + " " + t.s2, obstacle = obstacles[oid];
		if (obstacle && today < Date.parse(obstacle.until)) {
			this.obstacles[oid] = {
				reason: obstacle.reason,
				ways: []
			};
			tways = this.obstacles[oid].ways;
		}
		tways.push(s1.pn.addWay(s2.pn, tt, tf, 1));
		tways.push(s1.pn.addWay(s2.pp, tt, tf, 1));
		tways.push(s1.pp.addWay(s2.pn, tt, tf, 1));
		tways.push(s1.pp.addWay(s2.pp, tt, tf, 1));	
	}	
	for (var i = platforms.length; i--;) {
		platforms[i].init();
	}
	this.currentObstacles = [];
},
time: function(s1, s2) {
	var dx = Math.pow(s2.x - s1.x, 2);
	var dy = Math.pow(s2.y - s1.y, 2);
	var distance = Math.sqrt(dx + dy);
	return Math.round(distance / this.speed(distance) + subwayOptions.stopTime);
},
speed: function(distance) {
	var speed = subwayOptions.trainSpeed;
	n = Math.round(distance / 10);
	return speed[n] || (speed[n] = speed.last());
},
reset: function() {
	var platforms = this.platforms;
	for (var i = platforms.length; i--;) {
		var p = platforms[i];
		p.point = {time: 0, fault: 0, tram: 0};
		p.station.point = {time: 0};		
	}
},
spreadFrom: function(id, cosy) {
	this.reset();
	var start = this.stations[id];
	start.pp.point.time = 1;
	start.pn.point.time = 1;
	var current = [start.pp, start.pn], next;
	while (current.length) {
		next = [];
		for (var i = current.length; i--;) {
     		next = current[i].proceed(cosy).concat(next);
		}
		current = next;
	}
	var platforms = subway.platforms;
	for (var i = platforms.length; i--;) {
		platforms[i].apply(cosy);
	}
	var self = this;
	this.repeatSpread = function() {
		self.spreadFrom(id, cosy);
	}
},
routeTo: function(id) {
	var finish = this.stations[id].point;
	if (!finish.time) return null;
	var route = [id], from = finish.from;
	do {
		var id = from.station.id;
		from = from.point.from;
		route.push(id);
		var obstacle = from && this.obstacles[from.station.id + " " + id];
		if (obstacle) {
			var oid = from.station.id + "_" + id + "_closed";
			if (!Cookie(oid)) {
				$("#obstitle").html(obstacle.reason + " Выбран маршрут с&nbsp;другими пересадками.");
				var popup = $("#obstacle"), offset = $("#map").offset();
				var phalf = Math.round(popup.width() / 2);
				popup.css({
					left: offset.left + from.station.x.constrain(phalf, $("#map").width() - phalf * 2) - phalf,
					top: offset.top + from.station.y - Math.round(popup.height() / 2),
					visibility: "visible"
				});
				var expires = new Date();
				expires.setDate(expires.getDate() + 10);
				Cookie(oid, 1, expires);
			}
			var ways = obstacle.ways;
			for (var i = ways.length; i--;) ways[i].enabled = false;
			setTimeout(function() {
				subway.repeatSpread();
				panel.check();
			}, 100);
			return null;
		}
	} while (from);
	return {
		time: finish.time,
		fault: finish.fault,
		items: route.reverse()
	};
}
};

/* Station prototype */
function Station(id, lid, x, y) {
	this.id = id;
	this.lid = lid;
	this.x = x;
	this.y = y;
	this.point = {time: 0};
}
Station.prototype = {
addPlatform: function(side, nid) {
	var item = new Platform(this.id, side);
	if (nid) {
		item.nid = nid;
	}
	this[side] = item;
	return item;
}
};

/* Platform prototype */
function Platform(sid, side) {
	this.sid = sid;
	this.side = side;
	this.ways = [];
}
Platform.prototype = {
init: function() {
	this.station = subway.stations[this.sid];
	if (this.nid) {
		var cs = subway.stations[this.sid];
		var ns = subway.stations[this.nid];
		var np = ns[this.side];
		this.addWay(np, subway.time(cs, ns), subwayOptions.stageFault, 0);
	}
},
addWay: function(aim, time, fault, tram) {
	var way = {
		aim: aim,
		time: time,
		fault: fault,
		tram: tram,
		enabled: true
	};
	this.ways.push(way);
	return way;
},
proceed: function(cosy) {
    var result = [];
    var ways = this.ways, way, point;
	for (var i = ways.length; i--;) {
		way = ways[i];
		point = way.enabled && this.attempt(way, cosy);
		if (point) {
			way.aim.point = point;
			result.push(way.aim);
		}
	}
	return result;
},
apply: function(cosy) {
	if (this.point.time) {
		var point = this.attempt({aim: this.station, time: 0, fault: 0, tram: 0}, cosy);
		if (point) {
			this.station.point = this.point;
			this.station.point.side = this.side;
		}
	}
},
attempt: function(way, cosy) {
	var current = this.point, next = way.aim.point;		
	var time = current.time + way.time, tram = current.tram + way.tram;
	var f = !next.time || time < next.time || (cosy && tram < next.tram && time - next.time < 300);
	return f && {from: this, time: time, fault: current.fault + way.fault, tram: tram};
}
};
