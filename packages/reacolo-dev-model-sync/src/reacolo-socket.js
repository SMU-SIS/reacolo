import SockJS from 'sockjs-client';
import Schedule from './schedule.js';
import {
  RequestTimeoutError,
  NotConnectedError,
  AlreadyConnectedError,
  RequestFailedError
} from './errors';
import { ACK_MSG_TYPE } from './message-types';
import { DEFAULT_ACK_TIMEOUT, DEFAULT_THROTTLE } from './defaults';
// Defaut configurations.

export default class ReacoloSocket {
  constructor(
    serverAddress,
    requestMerger = () => undefined,
    ackTimeout = DEFAULT_ACK_TIMEOUT,
    throttleDelay = DEFAULT_THROTTLE
  ) {
    this._serverAddress = serverAddress;
    // Time to wait for an acknowledgement after a request has been sent to the server.
    this._ackTimeout = ackTimeout;

    // Give the opportunity to merge pending requests to minimize server and network overload.
    this._requestMerger = requestMerger;

    // Used to create unique identifier to messages.
    this._nextMessageId = 0;

    // Register if the server is connected or not.
    this._isConnected = false;

    // Records the callbacks to be called upon reception of an acknowledgement.
    this._ackCallbacks = new Map();

    // Throttle-related members.
    this._throttleDelay = throttleDelay;
    this._pendingMessages = [];
    this._nextSendingSchedule = undefined;

    // Server message callback (no op per default).
    this.onmessage = () => {};
    this.onclose = () => {};
  }

  async start() {
    if (this._isConnected) {
      throw new AlreadyConnectedError();
    }

    // Open the socket.
    this._socket = await new Promise((resolve, reject) => {
      const socket = new SockJS(this._serverAddress);
      socket.onopen = () => resolve(socket);
      socket.onerror = () => reject();
    });

    // Bind the handlers.
    this._socket.onmessage = this._onSocketMessage.bind(this);
    this._socket.onclose = this._onSocketClose.bind(this);

    // Mark the socket as connected.
    this._isConnected = true;

    // Return itself upon completion.
    return this;
  }

  get isConnected() {
    return this._isConnected;
  }

  get isASendingScheduled() {
    return this._nextSendingSchedule && !this._nextSendingSchedule.isDone;
  }

  // Send a request ({ type, data }).
  sendRequest(requestOrType, data) {
    if (!this.isConnected) {
      throw new NotConnectedError('Not connected to the server.');
    }
    // Allow the request to be passed as two arguments (type, data) or as an object
    // ({ type, data }).
    const request = typeof requestOrType === 'string' ? { type: requestOrType, data }
                                                      : requestOrType;

    let requestMessage;
    // If there is already a message waiting to be sent, attempt to merge the requests
    const lastPendingMessage = this._pendingMessages[this._pendingMessages.length - 1];
    if (lastPendingMessage) {
      const mergedRequest = this._requestMerger(lastPendingMessage.request, request);
      // If the merger has been successful, just replace the request of the last message with
      // the merged request.
      if (mergedRequest) {
        lastPendingMessage.request = mergedRequest;
        requestMessage = lastPendingMessage;
      }
    }
    // If the merger has failed, create a new pending message for the new request.
    if (!requestMessage) {
      requestMessage = this._createRequestMessage(request);
      // Add the message in the pending messages list.
      this._pendingMessages.push(requestMessage);
    }

    // If no sending is scheduled, schedule one to start as soon as possible.
    if (!this.isASendingScheduled) {
      this._scheduleNextSending();
    }

    // Return the acknowledgement promise of this request.
    return requestMessage.responsePromise;
  }

  _createRequestMessage(request) {
    const id = this._getNextMessageId();
    const message = { request, id };

    // Create the promise for an acknowledgement.
    const ackPromise = new Promise((resolve, reject) => {
      let timeoutId;
      message.ackReceivedCallback = (...args) => {
        clearTimeout(timeoutId);
        resolve(...args);
      };
      message.startAckTimeout = (timeout) => {
        if (timeoutId) {
          throw new Error('Timeout already started');
        }
        timeoutId = setTimeout(() => {
          reject(new RequestTimeoutError(`Message ${id} (${request.type}) timed out.`));
        }, timeout);
      };
    }).then((a) => {
      this._ackCallbacks.delete(id);
      return a;
    }, (e) => {
      this._ackCallbacks.delete(id);
      throw e;
    });

    // Create the message response promise.
    message.responsePromise = ackPromise.then((ack) => {
      if (ack.success) {
        return ack.response;
      }
      throw new RequestFailedError(ack.response);
    });

    // Register the acknowledgement callback.
    this._ackCallbacks.set(id, message.ackReceivedCallback);

    return message;
  }

  _scheduleNextSending(delay = 0) {
    this._nextSendingSchedule = new Schedule(delay, () => {
      this._sendPendingMessages();
    });
  }

  _cancelNextSending() {
    if (this.isASendingScheduled) {
      this._nextSendingSchedule.cancel();
    }
  }

  // Immediately send every pending requests.
  flush() {
    this._cancelNextSending();
    this._sendPendingMessages();
  }

  _sendPendingMessages() {
    if (this._pendingMessages.length > 0) {
      // Fetch the pending messages;
      const pendingMessages = this._pendingMessages;
      // Clear their list.
      this._pendingMessages = [];
      // Send the messages.
      this._sendMessages(pendingMessages);
      // Now that each message has been sent, start their ack timeout.
      pendingMessages.forEach(message => message.startAckTimeout(this._ackTimeout));
      // Schedule the next sending after the throttle delay.
      this._scheduleNextSending(this._throttleDelay);
    }
  }

  _sendMessages(messages) {
    // Create the bundle by picking the properties to send from each message.
    const messagesToSend = messages.map(({ request: { type, data }, id }) => ({ type, data, id }));
    // If there is only one waiting message, unpack it before sending it.
    const bundle = messagesToSend.length > 1 ? messagesToSend : messagesToSend[0];
    // Send the message.
    this._socket.send(JSON.stringify(bundle));
  }

  _onSocketMessage(originalMessage) {
    const message = JSON.parse(originalMessage.data);
    if (message.type === ACK_MSG_TYPE) {
      this._handleAckMessage(message);
    } else {
      this.onmessage(message);
    }
  }

  _onSocketClose() {
    this._isConnected = false;
    this.onclose();
  }

  _handleAckMessage(ackMessage) {
    const messageData = ackMessage.data;
    const callback = this._ackCallbacks.get(messageData.messageId);
    if (callback) {
      callback(messageData);
    } else {
      console.warn(
        `Received unexpected acknowledgement for message: ${messageData.messageId}.` +
        ' It may be a server error or because the request timed out.'
      );
    }
  }

  _getNextMessageId() {
    const msgId = this._nextMessageId;
    this._nextMessageId += 1;
    return msgId;
  }
}
