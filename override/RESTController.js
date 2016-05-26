/**
 * Copyright (c) 2015-present, Parse, LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import CoreManager from './CoreManager';
import ParseError from './ParseError';
import ParsePromise from './ParsePromise';
import Storage from './Storage';

export type RequestOptions = {
  useMasterKey?: boolean;
  sessionToken?: string;
};

export type FullOptions = {
  success?: any;
  error?: any;
  useMasterKey?: boolean;
  sessionToken?: string;
};

var XHR = null;

const RESTController = {
  ajax(method: string, url: string, data: any, headers?: any) {
    var promise = new ParsePromise();

    var attempts = 0;

    var dispatch = function() {

      var handled = false;

	    var xhr = Ti.Network.createHTTPClient({
	      timeout : 120000
	    });
	    xhr.onload = function(e) {
        if (handled)
          return;
        handled = !0;

        if (xhr.status >= 200 && xhr.status < 300) {
          var response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            // promise.reject(e.toString());
            promise.resolve(xhr.responseText, xhr.status, xhr);
          }
          if (response) {
            promise.resolve(response, xhr.status, xhr);
          }
        } else if (xhr.status >= 500 || xhr.status === 0) { // retry on 5XX or node-xmlhttprequest error
          if (++attempts < CoreManager.get('REQUEST_ATTEMPT_LIMIT')) {
            // Exponentially-growing random delay
            var delay = Math.round(
              Math.random() * 125 * Math.pow(2, attempts)
            );
            setTimeout(dispatch, delay);
          } else if (xhr.status === 0) {
            promise.reject('Unable to connect to the Parse API');
          } else {
            // After the retry limit is reached, fail
            promise.reject(xhr);
          }
        } else {
          promise.reject(xhr);
        }
	    };
      xhr.onerror = function(e) {
        if (handled)
          return;
        handled = !0;

        promise.reject(xhr);
      };
	    xhr.open(method, url, !0);
	    xhr.setRequestHeader("Content-Type", "text/plain");
	    headers = headers || {};
		for (var h in headers) {
			xhr.setRequestHeader(h, headers[h]);
		}
	    xhr.send(data);
	}
	dispatch();

    return promise;
  },

  request(method: string, path: string, data: mixed, options?: RequestOptions) {
    options = options || {};
    var url = CoreManager.get('SERVER_URL');
    if (url[url.length - 1] !== '/') {
      url += '/';
    }
    url += path;

    var payload = {};
    if (data && typeof data === 'object') {
      for (var k in data) {
        payload[k] = data[k];
      }
    }

    if (method !== 'POST') {
      payload._method = method;
      method = 'POST';
    }

    payload._ApplicationId = CoreManager.get('APPLICATION_ID');
    let jsKey = CoreManager.get('JAVASCRIPT_KEY');
    if (jsKey) {
      payload._JavaScriptKey = jsKey;
    }
    payload._ClientVersion = CoreManager.get('VERSION');

    var useMasterKey = options.useMasterKey;
    if (typeof useMasterKey === 'undefined') {
      useMasterKey = CoreManager.get('USE_MASTER_KEY');
    }
    if (useMasterKey) {
      if (CoreManager.get('MASTER_KEY')) {
        delete payload._JavaScriptKey;
        payload._MasterKey = CoreManager.get('MASTER_KEY');
      } else {
        throw new Error('Cannot use the Master Key, it has not been provided.');
      }
    }

    if (CoreManager.get('FORCE_REVOCABLE_SESSION')) {
      payload._RevocableSession = '1';
    }

    var installationController = CoreManager.getInstallationController();

    return installationController.currentInstallationId().then((iid) => {
      payload._InstallationId = iid;
      var userController = CoreManager.getUserController();
      if (options && typeof options.sessionToken === 'string') {
        return ParsePromise.as(options.sessionToken);
      } else if (userController) {
        return userController.currentUserAsync().then((user) => {
          if (user) {
            return ParsePromise.as(user.getSessionToken());
          }
          return ParsePromise.as(null);
        });
      }
      return ParsePromise.as(null);
    }).then((token) => {
      if (token) {
        payload._SessionToken = token;
      }

      var payloadString = JSON.stringify(payload);

      return RESTController.ajax(method, url, payloadString);
    }).then(null, function(response: { responseText: string }) {
      // Transform the error into an instance of ParseError by trying to parse
      // the error string as JSON
      var error;
      if (response && response.responseText) {
        try {
          var errorJSON = JSON.parse(response.responseText);
          error = new ParseError(errorJSON.code, errorJSON.error);
        } catch (e) {
          // If we fail to parse the error text, that's okay.
          error = new ParseError(
            ParseError.INVALID_JSON,
            'Received an error with invalid JSON from Parse: ' +
              response.responseText
          );
        }
      } else {
        error = new ParseError(
          ParseError.CONNECTION_FAILED,
          'XMLHttpRequest failed: ' + JSON.stringify(response)
        );
      }

      return ParsePromise.error(error);
    });
  },

  _setXHR(xhr: any) {
    XHR = xhr;
  }
}

module.exports = RESTController;
