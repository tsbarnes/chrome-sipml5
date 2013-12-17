/**
 * 
 */

function SIP() {
	this.stack = null;
	this.callbacks = {};

	document.write('<audio id="sip_output" autoplay="autoplay"></audio>');
}

SIP.prototype.addListener = function(type, callback) {
	if(!this.callbacks[type]) {
		this.callbacks[type] = [];
	}
	this.callbacks[type].push(callback);
};

SIP.prototype.login = function() {
	var self = this;
	var registerSession = this.stack.newSession('register', {
		sip_caps: [{
			name: '+g.oma.sip-im',
			value: null
		}, {
			name: '+audio',
			value: null
		}, {
			name: 'language',
			value: '\"en,fr\"'
		}],
		events_listener: {
			events: '*',
			listener: function(event) {
				console.info('register session event = ' + event.type);
				if(event.description) {
					console.info(' ** ' + event.description + ' ** ');
				}
				if(self.callbacks[event.type]) {
					for(var loop = 0; loop < self.callbacks[event.type].length; loop++) {
						self.callbacks[event.type][loop](event);
					}
				}
			}
		}
	});
	registerSession.register();
};

SIP.prototype.sendMessage = function(toAddr, message) {
	if(!this.messageSession) {
		this.messageSession = this.stack.newSession('message', {
			events_listener: {
				events: '*',
				listener: function(event) {
					console.info('message session event = ' + event.type);
					if(event.description) {
						console.info(' ** ' + event.description + ' ** ');
					}
					if(self.callbacks[event.type]) {
						for(var loop = 0; loop < self.callbacks[event.type].length; loop++) {
							self.callbacks[event.type][loop](event);
						}
					}
				}
			}
		// optional: '*' means all events
		});
	}
	messageSession.send(toAddr, message, 'text/plain;charset=utf-8');
	return messageSession;
};

SIP.prototype.call = function(toaddr) {
	if(!this.callSession) {
		this.callSession = this.stack.newSession('call-audio', {
			audio_remote: document.getElementById('sip_output'),
			sip_caps: [{
				name: '+g.oma.sip-im'
			}, {
				name: '+sip.ice'
			}, {
				name: 'language',
				value: '\"en,fr\"'
			}],
			expires: 100,
			events_listener: {
				events: '*',
				listener: function(event) {
					console.info('call session event = ' + event.type);
					if(event.description) {
						console.info(' ** ' + event.description + ' ** ');
					}
					if(self.callbacks[event.type]) {
						for(var loop = 0; loop < self.callbacks[event.type].length; loop++) {
							self.callbacks[event.type][loop](event);
						}
					}
				}
			}
		// optional: '*' means all events
		});
	}
	this.callSession.call(toaddr);
	return this.callSession;
};

SIP.prototype.acceptMessage = function(event) {
	event.newSession.accept(); // e.newSession.reject(); to reject the message
	console.info('SMS-content = ' + event.getContentString() + ' and SMS-content-type = ' + event.getContentType());
};

SIP.prototype.acceptCall = function(event) {
	event.newSession.accept(); // e.newSession.reject() to reject the call
};

SIP.prototype.declineCall = function(event) {
	event.newSession.reject(); // e.newSession.reject() to reject the call
};

SIP.prototype.setOptions = function(options) {
	var self = this;
	if(!this.stack) {
		this.stack = new SIPml.Stack($.extend({
			realm: 'sip2sip.info', // mandatory: domain name
			impi: 'bob', // mandatory: authorization name (IMS Private Identity)
			impu: 'sip:bob@example.org', // mandatory: valid SIP Uri (IMS Public Identity)
			password: null, // optional
			display_name: null, // optional
			websocket_proxy_url: null, // optional
			outbound_proxy_url: null, // optional
			ice_servers: null,
			enable_rtcweb_breaker: false, // optional
			enable_early_ims: true,
			enable_media_stream_cache: false,
			events_listener: {
				events: '*',
				listener: function(event) {
					console.info('sip stack event = ' + event.type);
					if(event.description) {
						console.info(' ** ' + event.description + ' ** ');
					}
					if(event.type == 'started') {
						self.login();
					}
					if(self.callbacks[event.type]) {
						for(var loop = 0; loop < self.callbacks[event.type].length; loop++) {
							self.callbacks[event.type][loop](event);
						}
					}
				}
			}, // optional: '*' means all events
			sip_headers: [ // optional
			{
				name: 'User-Agent',
				value: 'IM-client/OMA1.0 sipML5-v1.0.0.0'
			}]
		}, options));
		this.stack.start();
	} else {
		this.stack.setConfiguration(options);
		this.restart();
	}
};

SIP.prototype.restart = function() {
	this.stack.stop();
	this.stack.start();
};
