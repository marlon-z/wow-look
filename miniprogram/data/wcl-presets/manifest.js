module.exports = {
  dataVersion: '4.4.x',
  entries: {
    'mage:63': {
      index: function () { return require('./data-4.4.x/mage/63/index.js'); },
      files: {
        'mythic-plus-10': function () { return require('./data-4.4.x/mage/63/mythic-plus-10.js'); },
        'mythic-plus-16': function () { return require('./data-4.4.x/mage/63/mythic-plus-16.js'); },
        'mythic-plus-20': function () { return require('./data-4.4.x/mage/63/mythic-plus-20.js'); },
        'raid-mythic-vs-dr-mqd': function () { return require('./data-4.4.x/mage/63/raid-mythic-vs-dr-mqd.js'); },
        'raid-mythic-sporefall': function () { return require('./data-4.4.x/mage/63/raid-mythic-sporefall.js'); },
      },
    },
  },
};
