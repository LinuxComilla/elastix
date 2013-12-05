/**
  *
  * @ELASTIX
  * An elasticsearch tool for all your needs
  *
  **/

// Init
var url_util = require("url");
var path = require('path');
var check = require("validator").check;
var msgs = require(path.join(__dirname,"../config/messages"))
var defaults = require(path.join(__dirname,"../config/defaults"))
var ejs = require("elastic.js")
var nc = require('elastic.js/elastic-node-client')
var log = console.log
var str = JSON.stringify
var request = require("request")
var qsfy = require("querystring").stringify

// ======================================
var Elastix = function(url){
  var elx = {
    // ES Indicies API
    indicies:function(name,settings){
      return {
        create:function(){},
        destroy:function(){},
        settings:function(){},
        mapping: function() {
          return {
            create: function() {},
            update: function() {}
          };
        },
      }
    },
    // ES Document REST APIs
    document:function(io){
      var uri = "/"+io._index+"/"+io._type;
      return {
        index:function(d,cb){
          check(d._source,msgs.bad_source_param).notNull().notEmpty()
          var indexURL = uri;
          var _id = d._id || d._source._id;
          if(_id) indexURL = indexURL + "/" + _id ;
          elx.req({
            url:elx.url + indexURL,
            method:"POST",
            qs:d.params,
            json:d._source
          },cb)
        },
        get:function(_id,cb){
          check(_id,msgs.bad_id_param).notNull().notEmpty()
          var getURL = uri+"/"+_id;
          elx.req({
            url:elx.url + getURL,
            method:"GET"
          },cb)
        },
        update:function(d,cb){
          check(d._source,msgs.bad_source_param).notNull().notEmpty()
          var updateURL = uri;
          var _id = d._id || d._source._id;
          check(_id,msgs.bad_id_param).notNull().notEmpty()
          updateURL = updateURL + "/" + _id + "/_update";
          elx.req({
            url:elx.url + updateURL,
            method:"POST",
            qs:d.params,
            json:d
          },cb)
        },
        delete:function(_id,cb){
          check(_id,msgs.bad_id_param).notNull().notEmpty()
          var deleteURL = uri+"/"+_id;
          elx.req({
            url:elx.url + deleteURL,
            method:"DELETE"
          },cb)
        },
        multiGet:function(o,cb){},
        bulk:function(){}
      };
    },
    // Search Method
    search:function(o,cb){},
    // Global Request Client
    req:function(o,cb){
      request(o,function(e,r,b){
        if(b) b = elx.parseJSON(b);
        if(b && r && !e) b.status = r.statusCode;
        if(e){
          // an error occured
          cb(e,null);
        }else if(r && r.statusCode >= 400){
          // if statusCode isnt 200
          var error_message = new Error("Not 200 Response");
          if(r.statusCode) error_message = new Error("ES STATUS_CODE "+r.statusCode);
          if(b.error) error_message = new Error(str(b.error));
          if(typeof b !== "object") error_message = new Error(str(b));
          cb(error_message,b)

        }else if(!b){
          // Missing Response Body
          cb(new Error("Missing Response Body"),null)
        }else if(b){
          // No errors
          cb(null,b)
        }
      });
    },
    // Catch JSON Parsing Errors
    parseJSON: function(j) {
      if(typeof j !== "object"){
        try {
          var _j = JSON.parse(j);
          return _j;
        } catch (e) {
          return j;
        }
      }else{
        return j;
      }
    }
  };
  elx.url = url;
  if(!url) elx.url = defaults.es_url;
  check(elx.url).isUrl();
  elx._parsedUrl = url_util.parse(elx.url);
  elx.ejs = ejs;
  elx.ejs.client = nc.NodeClient(
    elx._parsedUrl.hostname,
    elx._parsedUrl.port,
    elx._parsedUrl.protocol
  );
  return elx;
};

module.exports = Elastix;