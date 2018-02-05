# Reacolo-React

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

## Context

The main feature of Reacolo relies on one main component `<Context>`.
the `<Context>` component is used to define the where and when of an adaptive cross-device application.

Contexts are defined by a set of "matchers" compared to the properties of a context object.

```html
<Context matchRole="picker" component={ColorPicker} />
<Context matchRole="canvas" component={Canvas} />
```

The example above define two different contexts.
The first `<Context>` defines a selector on a `role` context property.
It will render if Reacolo's context (not to be confused with React's) contains a `role` string property equals to `"picker"` (or an array containing *only* the string  `"picker"`). If it does not match, the `<Context>` does not render.
The second context will render if the reacolo's context object contains a `role` string property equals to `"canvas"`  (or an array containing *only* the string  `"canvas"`).

Reacolo's context is provided by a [<Provider>, see below](#Provider). <Context> needs to descend from this Provider (in the component tree) to work properly.

### Context rendering

There is three ways to define how a `<Context>` must render:
- Providing a `render` function. I.e. a function that returns any React-renderable elements to be rendered.
- Providing a `component` property. I.e. a React component to render when the context matches.
- Providing children. The children will then be rendered if the context matches. This method is the most readable, but it has some impact on the performances.

People familiar with [React Router](https://reacttraining.com/react-router/) will recognize the two first methods.

### Context Properties

Reacolo's context properties (against which Context's matchers are compared) can have two forms:

- Strings, e.g. `'pony'`.
- Arrays of strings, e.g. `['pony'`, `'cat']`.

Note: `'pony'` is actually equivalent to `['pony']`.

### Matchers

The context properties starting with `"match"` are the matchers of a <Context>. For example

```html
<Context matchMount="cat" matchGround="rainbow" component={Foo} />
```
will match again the `cat` and the `ground` properties of the Reacolo context. Note that the first letter is automatically lower-cased.

Alternatively, matchers can be provided as an object using the `match` property:
```html
<Context match={{ mount: "cat", ground: "rainbow" }} component={Foo} />
```

#### Basics and operators `&` and `|`

Matcher can use the or operator `|` and the and operator `&`:

- `pony | cat` will match `'pony'`, `'cat'`, `['pony']` and `['cat']`.
- `pony & cat` will match `['pony', 'cat']`.

`&` has priority over `|`: `pony | pony & cat` will match `'pony'`, `['pony']` or `['pony', 'cat']`.

Matchers are strict: `pony` will **not** match `['pony', 'cat']`. `pony | cat` won't either.

`&` can be omitted: `pony cat` is equivalent to `pony & cat`.

Names are trimmed: `pony|cat` is equivalent to `pony | cat`.

Parenthesis can be used as expected: `pony ( cat | pug )` is equivalent to `pony cat | pony pug`.

Names can make use of any characters except from `&`, `|`, `(`, `)`, `?`, `*` and blank characters.
They cannot be exactly `default` either.

#### Optional matches: `?`

The optional modifier `?` can be used to mark a match as optional.

For example, `pony cat?` is equivalent to `pony | pony cat`.

#### Wildcase: `*`

The wild case symbol can be used to match anything.

For example, `pony *` will match `['pony', 'cat']` or `['everything', 'that', 'includes', 'pony', 'and', 'something', 'else']`.

By default, the wildcase is *not* optional. `pony *` will **not** match `'pony'` alone (nor `['pony']`).

However, it can be used in conjunction with `?`: `pony *?` will match any context property that contains `'pony'`.

## Provider

Reacolo's context is provided to React's component tree using a <Provider>:

```html
<Provider model={model}>
  <MyApp />
</Provider>
```

The `<Provider>` provides everything required by a `<Context>` to work. It requires a single property: `model`. `model` is used for storing and synchronizing both the application data (that can be fetched using the `connect` HOC) and the Reacolo context.

The `<Provider>` syntax is inspired by [React Redux](https://github.com/reactjs/react-redux)'s <Provider>.

### Reacolo context

Reacolo itself does not focus on context edition (though, depending on the model that is used, context setters might be accessible to components using `connect`).
Typically, modification of the context comes from recognizers (e.g. activity recognizer, location tracking..) that should not be mixed in with the UI rendering (which reacolo focus on).

The properties of the context is entirely up to the developer. Reacolo will be able to match against string and array of string values. Matching against deep properties are not yet supported (i.e. nested objects).

Conventionally, Reacolo context always contains the three following properties:
- `role`, a local property (i.e. it is different from a device to another), that is used to identify the device
- `availableRoles`, the list of all the roles currently available (i.e. if a phone takes up the role `'main'` and watch the role `'wrist'`, availableRoles will be `['main', 'wrist']`).

Often, the context will also contain the `status` property that provides information on the model synchronization state (e.g.  `'connecting'`, `'ready'`, `'disconnected'`, `'error'` ).

[Reacolo Dev Model](../dev-model) respects these conventions.

### Model API

TODO

## connect

TODO

## Switch

Often, only one <Context> from a set must be render. To do so, one may
use the <Switch> component.

```html
<Switch>
  <Context matchFriends="cat *?" component={PetFriend} />
  <Context matchFriends="dragon *?" component={LizardFriend} />
  <Context component={Antisocial}>
</Switch>
```

<Context> components will be tested in order and only the first one that matches will be rendered.
<Context> components must be **direct** child of a <Switch>.

This syntax is inspired by [React Router](https://reacttraining.com/react-router/) 's Switch

### Default Context

A context can be marked as default by adding the `default` property:

```html
<Switch>
  <Context matchFriends="cat *?" component={PetFriend} default />
  <Context matchFriends="dragon *?" component={LizardFriend} />
</Switch>
```

If no context matches, the default context will be rendered (regardless of its own selectors).

## Portal

TODO
