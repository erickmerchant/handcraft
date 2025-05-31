# Handcraft

A tiny front-end framework for constructing declarative/reactive UI. Install from NPM or get it from a CDN like [jsDelivr](https://cdn.jsdelivr.net/gh/erickmerchant/handcraft@latest/prelude/all.js) and add it to your import map.

---

## API

### reactivity.js

#### export function effect(callback)

#### export function watch(object)

### dom.js

#### export let position

#### export class HandcraftEventTarget

#### export class HandcraftNode extends HandcraftEventTarget

#### export class HandcraftElement extends HandcraftNode

#### export class HandcraftRoot extends HandcraftNode

#### export function $(el)

#### export let h

#### export function unsafe(content)

### dom/aria.js

#### HandcraftElement.prototype.aria = function aria(attrs)

### dom/classes.js

#### HandcraftElement.prototype.classes = function classes(...classes)

### dom/command.js

#### HandcraftEventTarget.prototype.command = function command(events, handler, options = {})

### dom/css.js

#### HandcraftRoot.prototype.css = function css(css, options = {})

### dom/data.js

#### HandcraftElement.prototype.data = function data(data)

### dom/effect.js

#### HandcraftNode.prototype.effect = function effect(cb)

### dom/observe.js

#### HandcraftNode.prototype.observe = function observe()

### dom/on.js

#### HandcraftEventTarget.prototype.on = function on(events, handler, options = {})

### dom/once.js

#### HandcraftEventTarget.prototype.once = function once(events, handler, options = {})

### dom/prop.js

#### HandcraftNode.prototype.prop = function prop(key, value)

### dom/shadow.js

#### HandcraftElement.prototype.shadow = function shadow(options = {mode: "open"})

### dom/styles.js

#### HandcraftElement.prototype.styles = function styles(styles)

### each.js

#### export function each(list)

### when.js

#### export function when(cb)

### define.js

#### export function define(name)

### prelude/all.js

---

## Inspiration

Much of the API is inspired by Rust and its ecosystem. The rest is the latest iteration of ideas I've had since around 2015. I need to mention the following as inspiration though.

- [jQuery](https://github.com/jquery/jquery)
- [Ender](https://github.com/ender-js/Ender)
- [HyperScript](https://github.com/hyperhype/hyperscript)
