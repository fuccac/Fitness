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
                            callback({msg:'File successfully downloaded',sev:0});
                        });
                    }
                })
                .catch(function (err) {
                   
                    callback({msg:'Error downloading file using the Dropbox API: ' + err,sev:2});
                });
        }
        else {
            callback({msg:'FILE '+id+' NOT DOWNLOADED - PROXY MODE ACTIVE',sev:1});
        }

    };

    this.uploadFile = function (token, id, callback) {
        if (!config.PROXY_MODE) {
            var dbx = new Dropbox({ accessToken: token, fetch });  // creates post-auth dbx instance
            fs.readFile(path.join(__dirname, '../saves/' + id), 'utf8', function (err, contents) {
                if (err) {
                    callback({msg:err,sev:2});
                    return;
                }
                dbx.filesUpload({ path: '/' + id, contents: contents, mode: 'overwrite' })
                    .then(function (response) {
                        callback({msg:response.name + " uploaded",sev:0});
                    })
                    .catch(function (error) {
                        callback({msg:error,sev:2});
                    });
            });
        }
        else {
            callback({msg:'FILE '+id+' NOT UPLOADED - PROXY MODE ACTIVE',sev:1});
        }

    };
}
module.exports = DropboxFunctions;