// @ts-nocheck
/*jshint esversion: 6 */
var Dropbox = require('dropbox').Dropbox;
var fs = require('fs');
var path = require('path');
fetch = require('isomorphic-fetch');
var Config = require("./Config");
var config = new Config();

function DropboxFunctions() {
    this.downloadFile = function (token, id, callback) {
        if (!config.PROXY_MODE) {
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
        }
        else {
            callback('FILE '+id+' NOT DOWNLOADED - PROXY MODE ACTIVE');
        }

    };

    this.uploadFile = function (token, id, callback) {
        if (!config.PROXY_MODE) {
            var dbx = new Dropbox({ accessToken: token, fetch });  // creates post-auth dbx instance
            fs.readFile(path.join(__dirname, '../saves/' + id), 'utf8', function (err, contents) {
                if (err) {
                    console.log('Error: ', err);
                }
                dbx.filesUpload({ path: '/' + id, contents: contents, mode: 'overwrite' })
                    .then(function (response) {
                        callback(response);
                    })
                    .catch(function (error) {
                        callback(error);
                    });
            });
        }
        else {
            callback('FILE '+id+' NOT UPLOADED - PROXY MODE ACTIVE');
        }

    };
}
module.exports = DropboxFunctions;