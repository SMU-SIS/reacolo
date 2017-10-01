# Reacolo

Reacolo is a React-based adaptive cross-device applications library.
Reacolo enables you to define what should be displayed:

- **where**, i.e. on what device. E.g. video on smart glasses and controls on smart phone.
- **when**, i.e. for what context. E.g. both a 'display' device and a 'remote' device are available or the user is walking.

Reacolo does not force you to use its own data synchronization mechanism nor context detection.
It is designed so that it can easily build on your own application, using your own data or context.
However, we do also provide a data synchronization mechanism if you do not already have your own (see [connect](#connect)).

## Build

Currently, Reacolo have not been made available on any cdn nor repositories such as npm. But it will be soon. Promise.
In the meantime, you can build it as follow.

### [yarn](https://yarnpkg.com) (recommended)

```bash
yarn install
yarn build
```

### npm

```bash
npm install
npm run build
```

## API

The main feature of Reacolo relies on two components `<ContextSwitch>` and `<Context>`.
These two components are used to define the where and when of an adaptive cross-device application.

Contexts are defined by a set of `selectors` matched against the properties of a context POJO (Plain Old ~~Java~~ Javascript Object).


### Example

```html
<ContextSwitch context={context}>
  <Context clientRole="picker">
    <ColorPicker color={color} onColorChange={syncColor} />
  </Context>
  <Context>
    <Palette color={color} />
  </Context>
</ContextSwitch>
```

`<ContextSwitch>` receives the context as its only property and
renders the first of its matching `<Context>`.

The example above define two different contexts.
The first `<Context>` defines a selector on a `clientRole` context property.
It will pass if the context object contains a `clientRole` string property equals to `"picker"` (or an array containing *only* the string  `"picker"`).
The second context does not specify any selectors and thus will always match. It will be rendered if the first context does not match.

There is two rules to respect when defining `<Context>`s:

1. `<Context>`s must be *directly* contained inside a `<ContextSwitch>`.
2. Due to React's current [lake of support for fragments](https://github.com/facebook/react/issues/2127), `<Context>` can only contain a single child. [It will change eventually](https://github.com/facebook/react/issues/8854), but in the meantime, if you need a `<Context>` to define more than one child, you need to wrap them in a container (e.g. a `<span>` or a `<div>`).

[Nested contexts](#nested-contexts) are an exception to these two rules.

If no context matches and no [default context](#default-context) has been defined, `<ContextSwitch>` does not render anything.

### Default Context

A context can be marked as default by adding the `default` property:

```html
<Context selectedProp="selector" default>{content}</Context>
```

If no context matches, the default context will be rendered (regardless of its own selectors).

Note: An obvious trade-off of this mechanism is that it is not possible to match against a context property named `'default'`.


### Context Properties

Context properties can have three forms:

- Strings, e.g. `'pony'`.
- Arrays of strings, e.g. `['pony'`, `'cat']`.
- Objects of numbers, e.g. `{ pony: 1, cat: 2, pug: 0 }` (this is equivalent to the above).

All are equivalent: `'pony'` is equivalent to `['pony']`, numbers lesser than 1 are ignored.
The order does not matter.

### Selector Syntax

#### Basics and operators `&` and `|`

Selectors can use the or operator `|` and the and operator `&`:

- `pony | cat` will match `'pony'`, `'cat'`, `['pony']` and `['cat']`.
- `pony & cat` will match `['pony', 'cat']`.

`&` has priority over `|`: `pony | pony & cat` will match `'pony'`, `['pony']` or `['pony', 'cat']`.

Selectors are strict: `pony` will **not** match `['pony', 'cat']`. `pony | cat` won't either.

`&` can be omitted: `pony cat` is equivalent to `pony & cat`.

Names are trimmed: `pony|cat` is equivalent to `pony | cat`.

Parenthesis can be used as expected: `pony ( cat | pug )` is equivalent to `pony cat | pony pug`.

Names can make use of any characters except from `&`, `|`, `(`, `)`, `?`, `.` and blank characters.
They cannot be exactly `default` either.

#### Optional matches: `?`

The optional modifier `?` can be used to mark a match as optional.

For example, `pony cat?` is equivalent to `pony | pony cat`.

#### Wildcase: `.`

The wild case symbol can be used to match anything.

For example, `pony .` will match `['pony', 'cat']` or `['everything', 'that', 'includes', 'pony', 'and', 'something', 'else']`.

By default, the wildcase is *not* optional. `pony .` will **not** match `'pony'` alone (nor `['pony']`).

However, it can be used in conjunction with `?`: `pony .?` will match any context property that contains `'pony'`.

### Nested Contexts

`<Context>`s can be nested:

```html
<ContextSwitch context={context}>
  <Context prop1="val1">
    <Context clientRole="role1">
      <MyComp1 foo={bar} onStuff={doStuff} />
    </Context>
    <Context clientRole="role2">
      <MyComp2 foo={bar} onOtherStuff={doOtherStuff} />
    </Context>
  </Context>
  <Context default>
    <MyComp foo={bar} />
  </Context>
</ContextSwitch>
```

This syntax is just a syntactic sugar. In practice, a parent `<Context>` will just wrap its `<Context>` children in an inner `<ContextSwitch>`.

Nested contexts are the only case where a `<Context>` can have several children. In this case, it can only have `<Context>`s as children. It is also the only case where a `<Context>` is allowed not to be the direct children of a `<ContextSwitch>`.

Nexted contexts can themselves contain nested contexts.

### connect

The `connect` higher order component (HOC) is used to provide context and data synchronization to a component by connecting it to a [ReacoloModel](#reacolo-model-api) (see [reacolo dev model](../reacolo-dev-model) and [reacology model](../reacology-model)):

```js
const MyConnectedApp = connect(MyApp, myModel);
```

Once `<MyApp>` is connected it will be provided with the following props:

- `data`: a POJO containing the current application data (depends on the most recent `setData` call).
- `setData`: a function that can be used to set (and synchronized) a new data object. Note that unlike `React.Component#setState`, `setData` does not merge the object with the existing one but replaces it.
- `context`: depends on the model sync, but typically contains at least:
    - `clientRole`: the role assigned to this particular client. This is typically the only piece of data that is not exactly similar among all clients.
    - `roles`: the different roles that have been taken (including this client's role).
- `isConnected`: indicates if the model is currently connected or not.


Connected components should always **manage the non connected special case**. When the model is not connected, `data` and `setData` are not accessible. The content of `context` depends on the model sync that is used, but it will typically provides minimum values (e.g. `'clientRole'`). It is typical that the first time a connected component is rendered, the model sync is not connected yet.


### Reacolo Model Sync

*TODO*
