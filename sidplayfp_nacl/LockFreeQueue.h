#ifndef __LOCKFREEQUEUE_H__
#define __LOCKFREEQUEUE_H__
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
		std::atomic<uint32_t> mBuffersInUse;
		uint32_t mBufferSize;

		std::atomic<Node *> mDivider, mLast; // shared

	public:
		LockFreeQueue() 
			: mFree(nullptr)
			, mBuffersInUse(0)
			, mBufferSize(0)
		{
			mFirst = mDivider = mLast = new Node; // create dummy separator
		}
		
		uint32_t BuffersInUse() const { return mBuffersInUse; }
		uint32_t BufferSize() const { return mBufferSize; }

		template<typename Func>
		void Init(uint32_t pQueueLength, Func initFunc)
		{
			// Create free list
			for (uint32_t i = 0; i < pQueueLength; ++i)
			{
				Node *tmp = new Node;
				initFunc(&tmp->mValue);
				tmp->mNext = mFree;
				mFree = tmp;
			}
			mBufferSize += pQueueLength;
		}

		~LockFreeQueue()
		{
			mDivider = nullptr;

			// Transfer any remainder of the queue to the free list
			((Node *)mLast)->mNext = mFree;
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

			((Node *)(mLast))->mNext = produceNode; // Add new item to queue
			mLast = ((Node *)(mLast))->mNext; // Publish 

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
				return &(( (Node *)mDivider)->mNext->mValue);
			}

			return nullptr;
		}

		void PublishConsumption()
		{
			if (mDivider != mLast) // Safe; mLast may be updated but never backs up
			{
				// queue nonempty		
				mDivider =  ((Node *)mDivider)->mNext; // Pubish consumption.
			}
		}
};
#endif
