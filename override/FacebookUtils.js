/**
 * Copyright (c) 2015-present, Parse, LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow-weak
 */

import parseDate from './parseDate';
import ParseUser from './ParseUser';

var PUBLIC_KEY = "*";

var initialized = false;
var requestedPermissions;
var initOptions;
var provider = {
	authenticate : function(options) {
        var self = this;
        TiFacebook.forceDialogAuth = false;
        TiFacebook.authorize();

		TiFacebook.addEventListener('login', function(response) {

			if (response.success) {
			     if (options.success) {
			        options.success(self, {
			            id :  JSON.parse(response.data).id,
			            access_token : TiFacebook.accessToken,
			            expiration_date : (new Date(TiFacebook.expirationDate)).toJSON()
			      });
			
			    }
			  } else {
			    if (options.error) {
			      options.error(self, response);
			    }
			  }
		});

	},
	restoreAuthentication : function(authData) {
		var authResponse;
		if (authData) {
			authResponse = {
				userID : authData.id,
				accessToken : authData.access_token,
				expiresIn : (Parse._parseDate(authData.expiration_date).getTime() - (new Date()).getTime()) / 1000
			};
	    } else {
	      authResponse = {
	        userID : null,
	        accessToken : null,
	        expiresIn : null
	      };
	    }
			    //FB.Auth.setAuthResponse(authResponse);
		if (!authData) {
		  TiFacebook.logout();
		}
		return true;
	},
	getAuthType : function() {
	    return "facebook";
	},
	deauthenticate : function() {
	    this.restoreAuthentication(null);
	},
    init : function() {
      Ti.API.debug("called FB.init()");
    },
    login : function() {
      Ti.API.debug("called FB.login()");
    },
    logout : function() {
      Ti.API.debug("called FB.logout()");
    }
};

/**
 * Provides a set of utilities for using Parse with Facebook.
 * @class Parse.FacebookUtils
 * @static
 */
var FacebookUtils = {
  /**
   * Initializes Parse Facebook integration.  Call this function after you
   * have loaded the Facebook Javascript SDK with the same parameters
   * as you would pass to<code>
   * <a href=
   * "https://developers.facebook.com/docs/reference/javascript/FB.init/">
   * FB.init()</a></code>.  Parse.FacebookUtils will invoke FB.init() for you
   * with these arguments.
   *
   * @method init
   * @param {Object} options Facebook options argument as described here:
   *   <a href=
   *   "https://developers.facebook.com/docs/reference/javascript/FB.init/">
   *   FB.init()</a>. The status flag will be coerced to 'false' because it
   *   interferes with Parse Facebook integration. Call FB.getLoginStatus()
   *   explicitly if this behavior is required by your application.
   */
  init(options) {
    if (typeof FB === 'undefined') {
      throw new Error(
        'The Facebook JavaScript SDK must be loaded before calling init.'
      );
    }
    initOptions = {};
    if (options) {
      for (var key in options) {
        initOptions[key] = options[key];
      }
    }
    if (initOptions.status && typeof console !== 'undefined') {
      var warn = console.warn || console.log || function() {};
      warn.call(console, 'The "status" flag passed into' +
        ' FB.init, when set to true, can interfere with Parse Facebook' +
        ' integration, so it has been suppressed. Please call' +
        ' FB.getLoginStatus() explicitly if you require this behavior.');
    }
    initOptions.status = false;
    FB.init(initOptions);
    ParseUser._registerAuthenticationProvider(provider);
    initialized = true;
  },

  /**
   * Gets whether the user has their account linked to Facebook.
   *
   * @method isLinked
   * @param {Parse.User} user User to check for a facebook link.
   *     The user must be logged in on this device.
   * @return {Boolean} <code>true</code> if the user has their account
   *     linked to Facebook.
   */
  isLinked(user) {
    return user._isLinked('facebook');
  },

  /**
   * Logs in a user using Facebook. This method delegates to the Facebook
   * SDK to authenticate the user, and then automatically logs in (or
   * creates, in the case where it is a new user) a Parse.User.
   *
   * @method logIn
   * @param {String, Object} permissions The permissions required for Facebook
   *    log in.  This is a comma-separated string of permissions.
   *    Alternatively, supply a Facebook authData object as described in our
   *    REST API docs if you want to handle getting facebook auth tokens
   *    yourself.
   * @param {Object} options Standard options object with success and error
   *    callbacks.
   */
  logIn(permissions, options) {
    if (!permissions || typeof permissions === 'string') {
      if (!initialized) {
        throw new Error(
          'You must initialize FacebookUtils before calling logIn.'
        );
      }
      requestedPermissions = permissions;
      return ParseUser._logInWith('facebook', options);
    } else {
      var newOptions = {};
      if (options) {
        for (var key in options) {
          newOptions[key] = options[key];
        }
      }
      newOptions.authData = permissions;
      return ParseUser._logInWith('facebook', newOptions);
    }
  },

  /**
   * Links Facebook to an existing PFUser. This method delegates to the
   * Facebook SDK to authenticate the user, and then automatically links
   * the account to the Parse.User.
   *
   * @method link
   * @param {Parse.User} user User to link to Facebook. This must be the
   *     current user.
   * @param {String, Object} permissions The permissions required for Facebook
   *    log in.  This is a comma-separated string of permissions.
   *    Alternatively, supply a Facebook authData object as described in our
   *    REST API docs if you want to handle getting facebook auth tokens
   *    yourself.
   * @param {Object} options Standard options object with success and error
   *    callbacks.
   */
  link(user, permissions, options) {
    if (!permissions || typeof permissions === 'string') {
      if (!initialized) {
        throw new Error(
          'You must initialize FacebookUtils before calling link.'
        );
      }
      requestedPermissions = permissions;
      return user._linkWith('facebook', options);
    } else {
      var newOptions = {};
      if (options) {
        for (var key in options) {
          newOptions[key] = options[key];
        }
      }
      newOptions.authData = permissions;
      return user._linkWith('facebook', newOptions);
    }
  },

  /**
   * Unlinks the Parse.User from a Facebook account.
   *
   * @method unlink
   * @param {Parse.User} user User to unlink from Facebook. This must be the
   *     current user.
   * @param {Object} options Standard options object with success and error
   *    callbacks.
   */
  unlink: function(user, options) {
    if (!initialized) {
      throw new Error(
        'You must initialize FacebookUtils before calling unlink.'
      );
    }
    return user._unlinkFrom('facebook', options);
  }
};

export default FacebookUtils;
