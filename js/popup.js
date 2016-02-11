/**
 *
 */

function SIPClientCtrl($scope) {
	$scope.toaddr = '';
	$scope.connected = false;
	$scope.dialpad = [1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'];
	$scope.calls = {};

	chrome.runtime.onMessage.addListener(function(message) {
		if(message.type == 'update') {
			$scope.connected = message.connected;
			for( var key in message.calls) {
				$scope.calls[key] = message[key];
			}
			$scope.$apply();
		}
	});
	chrome.runtime.sendMessage({
		type: 'noop'
	});

	$scope.connect = function() {
		chrome.runtime.sendMessage({
			type: 'connect'
		});
	};

	$scope.disconnect = function() {
		chrome.runtime.sendMessage({
			type: 'disconnect'
		});
	};

	$scope.startCall = function() {
		chrome.runtime.sendMessage({
			type: 'call',
			toaddr: $scope.toaddr
		});
	};

	$scope.answer = function(sipCall) {
		chrome.runtime.sendMessage({
			type: 'answer',
			session: sipCall.session
		});
	};

	$scope.hangup = function(sipCall) {
		chrome.runtime.sendMessage({
			type: 'hangup',
			session: sipCall.session
		});
	};

	$scope.dtmf = function(sipCall, digit) {
		chrome.runtime.sendMessage({
			type: 'dtmf',
			session: sipCall.session,
			digit: digit
		});
	};
}

var SIPClient = angular.module('SIPClient', []);
SIPClient.controller('SIPClientCtrl', ['$scope', SIPClientCtrl]);
