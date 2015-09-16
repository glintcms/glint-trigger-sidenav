/**
 * Module dependencies.
 */
var debug = require('debug')('glint-trigger-sidenav');
var fs = require('fs');
var Trigger = require('glint-trigger');
var merge = require('utils-merge');
var inherits = require('inherits');
var toggle = require('amp-toggle-class');
var add = require('amp-add-class');
var remove = require('amp-remove-class');
var insertCss = require('insert-css');
var domify = require('domify');
var objectizr = require('objectizr');
var c = require('./config');


var style = fs.readFileSync(__dirname + '/style.css', 'utf8');
var template = fs.readFileSync(__dirname + '/template.dot', 'utf8');

/**
 * Expose `SideNav`
 */
exports = module.exports = SideNav;
inherits(SideNav, Trigger);

/**
 * `SideNav` constructor function.
 */
function SideNav(options) {
  if (!(this instanceof SideNav)) return new SideNav(options);
  Trigger.apply(this, arguments);

  this.c = this.c || {};
  merge(this.c, c);
  merge(this.c, options);
  this.init();
}

SideNav.prototype.init = function() {
  var self = this, config = this.c, selector, $el, $parent, $cmd, $commands = {}, commands, s, editing = false;
  debug('sidenav init request');


  // insert sidenav only once
  $parent = document.querySelector(config.selectorParent);
  if (!$parent) return; // nothing to do
  $el = $parent.querySelector(config.selector);
  if ($el) return; // nothing to do

  // insert templates
  insertCss(style);
  $parent.appendChild(domify(template));


  // instantiate command elements
  Object.keys(config.commands).forEach(function(cmd) {
    var sel = config.commands[cmd];
    $commands[cmd] = document.querySelector(sel);
  });

  var initialCommands = objectizr('edit,copy,rename,delete', true);
  var editingCommands = objectizr('cancel,save,copy,rename', true);

  function startEditing(){
    editing = true;
    Object.keys(config.commands).forEach(function(cmd){
      if (editingCommands[cmd]) {
        remove($commands[cmd], 'hide');
      } else {
        add($commands[cmd], 'hide');
      }
    });
    debug('start editing');
  }

  function endEditing() {
    editing = false;
    Object.keys(config.commands).forEach(function(cmd){
      if (initialCommands[cmd]) {
        remove($commands[cmd], 'hide');
      } else {
        add($commands[cmd], 'hide');
      }
    });
    debug('end editing');
  }

  endEditing();

  // add event handlers
  this.on('add', function(sink) {
    if (s) return;
    s = sink;
    s.on('pre-edit', startEditing);
    s.on('pre-cancel', endEditing);
    s.on('pre-save', endEditing);
    s.on('pre-delete', endEditing);
  });


  // simple commands without user interaction
  commands = 'load,edit,save,cancel,delete'.split(',');
  commands.forEach(function(cmd) {
    selector = config.commands[cmd];
    $cmd = document.querySelector(selector);

    debug('sidenav init', cmd, selector, $cmd);

    if ($cmd) $cmd.addEventListener('click', function(e) {
      e.preventDefault();
      debug('sidenav', cmd);
      self.callFunction(cmd);
      return false;
    });

  });

  // commands with input fields

  // copy
  selector = config.commands.copy + ' ';
  $cmd = document.querySelector(config.commands.copy);
  inlineInput(selector, $cmd, copy);

  // rename
  selector = config.commands.rename + ' ';
  $cmd = document.querySelector(config.commands.rename);
  inlineInput(selector, $cmd, rename);

  function inlineInput(selector, $cmd, task) {

    var $wrapper = document.querySelector(selector + '.sidenav-input');
    var $input = document.querySelector(selector + '.sidenav-input input');
    var $save = document.querySelector(selector + 'button.save');
    var $cancel = document.querySelector(selector + 'button.cancel');

    if ($input) $input.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    });

    if ($input) $input.addEventListener('keyup', function(e) {
      // enter
      if (e.keyCode == 13) {
        task($input.value);
        showHide($wrapper);
      }
      // esc
      if (e.keyCode == 27) {
        showHide($wrapper);
      }
    });

    if ($save) $save.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      task($input.value);
      showHide($wrapper);

      debug('copy save', $input, $input.textContent, $input.value);
      return false;
    });

    if ($cancel) $cancel.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      showHide($wrapper);

      debug('copy cancel', $input, $input.textContent, $input.value);
      return false;
    });

    if ($cmd) $cmd.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      showHide($wrapper);

      debug('copy', toggle);
      return false;
    });

    function showHide(el) {
      var display = el.style.display;
      var next = !display || display === 'none' ? 'block' : 'none';
      el.style.display = next;
      toggle(el.parentElement, 'inline-editing');
      if (next === 'block') $input.focus();
    }

  }

  /* tasks */
  function copy(name) {
    debug('copy begin', name, self.sinks);
    if (!name || !self.sinks || !self.sinks.length) return false;
    var sink = self.sinks[0];
    if (typeof sink.id !== 'function') return false;

    sink.id(name);
    sink.editing = true;
    self.callFunction('save', function(err, result) {
      if (err) return console.error('could not save:', name);
      debug('copy done', name, sink.id(), sink.locale);
      location.replace(name);
    });
  }

  function rename(name) {
    debug('copy begin', name, self.sinks);
    if (!name || !self.sinks || !self.sinks.length) return false;
    var sink = self.sinks[0];
    if (typeof sink.id !== 'function') return false;

    var old = sink.id();

    // copy
    sink.id(name);
    sink.editing = true;
    self.callFunction('save', function(err, result) {
      if (err) return console.error('could not rename:', old, ' to:', name);

      // delete old
      sink.id(old);
      sink.editing = true;
      self.callFunction('delete', function(err, result) {
        if (err) return console.error('could not rename:', old, ' to:', name);
        debug('rename done from:', old, ' to:', name, sink.locale);
        location.replace(name);
      })
    });
  }

};

