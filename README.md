# tizen relay

**DISCLAIMER**

This is a fast hack. Error handling is limited and may have incorrect arguments in tizen cli commands. Use with care.


Tizen only allows one machine to connect and deploy apps at a time.

The tizen relay web server that does tizen tasks in your behalf so several teammates can control the same device.


Supported scenarios:

* deploy remotely generated wgt files to a smart tv
* generate iframe app pointing at your ip:port and deploy it to the smart tv


## setup

Checkout repos to the machine which is whilelisted in tizen dev mode.

You should have tizen studio and its relevant packages installed
and you must edit the const at the beginning of `index.js` to match your folder names and JDK version.

    npm start


## costumize

You're free to pass different template arguments and/or edit the iframeTemplate contents.
This is the minimum app we came up with to test local stuff fast, ie without actually deploying again.


## to aid in use on other machines (optional)

(in a tab/process)

    npm start

(in another one)

    npm install -g localtunnel
    lt --port 6633 --subdomain tizenrelay
