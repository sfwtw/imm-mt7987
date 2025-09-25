#!/bin/sh
source /usr/share/libubox/jshn.sh
method=$1
config_section=$2

modem_network=$(uci get qmodem.$config_section.network)
alias=$(uci get qmodem.$config_section.alias)

get_uptime(){
    uptime_seconds=$(cat /proc/uptime | awk '{print $1}' | cut -d. -f1)
    network_uptime=$(ubus call network.interface.$alias status 2>/dev/null | jsonfilter -e '@.uptime')
    json_add_string uptime "$uptime_seconds"
    json_add_string network_uptime "$network_uptime"
}

get_ping(){
    ping_result_ip=$(ping -c 1 8.8.8.8 2>&1)
    ping_result_baidu=$(ping -c 1 baidu.com 2>&1)
    
    # 检查两个ping是否都成功
    if echo "$ping_result_ip" | grep -q "packets received" && echo "$ping_result_ip" | grep -q "0% packet loss" && \
       echo "$ping_result_baidu" | grep -q "packets received" && echo "$ping_result_baidu" | grep -q "0% packet loss"; then
        json_add_string result "both_success"
        json_add_string status "connected"
    elif echo "$ping_result_ip" | grep -q "packets received" && echo "$ping_result_ip" | grep -q "0% packet loss"; then
        json_add_string result "ip_only"
        json_add_string status "dns_blocked"
    else
        json_add_string result "failed"
        json_add_string status "disconnected"
    fi
    
    json_add_string ip_ping "$ping_result_ip"
    json_add_string baidu_ping "$ping_result_baidu"
}

get_ip(){
    ip_addr_v4=$(ip addr show $modem_network | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1 | head -1)
    ip_addr_v6=$(ip addr show $modem_network | grep 'inet6 ' | grep 'scope global' | awk '{print $2}' | cut -d'/' -f1 | head -1)

    [ -z "$ip_addr_v4" ] && ip_addr_v4="Not available"
    [ -z "$ip_addr_v6" ] && ip_addr_v6="Not available"

    json_add_string ipv4 "$ip_addr_v4"
    json_add_string ipv6 "$ip_addr_v6"
}

get_traffic(){
    rx_bytes=$(cat /sys/class/net/$modem_network/statistics/tx_bytes)
    tx_bytes=$(cat /sys/class/net/$modem_network/statistics/rx_bytes)

    json_add_string rx_bytes "$rx_bytes"
    json_add_string tx_bytes "$tx_bytes"
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
    "get_ip")
        get_ip
        ;;
    "get_traffic")
        get_traffic
        ;;
esac
json_dump
