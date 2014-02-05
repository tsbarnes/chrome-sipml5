/**
 * Chrome SIP Client using SIPml5
 */

var options = {
	realm: null,
	impi: null,
	impu: null,
	password: null,
	display_name: null,
	websocket_proxy_url: null,
	outbound_proxy_url: null,
	ice_servers: [],
	enable_rtcweb_breaker: true,
	enable_early_ims: true,
	enable_media_stream_cache: false
};

var client = new SIP();

var notifySound = new Audio('wav/phone-ringing.wav');

chrome.notifications.onButtonClicked.addListener(function(notificationId,
		buttonIndex) {
	var notificationInfo = notificationId.split('/');
	var type = notificationInfo[0];
	var id = notificationInfo[1];
	if(type == 'sip_incoming_call') {
		if(buttonIndex == 0) {
			client.stack.ao_sessions[id].accept();
		} else {
			client.stack.ao_sessions[id].reject();
		}
		chrome.notifications.clear(notificationId, function(wasCleared) {
			if(wasCleared) {
				console.log('Call notification cleared');
			}
		});
	}
});

chrome.notifications.onClicked.addListener(function(notificationId) {
	var notificationInfo = notificationId.split('/');
	var type = notificationInfo[0];
	var id = notificationInfo[1];
	if(type == 'sip_incoming_call') {
		client.stack.ao_sessions[id].accept();
		chrome.notifications.clear(notificationId, function(wasCleared) {
			if(wasCleared) {
				console.log('Call notification cleared');
			}
		});
	}
});

chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
	var notificationInfo = notificationId.split('/');
	var type = notificationInfo[0];
	var id = notificationInfo[1];
	if(type == 'sip_incoming_call') {
		if(byUser == true) {
			client.stack.ao_sessions[id].reject();
		}
		notifySound.stop();
	}
});

client.addListener('connected', function(type, event) {
	if(type == 'login') {
		console.log('Login event handler called');
		chrome.notifications.create('', {
			type: 'basic',
			iconUrl: 'img/icon48.png',
			title: 'SIP connected',
			message: 'SIP client is now connected!',
			eventTime: Date.now() + 500,
			priority: -2
		}, function(notificationId) {
		});
	}
});

client.addListener('i_new_call', function(type, event) {
	if(type == 'stack') {
		chrome.notifications.create('sip_incoming_call/' + event.newSession.getId(), {
			type: 'basic',
			iconUrl: 'img/icon48.png',
			title: 'Incoming call',
			message: 'SIP call incoming',
			isClickable: true,
			priority: 2,
			buttons: [{
				title: 'Accept'
			}, {
				title: 'Decline'
			}]
		}, function(notificationId) {
		});
		notifySound.load();
		notifySound.play();
	}
});

chrome.storage.local.get(options, function(items) {
	for( var key in items) {
		options[key] = items[key];
	}

	client.setOptions(options);
});

chrome.storage.onChanged.addListener(function(changes, areaName) {
	if(areaName == 'local') {
		for( var key in changes) {
			options[key] = changes[key].newValue;
		}
		client.setOptions(options);
	}
});

chrome.runtime.onConnect.addListener(function(port) {
	if(port.name == 'options') {
		port.onMessage.addListener(function(message) {
			if(message.type == 'options') {
				port.postMessage(options);
			}
		});
	} else if(port.name == 'popup') {
		port.onMessage.addListener(function(message) {
			if(message.type == 'calls') {
				var response = {};
				for( var id in client.stack.ao_sessions) {
					if(client.stack.ao_sessions[id] != undefined) {
						if(client.stack.ao_sessions[id].call != undefined) {
							response[client.stack.ao_sessions[id].getId()] = {
								'session': client.stack.ao_sessions[id].getId()
							};
						}
					}
				}
				port.postMessage(response);
			} else if(message.type == 'call') {
				console.log('Calling ' + message.toaddr);
				client.call(message.toaddr);
			} else if(message.type == 'hangup') {
				console.log('Hanging up');
				client.stack.ao_sessions[message.session].hangup();
				chrome.notifications.clear('sip_incoming_call', function(
						wasCleared) {
					if(wasCleared) {
						console.log('Call notification cleared');
					}
				});
			} else if(message.type == 'answer') {
				client.stack.ao_sessions[message.session].accept();
				chrome.notifications.clear('sip_incoming_call', function(
						wasCleared) {
					if(wasCleared) {
						console.log('Call notification cleared');
					}
				});
			}
		});
	}
});
