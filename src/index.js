'use strict'

$ = require('jquery')

$(document).ready(function () {
  require('babel-polyfill')
  var App = require('./app.js')

  var app = new App({})

  document.body.appendChild(app.render())

  app.init() // @TODO: refactor to remove
})
