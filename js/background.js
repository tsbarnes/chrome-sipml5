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
var currentCall;

var notifySound = new Audio('wav/phone-ringing.wav');

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
	if(notificationId == 'sip_incoming_call' && currentCall) {
		if(buttonIndex == 0) {
			currentCall.accept();
		} else {
			currentCall.reject();
		}
		chrome.notifications.clear(notificationId, function(wasCleared) {
			if(wasCleared) {
				console.log('Call notification cleared');
			}
		});
	}
});

chrome.notifications.onClicked.addListener(function(notificationId) {
	if(notificationId == 'sip_incoming_call' && currentCall) {
		currentCall.accept();
		chrome.notifications.clear(notificationId, function(wasCleared) {
			if(wasCleared) {
				console.log('Call notification cleared');
			}
		});
	}
});

chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
	if(notificationId == 'sip_incoming_call') {
		if(currentCall && byUser == true) {
			currentCall.reject();
		}
		notifySound.stop();
	}
});

client.addListener('connected', function(event) {
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
});

client.addListener('i_new_call', function(event) {
	chrome.notifications.create('sip_incoming_call', {
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
		currentCall = event.newSession;
		notifySound.load();
		notifySound.play();
	});
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
			if(message.type == 'call') {
				console.log('Calling ' + message.toaddr);
				currentCall = client.call(message.toaddr);
			} else if(message.type == 'hangup' && currentCall) {
				console.log('Hanging up');
				currentCall.hangup();
			}
		});
	}
});
