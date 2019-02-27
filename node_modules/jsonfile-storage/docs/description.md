# JSON File Storage

Package with a simple API for storing json files to a local directory.

[![Coverage Status](https://coveralls.io/repos/github/tVienonen/jsonfile-storage/badge.svg?branch=master)](https://coveralls.io/github/tVienonen/jsonfile-storage?branch=master)
[![Build Status](https://travis-ci.org/tVienonen/jsonfile-storage.svg?branch=master)](https://travis-ci.org/tVienonen/jsonfile-storage)
# Getting Started

`npm i jsonfile-storage`

```
var JSONFileStorage = require('jsonfile-storage');

// directory must exist before creating storage instance
var storage = new JSONFileStorage('./data');

// put stuff into the storage
storage.put({ "key" : "stuff" }).then(result => {
    console.log(result);
    // outputs: { key: 'stuff', id: '137280bc-8afe-4ba2-9625-8c1d20b13c58' }
    // the id is generated automatically if it does not exist
    
    // remove item from the storage
    storage.remove(result.id).then(() => {
        // file was removed from storage
        console.log(storage.getFiles());
        // outputs: []
    })
})
```

# API
