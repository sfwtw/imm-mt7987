#!/bin/sh
source /usr/share/libubox/jshn.sh
method=$1
config_section=$2

get_uptime(){
    uptime_val=$(uptime)
    json_add_string result "$uptime_val"
}

get_ping(){
    ping_result=$(ping -c 3 8.8.8.8 2>&1)
    json_add_string result "$ping_result"
}

json_init
json_add_object result
json_close_object
case $method in
    "get_uptime")
        get_uptime
        ;;
    "get_ping")
        get_ping
        ;;
esac
json_dump
