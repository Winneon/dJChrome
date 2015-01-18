window.logged_in = false;
window.username  = undefined;
window.password  = undefined;
window.colour    = undefined;

chrome.storage.sync.get("colour", function(data){
	if (data.colour){
		window.colour = data.colour;
	}
});
chrome.storage.sync.get("username", function(data){
	if (data.username){
		window.username = data.username;
		chrome.storage.sync.get("password", function(data){
			if (data.password){
				window.password = data.password;
				window.logged_in = true;
			}
		});
	}
});

function playlist(){
	$.post("http://worldscolli.de/api/dj", {
		type: "refresh",
		data: {
			username: window.username,
			password: window.password
		}
	}, function(data){
		if (window.logged_in){
			var cont = true;
			for (var i in data.data.queue){
				if (data.data.queue[i].user == window.username){
					cont = false;
				}
			}
			if (cont){
				console.log(data);
				if (data.data.playlist.length > 0){
					$.post("http://worldscolli.de/api/dj", {
						type: "add",
						data: {
							username: window.username,
							password: window.password,
							link: data.data.playlist[0].link,
							playlist: true
						}
					}, function(data){ });
				}
			}
		}
	});
}

setInterval(playlist, 10000);