## TiParseJS
A wrapper for the official Parse JS SDK for Titanium 

### Why?
This is a spinoff of Aaron Saunders original wrapper, tiparse_mine [gist](https://gist.github.com/aaronksaunders/6665528). I've since maintained using this which was originally meant for the v1.2 of the SDK JS SDK. Now that the SDK is at v1.7.1 and Parse has gone open source I feel it was time for a refresh.

### How to install
- Download the zip in the /dist folder and extract that to /Users/<youruser>/Library/Application Support/Titanium/modules/commonjs/.
- Download tiparsejs-wrapper.js and extract that to your project's lib folder.
- Add your keys to config.json
```
{
	"global": {
	    "parseOptions": {
	      "facebookAppId" : "<yourkeyhere>",
	      "applicationId": "<yourkeyhere>",
	      "javascriptkey": "<yourkeyhere>",
	      "restKey": "<yourkeyhere>"
	    },
	},
	"env:development": {},
	"env:test": {},
	"env:production": {},
	"os:android": {},
	"os:blackberry": {},
	"os:ios": {},
	"os:mobileweb": {},
	"os:windows": {},
	"dependencies": {}
}
```
- In your main controller (index.js) of your app, require the module
```
require('tiparsejs_wrapper')(Alloy.CFG.parseOptions);
```
- If you are not using Facebook, comment out those lines in the wrapper.
- Done!
- See example folder for sample Alloy app
- See Parse.com's [Official JS Guide](https://parse.com/docs/js/guide) for 90% of everthing you need to know how to do, google the rest.


### How this module was built (Manual Method)
- Download SDK and extract to Parse-JS-SDK-master
- cd to ./Parse-JS-SDK-master/
- Edit package.json (if you haven't forked this repo and are building from scratch)
  - Add Line GUID: e8c5e008-5bee-15a5-1027-f5d0d8506ad9
  - Change Title to: TiParseJS
- Copy the files from override and replace them in ./Parse-JS-SDK-master/src/
- “npm install”
- “gulp compile”
- “titaniumifier —out ../dist"
- Then follow steps above to install it to your project


### What's missing
- Push 
  - For iOS I think I can include this inside the wrapper, standby
  - for Android, see TiParse by rebelcorp [here](https://github.com/timanrebel/Parse/tree/master/android)
