#include "sidplayfp_nacl.h"
#include "sidplayfp/SidInfo.h"
#include "sidplayfp/SidTune.h"
#include "sidplayfp/SidTuneInfo.h"
#include "ppapi/cpp/var_dictionary.h"
#include "ppapi/cpp/var_array_buffer.h"
#include "rom/basic_rom.c"
#include "rom/chargen_rom.c"
#include "rom/kernal_rom.c"
#include "math.h"
#include <string.h>
#include <chrono>

SidplayfpInstance::SidplayfpInstance(PP_Instance instance ) : pp::Instance(instance)
  , mAudio(nullptr)
  , mBufferStorage(nullptr)
  , mNrBuffers(0)
  , mFreeQueue(nullptr)
  , mPlaybackQueue(nullptr)
  , mBuffersDecoded(0)
  , mBuffersPlayed(0)
  , mDestructing(false)
  , mPlayerStatus(STOPPED)
  , mFilterEnabled(true)
  , mReSIDfp_builder("ReSIDfp")
  , mReSID_builder("ReSID")
{
  mLastError = "All OK";
  // Load ROM images.
  mEngine.setRoms(kernal_rom, basic_rom, chargen_rom);

  // Configure the engine
  mReSIDfp_builder.create(mEngine.info().maxsids());
  if (!mReSIDfp_builder.getStatus())
  {
    mLastError = mReSIDfp_builder.error();
  }
  
  mReSID_builder.create(mEngine.info().maxsids());
  if (!mReSID_builder.getStatus())
  {
    mLastError = mReSID_builder.error();
  }

  mReSID_builder.filter(mFilterEnabled);
  mReSIDfp_builder.filter(mFilterEnabled);

  SidConfig sidConfig;
  sidConfig.frequency = 44100; 
  sidConfig.samplingMethod = SidConfig::INTERPOLATE;
  sidConfig.fastSampling = false;
  sidConfig.playback = SidConfig::STEREO;
  sidConfig.sidEmulation = &mReSID_builder;

  if (!mEngine.config(sidConfig))
  {
    mLastError = mEngine.error();
  }

  // Set up handlers
  mFunctionMap["libinfo"] = &SidplayfpInstance::HandleLibInfo;
  mFunctionMap["playerinfo"] = &SidplayfpInstance::HandlePlayerInfo;
  mFunctionMap["load"] = &SidplayfpInstance::HandleLoad;
  mFunctionMap["play"] = &SidplayfpInstance::HandlePlay;
  mFunctionMap["pauseresume"] = &SidplayfpInstance::HandlePauseResume;
  mFunctionMap["getconfig"] = &SidplayfpInstance::HandleGetConfig;
  mFunctionMap["setconfig"] = &SidplayfpInstance::HandleSetConfig;
}

SidplayfpInstance::~SidplayfpInstance()
{
  mDecodingThread.join();
  delete mAudio; mAudio = nullptr;
  delete mPlaybackQueue; mPlaybackQueue = nullptr;
  delete mFreeQueue; mFreeQueue = nullptr;
  delete[] mBufferStorage; mBufferStorage = nullptr;
}

