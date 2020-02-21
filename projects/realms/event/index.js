'use strict';

const Event = require('./event');
const Navigate = require('./navigate');
const Digit = require('./digit');
const Request = require('./request');

module.exports = Object.assign(Event, {
  Navigate,
  Digit,
  Request,
});