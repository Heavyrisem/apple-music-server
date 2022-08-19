const path = require('path');

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended', 'plugin:import/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', ['parent', 'sibling'], 'index'],
        pathGroups: [
          {
            pattern: '~**',
            group: 'external',
          },
        ],
        'newlines-between': 'always',
      },
    ],
  },
  settings: {
    "import/resolver": {
      // "alias": {
      // map: [
      //   ["@shared", path.resolve(__dirname, "../shared")]
      // ],
      // "extensions": [".js", ".jsx", ".ts", ".tsx", ".entity"]
      // },
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx", ".entity"],
        "moduleDirectory": ["node_modules", "@types"]
      },
      "typescript": {}  // this loads <rootdir>/tsconfig.json to eslint
    }
  }
}