void SidplayfpInstance::DecodingLoop()
{
  while(!mDestructing)
  {
    bool delay = true;

    do
    {
      std::unique_lock<std::mutex> lock(mPlayerMutex);
      if (!mPlayingTune || mPlayerStatus != PLAYING)
      {
        // Nothing to decode
        break;
      }
      
      AudioQueueEntry *queueEntry = nullptr;
      if (!mFreeQueue->pop(queueEntry))
      {
        // No room to store data.
        break;
      }

      delay = false; // There is work to do.
      
      mEngine.play( queueEntry->mData, 2 * mSampleSize);
/*
      // duplicate channels
      for (int i = mSampleSize - 1; i > 0; i--)
      {
        queueEntry->mData[ 2 * i + 1] = v;
        queueEntry->mData[ 2 * i ] = v;
      }
*/
      mBuffersDecoded++;
      
      mPlaybackQueue->push(queueEntry);
    } while(0);
    
    if (delay)
    {
      std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
  }
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

// Called by browser to initialize the embedded module. 
// argc: Number of arguments supplied in <embed> tag
// argn/argv: key/value pair for every argument.
bool SidplayfpInstance::Init(uint32_t argc, const char *argn[], const char *argv[])
{
  // Retrieve recommended sample frame count
  
  mSampleSize = pp::AudioConfig::RecommendSampleFrameCount(this,PP_AUDIOSAMPLERATE_44100, 8192); // Try to use a large frame count. 8192 samples @ 44100 KHz corresponds to about 185 ms. 

  // Allocate a buffer of 5 sec.
  mNrBuffers = (uint32_t)ceil(5. * 44100. / (double)mSampleSize);
  
  mBufferStorage = new AudioQueueEntry[mNrBuffers]; 
  mFreeQueue = new memory_sequential_consistent::CircularFifo<AudioQueueEntry *>(mNrBuffers);
  mPlaybackQueue = new memory_sequential_consistent::CircularFifo<AudioQueueEntry *>(mNrBuffers);

  for (int i = 0; i < mNrBuffers; ++i) 
  {
    mBufferStorage[i].mData = new int16_t[2*mSampleSize];
    mFreeQueue->push(&mBufferStorage[i]);
  }

  // Create audio resource
  mAudio = new pp::Audio(this, pp::AudioConfig(this, PP_AUDIOSAMPLERATE_44100, mSampleSize),
                         GetAudioDataCallback, this);

  // Start the decoding thread
  mDecodingThread = std::thread(&SidplayfpInstance::DecodingLoop, this);

  // Don't start playing audio until specifically requested. 
  return true;
}

// Callback from browser: Supply data.
void SidplayfpInstance::GetAudioData(int16_t *pSamples, uint32_t buffer_size)
{
  if (buffer_size > mSampleSize)
  {
    // This will generate noise :-/
    buffer_size = mSampleSize;
  }

  AudioQueueEntry *queueEntry = nullptr;
  playerStatus status = mPlayerStatus;

  switch(status)
  {
    case STOPPED:
    case PAUSED:
      break;
    case PLAYING:
      mPlaybackQueue->pop(queueEntry);
      break;
    case FLUSHING_RESUMEPLAY:
    case FLUSHING_STOP:
    {
      AudioQueueEntry *flushEntry = nullptr;
      while (mPlaybackQueue->pop(flushEntry))
      {
	mFreeQueue->push(flushEntry);
      }
      mBuffersPlayed = 0;
      mPlayerStatus = (status == FLUSHING_RESUMEPLAY ? PLAYING : STOPPED);
    }
    break;
  }

  if (queueEntry)
  {
    memcpy(pSamples, queueEntry->mData, 2 * buffer_size * sizeof(int16_t));
    mFreeQueue->push(queueEntry);
    mBuffersPlayed++;
  }
  else
  {
    // No data available (or paused, but player status hasn't been updated). Generate silence
    memset(pSamples, 0, buffer_size * 2 * sizeof(int16_t));
  }
}

pp::Var SidplayfpInstance::HandlePlay(const pp::Var &pData)
{
  std::unique_lock<std::mutex> lock(mPlayerMutex);
  bool status = true;

  int subtuneToLoad = 0; // Default to "default starting song"

  // see if a subtuneID has been supplied.
  if (pData.is_dictionary())
  {
    pp::Var contents = pp::VarDictionary(pData).Get("subtuneId");
    if (contents.is_number())
    {
      subtuneToLoad = contents.AsInt();
    } 
  }
  mCurrentSubtune = mLoadedTune->selectSong(subtuneToLoad);

// Switch to new track
  
  // Lock has been taken, so decoding thread is not active.
  mPlayingTune = mLoadedTune;
  mBuffersDecoded = 0;
  bool wasPlaying = (mPlayerStatus == PLAYING || mPlayerStatus == PAUSED);

  if (mEngine.load(mPlayingTune.get()))
  {
    // Tune has been loaded. (Re)start playback.
    mPlayerStatus = wasPlaying ? FLUSHING_RESUMEPLAY : PLAYING;
    mAudio->StartPlayback();
  }
  else
  {
    mLastError = mEngine.error();
    mPlayerStatus = wasPlaying ? FLUSHING_STOP : STOPPED;
    status = false;
  }

  return pp::Var(status);
}

pp::Var SidplayfpInstance::HandlePauseResume(const pp::Var &)
{
  std::unique_lock<std::mutex> lock(mPlayerMutex);
    
  playerStatus status = mPlayerStatus;

  if (status == PLAYING)
    mPlayerStatus = PAUSED;
  else if (status == PAUSED)
    mPlayerStatus = PLAYING;

  return pp::Var();
}

pp::Var SidplayfpInstance::HandlePlayerInfo(const pp::Var &)
{
  // Retrieve audio status
  pp::VarDictionary audioInfo;
  audioInfo.Set("sampleSize", (int)mSampleSize);
  audioInfo.Set("bufferSize", (int)mNrBuffers);
  audioInfo.Set("bufferUsage", (int)(mBuffersDecoded.load(std::memory_order_seq_cst) - mBuffersPlayed.load(std::memory_order_seq_cst)));

  audioInfo.Set("progress", (double) (mBuffersPlayed) * (double) mSampleSize / 44100.);
  audioInfo.Set("lastError", mLastError);
  audioInfo.Set("subtune", mCurrentSubtune);
  playerStatus status = mPlayerStatus;

  switch (status)
  {
    case STOPPED:
      audioInfo.Set("status", "STOPPED");
      break;
    case PAUSED:
      audioInfo.Set("status", "PAUSED");
      break;
    case PLAYING:
      audioInfo.Set("status", "PLAYING");
      break;
    case FLUSHING_RESUMEPLAY:
      audioInfo.Set("status", "FLUSHING_RESUMEPLAY");
      break;
    case FLUSHING_STOP:
      audioInfo.Set("status","FLUSHING_STOP");
      break;
  }
  return audioInfo;
}

pp::Var SidplayfpInstance::HandleLibInfo(const pp::Var &)
{
  std::unique_lock<std::mutex> lock(mPlayerMutex);

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

pp::Var SidplayfpInstance::HandleGetConfig(const pp::Var &)
{
  std::unique_lock<std::mutex> lock(mPlayerMutex);
  SidConfig currentConfig = mEngine.config();

  pp::VarDictionary returnValue;

  const char *c64model = "unknown";
  switch (currentConfig.defaultC64Model)
  {
    case SidConfig::PAL:
      c64model = "PAL";
      break;
    case SidConfig::NTSC:
      c64model = "NTSC";
      break;
    case SidConfig::OLD_NTSC:
      c64model = "OLD_NTSC";
      break;
    case SidConfig::DREAN:
      c64model = "DREAN";
      break;
  }
  
  returnValue.Set("defaultC64Model", c64model);
  returnValue.Set("forceC64Model", currentConfig.forceC64Model);
  returnValue.Set("defaultSidModel", currentConfig.defaultSidModel == SidConfig::MOS6581 ? "6581" : "8580");
  returnValue.Set("forceSidModel", currentConfig.forceSidModel);

  // Don't propagate playback and frequency settings
  returnValue.Set("sidEmulation", currentConfig.sidEmulation->name());
  returnValue.Set("filterEnabled", mFilterEnabled); 
  returnValue.Set("resampling", currentConfig.samplingMethod == SidConfig::RESAMPLE_INTERPOLATE);

  return returnValue;
}

pp::Var SidplayfpInstance::HandleSetConfig(const pp::Var &pData)
{
  {
    // There's no full exception support in pNaCl :-(

    std::unique_lock<std::mutex> lock(mPlayerMutex);

    SidConfig currentConfig = mEngine.config();
    SidConfig newConfig = currentConfig;
    bool restartPlayback = false;

    if (pData.is_dictionary())
    {
      pp::VarDictionary dict(pData);
      
      pp::Var value = dict.Get("defaultC64Model");
      if (value.is_string())
      {
	std::string modelStr = value.AsString();

	if (modelStr == "PAL")
	{
	  newConfig.defaultC64Model = SidConfig::PAL;	
	} else if (modelStr == "NTSC")
	{
	  newConfig.defaultC64Model = SidConfig::NTSC;	
	} else if (modelStr == "OLD_NTSC")
	{
	  newConfig.defaultC64Model = SidConfig::OLD_NTSC;	
	} else if (modelStr == "DREAN")
	{
	  newConfig.defaultC64Model = SidConfig::DREAN;	
	}
      }

      value = dict.Get("forceC64Model");
      if (value.is_bool())
      {
	newConfig.forceC64Model = value.AsBool();
      }
      
      value = dict.Get("defaultSidModel");
      // Parse as int *and* as string..
      if (value.is_int())
      {
	switch(value.AsInt())
	{
	  case 6581:
	    newConfig.defaultSidModel = SidConfig::MOS6581;
	    break;
	  case 8580:
	    newConfig.defaultSidModel = SidConfig::MOS8580;
	    break;
	}
      }
      if (value.is_string())
      {
	std::string modelStr = value.AsString();
	if (modelStr == "6581")
	  newConfig.defaultSidModel = SidConfig::MOS6581;
	else if (modelStr == "8580")
	  newConfig.defaultSidModel = SidConfig::MOS8580;
      }
      
      value = dict.Get("forceSidModel");
      if (value.is_bool())
      {
	newConfig.forceSidModel = value.AsBool();
      }

      value = dict.Get("sidEmulation");
      if (value.is_string())
      {
	std::string emulationStr = value.AsString();
	if (emulationStr == mReSIDfp_builder.name())
	  newConfig.sidEmulation = &mReSIDfp_builder;
	else if (emulationStr == mReSID_builder.name())
	  newConfig.sidEmulation = &mReSID_builder;
      }

      value = dict.Get("filterEnabled");
      if (value.is_bool())
      {
	bool newEnabled = value.AsBool();
	if (newEnabled != mFilterEnabled)
	{
	  restartPlayback = true;
	  mFilterEnabled = value.AsBool();
	  mReSIDfp_builder.filter(mFilterEnabled);
	  mReSID_builder.filter(mFilterEnabled);
	}
      }

      value = dict.Get("resampling");
      if (value.is_bool())
      {
	newConfig.samplingMethod = (value.AsBool() ? SidConfig::RESAMPLE_INTERPOLATE : SidConfig::INTERPOLATE);
      }
    }

    restartPlayback = restartPlayback || 
		       newConfig.defaultC64Model != currentConfig.defaultC64Model || 
		       newConfig.defaultSidModel != currentConfig.defaultSidModel ||
		       newConfig.forceC64Model != currentConfig.forceC64Model ||
		       newConfig.forceSidModel != currentConfig.forceSidModel ||
		       newConfig.sidEmulation != currentConfig.sidEmulation ||
		       newConfig.samplingMethod != currentConfig.samplingMethod;


    if (restartPlayback)
    {
      bool wasPlaying = mPlayerStatus == PLAYING || mPlayerStatus == PAUSED;
      mEngine.stop();

      if (!mEngine.config(newConfig))
	mLastError = mEngine.error();

      if (mEngine.load(mPlayingTune.get()))
      {
	if (wasPlaying)
	  mPlayerStatus = wasPlaying?  FLUSHING_RESUMEPLAY : PLAYING;
      }
      else
      {
	mPlayerStatus = wasPlaying ? FLUSHING_STOP : STOPPED;
      }
    }
  } while(0);
  return HandleGetConfig(pp::Var());
}

pp::Var SidplayfpInstance::HandleLoad(const pp::Var &pData)
{
  std::unique_lock<std::mutex> lock(mPlayerMutex);

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
    // Select default song
    mLoadedTune->selectSong(0);

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
