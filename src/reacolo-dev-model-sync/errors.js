import ExtendableError from 'es6-error';

export class NotConnectedError extends ExtendableError {}
export class RequestTimeoutError extends ExtendableError {}
export class RequestFailedError extends ExtendableError {}
export class AlreadyConnectedError extends ExtendableError {}
