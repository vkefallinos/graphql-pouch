import Relay from 'react-relay';
import EventEmitter from 'events';

export default class NetworkLayer extends Relay.DefaultNetworkLayer {
  constructor(...args) {
    super(...args);
    this.url = args[0];
    this._requests = Object.create(null);
    this._dispatcher = new EventEmitter();

    const closeSubscription = this._subscribe();
    // this._socket = io();

    this._dispatcher.on('subscription update', (message, author) => {
      console.log('MESSAGE')
      console.log(message)
      console.log(author)
    })

    // this._socket.on('subscription update', ({ id, data, errors }) => {
    //   const request = this._requests[id];
    //   if (!request) {
    //     return;
    //   }

    //   if (errors) {
    //     request.onError(errors);
    //   } else {
    //     request.onNext(data);
    //   }
    // });

    // this._socket.on('subscription closed', (id) => {
    //   const request = this._requests[id];
    //   if (!request) {
    //     return;
    //   }

    //   console.log(`Subscription ${id} is completed`);
    //   request.onCompleted();
    //   delete this._requests[id];
    // });

    // this._socket.on('error', (error) => {
    //   Object.values(this._requests).forEach((request) => {
    //     request.onError(error);
    //   });
    // });
  }

  sendSubscription(request) {
    console.log('CONNECT SUBSCRIPTION')
    const id = request.getClientSubscriptionId();
    this._requests[id] = request;
    console.log(id)
    console.log(request)
    console.log(request.getQueryString())
    console.log(request.getVariables())

    this._dispatcher.emit('subscribe', {
      id,
      query: request.getQueryString(),
      variables: request.getVariables(),
    });

    return {
      dispose: () => {
        console.log(`disposing ${request.getDebugName()}:${id}`);
        // this._socket.emit('unsubscribe', id);
      },
    };
  }

  disconnect() {
    console.log('DISCONNECT SUBSCRIPTION')
    // this._socket.disconnect();

    // this._requests.forEach(request => {
    //  request.onCompleted();
    // });
  }

  _publish (message, author) {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.url}/_publish`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
          message: message,
          author: author || 'Anonymous'
      }));
  }

  _subscribe() {
      const xhr = new XMLHttpRequest();
      const self = this;

      xhr.onreadystatechange = function () {
          if (this.readyState != 4) return;

          if (this.status == 200) {
              console.log(this.responseText)
              const data = JSON.parse(this.responseText);
              self._dispatcher.emit(data.message, data.author);
              self._subscribe();
              return;
          }

          setTimeout(self._subscribe.bind(self), 1000);
      };

      xhr.open('GET', `${this.url}/_subscribe`, true);
      xhr.send();
      return xhr.abort;
  }

}
