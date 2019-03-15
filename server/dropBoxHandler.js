// @ts-nocheck
/*jshint esversion: 6 */
var Dropbox = require('dropbox').Dropbox;
var fs = require('fs');
var path = require('path');
fetch = require('isomorphic-fetch');

function DropboxFunctions() {
    this.downloadFile = function (token, id, callback) {
        var dbx = new Dropbox({ accessToken: token, fetch });  // creates post-auth dbx instance
        dbx.filesDownload({ path: '/' + id })
            .then(function (response) {
                if (response.fileBinary !== undefined) {
                    var filepath = path.join(__dirname, '../saves/' + response.name);
                    fs.writeFile(filepath, response.fileBinary, 'binary', function (err) {
                        if (err) { throw err; }
                        console.log("Dropbox File '" + response.name + "' saved");
                        callback('File successfully downloaded');
                    });
                }
            })
            .catch(function (err) {
                console.log(err);
                callback('Error downloading file using the Dropbox API');
            });
    };

    this.uploadFile = function (token, id, callback) {
        var dbx = new Dropbox({ accessToken: token, fetch });  // creates post-auth dbx instance
        fs.readFile(path.join(__dirname, '../saves/' + id), 'utf8', function (err, contents) {
            if (err) {
                console.log('Error: ', err);
            }
            dbx.filesUpload({ path: '/' + id, contents: contents })
                .then(function (response) {
                    callback(response);
                })
                .catch(function (error) {
                    callback(error);
                });
        });
    };
}
module.exports = DropboxFunctions;