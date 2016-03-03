/**
 *
 */

function SIP() {
	this.output = document.createElement('audio');
	this.output.setAttribute('autoplay', 'autoplay');
	this.stack = null;
	this.callbacks = {};
	this.current_calls = {};

	SIPml.init();
}

SIP.prototype.addListener = function(type, callback) {
	if (!this.callbacks[type]) {
		this.callbacks[type] = [];
	}
	this.callbacks[type].push(callback);
};

SIP.prototype.login = function() {
	var self = this;
	var registerSession = this.stack.newSession('register', {
	    sip_caps : [ {
	        name : '+g.oma.sip-im',
	        value : null
	    }, {
	        name : '+audio',
	        value : null
	    }, {
	        name : 'language',
	        value : '\"en\"'
	    } ],
	    events_listener : {
	        events : '*',
	        listener : function(event) {
		        console.info('register session event = ' + event.type);
		        if (event.description) {
			        console.info(' ** ' + event.description + ' ** ');
		        }
		        if (event.type == 'connected') {
			        self.presence();
		        }
		        if (self.callbacks[event.type]) {
			        for (var loop = 0; loop < self.callbacks[event.type].length; loop++) {
				        self.callbacks[event.type][loop]('login', event);
			        }
		        }
	        }
	    }
	});
	registerSession.register();
};

SIP.prototype.presence = function() {
	var publishSession = this.stack.newSession('publish', {
		events_listener : {
		    events : '*',
		    listener : function(event) {
			    console.info('presence session event = ' + event.type);
			    if (event.description) {
				    console.info(' ** ' + event.description + ' ** ');
			    }
		    }
		}
	});
	var contentType = 'application/pidf+xml';
	var content = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';
	content += '<presence xmlns=\"urn:ietf:params:xml:ns:pidf\"\n';
	content += ' xmlns:im=\"urn:ietf:params:xml:ns:pidf:im\"';
	content += ' entity=\"' + this.configuration.impu + '\">\n';
	content += '<tuple id=\"s8794\">\n';
	content += '<status>\n';
	content += '   <basic>open</basic>\n';
	content += '   <im:im>away</im:im>\n';
	content += '</status>\n';
	content += '</tuple>\n';
	content += '</presence>';

	// send the PUBLISH request
	publishSession.publish(content, contentType, {
	    expires : 200,
	    sip_caps : [ {
		    name : '+g.oma.sip-im'
	    }, {
		    name : '+sip.ice'
	    }, {
	        name : 'language',
	        value : '\"en\"'
	    } ],
	    sip_headers : [ {
	        name : 'Event',
	        value : 'presence'
	    }, {
	        name : 'Organization',
	        value : 'Doubango Telecom'
	    } ]
	});
};

SIP.prototype.sendMessage = function(toAddr, message) {
	var self = this;
	var messageSession = this.stack.newSession('message', {
		events_listener : {
		    events : '*',
		    listener : function(event) {
			    console.info('message session event = ' + event.type);
			    if (event.description) {
				    console.info(' ** ' + event.description + ' ** ');
			    }
			    if (self.callbacks[event.type]) {
				    for (var loop = 0; loop < self.callbacks[event.type].length; loop++) {
					    self.callbacks[event.type][loop]('message', event);
				    }
			    }
		    }
		}
	// optional: '*' means all events
	});
	messageSession.send(toAddr, message, 'text/plain;charset=utf-8');
	return messageSession;
};

SIP.prototype.sipCall = function(toaddr) {
	var self = this;
	var callSession = this.stack.newSession('call-audio', {
	    audio_remote: this.output,
	    sip_caps: [
				{
		    	name: '+g.oma.sip-im'
	    	},
				{
		    	name: '+sip.ice'
	    	},
				{
	        name: 'language',
	        value: '\"en\"'
	    	}
			],
	    expires: 100,
	    events_listener: {
	      events: '*',
	      listener: function(event) {
		    	console.info('call session event = ' + event.type);
		      if (event.description) {
			      console.info(' ** ' + event.description + ' ** ');
		      }
					if (event.type == 'connected') {
						self.current_calls[event.session.getId()] = {
							type: 'call',
							session: event.session.getId(),
							state: 'active'
						};
					} else if (event.type == 'terminating') {
						delete self.current_calls[event.session.getId()];
					}
		      if (self.callbacks[event.type]) {
			      for (var loop = 0; loop < self.callbacks[event.type].length; loop++) {
				      self.callbacks[event.type][loop]('call', event);
			      }
		      }
	      }
	    }
	// optional: '*' means all events
	});
	callSession.call(toaddr);
	return callSession;
};

