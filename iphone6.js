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

// Here is a list of the serial numbers of the phones I don't care about
// I can't seem to figure out which is which, but I know those aren't the
// iphone 6 - 64Gb
var dontCare = ["MG3H2CL/A", "MG3E2CL/A", "MG3F2CL/A", "MG3D2CL/A", "MG3A2CL/A", "MG3C2CL/A", "MG9M2CL/A"];

// email: Email address to which send the "notification"
// storeName: name of the store where you want to reserve your iPhone 6
var email = "my.email@gmail.com", storeName = "Sainte-Catherine";

// today is used to check if changed day (at midnight). If so, we'll reset the
// previouslyAvailablePhones array
var today = new Date();
var previouslyAvailablePhones = [];

/**
 * This function will be call every 5 seconds to check if the status of the
 * iphone 6 has changed
 */
function loop () {
  request.get('https://reserve.cdn-apple.com/CA/en_CA/reserve/iPhone/availability.json', function(err, body, availability) {
    if(!isJSON(availability)) return;
    // Parse the json with the availability of the different phones
    var available = JSON.parse(availability);
    request.get("https://reserve.cdn-apple.com/CA/en_CA/reserve/iPhone/stores.json", function(err, body, storesString) {
      if(!isJSON(storesString)) return;

      var stores = JSON.parse(storesString);

      if(!stores.stores) return;

      // We get the storeNumber by removing all stores except the one we want
      var storeNumber = stores.stores.filter(function(val) {
        return val.storeName === storeName;
      })[0].storeNumber;

      // We iterate through the properties of the object, which are serial
      // numbers, and we check if the phone we're waiting for is available
      for(var i in available[storeNumber]) {
        var phonesThatIdontCareAbout = contains(dontCare, i);

        var didWeAlreadySendAnEmail = contains(previouslyAvailablePhones, i);
        
        console.log(phonesThatIdontCareAbout, previouslyAvailablePhones, didWeAlreadySendAnEmail, i);

        // If the phone is available and isn't one that we dont' care about
        // we send the email
        if(available[storeNumber][i] && !phonesThatIdontCareAbout && !didWeAlreadySendAnEmail) {
          // We push the serial number in an array to avoid spamming you if
          // it's still available in the next 5 seconds.
          previouslyAvailablePhones.push(i);

          transporter.sendMail({
            from: 'Apple ✔ <'+email+'>', // sender address
            to: email, // list of receivers
            subject: 'iPhone available', // Subject line
            html: '<a href="https://reserve.cdn-apple.com/CA/en_CA/reserve/iPhone/availability">Click</a>' // html body
          }, done);
        }
      }

      // If today is a different day from 5 seconds ago, we reset the
      // available phones array
      var tmp = new Date();
      if(tmp.getDate() !== today.getDate()) {
        console.log("reseting phones");
        previouslyAvailablePhones = [];
        today = new Date();
      }
    });
  });
}

// Do the get request every 5 seconds
var interval = setInterval(loop, 5000);

/**
 * Callback for when the email is sent or note
 * @param  {Object}   error describes the error
 * @param  {Object}   info  describes the result (if no error)
 */
function done(error, info){
  if(error) {
    console.log(error);
  } else {
    console.log('Message sent:', info);
  }
}

/**
 * Helper function that returns true if the element x is in the array arr
 * @param  {Array}   arr the array in which x is checked to be in
 * @param  {a} x     anything that could be in the array
 * @return {Boolean} whether or not x is in arr
 */
function contains (arr, x) {
  return arr.filter(function(val) {
    return val === x;
  }).length > 0;
}

function isJSON (json) {
  try {
    JSON.parse(json);
  } catch(err) {
    return false;
  }
  return true;
}