'use strict';

// Static dependency anchor: the main package resolves this module with require.async.
const classData = require('../../data/druid');
Page({ data: { classKey: classData.class.key } });
