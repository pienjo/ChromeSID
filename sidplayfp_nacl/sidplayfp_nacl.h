#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"

#include "ppapi/cpp/var.h"
#include "sidplayfp/sidplayfp.h"

#include <memory>

class SidplayfpInstance;


class SidplayfpInstance : public pp::Instance
{
  public:
    explicit SidplayfpInstance(PP_Instance instance );
    virtual ~SidplayfpInstance();
    
    // Entry point of messages
    virtual void HandleMessage(const pp::Var &var_message) override;
    
  private:
    
		typedef pp::Var (SidplayfpInstance::*handlerFunc)(const pp::Var &);
    std::map<std::string, handlerFunc> mFunctionMap;
  
    // Message handlers
    pp::Var HandleInfo(const pp::Var &);
    pp::Var HandleLoad(const pp::Var &pData);
    
    std::shared_ptr<SidTune> mLoadedTune;
    
    // engine
    sidplayfp mEngine;
};
 
