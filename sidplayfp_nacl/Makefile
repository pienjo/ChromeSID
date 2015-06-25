VALID_TOOLCHAINS := pnacl

include $(NACL_SDK_ROOT)/tools/common.mk

TARGET=sidplayfp
LIBS=ppapi_cpp ppapi

CFLAGS=-Wall -Wno-unused-private-field -I $(CURDIR) -I $(CURDIR)/sidplayfp -DHAVE_CONFIG_H
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
utils/iniParser.cpp \
utils/SidDatabase.cpp \
utils/MD5/MD5.cpp \
sidplayfp_nacl.cpp

$(foreach src, $(SOURCES), $(eval $(call COMPILE_RULE, $(src), $(CFLAGS))))

$(eval $(call LINK_RULE, $(TARGET)_unstripped, $(SOURCES), $(LIBS), $(DEPS)))
$(eval $(call STRIP_RULE, $(TARGET), $(TARGET)_unstripped))

$(eval $(call NMF_RULE, $(TARGET),))

