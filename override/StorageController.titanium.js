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

import ParsePromise from './ParsePromise';

var StorageController = {
	async: 0,

	getItem : function(key) {
      return Ti.App.Properties.getObject(fixKey(key));
    },
    setItem : function(key, value) {
      return Ti.App.Properties.setObject(fixKey(key), value);
    },
    removeItem : function(key, value) {
      return Ti.App.Properties.removeProperty(fixKey(key));
    },
	clear() {
		localStorage.clear();
	}
};

function fixKey(key) {
  return key.split("/").join("");
}

module.exports = StorageController;
