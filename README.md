# NGINX Reverse Proxy Manager in NodeJS
The aim is to manage your nginx in nodeJS language. You can use it like an API. 
_Note:_ Because of base configuration, you can only access HTTPS of this website. But you can use a HTTP or HTTPS Backend.  
Also it supports **DoS/DDoS protection** (by software). 

![photo](https://i.ibb.co/GVYJ23k/Screenshot-20190615-221727-Termius.jpg)

## Installing nginx to your CentOS Server
You can install nginx to other distros. too but I am going to tell it in CentOS,
Run this command to add nginx repo: 
~~~shell
> sudo nano /etc/yum.repos.d/nginx.repo
~~~
Then add this:
~~~
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
~~~

To open ports in firewall
~~~shell
> firewall-cmd --zone=public --add-port=80/tcp --permanent
> firewall-cmd --zone=public --add-port=443/tcp --permanent
> firewall-cmd --reload
~~~

Enter http://IP , you should be able to see welcoming nginx page.

Then copy inside of setup folder to `/etc/nginx` folder (Thanks to Nginxconfig.io for configuration files). Then run:
~~~shell
> openssl dhparam -dsaparam -out /etc/nginx/dhparam.pem 2048
> mkdir -p /var/www/_letsencrypt
> chown www-data /var/www/_letsencrypt
> sudo mkdir /etc/nginx/sites
> sudo mkdir /etc/nginx/sites-enabled
~~~

And _after you added your first website_ run this:
~~~shell
> echo -e '#!/bin/bash\nnginx -t && systemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh
> sudo chmod a+x /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh
~~~

Then you are ready to use your script.

# Usage
## Server settings
First run `npm install`
Then set basic server settings to build your server.
~~~javascript
const PATH_SITES_ENABLED = "/etc/nginx/sites-enabled";
const DEFAULT_SITE_SCHEME = fs.readFileSync("scheme.conf", "utf8");
const commands = fs.readFileSync("command.txt", "utf8").split("\r\n");
const mail = "info@example.com";
~~~
_PATH_SITES_ENABLED_ is the directory that stores configuration files.   
_DEFAULT_SITE_SCHEME_ is path to default configuration file that will be used for future websites.  
_commands_ is an string array that is needed to be run element by element to setup new website.  
_mail_ is needed for confirming your website by LetsEncrypt SSL  

Then setup your configuration manager.

~~~javascript
var cm = new ConfigManager(PATH_SITES_ENABLED, DEFAULT_SITE_SCHEME, commands, mail);
~~~

Then prepare settings for your first website
~~~javascript
var dom = "example.com";
var zoneName = "example"; // This is for preventing DoS/DDoS by blocking flood. Every domain should have different zoneName(s).
var ip = "123.123.123.123" // This is IP that will be our backend.


var settings = [10, 10, dom, "https", ip, 443, zoneName, 5, 15]; // You can be confused with these values. You will understand them while you are coding (JSDoc). And you can look into scheme.conf then compare the variable names and values.
~~~
(Be sure that you have configured your DNS settings)
And then add your website
 
~~~javascript
cm.addSite(settings).then((res) => {
    console.log(res, true); // Adding website seems successful. 
  }).catch((err) => {
    console.log(err, false); // An error has been occurred.
  });
~~~

Then enter your domain `https://example.com` (You will be forwarded to https if you try to enter from HTTP Protocol).

Good job! It's ready! To remove a website:

~~~javascript
cm.removeSite(oldDom).then((res) => {
  console.log(res, true);
}).catch((err) => {
  console.log(err, false);
});
~~~

At your backend, you can find visitor's IP. In PHP:

~~~php
if($_SERVER["REMOTE_ADDR"] === "YOUR_PROXY_IP"){ // You should be sure that client is requesting through proxy.
    $_SERVER["REMOTE_ADDR"] = $_SERVER["HTTP_X_REAL_IP"];
}

// Then you can do what you want about visitor's IP.
~~~

# Commmand Line Usage (Easy Way)
Just run `sudo node siteAdder.js`. Then choose the action that you want. (I recommend you to only touch settings domain, backend protocol, backend port, backend ip etc. )

**Note:** Try to not use same domain many times for creating cert. You can be get banned for 1 week.

If you find any bug, please open an issuse from issues tab. 

Todo list:
- [x] CloudFlare support (Reversing IP Back)
- [x] Dynamically adding/removing websitse
- [x] More specific configuration file support website by website
- [x] NGINX Stats support (Added through dynamic serverblock confs.)
- [x] Terminal GUI

Web Proxy/NGINX Configuration manager NodeJS Part made by selimrecep
