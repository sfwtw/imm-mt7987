-- Copyright 2024 Siriling <siriling@qq.com>
-- Copyright 2024 FJR <fjrcn@outlook.com>
module("luci.controller.qwebui", package.seeall)
local http = require "luci.http"
local fs = require "nixio.fs"
local json = require("luci.jsonc")
uci = luci.model.uci.cursor()
local script_path="/usr/share/qwebui/"
local run_path="/tmp/run/qwebui/"
local qwebui_ctrl = "/usr/share/qwebui/qwebui_ctrl.sh"

function index()
	entry({"admin", "modem", "qwebui", "qwebui_ctrl"}, call("qwebuiCtrl")).leaf = true
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
	local translate = http.formvalue("translate")
	if params then
		result = shell(qwebui_ctrl..action.." "..cfg_id.." ".."\""..params.."\"")
	else 
		result = shell(qwebui_ctrl..action.." "..cfg_id)
	end
	luci.http.prepare_content("application/json")
	luci.http.write(result)
end
