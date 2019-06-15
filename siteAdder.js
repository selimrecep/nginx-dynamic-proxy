const { exec } = require('child_process');
const fs = require("fs");
const ConfigManager = require("./ConfigManager");

const PATH_SITES_ENABLED = "/etc/nginx/sites-enabled";
const PATH_SITES_EXTRA = "/etc/nginx/sites";
var DEFAULT_SITE_SCHEME = fs.readFileSync("scheme.conf", "utf8");
var commands = fs.readFileSync("command.txt", "utf8").split("\r\n");
const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");




var mail = "recepselimagirman@gmail.com"


var cm = new ConfigManager(PATH_SITES_ENABLED, PATH_SITES_EXTRA, DEFAULT_SITE_SCHEME, commands, mail);


var dom = "habsay.pw";
var zoneName = "habsayP";
var ip = "34.90.186.20"

var baseSB = "profiles/serverBlock";
var sbPaths = fs.readdirSync(baseSB);
var serverBlock = "";

for (var k in sbPaths) {
  var path = sbPaths[k];
  var conf = fs.readFileSync(baseSB + "/" + path);
  serverBlock += conf + "\n";
}


const run = async () => {
  init();
  const method = await methodAsk();
  try {
    switch (method.TYPE) {
      case "Add website":
        const site1 = await askQuestionsAdd();
        const { DOMAIN, RATE_PR, RATE_LIMIT, BACKEND_PROTOCOL, BACKEND_PORT, BACKEND_IP, ZONE_NAME, DYNA_RATE, STA_RATE, ADD_SSL } = site1;

        var settings = [RATE_PR, RATE_LIMIT, DOMAIN, BACKEND_PROTOCOL, BACKEND_IP, BACKEND_PORT, ZONE_NAME, DYNA_RATE, STA_RATE];
        cm.addSite(settings, "", serverBlock, ADD_SSL).then((res) => {
          log(res, true);
          success();
        }).catch((err) => {
          log(err, false);
          error(err.message);
        });
        break;
      case "Remove website":
        const site2 = await whichDomainAsk();
        var domain = site2.DOMAIN;

        cm.removeSite(domain);
        success();
        break;
      case "Check website":
        const site3 = await whichDomainAsk();
        var domain = site3.DOMAIN;

        print(cm.siteExists(domain));
        break;
      default:

        break;
    }
  } catch (e) {
    error(e.message);
  }
};
const whichDomainAsk = () => {

  const questions = [
    {
      name: "DOMAIN",
      type: "input",
      message: "What is domain name of the website?",
      validate: function (dom) {
        return /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/.test(dom);
      }
    }
  ]
  return inquirer.prompt(questions);
}
const askQuestionsAdd = () => {
  const questions = [
    {
      name: "DOMAIN",
      type: "input",
      message: "What is domain name of the website?",
      validate: function (dom) {
        return /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/.test(dom);
      }
    },
    {
      name: "RATE_PR",
      type: "input",
      message: "What is rate_pr value?",
      default: 25,
      validate: (val) => !isNaN(val)
    },
    {
      name: "RATE_LIMIT",
      type: "input",
      message: "What is rate_limit value?",
      default: 10,
      validate: (val) => !isNaN(val)
    },
    {
      name: "BACKEND_PROTOCOL",
      type: "input",
      message: "What is backend protocol?",
      default: "http",
      validate: (val) => val == "http" || val == "https"
    },
    {
      name: "BACKEND_PORT",
      type: "input",
      message: "What is backend port?",
      default: 80,
      validate: (val) => !isNaN(val)
    },
    {
      name: "BACKEND_IP",
      type: "input",
      message: "What is backend IP?",
      validate: (val) => /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(val)
    },
    {
      name: "ZONE_NAME",
      type: "input",
      message: "What is zone name of the website(IT SHOULD BE UNIQUE)?"
    },
    {
      name: "DYNA_RATE",
      type: "input",
      message: "What is dynamic rate limit burst value?",
      default: 5,
      validate: (val) => !isNaN(val)
    },
    {
      name: "STA_RATE",
      type: "input",
      message: "What is static rate limit burst value?",
      default: 50,
      validate: (val) => !isNaN(val)
    },
    {
      name: "ADD_SSL",
      type: "input",
      message: "Have you ever added SSL for this domain? (IN THIS MACHINE)",
      default: false,
      list : [false, true]
    }

  ];
  return inquirer.prompt(questions);
};
const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("selimrecep", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
}

const methodAsk = () => {
  const questions = [
    {
      name: "TYPE",
      type: "list",
      message: "What do you want to do?",
      choices: ["Add website", "Remove website", "Check website"]
    }

  ];
  return inquirer.prompt(questions);
};
function log() {
  console.log.apply(this, arguments);
}

const success = res => {
  console.log(
    chalk.white.bgGreen.bold(`Done!`)
  );
};
const print = res => {
  console.log(
    chalk.white.bgBlue.bold(res)
  );
};

const error = err => {
  console.log(
    chalk.white.bgRed.bold(`Error! ` + err)
  );
};

run();