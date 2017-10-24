'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*global __ASYNC_PROPS__*/


exports.loadPropsOnServer = loadPropsOnServer;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createReactClass = require('create-react-class');

var _createReactClass2 = _interopRequireDefault(_createReactClass);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _RouterContext = require('react-router/lib/RouterContext');

var _RouterContext2 = _interopRequireDefault(_RouterContext);

var _computeChangedRoutes2 = require('react-router/lib/computeChangedRoutes');

var _computeChangedRoutes3 = _interopRequireDefault(_computeChangedRoutes2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var array = _propTypes2.default.array,
    func = _propTypes2.default.func,
    object = _propTypes2.default.object;


function eachComponents(components, iterator) {
  for (var i = 0, l = components.length; i < l; i++) {
    if (_typeof(components[i]) === 'object') {
      for (var key in components[i]) {
        iterator(components[i][key], i, key);
      }
    } else {
      iterator(components[i], i);
    }
  }
}

function filterAndFlattenComponents(components) {
  var flattened = [];
  eachComponents(components, function (Component) {
    if (Component && Component.loadProps) flattened.push(Component);
  });
  return flattened;
}

function _loadAsyncProps(_ref, cb) {
  var components = _ref.components,
      params = _ref.params,
      loadContext = _ref.loadContext;

  var componentsArray = [];
  var propsArray = [];
  var needToLoadCounter = components.length;
  var hasCalledBack = [];

  var maybeFinish = function maybeFinish(err) {
    if (err) cb(err);else if (needToLoadCounter === 0) cb(null, { propsArray: propsArray, componentsArray: componentsArray });
  };

  // If there are no components we should resolve directly
  if (needToLoadCounter === 0) {
    maybeFinish();
  } else {
    components.forEach(function (Component, index) {
      Component.loadProps({ params: params, loadContext: loadContext }, function (error, props) {
        var isDeferredCallback = hasCalledBack[index];
        if (isDeferredCallback && needToLoadCounter === 0) {
          cb(error, {
            propsArray: [props],
            componentsArray: [Component]
          });
        } else {
          if (!hasCalledBack[index]) needToLoadCounter--;
          propsArray[index] = props;
          componentsArray[index] = Component;
          hasCalledBack[index] = true;
          maybeFinish(error);
        }
      });
    });
  }
}

function lookupPropsForComponent(Component, propsAndComponents) {
  var componentsArray = propsAndComponents.componentsArray,
      propsArray = propsAndComponents.propsArray;

  var index = componentsArray.indexOf(Component);
  return propsArray[index];
}

function mergePropsAndComponents(current, changes) {
  for (var i = 0, l = changes.propsArray.length; i < l; i++) {
    var Component = changes.componentsArray[i];
    var position = current.componentsArray.indexOf(Component);
    var isNew = position === -1;

    if (isNew) {
      current.propsArray.push(changes.propsArray[i]);
      current.componentsArray.push(changes.componentsArray[i]);
    } else {
      current.propsArray[position] = changes.propsArray[i];
    }
  }
  return current;
}

function createElement(Component, props) {
  if (Component.loadProps) return _react2.default.createElement(AsyncPropsContainer, { Component: Component, routerProps: props });else return _react2.default.createElement(Component, props);
}

function loadPropsOnServer(_ref2, loadContext, cb) {
  var components = _ref2.components,
      params = _ref2.params;

  _loadAsyncProps({
    components: filterAndFlattenComponents(components),
    params: params,
    loadContext: loadContext
  }, function (err, propsAndComponents) {
    if (err) {
      cb(err);
    } else {
      var json = JSON.stringify(propsAndComponents.propsArray, null, 2);
      var scriptString = '<script>__ASYNC_PROPS__ = ' + json + '</script>';
      cb(null, propsAndComponents, scriptString);
    }
  });
}

function hydrate(props) {
  if (typeof __ASYNC_PROPS__ !== 'undefined') return {
    propsArray: __ASYNC_PROPS__,
    componentsArray: filterAndFlattenComponents(props.components)
  };else return null;
}

var AsyncPropsContainer = (0, _createReactClass2.default)({

  propTypes: {
    Component: func.isRequired,
    routerProps: object.isRequired
  },

  contextTypes: {
    asyncProps: object.isRequired
  },

  render: function render() {
    var _props = this.props,
        Component = _props.Component,
        routerProps = _props.routerProps,
        props = _objectWithoutProperties(_props, ['Component', 'routerProps']);

    var _context$asyncProps = this.context.asyncProps,
        propsAndComponents = _context$asyncProps.propsAndComponents,
        loading = _context$asyncProps.loading,
        reloadComponent = _context$asyncProps.reloadComponent;

    var asyncProps = lookupPropsForComponent(Component, propsAndComponents);
    var reload = function reload() {
      return reloadComponent(Component);
    };
    return _react2.default.createElement(Component, _extends({}, props, routerProps, asyncProps, {
      reloadAsyncProps: reload,
      loading: loading
    }));
  }
});

var AsyncProps = (0, _createReactClass2.default)({

  childContextTypes: {
    asyncProps: object
  },

  propTypes: {
    loadContext: object,
    components: array.isRequired,
    params: object.isRequired,
    location: object.isRequired,
    onError: func.isRequired,
    renderLoading: func.isRequired,

    // server rendering
    propsArray: array,
    componentsArray: array
  },

  getDefaultProps: function getDefaultProps() {
    return {
      onError: function onError(err) {
        throw err;
      },
      renderLoading: function renderLoading() {
        return null;
      },
      render: function render(props) {
        return _react2.default.createElement(_RouterContext2.default, _extends({}, props, { createElement: createElement }));
      }
    };
  },
  getInitialState: function getInitialState() {
    var _props2 = this.props,
        propsArray = _props2.propsArray,
        componentsArray = _props2.componentsArray;

    var isServerRender = propsArray && componentsArray;
    return {
      loading: false,
      prevProps: null,
      propsAndComponents: isServerRender ? { propsArray: propsArray, componentsArray: componentsArray } : hydrate(this.props)
    };
  },
  getChildContext: function getChildContext() {
    var _this = this;

    var _state = this.state,
        loading = _state.loading,
        propsAndComponents = _state.propsAndComponents;

    return {
      asyncProps: {
        loading: loading,
        propsAndComponents: propsAndComponents,
        reloadComponent: function reloadComponent(Component) {
          _this.reloadComponent(Component);
        }
      }
    };
  },
  componentDidMount: function componentDidMount() {
    var wasHydrated = this.state.propsAndComponents !== null;
    if (!wasHydrated) {
      var _props3 = this.props,
          components = _props3.components,
          params = _props3.params,
          location = _props3.location;

      this.loadAsyncProps(components, params, location);
    }
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (nextProps.location === this.props.location) return;

    var _computeChangedRoutes = (0, _computeChangedRoutes3.default)({ routes: this.props.routes, params: this.props.params }, { routes: nextProps.routes, params: nextProps.params }),
        enterRoutes = _computeChangedRoutes.enterRoutes;

    var indexDiff = nextProps.components.length - enterRoutes.length;
    var components = [];
    for (var i = 0, l = enterRoutes.length; i < l; i++) {
      components.push(nextProps.components[indexDiff + i]);
    }this.loadAsyncProps(filterAndFlattenComponents(components), nextProps.params, nextProps.location);
  },
  handleError: function handleError(cb) {
    var _this2 = this;

    return function (err) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (err && _this2.props.onError) _this2.props.onError(err);else cb.apply(undefined, [null].concat(args));
    };
  },
  componentWillUnmount: function componentWillUnmount() {
    this._unmounted = true;
  },
  loadAsyncProps: function loadAsyncProps(components, params, location, options) {
    var _this3 = this;

    var loadContext = this.props.loadContext;

    this.setState({
      loading: true,
      prevProps: this.props
    }, function () {
      _loadAsyncProps({
        components: filterAndFlattenComponents(components),
        params: params,
        loadContext: loadContext
      }, _this3.handleError(function (err, propsAndComponents) {
        var reloading = options && options.reload;
        var didNotChangeRoutes = _this3.props.location === location;
        // FIXME: next line has potential (rare) race conditions I think. If
        // somebody calls reloadAsyncProps, changes location, then changes
        // location again before its done and state gets out of whack (Rx folks
        // are like "LOL FLAT MAP LATEST NEWB"). Will revisit later.
        if ((reloading || didNotChangeRoutes) && !_this3._unmounted) {
          if (_this3.state.propsAndComponents) {
            propsAndComponents = mergePropsAndComponents(_this3.state.propsAndComponents, propsAndComponents);
          }
          _this3.setState({
            loading: false,
            propsAndComponents: propsAndComponents,
            prevProps: null
          });
        }
      }));
    });
  },
  reloadComponent: function reloadComponent(Component) {
    var params = this.props.params;

    this.loadAsyncProps([Component], params, null, { reload: true });
  },
  render: function render() {
    var propsAndComponents = this.state.propsAndComponents;

    if (!propsAndComponents) {
      return this.props.renderLoading();
    } else {
      var props = this.state.loading ? this.state.prevProps : this.props;
      return this.props.render(props);
    }
  }
});

exports.default = AsyncProps;