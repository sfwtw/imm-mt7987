module("luci.controller.Secondsystem660", package.seeall)

function index()
    entry({"admin", "system", "Secondsystem660"}, alias("admin", "system", "Secondsystem660", "settings"), _("官方系统"), 50)
    entry({"admin", "system", "Secondsystem660", "settings"}, template("Secondsystem660/settings"), _("Settings"), 10)
    entry({"admin", "system", "Secondsystem660", "switch"}, call("action_switch"), nil)
    entry({"admin", "system", "Secondsystem660", "reboots"}, call("action_reboots"), nil)
end

function action_switch()
    local sys = require "luci.sys"
    local http = require "luci.http"
    local sendat = 'echo 0 > /sys/class/gpio/cpe-pwr/value && echo 1 > /sys/class/gpio/cpe-pwr/value'
    local confirm = http.formvalue("confirm")
    
    if confirm and confirm == "yes" then
        --sys.call("fw_setenv boot_system 0")
        sys.call("sh /etc/nradio-switch.sh")
        sys.call("reboot")
    else
        luci.http.redirect(luci.dispatcher.build_url("admin", "system", "Secondsystem660", "settings"))
    end
end

function action_reboots()
    local sys = require "luci.sys"
    local http = require "luci.http"
    local sendat = 'echo 0 > /sys/class/gpio/cpe-pwr/value && echo 1 > /sys/class/gpio/cpe-pwr/value'
    local confirm = http.formvalue("confirm")
    
    if confirm and confirm == "yes" then
        sys.call(sendat)
        sys.call("reboot")
    else
        luci.http.redirect(luci.dispatcher.build_url("admin", "system", "Secondsystem660", "settings"))
    end
end
