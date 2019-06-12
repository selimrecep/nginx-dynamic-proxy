const { exec } = require('child_process');
const rimraf = require("rimraf");
const fs = require("fs");
const { FSError, CommandExecutionError, MissingParamsError } = require("./errors/Errors");
const LETS_ENCRYPT_BASE = "/etc/letsencrypt";
const NGINX_RELOAD_COMMAND = "sudo nginx -t && sudo systemctl reload nginx";
/**
 * Class for managing configs of nginx
 */
class ConfigManager {

    /**
     * Constructor 
     * @public
     * @param {String} PATH_SITES_ENABLED Path to enabled sites of nginx
     * @param {String} PATH_SITES_EXTRA Path to conf files of enabled sites of nginx
     * @param {String} DEFAULT_SITE_SCHEME  Default config scheme of website 
     * @param {string[]} commands Array of commands
     * @param {String} mail Lets Encrypt mailing E-Mail
     */
    constructor(PATH_SITES_ENABLED, PATH_SITES_EXTRA, DEFAULT_SITE_SCHEME, commands, mail) {
        this.PATH_SITES_ENABLED = PATH_SITES_ENABLED;
        this.PATH_SITES_EXTRA = PATH_SITES_EXTRA;
        this.DEFAULT_SITE_SCHEME = DEFAULT_SITE_SCHEME;
        this.commands = commands;
        this.mail = mail;
    }
    /**
     * Removes a website dynamically.
     * @param {String} dom Domain
     * @returns {Promise} Promise of result
     */
    removeSite(dom) {
        return new Promise((resolve, reject) => {
            var base = LETS_ENCRYPT_BASE;
            if (fs.existsSync(base + "/live/" + dom)) {
                if (fs.existsSync(base + "/" + dom + "/fullchain.pem"))
                    fs.unlinkSync(base + "/" + dom + "/fullchain.pem")
                if (fs.existsSync(base + "/" + dom + "/privkey.pem"))
                    fs.unlinkSync(base + "/" + dom + "/privkey.pem")
                if (fs.existsSync(base + "/" + dom + "/chain.pem"))
                    fs.unlinkSync(base + "/" + dom + "/chain.pem")
            }
            if (fs.existsSync(base + "/archive" + dom))
                rimraf.sync(base + "/archive" + dom);
            if (fs.existsSync(base + "/renewal" + dom))
                rimraf.sync(base + "/renewal" + dom);

            if (fs.existsSync(this.PATH_SITES_EXTRA + "/" + dom)) {
                rimraf.sync(this.PATH_SITES_EXTRA + "/" + dom);
            } /*else
                reject(new FSError("Configuration folder is missing"));*/
            if (fs.existsSync(this.PATH_SITES_ENABLED + "/" + dom + ".conf")) {
                fs.unlinkSync(this.PATH_SITES_ENABLED + "/" + dom + ".conf");
                this._runCommand(NGINX_RELOAD_COMMAND, [NGINX_RELOAD_COMMAND], 0, (output, isError) => {
                    if (isError)
                        return reject(new CommandExecutionError(output));
                    resolve(output);
                })
            } else
                reject(new FSError("Configuration file is missing"));
        });
    }

    /**
     * Addes a website dynamically.
     * @public
     * @param {Array} arr Settings of new website 
     * @param {string} preproxyConf Configuration before proxy_pass
     * @param {string} serverblockConf Configuration of server (You can put location /a { ... })
     * @param {boolean} passSSL If you have already created SSL use this to not get banned.
     * @returns {Promise} Promise of callback
     */
    addSite(arr, preproxyConf, serverblockConf, passSSL) {
        passSSL = (defined(passSSL)) ? passSSL : false;
        preproxyConf = (defined(preproxyConf)) ? preproxyConf : false;
        serverblockConf = (defined(serverblockConf)) ? serverblockConf : false;
        return new Promise((resolve, reject) => {
            if (arr.length < 6)
                return reject(new MissingParamsError("At least 6 params are required"));
            var domain = arr[2];
            var conf = this._getConf.apply(this, arr);
            this._addConfigFile(conf, domain, (err) => {
                if (err)
                    return reject(new FSError(err.message));
                if (preproxyConf !== false)
                    fs.writeFileSync(this.PATH_SITES_EXTRA + "/" + domain + "/preproxy.conf", preproxyConf);
                if (serverblockConf !== false)
                    fs.writeFileSync(this.PATH_SITES_EXTRA + "/" + domain + "/serverblock.conf", serverblockConf);
                var cmds = JSON.parse(JSON.stringify(this.commands));

                for (var k in cmds) {
                    var regDom = /{domain}/gi;
                    var regMail = /{mail}/gi;
                    var cmd = cmds[k];
                    cmd = cmd.replace(regDom, domain);
                    cmd = cmd.replace(regMail, this.mail);
                    cmds[k] = cmd;
                    if(passSSL && cmds[k].includes("certbot"))
                        cmds[k] = "echo skipped";
                }

                this._runCommand(cmds[0], cmds, 0, (output, isError) => {
                    if (isError)
                        return reject(new CommandExecutionError(output));
                    resolve(output);
                }, "")
            })
        })
    }

