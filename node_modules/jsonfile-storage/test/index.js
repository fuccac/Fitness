var JSONFileStorage = require('../src');
var chai = require('chai');
var assert = chai.assert,
    expect = chai.expect

var fs = require('fs');
var testDirectoryName = '/test-data/';
var changeDirectoryName = '/test-data2/';

afterEach(function() {
    var files = fs.readdirSync(__dirname + testDirectoryName);
    files.forEach(file => {
        if (file !== '.gitignore') {
            fs.unlinkSync(__dirname + testDirectoryName + file)
        }
    });   
})

describe('JSONFileStorage', function() {
    it('Should create a new instance of JSONFileStorage', function() {
        assert(new JSONFileStorage(__dirname + testDirectoryName) instanceof JSONFileStorage, 'Created instance is wrong');
    })
    it('Should fail creating a new instance of JSONFileStorage', function() {
        expect(() => {new JSONFileStorage('notexistingdirectory')}).to.throw('Error reading the files from the directory');
    })
    it('Should fail creating a new instance of JSONFileStorage 2', function() {
        expect(() => {new JSONFileStorage()}).to.throw('No directoryPath specified or directoryPath was an empty string');
    })
})
describe('JSONFileStorage#put', function() {
    it('Should put the json data into the "test-data" directory', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        storage.put({ test: 'this is some test string' })
        .then(result => {
            assert('id' in result, 'No id present on putted data');
            var files = fs.readdirSync(__dirname + testDirectoryName);
            assert(files.indexOf(result.id + '.json') !== -1, 'File was not found in ' + testDirectoryName);
            done();
        })
    })
})
describe('JSONFileStorage#putBulk', function() {
    it('Should put several items into the "test-data" directory', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        var items = [
            { stuff: 'some stuff here' },
            { stuff: 'another stuff content here' },
            { stuff: 'third stuff here' }
        ]
        storage.putBulk(items)
        .then(items => {
            assert(items.length === 3);
            done();
        })
    })
})
describe('JSONFileStorage#changeDirectory', function() {
    it('Should change directory', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        storage.put({stuff: 'in the first dir'})
        .then(res => {
            storage.changeDirectory(__dirname + changeDirectoryName);
            assert(storage.getFiles().length === 0);
            done();
        })
    })
})
describe('JSONFileStorage#get', function() {
    it('Should return the requested item with the correct id', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        storage.put({ test: 'this is some test string' })
        .then(putResult => {
            storage.get(putResult.id).then(getResult => {
                assert(putResult.id === getResult.id);
                done();
            })
        })
    })
    it('Should reject get promise because the id is wrong', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        storage.put({ test: 'this is some test string' })
        .then(putResult => {
            storage.get('asdasd')
            .then(getResult => {
                assert.fail();
                done();
            })
            .catch(err => {
                done();
            })
        })
    })
})
describe('JSONFileStorage#getBulk', function() {
    it('Should return all the json files in the directory', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        var items = [
            { stuff: 'some stuff here' },
            { stuff: 'another stuff content here' },
            { stuff: 'third stuff here' }
        ]
        storage.putBulk(items)
        .then(items => {
            storage.getBulk().then(items => {
                assert(items.length === 3);
                done();
            })
        })
    })
})
describe('JSONFileStorage#remove', function() {
    it('Should remove a single file from the directory', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        var items = [
            { stuff: 'some stuff here' },
            { stuff: 'another stuff content here' },
            { stuff: 'third stuff here' }
        ]
        storage.putBulk(items)
        .then(items => {
            var itemToBeRemoved = items[0];
            storage.remove(itemToBeRemoved.id)
            .then(() => {
                assert(storage.getFiles().indexOf(itemToBeRemoved.id + '.json') === -1)
                done();
            })
        })
    })
})
describe('JSONFileStorage#removeBulk', function() {
    it('Should remove all the files from the directory', function(done) {
        var storage = new JSONFileStorage(__dirname + testDirectoryName);
        var items = [
            { stuff: 'some stuff here' },
            { stuff: 'another stuff content here' },
            { stuff: 'third stuff here' }
        ]
        storage.putBulk(items)
        .then(items => {
            storage.removeBulk(storage.getFiles())
            .then(() => {
                assert(storage.getFiles().length === 0);
                done();
            })
        })
    })
})