SIP.prototype.dtmf = function(sessionId, digit) {
	if(this.stack && this.stack.ao_sessions && this.stack.ao_sessions[sessionId]) {
		if(this.stack.ao_session[sessionId].dtmf !== undefined) {
			this.stack.ao_sessions[sessionId].dtmf(digit);
		}
	}
};

SIP.prototype.callTransfer = function(sessionId, toaddr) {
	if(this.stack && this.stack.ao_sessions && this.stack.ao_sessions[sessionId]) {
		if(this.stack.ao_session[sessionId].transfer !== undefined) {
			this.stack.ao_sessions[sessionId].transfer(toaddr);
		}
	}
}

SIP.prototype.acceptMessage = function(event) {
	event.newSession.accept(); // e.newSession.reject(); to reject the
	// message
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
	this.configuration = $.extend({
		realm: 'example.org', // mandatory: domain name
		impi: 'bob', // mandatory: authorization name (IMS Private Identity)
		impu: 'sip:bob@example.org', // mandatory: valid SIP Uri (IMS Public Identity)
		password: null, // optional
		display_name: null, // optional
		websocket_proxy_url: null, // optional
		outbound_proxy_url: null, // optional
		ice_servers: [],
		enable_rtcweb_breaker: false, // optional
		enable_early_ims: true,
		enable_media_stream_cache: false,
		sip_headers: [ // optional
			{
				name: 'User-Agent',
				value: 'IM-client/OMA1.0 sipML5-v1.0.0.0'
			}
		]
	}, options);
	if (!this.configuration.realm) {
		console.log("SIP realm not set, not connecting");
	} else if (!this.configuration.impi) {
		console.log("IMPI not set, not connecting");
	} else if (!this.stack) {
		if (!this.configuration.impu) {
			this.configuration.impu = "sip:" + this.configuration.impi;
			this.configuration.impu += "@" + this.configuration.realm;
		}
		console.log(this.configuration);
		this.stack = new SIPml.Stack(this.configuration);
		this.stack.addEventListener('*', function(event) {
			console.info('sip stack event = ' + event.type);
			if (event.description) {
				console.info(' ** ' + event.description + ' ** ');
			}
			if (event.type == 'started') {
				self.login();
			} else if (event.type == 'i_new_call') {
				self.current_calls[event.newSession.getId()] = {
					type: 'call',
					session: event.newSession.getId(),
					state: 'incoming'
				};
			}
			if (self.callbacks[event.type]) {
				for (var loop = 0; loop < self.callbacks[event.type].length; loop++) {
					self.callbacks[event.type][loop]('stack', event);
				}
			}
		});
		this.stack.start();
	} else {
		this.stack.stop();
		this.stack.setConfiguration(this.configuration);
		this.stack.start();
	}
};

SIP.prototype.restart = function() {
	this.stack.stop();
	this.stack.start();
};

SIP.prototype.calls = function() {
	// var calls = {};
	// if(this.stack && this.stack.ao_sessions) {
	// 	for(var id in this.stack.ao_sessions) {
	// 		if(this.stack.ao_sessions[id] !== undefined) {
	// 			if(this.stack.ao_sessions[id] instanceof SIPml.Session.Call) {
	// 				if(this.stack.ao_sessions[id].o_session.o_stream_remote !== null) {
	// 					calls[this.stack.ao_sessions[id].getId()] = {
	// 						'session': this.stack.ao_sessions[id].getId()
	// 					};
	// 				}
	// 			}
	// 		}
	// 	}
	// }
	return this.current_calls;
};

SIP.prototype.connected = function() {
	if(this.stack && this.stack.ao_sessions) {
		for(var id in this.stack.ao_sessions) {
			if(this.stack.ao_sessions[id] !== undefined) {
				if(this.stack.ao_sessions[id] instanceof SIPml.Session.Registration) {
					return true;
				}
			}
		}
	}
	return false;
};
