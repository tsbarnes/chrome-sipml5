/**
 *
 */

function SIPClientCtrl($scope) {
	$scope.port = chrome.runtime.connect({
		name: 'popup'
	});
	$scope.toaddr = '';
	$scope.connected = false;
	$scope.calls = {};

	$scope.port.onMessage.addListener(function(message) {
		$scope.connected = message.connected;
		for( var key in message.calls) {
			$scope.calls[key] = message[key];
		}
		$scope.$apply();
	});
	$scope.port.postMessage({
		type: 'noop'
	});

	$scope.connect = function() {
		$scope.port.postMessage({
			type: 'connect'
		});
	};

	$scope.disconnect = function() {
		$scope.port.postMessage({
			type: 'disconnect'
		});
	};

	$scope.sipCall = function() {
		$scope.port.postMessage({
			type: 'call',
			toaddr: $scope.toaddr
		});
	};

	$scope.answer = function(sipCall) {
		$scope.port.postMessage({
			type: 'answer',
			session: sipCall.session
		});
	};

	$scope.hangup = function(sipCall) {
		$scope.port.postMessage({
			type: 'hangup',
			session: sipCall.session
		});
	};
}

var SIPClient = angular.module('SIPClient', []);
SIPClient.controller('SIPClientCtrl', ['$scope', SIPClientCtrl]);
