#include "sidplayfp_nacl.h"
#include "sidplayfp/SidInfo.h"
#include "sidplayfp/SidTune.h"
#include "sidplayfp/SidTuneInfo.h"

#include "ppapi/cpp/var_dictionary.h"
#include "ppapi/cpp/var_array_buffer.h"
#include "rom/basic_rom.c"
#include "rom/chargen_rom.c"
#include "rom/kernal_rom.c"


SidplayfpInstance::SidplayfpInstance(PP_Instance instance ) : pp::Instance(instance)
{
  // Load ROM images.
  mEngine.setRoms(kernal_rom, basic_rom, chargen_rom);
  
  // Set up handlers
  mFunctionMap["info"] = &SidplayfpInstance::HandleInfo;
  mFunctionMap["load"] = &SidplayfpInstance::HandleLoad;
  
}

SidplayfpInstance::~SidplayfpInstance()
{
}

void SidplayfpInstance::HandleMessage(const pp::Var &var_message)
{
  // Entry point of all messages
  
  pp::Var var_reply;

  if (var_message.is_dictionary())
  {
  	const pp::VarDictionary commandObj (var_message);
  	std::string command = commandObj.Get(pp::Var("command")).AsString();
  	pp::Var var_args = commandObj.Get(pp::Var("args"));
    
    handlerFunc handler = mFunctionMap[command];
    if (handler)
    {
      var_reply = (this->*handler)(var_args);
    }
  }
  
  PostMessage(var_reply);
}

    
pp::Var SidplayfpInstance::HandleInfo(const pp::Var &)
{
  pp::VarDictionary returnValue;
  const SidInfo &info = mEngine.info();

  // Retrieve name and version info of sidplayer lib
  std::string libraryVersion(info.name());
  libraryVersion.append(" ");
  libraryVersion.append(info.version());
  
  returnValue.Set("libraryVersion", pp::Var(libraryVersion));
  
  // Retrieve credits.

  pp::VarArray credits;
  
  for (unsigned int creditIdx = 0; creditIdx < info.numberOfCredits(); ++creditIdx)
  {
    credits.Set(creditIdx, info.credits(creditIdx));
  }
  returnValue.Set("credits", credits);

  // Retrieve ROM info
  pp::VarDictionary romInfo;
  romInfo.Set("kernal", info.kernalDesc());
  romInfo.Set("basic", info.basicDesc());
  romInfo.Set("chargen", info.chargenDesc());
  returnValue.Set("romInfo", romInfo);

  return returnValue;
}

namespace
{
	pp::VarDictionary GetSubtuneInfo(const SidTuneInfo *subtuneInfo)
	{
		pp::VarDictionary returnValue;
		
		if (!subtuneInfo)
			return returnValue;


		returnValue.Set("isStereo", subtuneInfo->isStereo());
		returnValue.Set("loadAddr", subtuneInfo->loadAddr());
		returnValue.Set("initAddr", subtuneInfo->initAddr());
		returnValue.Set("playAddr", subtuneInfo->playAddr());
	
	  switch(subtuneInfo->songSpeed())
		{
			case SidTuneInfo::SPEED_VBI:
				returnValue.Set("songSpeed", "Virtual blanking interrupt");
				break;
			case SidTuneInfo::SPEED_CIA_1A:
				returnValue.Set("songSpeed", "CIA 1 timer A");
				break;
		}
		
		const char *model = "unknown";
		switch(subtuneInfo->sidModel1())
		{
			case SidTuneInfo::SIDMODEL_UNKNOWN:
				break;
			case SidTuneInfo::SIDMODEL_ANY:
				model = "any";
				break;
			case SidTuneInfo::SIDMODEL_6581:
				model = "6581";
				break;
			case SidTuneInfo::SIDMODEL_8580:
				model = "8580";
				break;
		}
		returnValue.Set("sidModel1", model);

		const char *clock = "unknown";
		switch(subtuneInfo->clockSpeed())
		{
			case SidTuneInfo::CLOCK_UNKNOWN:
				break;
			case SidTuneInfo::CLOCK_PAL:
				clock = "PAL";
				break;
			case SidTuneInfo::CLOCK_NTSC:
				clock = "NTSC";
				break;
			case SidTuneInfo::CLOCK_ANY:
				clock = "any";
				break;
		}
		returnValue.Set("clockSpeed", clock);
		
		pp::VarArray songInfos;
		for (unsigned int i = 0; i < subtuneInfo->numberOfInfoStrings(); ++i)
		{
			songInfos.Set(i, subtuneInfo->infoString(i));
		}

		returnValue.Set("songInfos", songInfos);
		return returnValue;
	}
}
pp::Var SidplayfpInstance::HandleLoad(const pp::Var &pData)
{
  if (!pData.is_dictionary())
    return pp::Var();

  pp::Var contents = pp::VarDictionary(pData).Get("contents");
  
  if (!contents.is_array_buffer())
    return pp::Var();
  
  pp::VarArrayBuffer arrayBuffer(contents);
  const uint8_t *sidContents = (const uint8_t *) arrayBuffer.Map();
  
  mLoadedTune = std::shared_ptr<SidTune>(new SidTune(sidContents, arrayBuffer.ByteLength()));
  
  pp::VarDictionary returnValue;
  
  if (mLoadedTune->getStatus())
  {
    returnValue.Set("status", "OK");
    
    const SidTuneInfo *tuneInfo = mLoadedTune->getInfo();
    returnValue.Set("nrSongs", (int) tuneInfo->songs());
    returnValue.Set("defaultSong", (int) tuneInfo->startSong());
    returnValue.Set("format", tuneInfo->formatString());
    
    switch (tuneInfo->compatibility())
    {
      case SidTuneInfo::COMPATIBILITY_C64:
        returnValue.Set("compatibility", "C64 compatible");
        break;
      case SidTuneInfo::COMPATIBILITY_PSID:
        returnValue.Set("compatibility", "PSID specific");
        break;
      case SidTuneInfo::COMPATIBILITY_R64:
        returnValue.Set("compatibility", "Real C64 only");
        break;
      case SidTuneInfo::COMPATIBILITY_BASIC:
        returnValue.Set("compatibility", "C64 BASIC required");
        break;
    }

		pp::VarArray songs;
		for (uint32_t i = 0; i < tuneInfo->songs(); ++i)
		{
			songs.Set(i, GetSubtuneInfo(mLoadedTune->getInfo(i)));
		}

		returnValue.Set("songs", songs);
  }
  else
  {
    returnValue.Set("status", mLoadedTune->getStatus());
  }
    
  return returnValue;
}

// module glue

class SidplayfpModule : public pp::Module
{
  public:
    SidplayfpModule() : pp::Module()
    {
    }

    virtual ~SidplayfpModule()
    {
    }
    
    virtual pp::Instance * CreateInstance(PP_Instance instance)
    {
      return new SidplayfpInstance(instance);
    }
};

namespace pp
{
  pp::Module *CreateModule()
  {
    return new SidplayfpModule();
  }
}
