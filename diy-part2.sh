#!/bin/bash
#
# https://github.com/P3TERX/Actions-OpenWrt
# File name: diy-part2.sh
# Description: OpenWrt DIY script part 2 (After Update feeds)
#
# Copyright (c) 2019-2024 P3TERX <https://p3terx.com>
#
# This is free software, licensed under the MIT License.
# See /LICENSE for more information.
#

# Git稀疏克隆，只克隆指定目录到本地
function git_sparse_clone() {
  branch="$1" repourl="$2" && shift 2
  git clone --depth=1 -b $branch --single-branch --filter=blob:none --sparse $repourl
  repodir=$(echo $repourl | awk -F '/' '{print $(NF)}')
  cd $repodir && git sparse-checkout set $@
  mv -f $@ ../package
  cd .. && rm -rf $repodir
}

#sed -i 's/192.168.1.1/192.168.50.5/g' package/base-files/files/bin/config_generate

# Modify default theme
#sed -i 's/luci-theme-bootstrap/luci-theme-argon/g' feeds/luci/collections/luci/Makefile

# Modify hostname
#sed -i 's/OpenWrt/P3TERX-Router/g' package/base-files/files/bin/config_generate

# TTYD 免登录
# sed -i 's|/bin/login|/bin/login -f root|g' feeds/packages/utils/ttyd/files/ttyd.config

# 修改99_custom文件中的OPENWRT_RELEASE信息
UCI_DEFAULTS_FILE="target/linux/mediatek/filogic/base-files/etc/uci-defaults/99_custom"
if [ -f "$UCI_DEFAULTS_FILE" ]; then
    sed -i '/sed -i.*OPENWRT_RELEASE.*\/usr\/lib\/os-release/d' "$UCI_DEFAULTS_FILE"
    sed -i '/echo.*OPENWRT_RELEASE.*\/usr\/lib\/os-release/d' "$UCI_DEFAULTS_FILE"
    # 在exit 0上面插入新的内容
    VERSION_DATE="R$(date +%y.%-m.%-d)"
    sed -i '/^exit 0$/i\
sed -i '"'"'\/OPENWRT_RELEASE\/d'"'"' \/usr\/lib\/os-release\
echo "OPENWRT_RELEASE='"'"'ImmortalWrt (with 237'"'"'s Full HNAT) \/ '"$VERSION_DATE"''"'"'" >> \/usr\/lib\/os-release' "$UCI_DEFAULTS_FILE"
fi