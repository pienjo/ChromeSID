#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"

#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_dictionary.h"

#include "sidplayfp/sidplayfp.h"
#include "sidplayfp/SidInfo.h"

#include "rom/basic_rom.c"
#include "rom/chargen_rom.c"
#include "rom/kernal_rom.c"

class SidplayfpInstance : public pp::Instance 
{
  public:
    explicit SidplayfpInstance(PP_Instance instance ) : pp::Instance(instance) 
    {
      // Load ROM images.
      mEngine.setRoms(kernal_rom, basic_rom, chargen_rom);      
    }

    virtual ~SidplayfpInstance()
    {
    }
    
    virtual void HandleMessage(const pp::Var &var_message)
    {
      pp::Var var_reply;

      if (var_message.is_dictionary())
      {
	const pp::VarDictionary commandObj (var_message);
	std::string command = commandObj.Get(pp::Var("command")).AsString();
	pp::Var var_args = commandObj.Get(pp::Var("args"));

        if (command == "info") 
	{
	  var_reply = HandleInfo();
	}
      }
      
      PostMessage(var_reply);
    }
  private:

    pp::Var HandleInfo()
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

    sidplayfp mEngine;
};

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
  Module *CreateModule()
  {
    return new SidplayfpModule();    
  }
}
