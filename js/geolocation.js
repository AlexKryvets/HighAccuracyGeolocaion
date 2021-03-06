(function (geolocation) {
	window.geolocation = window.geolocation || {MIN_ACCURACY: 0, NOT_MAX_ACCURACY: 1, MAX_ACCURACY: 2};
	window.geolocation.getCurrentPosition = function () {		
		var onSuccess = (typeof arguments[0] === 'function') ? arguments[0] : function () {},
			onError = (typeof arguments[1] === 'function') ? arguments[1] : defaultErrorHandler,
			options = (typeof arguments[1] !== 'function') ? (arguments[1] || {}) : (arguments[2] || {}),
			identifier = null;
		options.maxAccuracy = options.maxAccuracy || 100;
		if (geolocation) {
			if (options.enableHighAccuracy) {
				identifier = getHighAccuracyPosition(
					function (highPosition) {
						onSuccess(highPosition, window.geolocation.MAX_ACCURACY);
					},
					function (error, lowPosition) {
						if (lowPosition != null) {
							onSuccess(lowPosition, window.geolocation.NOT_MAX_ACCURACY);
						} else {
							onError(error);
						}
					}, options
				);
			} else {
				getLowAccuracyPosition(
					function (position) {
						onSuccess(position, window.geolocation.MIN_ACCURACY);
					}, onError, options
				);
			}
		} else {
			onError({UNKNOWN_ERROR: 0, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, code: 4});
		}
		return identifier;
	};	
	window.geolocation.clearWatch = function (identifier) {	
		if (identifier != null) {
			geolocation.clearWatch(identifier.watchId);
			clearTimeout(identifier.setTimeoutId);
		}
	};	
	var getLowAccuracyPosition = function (onSuccess, onError, options) {
		geolocation.getCurrentPosition(
			function (position) {
				onSuccess(position); 
			},
			onError, options
		);
	};	
	var getHighAccuracyPosition = (function () {
		var lowPosition = null;
		return function (onSuccess, onError, options) {
			var watchId = geolocation.watchPosition(
				function (position) {
					if (position.coords.accuracy < options.maxAccuracy) {
						clearTimeout(setTimeoutId);
						onSuccess(position);
						geolocation.clearWatch(watchId);
						lowPosition = null;
					}
					lowPosition = position;
				}, 
				function (error) {
					clearTimeout(setTimeoutId);
					onError(error, lowPosition);
					geolocation.clearWatch(watchId);
				}, options
			);
			var setTimeoutId = setTimeout(
				function () { 
					geolocation.clearWatch(watchId);
					console.log(lowPosition);
					onError({UNKNOWN_ERROR: 0, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, code: 3}, lowPosition);
				}, options.timeout + 1000
			);
			return {watchId: watchId, setTimeoutId: setTimeoutId};
		};	
	}());
	var defaultErrorHandler = function (error) {
		switch (error.code)	{
			case error.PERMISSION_DENIED:
				alert("User denied the request for Geolocation.");
				break;
			case error.POSITION_UNAVAILABLE:
				alert("Location information is unavailable.");
				break;
			case error.TIMEOUT:
				alert("The request to get user location timed out.");
				break;
			case error.UNKNOWN_ERROR:
				alert("An unknown error occurred.");
				break;
			case 4:
				alert("Geolocation is not supported");
				break;
		}	
	};	
}(navigator.geolocation));