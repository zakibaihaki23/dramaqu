// composables/useWatchHistory.js
export const useWatchHistory = () => {
  const STORAGE_KEY = 'dramaqu_watch_history'

  // Get all watch history
  const getWatchHistory = () => {
    if (import.meta.client) {
      const history = localStorage.getItem(STORAGE_KEY)
      return history ? JSON.parse(history) : []
    }
    return []
  }

  // Save watch progress
  const saveWatchProgress = (dramaId, dramaData, episodeIndex, episodeData, currentTime = 0) => {
    if (!import.meta.client) return

    const history = getWatchHistory()
    
    // Find existing entry
    const existingIndex = history.findIndex(item => item.dramaId === dramaId)
    
    // Get total episodes from dramaData or calculate from episodes if available
    let totalEpisodes = dramaData.totalChapterNum || 0
    
    // If totalChapterNum is 0 or not available, try to get from episodes array if available
    if (!totalEpisodes && dramaData.episodes && Array.isArray(dramaData.episodes)) {
      totalEpisodes = dramaData.episodes.length
    }
    
    const watchEntry = {
      dramaId,
      dramaName: dramaData.bookName || dramaData.title,
      dramaCover: dramaData.bookCover || dramaData.coverWap || dramaData.image || dramaData.poster,
      episodeIndex,
      episodeName: episodeData.chapterName,
      episodeId: episodeData.chapterId,
      currentTime,
      totalEpisodes: totalEpisodes || 1, // Default to 1 if still 0
      lastWatched: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex] = watchEntry
    } else {
      // Add new entry at the beginning
      history.unshift(watchEntry)
    }

    // Keep only last 50 items
    const trimmedHistory = history.slice(0, 50)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory))
  }

  // Get watch progress for a specific drama
  const getWatchProgress = (dramaId) => {
    const history = getWatchHistory()
    return history.find(item => item.dramaId === dramaId)
  }

  // Clear all history
  const clearWatchHistory = () => {
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Remove specific drama from history
  const removeFromHistory = (dramaId) => {
    if (!import.meta.client) return
    
    const history = getWatchHistory()
    const filtered = history.filter(item => item.dramaId !== dramaId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  }

  return {
    getWatchHistory,
    saveWatchProgress,
    getWatchProgress,
    clearWatchHistory,
    removeFromHistory,
  }
}
