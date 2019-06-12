const { exec } = require('child_process');
const fs = require("fs");
const ConfigManager = require("./ConfigManager");

const PATH_SITES_ENABLED = "/etc/nginx/sites-enabled";
var DEFAULT_SITE_SCHEME = fs.readFileSync("scheme.conf", "utf8");
var commands = fs.readFileSync("command.txt", "utf8").split("\r\n");



var mail = "recepselimagirman@gmail.com"


var cm = new ConfigManager(PATH_SITES_ENABLED, DEFAULT_SITE_SCHEME, commands, mail);


var dom = "sad47.recepselim.com";
var oldDom = "sad46.recepselim.com"; // Old
var zoneName = "sad47";
var ip = "51.77.211.6"
var settings = [10, 10, dom, "https", ip, 443, zoneName, 5, 15];
cm.removeSite(oldDom).then((res) => {
  log(res, true);
  cm.addSite(settings).then((res) => {
    log(res, true);
  }).catch((err) => {
    log(err, false);
  });
}).catch((err) => {
  log(err, false);
});
function log() {
  console.log.apply(this, arguments);
}