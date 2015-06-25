VALID_TOOLCHAINS := pnacl

include $(NACL_SDK_ROOT)/tools/common.mk

TARGET=sidplayfp
LIBS=ppapi_cpp ppapi

CFLAGS=-Wall -I $(CURDIR) -I $(CURDIR)/sidplayfp -DHAVE_CONFIG_H
SOURCES = sidplayfp/sidplayfp.cpp

$(foreach src, $(SOURCES), $(eval $(call COMPILE_RULE, $(src), $(CFLAGS))))

$(eval $(call LINK_RULE, $(TARGET)_unstripped, $(SOURCES), $(LIBS), $(DEPS)))
$(eval $(call STRIP_RULE, $(TARGET), $(TARGET)_unstripped))

$(eval $(call NMF_RULE, $(TARGET),))

