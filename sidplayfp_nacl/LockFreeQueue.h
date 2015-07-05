// Based on Herb Sutter's article on Dr Dobbs: 
// "Writing Lock-free code: A corrected queue"
//
// http://www.drdobbs.com/parallel/writing-lock-free-code-a-corrected-queue/210604448?

#include <atomic>

template <typename T>
class LockFreeQueue
{
	private:
		struct Node 
		{
			Node() 
			: mNext(nullptr)
			{
			}

			Node(const T &val)
			: mValue(val)
			, mNext(nullptr)
			{
			}
			
			T mValue;
			Node *mNext;
	  };
	
  	Node *mFirst; // Producer only
		Node *mFree; // Producer only

		uint32_t mBuffersInUse;
		uint32_t mBufferSize;

		std::atomic<Node *> mDivider, mLast; // shared

	public:
		LockFreeQueue( uint32_t pQueueLength) 
			: mFree(nullptr)
			, mBuffersInUse(0)
			, mBufferSize(pQueueLength)
		{
			mFirst = mDivider = mLast = new Node; // create dummy separator
			
			// Create free list
			for (uint32_t i = 0; i < pQueueLength; ++i)
			{
				Node *tmp = new Node;
				tmp->mNext = mFree;
				mFree = tmp;
			}
		}

		~LockFreeQueue()
		{
			mDivider = nullptr;

			// Transfer any remainder of the queue to the free list
			mLast->mNext = mFree;
			mFree = mFirst;
			mFirst = nullptr;

			while (mFree != nullptr) // Release the list
			{
				Node *tmp = mFree;
				mFirst = tmp->mNext;
				delete tmp;
			}
		}

		// Producer context only

		T* GetProduceBuffer()  // returns nullptr if not available. Does NOT transfer ownership
		{
			if (mFree)
				return &mFree->mValue;
			return nullptr;
		}
		
		void PublishProduction()
		{
		  Node *produceNode = mFree;
			if (!produceNode) 
				return;
			
			// Andvance free queue
			mFree = mFree->mNext;
			mBuffersInUse++;

			mLast->mNext = produceNode; // Add new item to queue
			mLast = mLast->mNext; // Publish 

			// Trim items that have been consumed
			while (mFirst != mDivider) // Safe, mDivider is only moved forward by consumer, 
																 // and never modified by the producer
			{
				Node *tmp = mFirst;
				mFirst = mFirst->mNext;
			
				mBuffersInUse--;
				// Transfer to free queue
				tmp->mNext = mFree;
				mFree = tmp;
			}
		}
		
		// Consumer context only

		T* GetConsumptionBuffer()
		{
			if (mDivider != mLast) // Safe; mLast may be updated but never backs up
			{
				return mDivider->mNext->mValue;
			}

			return nullptr;
		}

		void PublishConsumption()
		{
			if (mDivider != mLast) // Safe; mLast may be updated but never backs up
			{
				// queue nonempty		
				mDivider = mDivider->mNext; // Pubish consumption.
			}
		}
};

