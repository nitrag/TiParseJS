import EventEmitter from './EventEmitter';
import LiveQueryClient from './LiveQueryClient';
import CoreManager from './CoreManager';
import ParsePromise from './ParsePromise';

function open() {
  var LiveQueryController = CoreManager.getLiveQueryController();
  LiveQueryController.open();
}

function close() {
  var LiveQueryController = CoreManager.getLiveQueryController();
  LiveQueryController.close();
}

/**
 *
 * We expose three events to help you monitor the status of the WebSocket connection:
 *
 * <p>Open - When we establish the WebSocket connection to the LiveQuery server, you'll get this event.
 * 
 * <pre>
 * Parse.LiveQuery.on('open', () => {
 * 
 * });</pre></p>
 *
 * <p>Close - When we lose the WebSocket connection to the LiveQuery server, you'll get this event.
 * 
 * <pre>
 * Parse.LiveQuery.on('close', () => {
 * 
 * });</pre></p>
 *
 * <p>Error - When some network error or LiveQuery server error happens, you'll get this event.
 * 
 * <pre>
 * Parse.LiveQuery.on('error', (error) => {
 * 
 * });</pre></p>
 * 
 * @class Parse.LiveQuery
 * @static
 * 
 */
let LiveQuery = new EventEmitter();

/**
 * After open is called, the LiveQuery will try to send a connect request
 * to the LiveQuery server.
 * 
 * @method open
 */ 
LiveQuery.open = open;

/**
 * When you're done using LiveQuery, you can call Parse.LiveQuery.close().
 * This function will close the WebSocket connection to the LiveQuery server,
 * cancel the auto reconnect, and unsubscribe all subscriptions based on it.
 * If you call query.subscribe() after this, we'll create a new WebSocket
 * connection to the LiveQuery server.
 * 
 * @method close
 */

LiveQuery.close = close;
// Register a default onError callback to make sure we do not crash on error
LiveQuery.on('error', () => {
});

export default LiveQuery;

let getSessionToken = () => {
  let promiseUser = CoreManager.getUserController().currentUserAsync();
  return promiseUser.then((currentUser) => {
    return ParsePromise.as(currentUser ? currentUser.sessionToken : undefined);
  }).then((sessionToken) => {
    return ParsePromise.as(sessionToken);
  });
};

let getLiveQueryClient = () => {
  return CoreManager.getLiveQueryController().getDefaultLiveQueryClient().then((defaultLiveQueryClient) => {
    return ParsePromise.as(defaultLiveQueryClient);
  });
};

let defaultLiveQueryClient;
let DefaultLiveQueryController = {
  setDefaultLiveQueryClient(liveQueryClient: any) {
    defaultLiveQueryClient = liveQueryClient;
  },
  getDefaultLiveQueryClient(): ParsePromise {
    if (defaultLiveQueryClient) {
      return ParsePromise.as(defaultLiveQueryClient);
    }

    let sessionTokenPromise = getSessionToken();
    return sessionTokenPromise.then((sessionToken) => {
      let liveQueryServerURL = CoreManager.get('LIVEQUERY_SERVER_URL');
      
      if (liveQueryServerURL && liveQueryServerURL.indexOf('ws') !== 0) {
        throw new Error('You need to set a proper Parse LiveQuery server url before using LiveQueryClient');
      }

      // If we can not find Parse.liveQueryServerURL, we try to extract it from Parse.serverURL
      if (!liveQueryServerURL) {
        let host = CoreManager.get('SERVER_URL').replace(/^https?:\/\//, '');
        liveQueryServerURL = 'ws://' + host;
        CoreManager.set('LIVEQUERY_SERVER_URL', liveQueryServerURL);
      }

      let applicationId = CoreManager.get('APPLICATION_ID');
      let javascriptKey = CoreManager.get('JAVASCRIPT_KEY');
      let masterKey = CoreManager.get('MASTER_KEY');
      // Get currentUser sessionToken if possible
      defaultLiveQueryClient = new LiveQueryClient({
        applicationId,
        serverURL: liveQueryServerURL,
        javascriptKey,
        masterKey,
        sessionToken,
      });
      // Register a default onError callback to make sure we do not crash on error
      defaultLiveQueryClient.on('error', (error) => {
        LiveQuery.emit('error', error);
      }).on('open', () => {
        LiveQuery.emit('open');
      }).on('close', () => {
        LiveQuery.emit('close');
      });

      return ParsePromise.as(defaultLiveQueryClient);
    });
  },
  open() {
    getLiveQueryClient().then((liveQueryClient) => {
      this.resolve(liveQueryClient.open());
    });
  },
  close() {
    getLiveQueryClient().then((liveQueryClient) => {
      this.resolve(liveQueryClient.close());
    });
  },
  subscribe(query: any): EventEmitter {
    let subscriptionWrap = new EventEmitter();

    getLiveQueryClient().then((liveQueryClient) => {
      if (liveQueryClient.shouldOpen()) {
        liveQueryClient.open();
      }
      let promiseSessionToken = getSessionToken();
      // new event emitter
      return promiseSessionToken.then((sessionToken) => {

        let subscription = liveQueryClient.subscribe(query, sessionToken);
        // enter, leave create, etc
        
        subscriptionWrap.id = subscription.id;
        subscriptionWrap.query = subscription.query;
        subscriptionWrap.sessionToken = subscription.sessionToken;
        subscriptionWrap.unsubscribe = subscription.unsubscribe;

        subscription.on('open', () => {
          subscriptionWrap.emit('open');
        }).on('create', (object) => {
          subscriptionWrap.emit('create', object);
        }).on('update', (object) => {
          subscriptionWrap.emit('update', object);
        }).on('enter', (object) => {
          subscriptionWrap.emit('enter', object);
        }).on('leave', (object) => {
          subscriptionWrap.emit('leave', object);
        }).on('delete', (object) => {
          subscriptionWrap.emit('delete', object);
        });

        this.resolve();
      });
    });
    return subscriptionWrap;
  },
  unsubscribe(subscription: any) {
    getLiveQueryClient().then((liveQueryClient) => {
      this.resolve(liveQueryClient.unsubscribe(subscription));
    });
  }
};

CoreManager.setLiveQueryController(DefaultLiveQueryController);
