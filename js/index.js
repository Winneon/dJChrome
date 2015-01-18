var bg_page  = chrome.extension.getBackgroundPage();
var search_timeout = undefined;
var ctrl = false;
$(document).ready(function(){
	$(".tooltipped").tooltip({
		"delay": 500
	});
	$("a[data-click='search']").sideNav();
	$(".modal-trigger").leanModal();
	$(".dropdown-button").dropdown();
	$("ul.tabs").tabs();
	if (bg_page.colour){
		update_colours(bg_page.colour);
	}
	$("ul#search_menu").on("menu_close", function(event){
		$("div.row.search_list div.row.item").remove();
		$("div.row.search_list > div.col > span").hide();
		$("div.search_side input").val("").parent().find(".active").removeClass("active");
	});
	$("a[data-click='drop']").click(function(event){
		$.post("http://worldscolli.de/api/dj", {
			type: "remove",
			data: {
				username: bg_page.username,
				password: bg_page.password
			}
		}, function(data){
			if (data.type == "refresh"){
				toast(data.data.message, 1000);
				refresh();
			} else if (data.type == "message"){
				toast(data.data.message, 1000);
			}
		});
	});
	$("a[data-click='veto']").click(function(event){
		$.post("http://worldscolli.de/api/dj", {
			type: "veto",
			data: {
				username: bg_page.username,
				password: bg_page.password
			}
		}, function(data){
			if (data.type == "refresh"){
				toast(data.data.message, 1000);
				refresh();
			} else if (data.type == "message"){
				toast(data.data.message, 1000);
			}
		});
	});
	$("div.search_hover a").click(function(event){
		$("a[data-click='search']").removeMenu();
	});
	$("div#add_modal a.btn").click(function(event){
		add_callback();
	});
	$("div#login_modal a").click(function(event){
		login_callback();
	});
	$("input#login_user, input#login_pass").keydown(function(event){
		if (event.which == 13){
			login_callback();
			return false;
		}
	});
	$("input#add_song").keydown(function(event){
		if (event.which == 13){
			add_callback();
			return false;
		}
	});
	$("div#colour_modal a").click(function(){
		$(this).parent().closeModal();
		bg_page.colour = $(this).data("colour");
		update_colours(bg_page.colour);
		chrome.storage.sync.set({ colour: bg_page.colour }, function(){ });
	});
	$("div.search_side input").keydown(function(event){
		if (event.which == 13){
			return false;
		}
		if (event.ctrlKey){
			ctrl = true;
		}
	});
	$("div.search_side input").keyup(function(event){
		if (event.which == 17 || ctrl){
			return ctrl = false;
		}
		if (event.which == 37 || event.which == 38 || event.which == 39 || event.which == 40){
			return false;
		}
		$("div.row.search_list div.row.item").remove();
		if (search_timeout){
			clearTimeout(search_timeout);
			search_timeout = undefined;
		}
		if ($(this).val() == ""){
			$("div.row.search_list > div.col > span").hide();
		} else {
			$("div.row.search_list > div.col > span").css("display", "table");
			search_timeout = setTimeout(search_callback, 1000);
		}
	});
	$("div#colour_modal a").css("background-color", function(){
		return $(this).data("colour");
	});
	if (bg_page.logged_in){
		start();
	} else {
		$("a.login_button").css("display", "inline-block");
		$("h5.no_queue").hide();
	}
});

function start(){
	refresh();
	setInterval(refresh, 5000);
}

function append_data(info){
	for (var i in info){
		$("div.row.search_list > div.col.s12").append(create_item(info[i].title, info[i].link, info[i].user, info[i].duration, false, false, true, false));
	}
	$("div.search_hover").parent().hover(function(){
		$($(this).children()[0]).show();
	}, function(){
		$($(this).children()[0]).hide();
	});
	$("div.search_hover a[data-btn='search_add']").click(function(event){
		$("a[data-click='search']").removeMenu();
		add_song($(this).parent().parent().find("div.row.title a").attr("href"));
	});
}

function search_callback(){
	var query = $("div.search_side input").val();
	$.get("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=" + query.replace(/\ /g, "+") + "&key=AIzaSyBlLj-8CA-VVCgcXtTEL8q0o3kbKsGyyPA", function(data){
		var total = data.items.length;
		var info = [];
		var ids = "";
		for (var i in data.items){
			ids = ids + "," + data.items[i].id.videoId;
		}
		ids = ids.replace(",", "");
		$.get("https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=" + ids + "&key=AIzaSyBlLj-8CA-VVCgcXtTEL8q0o3kbKsGyyPA", function(res){
			for (var j in res.items){
				info[j] = {
					title: res.items[j].snippet.title
				};
				info[j].link = "https://www.youtube.com/watch?v=" + res.items[j].id;
				info[j].user = res.items[j].snippet.channelTitle;
				info[j].duration = convert_yt_to_secs(res.items[j].contentDetails.duration);
			}
			$("div.row.search_list > div.col > span").hide();
			append_data(info);
		});
	});
}

function add_callback(){
	add_song($("div#add_modal input").val());
	$("div#add_modal").closeModal();
	$("div#add_modal input").val("");
	$("div#add_modal input").val("").parent().find(".active").removeClass("active");
}

