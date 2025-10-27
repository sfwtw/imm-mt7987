-- Copyright 2024 Siriling <siriling@qq.com>
-- Copyright 2024 FJR <fjrcn@outlook.com>
module("luci.controller.qwebui", package.seeall)
local http = require "luci.http"
local json = require("luci.jsonc")
local util = require "luci.util"
local qwebui_ctrl = "/usr/share/qwebui/qwebui_ctrl.sh"

function index()
	entry({"admin", "modem", "qwebui", "qwebui_ctrl"}, call("qwebuiCtrl")).leaf = true
	entry({"admin", "modem", "qwebui"}, call("redirect_to_qwebui")).dependent = true
end

function shell(command)
	local odpall = io.popen(command)
	local odp = odpall:read("*a")
	odpall:close()
	return odp
end

function qwebuiCtrl()
	local action = http.formvalue("action")
	local cfg_id = http.formvalue("cfg")
	local params = http.formvalue("params")
	local result
	local command
	if params then
		command = qwebui_ctrl .. " " .. action .. " " .. cfg_id .. " " .. params
	else
		command = qwebui_ctrl .. " " .. action .. " " .. cfg_id
	end
	result = shell(command)
	if not result or result == "" then
		result = json.stringify({error = "Command failed"})
	end
	luci.http.prepare_content("application/json")
	luci.http.write(result)
end

function redirect_to_qwebui()
	luci.http.redirect("/qwebui")
end
