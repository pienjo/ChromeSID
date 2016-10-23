VALID_TOOLCHAINS := pnacl

include $(NACL_SDK_ROOT)/tools/common.mk

TARGET=sidplayfp
LIBS=ppapi_cpp ppapi
CONFIG=Release

# Use std=gnu++11 (even though the code itself doesn't use any GNU extensions) to work around
# a bug in pepper's newlib (sstream uses GNU extensions)

CFLAGS=-std=gnu++11 -Wall -Wno-unused-private-field -I $(CURDIR) -I $(CURDIR)/sidplayfp -DHAVE_CONFIG_H -O3
SOURCES = \
sidplayfp/config.cpp \
sidplayfp/EventScheduler.cpp \
sidplayfp/player.cpp \
sidplayfp/psiddrv.cpp \
sidplayfp/mixer.cpp \
sidplayfp/reloc65.cpp \
sidplayfp/SidConfig.cpp \
sidplayfp/sidbuilder.cpp \
sidplayfp/sidplayfp.cpp  \
sidplayfp/SidTune.cpp \
sidplayfp/sidemu.cpp \
sidplayfp/c64/c64.cpp \
sidplayfp/c64/mmu.cpp \
sidplayfp/c64/VIC_II/mos656x.cpp \
sidplayfp/c64/CPU/mos6510.cpp \
sidplayfp/c64/CIA/mos6526.cpp \
sidplayfp/c64/CIA/timer.cpp \
sidplayfp/c64/CIA/tod.cpp \
sidplayfp/sidtune/MUS.cpp \
sidplayfp/sidtune/p00.cpp \
sidplayfp/sidtune/prg.cpp \
sidplayfp/sidtune/PSID.cpp \
sidplayfp/sidtune/SidTuneBase.cpp \
sidplayfp/sidtune/SidTuneTools.cpp \
utils/MD5/MD5.cpp \
builders/resid-builder/resid-builder.cpp \
builders/resid-builder/resid-emu.cpp \
builders/resid-builder/resid/dac.cc \
builders/resid-builder/resid/sid.cc \
builders/resid-builder/resid/voice.cc \
builders/resid-builder/resid/wave.cc \
builders/resid-builder/resid/envelope.cc \
builders/resid-builder/resid/filter.cc \
builders/resid-builder/resid/extfilt.cc \
builders/resid-builder/resid/pot.cc \
builders/resid-builder/resid/version.cc \
sidplayfp_nacl.cpp

$(foreach src, $(SOURCES),$(eval $(call COMPILE_RULE,$(src),$(CFLAGS))))

ifneq (,$(or $(findstring pnacl,$(TOOlCHAIN)),$(findstring Release,$(CONFIG))))
$(eval $(call LINK_RULE,$(TARGET)_unstripped,$(SOURCES),$(LIBS),$(DEPS)))
$(eval $(call STRIP_RULE,$(TARGET),$(TARGET)_unstripped))
else
$(eval $(call LINK_RULE,$(TARGET),$(SOURCES),$(LIBS),$(DEPS)))
endif

$(eval $(call NMF_RULE,$(TARGET),))

install:	pnacl/Release/$(TARGET).pexe pnacl/Release/$(TARGET).nmf
	cp pnacl/Release/$(TARGET).pexe pnacl/Release/$(TARGET).nmf ../app
