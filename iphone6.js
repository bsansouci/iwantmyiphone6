/*jslint node: true */
"use strict";

var request = require("request");
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var fs = require("fs");

// We load the AWS keys
var keys = JSON.parse(fs.readFileSync("./config.json", "utf8"));

// We create the transporter for the email
var transporter = nodemailer.createTransport(ses(keys));

var dontCare = ["MG3H2CL/A", "MG3E2CL/A", "MG3F2CL/A", "MG3D2CL/A"];
var email = "benjamin.sansouci@gmail.com", storeName = "Sainte-Catherine";

// This function will be call every 5 seconds to check if the status of the
// iphone 6 has changed
function loop () {
  request.get('https://reserve.cdn-apple.com/CA/en_CA/reserve/iPhone/availability.json', function(err, body, availability) {

    var available = JSON.parse(availability);
    request.get("https://reserve.cdn-apple.com/CA/en_CA/reserve/iPhone/stores.json", function(err, body, storesString) {
      var stores = JSON.parse(storesString);

      // We get the storeNumber by removing all stores except the one we want
      var storeNumber = stores.stores.filter(function(val) {
        return val.storeName === storeName;
      })[0].storeNumber;

      // We iterate through the properties of the object, which are serial
      // numbers, and we check if the phone we're waiting for is available
      for(var i in available[storeNumber]) {
        var isNotThoseiPhones = dontCare.filter(function(x) {
          return i === x;
        }).length === 0;

        if(available[storeNumber][i] && isNotThoseiPhones) {
          transporter.sendMail({
            from: 'Apple ✔ <'+email+'>', // sender address
            to: email, // list of receivers
            subject: 'iPhone available', // Subject line
            html: '<a href="https://reserve.cdn-apple.com/CA/en_CA/reserve/iPhone/availability">Click</a>' // html body
          }, function(error, info){
            if(error){
              console.log(error);
            }else{
              console.log('Message sent:', info);
            }
          });

          // Once we saw that it might be available, we stop and wait a minute
          // before re-trying (if we don't, we'll receive one email every 5sec)
          clearInterval(interval);
          interval = setInterval(loop, 60000);
        }
      }
    });
  });
}
var interval = setInterval(loop, 5000);