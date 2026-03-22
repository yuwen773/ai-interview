const path = require('path')

const config = {
  projectName: 'interview-mini',
  date: '2024-1-1',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2 / 1
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    },
    webpackChain(chain) {
      chain.resolve.alias.set('@', path.resolve(__dirname, '..', 'src'))
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    outputPath: 'index.html',
    async: {
      loading: 'AsyncLoading',
      error: 'AsyncError',
      delay: 200,
      retry: true,
      retryOptions: {
        retries: 3
      }
    },
    webpackChain(chain) {
      chain.resolve.alias.set('@', path.resolve(__dirname, '..', 'src'))
    }
  }
}

module.exports = function (merge) {
  if (process.env.TARO_ENV === 'weapp') {
    return merge({}, config, require('./weapp.config.js'))
  }
  if (process.env.TARO_ENV === 'h5') {
    return merge({}, config, require('./h5.config.js'))
  }
  return config
}
