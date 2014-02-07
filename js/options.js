/**
 *
 */

function SIPOptionsCtrl($scope) {
	$scope.port = chrome.runtime.connect({
		name: 'options'
	});
	$scope.options = {};

	$scope.port.onMessage.addListener(function(message) {
		for( var key in message) {
			$scope.options[key] = message[key];
		}
		$scope.$apply();
	});
	$scope.port.postMessage({
		type: 'options'
	});

	chrome.storage.onChanged.addListener(function(changes, areaName) {
		if(areaName == 'local') {
			$scope.port.postMessage({
				type: 'options'
			});
		}
	});

	$scope.submit = function() {
		chrome.storage.local.set($scope.options);
	};

	$scope.grabMedia = function() {
		navigator.webkitGetUserMedia({
			audio: true
		}, function() {
		});
	};

	$scope.addICEServer = function() {
		if(!$scope.options.ice_servers || typeof ($scope.options.ice_servers) != 'object') {
			$scope.options.ice_servers = [];
		}
		$scope.options.ice_servers.push({
			url: ''
		});
	};

	$scope.removeICEServer = function(index) {
		$scope.options.ice_servers.splice(index, 1);
	};
}

var SIPOptions = angular.module('SIPOptions', []);
SIPOptions.controller('SIPOptionsCtrl', ['$scope', SIPOptionsCtrl]);
