const security = require('eslint-plugin-security')

// This configuration only uses the security plugin for eslint
module.exports = [
  {
    files: ['**/*.js'],
    plugins: {
      security,
    },
    rules: Object.fromEntries(
      Object.keys(security.rules).map((rule) => [`security/${rule}`, 'error'])
    ),
  },
]
