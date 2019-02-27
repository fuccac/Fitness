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

<a name="JSONFileStorage"></a>

## JSONFileStorage
**Kind**: global class  

* [JSONFileStorage](#JSONFileStorage)
    * [new JSONFileStorage(directoryPath)](#new_JSONFileStorage_new)
    * [.get(id)](#JSONFileStorage+get) ⇒ <code>Promise.&lt;any&gt;</code>
    * [.getBulk()](#JSONFileStorage+getBulk) ⇒ <code>Promise.&lt;Array.&lt;any&gt;&gt;</code>
    * [.put(item, [updateListing])](#JSONFileStorage+put) ⇒ <code>Promise.&lt;any&gt;</code>
    * [.putBulk(items)](#JSONFileStorage+putBulk) ⇒ <code>Promise.&lt;Array.&lt;any&gt;&gt;</code>
    * [.remove(id, [updateListing])](#JSONFileStorage+remove)
    * [.removeBulk(ids)](#JSONFileStorage+removeBulk) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.getFiles()](#JSONFileStorage+getFiles) ⇒ <code>Array.&lt;string&gt;</code>
    * [.changeDirectory(directoryPath)](#JSONFileStorage+changeDirectory)

<a name="new_JSONFileStorage_new"></a>

### new JSONFileStorage(directoryPath)
Creates a new instance of JSONFileStorage

**Throws**:

- Error if directoryPath is not a string or an empty string


| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | The path of the folder where the data will be saved/retrieved |

<a name="JSONFileStorage+get"></a>

### jsonFileStorage.get(id) ⇒ <code>Promise.&lt;any&gt;</code>
Get a single item from the directory with the id

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  
**Returns**: <code>Promise.&lt;any&gt;</code> - a promise that resolves into the file that matches the id.
The promise is rejected if the file is not found with the id. Or if there is an error parsing the JSON.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | id of the item to get |

<a name="JSONFileStorage+getBulk"></a>

### jsonFileStorage.getBulk() ⇒ <code>Promise.&lt;Array.&lt;any&gt;&gt;</code>
Gets all the items from the directory and their content

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  
<a name="JSONFileStorage+put"></a>

### jsonFileStorage.put(item, [updateListing]) ⇒ <code>Promise.&lt;any&gt;</code>
Puts a single item in the directory

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  
**Returns**: <code>Promise.&lt;any&gt;</code> - promise that resolves into the file that was put  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| item | <code>any</code> |  | item to be put in to the directory |
| [updateListing] | <code>boolean</code> | <code>true</code> | should the files property be updated. Default is true |

<a name="JSONFileStorage+putBulk"></a>

### jsonFileStorage.putBulk(items) ⇒ <code>Promise.&lt;Array.&lt;any&gt;&gt;</code>
Puts items in the directory in bulk

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  
**Returns**: <code>Promise.&lt;Array.&lt;any&gt;&gt;</code> - items putted to the directory  
**Throws**:

- Error if items is not an array


| Param | Type | Description |
| --- | --- | --- |
| items | <code>Array.&lt;any&gt;</code> | items to be put to the directory |

<a name="JSONFileStorage+remove"></a>

### jsonFileStorage.remove(id, [updateListing])
removes the specified file from the directory

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>string</code> |  | id of the file |
| [updateListing] | <code>boolean</code> | <code>true</code> | should the file listing be updated. Default is true |

<a name="JSONFileStorage+removeBulk"></a>

### jsonFileStorage.removeBulk(ids) ⇒ <code>Promise.&lt;void&gt;</code>
Deletes files in bulk

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  

| Param | Type | Description |
| --- | --- | --- |
| ids | <code>Array.&lt;string&gt;</code> | Array of ids for the files to be deleted |

<a name="JSONFileStorage+getFiles"></a>

### jsonFileStorage.getFiles() ⇒ <code>Array.&lt;string&gt;</code>
Get the json files inside the directory

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  
**Returns**: <code>Array.&lt;string&gt;</code> - files in the directory  
<a name="JSONFileStorage+changeDirectory"></a>

### jsonFileStorage.changeDirectory(directoryPath)
Changes the directory used within this class

**Kind**: instance method of [<code>JSONFileStorage</code>](#JSONFileStorage)  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | path where to change to |

