(function (geolocation) {
	window.geolocation = window.geolocation || {MIN_ACCURACY: 0, NOT_MAX_ACCURACY: 1, MAX_ACCURACY: 2};
	window.geolocation.getCurrentPosition = function () {		
		var onSuccess = (typeof arguments[0] === 'function') ? arguments[0] : function () {},
			onError = (typeof arguments[1] === 'function') ? arguments[1] : defaultErrorHandler,
			options = (typeof arguments[1] !== 'function') ? (arguments[1] || {}) : (arguments[2] || {});
		options.maxAccuracy = options.maxAccuracy || 100;
		if (geolocation) {
			if (options.enableHighAccuracy) {
				getHighAccuracyPosition(
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
	};	
	window.geolocation.clearWatch = function (identifier) {	
	};	
	var getLowAccuracyPosition = function (onSuccess, onError, options) {
		geolocation.getCurrentPosition(onSuccess, onError, options);
	};	
	var getHighAccuracyPosition = function (onSuccess, onError, options) {
		var provider = new SingletonGeolocationProvider(options);
		var listener = {
			onSuccess: function (position) {
				if (position.coords.accuracy < options.maxAccuracy) {
					clearTimeout(setTimeoutId);
					onSuccess(position);
					provider.removeListener(listener);
				}
			}, 
			onError: function (error) {
				clearTimeout(setTimeoutId);
				onError(error, provider.getPosition());
				provider.removeListener(listener);
			}
		};
		var setTimeoutId = setTimeout(
			function () { 
				onError({UNKNOWN_ERROR: 0, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, code: 3}, provider.getPosition()); 
				provider.removeListener(listener);
			}, options.timeout + 1000
		);
		provider.addListener(listener);
	};	
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
	var extend = (function () {
		var F = function () {};
		return function (C, P) {
			F.prototype = P.prototype;
			C.prototype = new F();
			C.parent = P.prototype;
			C.prototype.constructor = C;
		}
	}());
	var AbstractProvider = function AbstractProvider () {};
	AbstractProvider.prototype.addListener = function (listener) {
		for (i in this._listeners) {
			if (listener == this._listeners[i]) {
				return;
			}
		}
		listener.onSuccess = listener.onSuccess || function () {};
		listener.onError = listener.onError || function () {};
		this._listeners.push(listener);
	};
	AbstractProvider.prototype.removeListener = function (listener) {
		for (i in this._listeners) {
			if (listener == this._listeners[i]) {
				this._listeners.splice(i, 1);
				break;
			}
		}
	};
	AbstractProvider.prototype.notifySuccess = function (position) {
		for (i in this._listeners) {
			this._listeners[i].onSuccess(position);
		}
	};
	AbstractProvider.prototype.notifyError = function (error) {
		for (i in this._listeners) {
			this._listeners[i].onError(error);
		}
	};
	var SingletonGeolocationProvider;
	(function () {
		var instance, options, position = null, watchId = null;
		SingletonGeolocationProvider = function SingletonGeolocationProvider (o) {
			options = o;
			if (instance) {
				return instance;
			}
			instance = this;
			this._listeners = [];
			this.addListener = function (listener) {
				SingletonGeolocationProvider.prototype.addListener.apply(instance, arguments);
				if (watchId == null) {
					watchId = geolocation.watchPosition(
						function (p) { 
							instance.notifySuccess(p); 
							position = p;
						}, 
						function (e) { 
							instance.notifyError(e); 
						},
						options
					);
				}
			};
			this.removeListener = function (listener) {
				SingletonGeolocationProvider.prototype.removeListener.apply(instance, arguments);
				if (this._listeners.length == 0) {
					geolocation.clearWatch(watchId);
					watchId = null;
					position = null;
				}
			};
			this.getWatchId = function () {
				return watchId;
			};
			this.getPosition = function () {
				return position;
			};
		};
		extend(SingletonGeolocationProvider, AbstractProvider);
	}());
}(navigator.geolocation));