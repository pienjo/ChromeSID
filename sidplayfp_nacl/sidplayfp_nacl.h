#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/audio.h"
#include "ppapi/cpp/audio_config.h"
#include "ppapi/cpp/var.h"
#include "sidplayfp/sidplayfp.h"
#include "sidplayfp/SidConfig.h"
#include "builders/resid-builder/resid.h"
#include "LockFreeQueue.h"
#include <memory>
#include <mutex>
#include <thread>

class SidplayfpInstance;


class SidplayfpInstance : public pp::Instance
{
  public:
    explicit SidplayfpInstance(PP_Instance instance );
    virtual ~SidplayfpInstance();
    
    // Entry point of messages
    virtual void HandleMessage(const pp::Var &var_message) override;

		// Called by the browser once the NaCL module is loaded and ready to initialize.
		virtual bool Init(uint32_t argc, const char *argn[], const char *argv[]) override;

  private:
		void GetAudioData(int16_t *pSamples, uint32_t buffer_size);	

		// Callback function called by browser when new audio data is required
		static void GetAudioDataCallback(void *pSamples, uint32_t buffer_size, void *data)
		{
			reinterpret_cast<SidplayfpInstance *>(data)->GetAudioData(reinterpret_cast<int16_t *>(pSamples), buffer_size);
		}

		// Audio resource
		pp::Audio *mAudio;
		uint32_t mSampleSize;

		// Audio queue
		class AudioQueueEntry
		{
			public:
				AudioQueueEntry() : mData (nullptr)
				{
				}

				~AudioQueueEntry() 
				{
					delete mData;
				}

				int16_t *mData;
		};

		LockFreeQueue<AudioQueueEntry> mPlaybackQueue;
		
		void DecodingLoop();

		typedef pp::Var (SidplayfpInstance::*handlerFunc)(const pp::Var &);
    std::map<std::string, handlerFunc> mFunctionMap;
  
    // Message handlers
    pp::Var HandleInfo(const pp::Var &);
    pp::Var HandleLoad(const pp::Var &pData);
	
	  // Synchronisation: Locks access to all SidplayFP resources
		std::mutex mPlayerMutex;	
		std::thread mDecodingThread;
		std::atomic<bool> mDestructing;

		// Tune
    std::shared_ptr<SidTune> mLoadedTune;
		std::shared_ptr<SidTune> mPlayingTune;

    // engine
    sidplayfp mEngine;
		SidConfig mConfig;
		ReSIDBuilder mSidBuilder;
};
 
