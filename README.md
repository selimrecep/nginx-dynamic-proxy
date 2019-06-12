# NGINX Reverse Proxy Manager in NodeJS
The aim is to manage your nginx in nodeJS language. You can use it like an API. 
## Installing nginx to your CentOS Server
You can install nginx to other distros. too but I am going to tell it in CentOS,
Run this command to add nginx repo: 
`sudo nano /etc/yum.repos.d/nginx.repo`
Then add this:
~~~[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1~~~