function login_callback(){
	$("div#login_modal").closeModal();
	var user = $("input#login_user").val();
	var pass = $("input#login_pass").val();
	$.post("http://worldscolli.de/api/login", {
		username: user,
		password: pass
	}, function(data){
		if (data.success){
			chrome.storage.sync.set({
				username: user,
				password: pass
			}, function(){
				bg_page.username = user;
				bg_page.password = pass;
				bg_page.logged_in = true;
				
				toast("Logged in successfully!", 1000);
				$("a.login_button").hide();
				$("h5.no_queue").show();
				start();
			});
		} else {
			toast("Invalid login credentials!", 1000);
		}
	});
}

function add_song(url){
	$.post("http://worldscolli.de/api/dj", {
		type: "add",
		data: {
			username: bg_page.username,
			password: bg_page.password,
			link: url
		}
	}, function(data){
		if (data.type == "refresh"){
			toast(data.data.message, 1000);
			refresh();
		} else if (data.type == "message"){
			toast(data.data.message + " Added request to your playlist.", 1000);
		}
	});
}

function refresh(){
	$.post("http://worldscolli.de/api/dj", {
		type: "refresh",
		data: {
			username: bg_page.username,
			password: bg_page.password
		}
	}, function(data){
		$("div#queue div.row.item, div#playlist div.row.item").remove();
		
		for (var i in data.data.queue){
			$("div#queue").append(create_item(data.data.queue[i].title, data.data.queue[i].link, data.data.queue[i].user, data.data.queue[i].duration, true, i == 0, false, false));
		}
		for (var i in data.data.playlist){
			$("div#playlist").append(create_item(data.data.playlist[i].title, data.data.playlist[i].link, data.data.playlist[i].user, data.data.playlist[i].duration, true, false, false, true));
		}
		
		$("span.playlist_hover").parent().hover(function(){
			$($(this).children()[0]).show();
		}, function(){
			$($(this).children()[0]).hide();
		});
		$("span.playlist_hover a[data-btn='playlist_remove']").click(function(event){
			$.post("http://worldscolli.de/api/dj", {
				type: "remove_playlist",
				data: {
					username: bg_page.username,
					password: bg_page.password,
					link: $(this).parent().parent().find("div.row.title a").attr("href")
				}
			}, function(data){
				console.log(data);
				if (data.type == "refresh"){
					toast(data.data.message, 1000);
					refresh();
				} else if (data.type == "message"){
					toast(data.data.message, 1000);
				}
			});
		});
		
		if ($("div#queue > div.row.item").length == 0){
			$("span.queue_empty").show();
		} else {
			$("span.queue_empty").hide();
		}
		if ($("div#playlist > div.row.item").length == 0){
			$("span.playlist_empty").show();
		} else {
			$("span.playlist_empty").hide();
		}
	});
}

function update_colours(colour){
	$("nav").css("background-color", colour);
	$("div.indicator").css("background-color", colour);
	$("ul.tabs li.tab a").css("color", colour);
}

function create_item(title, link, user, secs, thumb, first, search, playlist){
	var item = $("<div/>", {
		"class": "row item"
	});
	
	if (search){
		item.append($("<div/>", {
			"class": "search_hover"
		}).append($("<a/>", {
			"class": "waves-effect waves-light btn",
			"data-btn": "search_add",
			"href": "#"
		}).text("Add")).append($("<a/>", {
			"class": "waves-effect waves-light btn",
			"href": link,
			"target": "_blank"
		}).text("Open in new tab")));
	}
	if (playlist){
		item.append($("<span/>", {
			"class": "playlist_hover"
		}).append($("<a/>", {
			"class": "waves-effect waves-light btn",
			"data-btn": "playlist_remove",
			"href": "#"
		}).text("Remove")).append($("<a/>", {
			"class": "waves-effect waves-light btn",
			"href": link,
			"target": "_blank"
		}).text("Open in new tab")));
	}
	if (thumb){
		item.append($("<div/>", {
			"class": "col s2"
		}).append($("<i/>", {
			"class": first ? "mdi-av-play-arrow" : "mdi-hardware-keyboard-arrow-up"
		})));
	}
	
	item.append($("<div/>", {
		"class": "col s8"
	}).append($("<div/>").append($("<div/>", {
		"class": "row title"
	}).append($("<a/>", {
		"href": link,
		"title": title,
		"target": "_blank"
	}).text(title))).append($("<div/>", {
		"class": "row submitter"
	}).text(user)))).append($("<div/>", {
		"class": "col s2"
	}).append($("<div/>").append($("<div/>", {
		"class": "row duration"
	}).text(convert_to_clock(secs)))));
	
	return item;
}

function convert_yt_to_secs(duration){
	duration = duration.replace("PT", "");
	duration = duration.replace("H", " * 3600) + (");
	duration = duration.replace("M", " * 60) + (");
	
	if (duration.indexOf("S") > -1){
		duration = duration.replace("S", " * 1)");
	} else {
		duration = duration + "0)";
	}
	
	return eval("(" + duration);
}

// Source: https://github.com/MeoMix/StreamusChromeExtension/blob/master/src/js/common/utility.js
function convert_to_clock(timeInSeconds){
	if (isNaN(timeInSeconds)) {
        timeInSeconds = 0;
    }

    var hours = Math.floor(timeInSeconds / 3600);
    var remainingSeconds = timeInSeconds % 3600;
    
    var minutes = Math.floor(remainingSeconds / 60);
    remainingSeconds = remainingSeconds % 60;

    //  Ensure two-digits for small numbers
    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (remainingSeconds < 10) {
        remainingSeconds = "0" + remainingSeconds;
    }

    var timeString = minutes + ':' + remainingSeconds;

    if (hours > 0) {
        timeString = hours + ':' + timeString;
    }

    return timeString;
}