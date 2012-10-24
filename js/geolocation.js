(function (geolocation) {
	window.geolocation = window.geolocation || {MIN_ACCURACY: 0, NOT_MAX_ACCURACY: 1, MAX_ACCURACY: 2};
	window.geolocation.getCurrentPosition = function () {		
		var onSuccess = (typeof arguments[0] === 'function') ? arguments[0] : function () {},
			onError = (typeof arguments[1] === 'function') ? arguments[1] : function () {},
			options = (typeof arguments[1] !== 'function') ? (arguments[1] || {}) : (arguments[2] || {}),
			identifier = null;
		options.numberOfTriesForBestResult = options.numberOfTriesForBestResult || 1;
		options.maxAccuracy = options.maxAccuracy || 100;
		if (geolocation) {
			if (options.enableHighAccuracy) {
				identifier = getHighAccuracyPosition(
					function (highPosition) {
						onSuccess(highPosition, window.geolocation.MAX_ACCURACY);
					},
					function (error) {
						getLowAccuracyPosition(
							function (lowPosition) {
								onSuccess(lowPosition, window.geolocation.NOT_MAX_ACCURACY);
							}, onError, options
						);
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
			handleNoGeolocation();
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
			function (error) {
				if (typeof onError === 'function') { 
					onError(error); 
				} else {
					handleError(error);
				}
			}, options
		);
	};	
	var getHighAccuracyPosition = function (onSuccess, onTimeoutError, options) {
		var counter = 0, watchId = setTimeoutId = null;
		watchId = geolocation.watchPosition(
			function (position) {
				if (position.coords.accuracy < options.maxAccuracy) {
					geolocation.clearWatch(watchId);
					clearTimeout(setTimeoutId);
					onSuccess(position); 
				} else if (counter > options.numberOfTriesForBestResult) {
					geolocation.clearWatch(watchId);
					clearTimeout(setTimeoutId);
				} 
				counter++;
			}, 
			function (error) {
				clearTimeout(setTimeoutId);
				if (error.code == error.TIMEOUT) {
					onTimeoutError(error);
				} else {
					handleError(error);
				}
			}, options
		);
		setTimeoutId = setTimeout(function () { 
			geolocation.clearWatch(watchId); 
			onTimeoutError({PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, code: 3}); 
		}, options.timeout + 1000);
		return {watchId: watchId, setTimeoutId: setTimeoutId};
	};	
	var handleError = function (error) {
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
		}	
	};	
	var handleNoGeolocation = function () {
		alert('Ваш браузер не поддерживает геолокацию');
	};
}(navigator.geolocation));