    /**
     * Executes commands in array in Linux env.
     * @private
     * @param {String} cmd Next command 
     * @param {string[]} arr Commands Array
     * @param {Number} k Command step
     * @param {Function} fn Callback
     * @param {String} totalOutput Output of execution
     */
    _runCommand(cmd, arr, k, fn, totalOutput) {
        totalOutput = (defined(totalOutput)) ? totalOutput + "\n" : "";
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                fn(stderr, true);
                return;
            }

            k++;
            totalOutput += stdout;
            if (typeof arr[k] == "undefined") {
                fn(totalOutput, false);
                return;
            }
            this._runCommand(arr[k], arr, k, fn, totalOutput);
        });
    }

    /**
     * Add config file.
     * @private
     * @param {String} conf Config text
     * @param {String} domain Config name that will include ".conf"
     * @param {Function} cb Callback
     */
    _addConfigFile(conf, domain, cb) {
        if (!fs.existsSync(this.PATH_SITES_ENABLED))
            fs.mkdirSync(this.PATH_SITES_ENABLED);

        if (!fs.existsSync(this.PATH_SITES_EXTRA))
            fs.mkdirSync(this.PATH_SITES_EXTRA);

        var path = this.PATH_SITES_ENABLED + "/" + domain + ".conf";
        var dir = this.PATH_SITES_EXTRA + "/" + domain;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        fs.writeFileSync(dir + "/preproxy.conf", "");
        fs.writeFileSync(dir + "/serverblock.conf", "");
        fs.writeFile(path, conf, "utf8", (err) => {
            cb(err)
        });
    }


    /**
     * Returns new configuration text.
     * @private
     * @param {Number} rate_pr A param of config file.
     * @param {Number} rate_limit A param of config file.
     * @param {String} domain A param of config file.
     * @param {String} passProtocol A param of config file.
     * @param {String} passIP A param of config file.
     * @param {Number} passPort A param of config file.
     * @param {Number} dynBurst A param of config file.
     * @param {Number} staBurst A param of config file.
     * @returns {String} Edited config file
     */
    _getConf(rate_pr, rate_limit, domain, passProtocol, passIP, passPort, zone, dynBurst, staBurst) {
        var toReplace = ["rate_pr", "rate_limit", "domain", "passProtocol", "passIP", "passPort", "zone", "dynBurst", "staBurst"]

        rate_pr = (defined(rate_pr)) ? rate_pr + "r/s" : "10r/s";
        rate_limit = rate_limit + "m" || "10m";
        domain = domain || "example.com";
        passProtocol = passProtocol || "http";
        passIP = passIP || null;
        passPort = passPort || -1;
        zone = zone || "limit";
        dynBurst = dynBurst || 5;
        staBurst = staBurst || 15;
        var args = [rate_pr, rate_limit, domain, passProtocol, passIP, passPort, zone, dynBurst, staBurst];
        var scheme = new String(this.DEFAULT_SITE_SCHEME).toString();
        for (var k in toReplace) {
            var from = toReplace[k];
            var a = "{" + from + "}";
            var regex = new RegExp(a, "gi");
            scheme = scheme.replace(regex, args[k]);
        }
        return scheme;
    }
}

function defined(obj) {
    return typeof obj !== "undefined";
}

module.exports = ConfigManager;
