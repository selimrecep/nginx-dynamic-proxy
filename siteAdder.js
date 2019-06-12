const { exec } = require('child_process');
const fs = require("fs");
const ConfigManager = require("./ConfigManager");

const PATH_SITES_ENABLED = "/etc/nginx/sites-enabled";
const PATH_SITES_EXTRA = "/etc/nginx/sites";
var DEFAULT_SITE_SCHEME = fs.readFileSync("scheme.conf", "utf8");
var commands = fs.readFileSync("command.txt", "utf8").split("\r\n");



var mail = "recepselimagirman@gmail.com"


var cm = new ConfigManager(PATH_SITES_ENABLED, PATH_SITES_EXTRA, DEFAULT_SITE_SCHEME, commands, mail);


var dom = "saydir.alicanyildiz.net";
var oldDom = "sad51.recepselim.com"; // Old
var zoneName = "habsay";
var ip = "34.90.30.187"

var baseSB = "profiles/serverBlock";
var sbPaths = fs.readdirSync(baseSB);
var serverBlock = "";

for(var k in sbPaths){
  var path = sbPaths[k];
  var conf = fs.readFileSync(baseSB + "/" + path);
  serverBlock += conf + "\n";
}

var settings = [25, 10, dom, "http", ip, 80, zoneName, 5, 50];
/*cm.removeSite(oldDom).then((res) => {
  log(res, true);*/
cm.addSite(settings, "", serverBlock, true).then((res) => {
  log(res, true);
}).catch((err) => {
  log(err, false);
});
/*}).catch((err) => {
  log(err, false);
});*/
function log() {
  console.log.apply(this, arguments);
}