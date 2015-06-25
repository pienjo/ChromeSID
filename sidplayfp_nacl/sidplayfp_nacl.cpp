#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"

class SidplayfpInstance : public pp::Instance 
{
  public:
    explicit SidplayfpInstance(PP_Instance instance ) : pp::Instance(instance) 
    {
    }

    virtual ~SidplayfpInstance()
    {
    }

    virtual void HandleMessage(const pp::Var &var_message)
    {

    }
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
