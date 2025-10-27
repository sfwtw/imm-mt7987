include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/kernel.mk

PKG_NAME:=qwebui
PKG_VERSION:=1
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  PKGARCH:=all
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=Qwebui
endef

define Package/$(PKG_NAME)/description
	Qwebui
endef

define Build/Prepare
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
		$(CP) ./files/* $(1)/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
