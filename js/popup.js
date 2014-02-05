/**
 *
 */

function SIPClientCtrl($scope) {
	$scope.port = chrome.runtime.connect({
		name: 'popup'
	});
	$scope.toaddr = '';
	$scope.calls = {};

	$scope.port.onMessage.addListener(function(message) {
		for( var key in message) {
			$scope.calls[key] = message[key];
		}
		$scope.$apply();
	});
	$scope.port.postMessage({
		type: 'calls'
	});

	$scope.call = function() {
		port.postMessage({
			type: 'call',
			toaddr: $scope.toaddr
		});
	};

	$scope.answer = function(call) {
		port.postMessage({
			type: 'answer',
			session: call.session
		});
	};

	$scope.hangup = function(call) {
		port.postMessage({
			type: 'hangup',
			session: call.session
		});
	};
}

var SIPClient = angular.module('SIPClient', []);
SIPClient.controller('SIPClientCtrl', ['$scope', SIPClientCtrl]);