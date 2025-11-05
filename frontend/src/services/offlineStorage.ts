export interface StorageItem {
  timestamp: number;
  data: any;
  expiresAt?: number;
}

export interface OfflineFlashcard {
  id: string;
  filename: string;
  category: string;
  uploader: string;
  createdAt: string;
  parsedData: {
    total_questions: number;
    questions_with_answers: number;
    questions_without_answers: number;
    missing_numbers: number[];
    questions: Array<{
      number: number;
      question: string;
      choices: string[];
      correct_answer: string;
    }>;
  };
}

const STORAGE_PREFIX = 'prepwise_offline_';
const FLASHCARD_KEY = 'flashcards_list';
const FLASHCARD_DATA_KEY = 'flashcard_data_';
const SYNC_QUEUE_KEY = 'sync_queue';

class OfflineStorage {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkLocalStorageAvailable();
  }

  private checkLocalStorageAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('[Offline Storage] localStorage not available:', e);
      return false;
    }
  }

  private getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  setFlashcardsList(flashcards: any[]): boolean {
    if (!this.isAvailable) return false;
    
    try {
      const item: StorageItem = {
        timestamp: Date.now(),
        data: flashcards
      };
      localStorage.setItem(this.getKey(FLASHCARD_KEY), JSON.stringify(item));
      return true;
    } catch (e) {
      console.error('[Offline Storage] Error saving flashcards list:', e);
      return false;
    }
  }

  getFlashcardsList(): any[] | null {
    if (!this.isAvailable) return null;
    
    try {
      const stored = localStorage.getItem(this.getKey(FLASHCARD_KEY));
      if (!stored) return null;
      
      const item: StorageItem = JSON.parse(stored);
      return item.data;
    } catch (e) {
      console.error('[Offline Storage] Error retrieving flashcards list:', e);
      return null;
    }
  }

  setFlashcardData(flashcardId: string, data: OfflineFlashcard): boolean {
    if (!this.isAvailable) return false;
    
    try {
      const item: StorageItem = {
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem(this.getKey(`${FLASHCARD_DATA_KEY}${flashcardId}`), JSON.stringify(item));
      return true;
    } catch (e) {
      console.error('[Offline Storage] Error saving flashcard data:', e);
      return false;
    }
  }

  getFlashcardData(flashcardId: string): OfflineFlashcard | null {
    if (!this.isAvailable) return null;
    
    try {
      const stored = localStorage.getItem(this.getKey(`${FLASHCARD_DATA_KEY}${flashcardId}`));
      if (!stored) return null;
      
      const item: StorageItem = JSON.parse(stored);
      return item.data;
    } catch (e) {
      console.error('[Offline Storage] Error retrieving flashcard data:', e);
      return null;
    }
  }

  deleteFlashcardData(flashcardId: string): boolean {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.removeItem(this.getKey(`${FLASHCARD_DATA_KEY}${flashcardId}`));
      return true;
    } catch (e) {
      console.error('[Offline Storage] Error deleting flashcard data:', e);
      return false;
    }
  }

  clearFlashcardCache(): boolean {
    if (!this.isAvailable) return false;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(STORAGE_PREFIX) && key.includes(FLASHCARD_DATA_KEY)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(this.getKey(FLASHCARD_KEY));
      return true;
    } catch (e) {
      console.error('[Offline Storage] Error clearing flashcard cache:', e);
      return false;
    }
  }

  getStorageSize(): { used: number; total: number; percentage: number } {
    let used = 0;
    
    if (this.isAvailable) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes(STORAGE_PREFIX)) {
            used += key.length + localStorage.getItem(key)!.length;
          }
        });
      } catch (e) {
        console.error('[Offline Storage] Error calculating storage size:', e);
      }
    }

    const total = 5 * 1024 * 1024;
    const percentage = (used / total) * 100;
    return { used, total, percentage };
  }

  queueForSync(action: string, data: any): boolean {
    if (!this.isAvailable) return false;
    
    try {
      const queue = this.getSyncQueue();
      queue.push({
        id: Date.now().toString(),
        action,
        data,
        timestamp: Date.now()
      });
      localStorage.setItem(this.getKey(SYNC_QUEUE_KEY), JSON.stringify(queue));
      return true;
    } catch (e) {
      console.error('[Offline Storage] Error queueing sync:', e);
      return false;
    }
  }

  getSyncQueue(): Array<{ id: string; action: string; data: any; timestamp: number }> {
    if (!this.isAvailable) return [];
    
    try {
      const stored = localStorage.getItem(this.getKey(SYNC_QUEUE_KEY));
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (e) {
      console.error('[Offline Storage] Error retrieving sync queue:', e);
      return [];
    }
  }

  clearSyncQueue(): boolean {
    if (!this.isAvailable) return false;
    
    try {
      localStorage.removeItem(this.getKey(SYNC_QUEUE_KEY));
      return true;
    } catch (e) {
      console.error('[Offline Storage] Error clearing sync queue:', e);
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorage();
