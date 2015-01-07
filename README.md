iwantmyiphone6
==============
_This is a toy project because I was bored. Please don't use it to spam Apple servers, I'm not responsible for what you do with this code._

This will do regular get requests to check if your iPhone 6 is available for reservation at the retailer of your choice.

All you need a file called config.json of this form:
```js
{
  "accessKeyId": "thisisakey",
  "secretAccessKey": "randomstringofnumbers"
}
```

## Install
Simply run
``` 
npm install 
node iphone6.js
```

Then you can run it on a server using [forever](https://github.com/nodejitsu/forever). Do the following:
```
forever start iphone6.js
```
