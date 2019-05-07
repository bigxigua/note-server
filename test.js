var fnv = require('fnv-plus');
fnv.hash('xiaoxiao', 64);
console.log(fnv.hash('xiaoxiao', 64).str());