var fs = require('fs');
var uuid = require('uuid/v4');
/**
 * Creates a new instance of JSONFileStorage
 * @constructor
 * @param {string} directoryPath 
 * The path of the folder where the data will be saved/retrieved
 * @throws Error if directoryPath is not a string or an empty string
 */
function JSONFileStorage(directoryPath) {
    var files = [];
    var _directoryPath
    
    setDirectoryPath(directoryPath);
    /**
     * Get a single item from the directory with the id
     * @memberOf JSONFileStorage
     * @function JSONFileStorage#get
     * @param {string} id id of the item to get
     * @returns {Promise<any>} a promise that resolves into the file that matches the id.
     * The promise is rejected if the file is not found with the id. Or if there is an error parsing the JSON.
     */
    this.get = function(id) {
        id += /.json$/.test(id) ? '' : '.json';
        return new Promise(function(resolve, reject) {
            fs.readFile(_directoryPath + id, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        var dataJSON = JSON.parse(data.toString());
                        resolve(dataJSON);
                    } catch (e) {
                        console.error('Error parsing JSON data');
                        reject(e);
                    }
                }
            })
        })
    }
    /**
     * Gets all the items from the directory and their content
     * @memberOf JSONFileStorage
     * @function JSONFileStorage#getBulk
     * @returns {Promise<Array<any>>}
     */
    this.getBulk = function() {
        var promises = files.reduce(function(carry, current) {
            carry.push(this.get(current));
            return carry;
        }.bind(this), []);
        return Promise.all(promises);
    }
    /**
     * Puts a single item in the directory
     * @memberOf JSONFileStorage
     * @function JSONFileStorage#put
     * @param {any} item item to be put in to the directory
     * @param {boolean} [updateListing=true] should the files property be updated. Default is true
     * @returns {Promise<any>} promise that resolves into the file that was put
     */
    this.put = function(item, updateListing = true) {
        if (!('id' in item)) {
            console.debug('No id field was set in the item. Generating id...');
            item.id = uuid();
        }
        return new Promise(function(resolve, reject) {
            var filePath = _directoryPath + item.id + '.json';
            fs.writeFile(filePath, JSON.stringify(item), function(err) {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    if (updateListing) {
                        files = getFileListing();
                    }
                    resolve(item);
                }
            })
        });
    }
    /**
     * Puts items in the directory in bulk
     * @memberOf JSONFileStorage
     * @function JSONFileStorage#putBulk
     * @param {Array<any>} items items to be put to the directory
     * @returns {Promise<Array<any>>} items putted to the directory
     * @throws Error if items is not an array
     */
    this.putBulk = function(items) {
        if (!Array.isArray(items)) {
            throw new Error('itemList must be an array of items!');
        }
        var promises = items.map(function(item) { return this.put(item, false) }.bind(this));
        var promiseContainer = Promise.all(promises);
        return new Promise(function(resolve, reject) {
            promiseContainer
            .then(function(items) {
                files = getFileListing();
                resolve(items);
            })
            .catch(function(err) {
                console.error(err.message);
            });
        });
    }
    /**
     * removes the specified file from the directory
     * @memberOf JSONFileStorage
     * @function JSONFileStorage#remove
     * @param {string} id id of the file
     * @param {boolean} [updateListing=true] should the file listing be updated. Default is true
     */
    this.remove = function(id, updateListing = true) {
        id += /.json$/.test(id) ? '' : '.json';
        return new Promise(function(resolve, reject) {
            if (files.indexOf(id) === -1) {
                console.error('File not found with for this id!', id);
                reject('File not found with for this id!');
                return;
            }
            fs.unlink(_directoryPath + id, function(err) {
                if (err) {
                    console.error('There was an error removing the file', err.message);
                    reject(err);
                } else {
                    if (updateListing) {
                        files = getFileListing();
                    }
                    resolve();
                }
            })
        })
    }
    /**
    * Deletes files in bulk
    * @memberOf JSONFileStorage
    * @function JSONFileStorage#removeBulk
    * @param {Array<string>} ids Array of ids for the files to be deleted
    * @returns {Promise<void>}
    */
    this.removeBulk = function(ids) {
        return new Promise(function(resolve, reject) {
            if (!Array.isArray(ids)) {
                console.error('Ids must be an Array');
                throw new Error('Ids must be an Array');
            }
            Promise.all(ids.map(function(id) { return this.remove(id, false) }.bind(this)))
            .then(function() {
                files = getFileListing();
                resolve();
            })
            .catch(function(err) {
                console.error(err.message);
                reject(err.message);
            })
        }.bind(this))
    }
    /**
     * Get the json files inside the directory
     * @memberOf JSONFileStorage
     * @function JSONFileStorage#getFiles
     * @returns {Array<string>} files in the directory
     */
    this.getFiles = function() {
        return files.slice();
    }
    /**
     * Changes the directory used within this class
     * @memberOf JSONFileStorage
     * @function JSONFileStorage#changeDirectory
     * @param {string} directoryPath path where to change to
     */
    this.changeDirectory = function(directoryPath) {
        setDirectoryPath(directoryPath);
    }
    /**
     * Gets the current directory file listing
     * 
     * Filters out all the files that dont have a .json extension
     * 
     * IMPORTANT: This operation is synchronous
     * @private
     * @function getFileListing
     * @returns {string[]} the names of the files
     */
    function getFileListing() {
        return fs.readdirSync(_directoryPath).filter(function(file) { return /.json$/.test(file) });
    }
    /**
     * Sets a new directory for this class and updates the files
     * @private
     * @function setDirectoryPath
     * @param {string} directoryPath directory path to be set
     * @throws Error when no directoryPath is provided or when it is an empty string
     * @throws Error when reading files from the directory fails
     */
    function setDirectoryPath(directoryPath) {
        if (typeof directoryPath === 'string' && directoryPath.trim() !== '') {
            if (directoryPath.charAt(directoryPath.length-1) !== '/') {
                // add trailing slash
                directoryPath += '/';
            }
            _directoryPath = directoryPath;
            try {
                files = getFileListing();
            } catch (e) {
                throw new Error('Error reading the files from the directory', e);
            }
        } else {
            throw new Error('No directoryPath specified or directoryPath was an empty string');
        }
    }
}

module.exports = JSONFileStorage;
