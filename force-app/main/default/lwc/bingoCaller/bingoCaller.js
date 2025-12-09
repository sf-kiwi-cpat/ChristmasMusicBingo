import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getActiveGame from '@salesforce/apex/GameController.getActiveGame';
import getPlayedSongsForCaller from '@salesforce/apex/CallerController.getPlayedSongsForCaller';

export default class BingoCaller extends LightningElement {
    @track activeGame;
    @track playedSongs = [];
    @track isLoading = true;
    @track lastCalledSong = null;
    @track isFlashing = false;
    
    wiredPlayedSongs;
    pollInterval;
    isInitialLoad = true;
    
    @wire(getActiveGame)
    wiredGame({ error, data }) {
        if (data) {
            this.activeGame = data;
            this.isLoading = false;
            this.startPolling();
        } else if (error) {
            this.showError('Error loading game', error.body?.message || 'Unknown error');
            this.isLoading = false;
        }
    }
    
    @wire(getPlayedSongsForCaller, { gameId: '$activeGame.Id' })
    wiredPlayedSongsResult(result) {
        this.wiredPlayedSongs = result;
        const { data, error } = result;
        if (data) {
            // Check if this is the first load with data (initial page load)
            const isFirstLoadWithData = this.isInitialLoad && this.playedSongs.length === 0 && data.length > 0;
            
            // Check if we went from 0 songs to having songs (first song added while on page)
            const isFirstSongAdded = !this.isInitialLoad && this.playedSongs.length === 0 && data.length > 0;
            
            // Check if a new song was added by comparing Order__c
            let newSong = null;
            if (this.playedSongs.length > 0 && data.length > this.playedSongs.length) {
                // Find the newest song (highest Order__c)
                const previousMaxOrder = Math.max(...this.playedSongs.map(s => s.Order__c || 0));
                newSong = data.find(s => s.Order__c > previousMaxOrder);
            } else if (isFirstSongAdded) {
                // First song added while on page - get the newest song
                newSong = data[data.length - 1];
            }
            
            // Handle the new song
            if (newSong) {
                // Store the previous last called song before updating
                const previousLastCalled = this.lastCalledSong;
                this.handleNewSongCalled(newSong);
                // Scroll to the song that moved from "Last Called" to the list (if it exists)
                if (previousLastCalled) {
                    setTimeout(() => {
                        this.scrollToSongInList(previousLastCalled.Id);
                    }, 500); // Wait for DOM update and flash animation
                }
            } else if (isFirstLoadWithData) {
                // First load with data - set the last song as last called without flash
                const newestSong = data[data.length - 1];
                this.lastCalledSong = newestSong;
            }
            
            // Check if songs were deleted
            if (data.length === 0) {
                // All songs cleared - clear last called
                this.lastCalledSong = null;
            } else if (this.lastCalledSong) {
                // Check if the last called song still exists in the data
                const lastCalledStillExists = data.some(song => song.Id === this.lastCalledSong.Id);
                if (!lastCalledStillExists) {
                    // Last called song was deleted - clear it or set to the newest song
                    if (data.length > 0) {
                        // Set to the newest song (highest Order__c)
                        const newestSong = data.reduce((prev, current) => 
                            (current.Order__c > prev.Order__c) ? current : prev
                        );
                        this.lastCalledSong = newestSong;
                    } else {
                        this.lastCalledSong = null;
                    }
                }
            }
            
            this.playedSongs = data;
            this.isInitialLoad = false;
        } else if (error) {
            console.error('Error loading played songs:', error);
            this.isInitialLoad = false;
        }
    }
    
    connectedCallback() {
        // Polling will start when activeGame is loaded
    }
    
    disconnectedCallback() {
        this.stopPolling();
    }
    
    startPolling() {
        // Poll every 2 seconds for new played songs
        this.pollInterval = setInterval(() => {
            if (this.activeGame?.Id) {
                refreshApex(this.wiredPlayedSongs);
            }
        }, 2000);
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    handleNewSongCalled(newSong) {
        // Set as last called first
        this.lastCalledSong = newSong;
        this.isFlashing = false; // Reset first
        
        // Use requestAnimationFrame to ensure DOM is updated before triggering animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.isFlashing = true;
                
                // Remove flash class after animation completes
                setTimeout(() => {
                    this.isFlashing = false;
                }, 2000);
            });
        });
    }
    
    get playedSongsList() {
        // Return all played songs except the last called one (if it exists)
        if (!this.lastCalledSong) {
            return this.playedSongs;
        }
        return this.playedSongs.filter(song => song.Id !== this.lastCalledSong.Id);
    }
    
    get lastCalledClass() {
        let classes = 'last-called-section';
        if (this.isFlashing) {
            classes += ' flash';
        }
        return classes;
    }
    
    scrollToSongInList(songId) {
        // Scroll to a specific song in the played songs list
        const songItem = this.template.querySelector(`[data-played-song-id="${songId}"]`);
        if (songItem) {
            // Scroll the played songs panel to show the song
            const playedSongsPanel = this.template.querySelector('.played-songs-panel');
            if (playedSongsPanel) {
                // Calculate the position to scroll to
                const panelRect = playedSongsPanel.getBoundingClientRect();
                const itemRect = songItem.getBoundingClientRect();
                const scrollTop = playedSongsPanel.scrollTop;
                const itemTop = itemRect.top - panelRect.top + scrollTop;
                
                // Scroll to center the item in the panel
                playedSongsPanel.scrollTo({
                    top: itemTop - (playedSongsPanel.clientHeight / 2) + (itemRect.height / 2),
                    behavior: 'smooth'
                });
                
                // Add a brief highlight effect
                songItem.style.transition = 'box-shadow 0.3s ease';
                songItem.style.boxShadow = '0 0 20px rgba(200, 16, 46, 0.6)';
                setTimeout(() => {
                    songItem.style.boxShadow = '';
                }, 1500);
            }
        }
    }
    
    scrollToNewSong(songId) {
        // Find the song item in the played songs list (for when it moves from Last Called to the list)
        const songItem = this.template.querySelector(`[data-played-song-id="${songId}"]`);
        if (songItem) {
            // Scroll the played songs panel to show the new song
            const playedSongsPanel = this.template.querySelector('.played-songs-panel');
            if (playedSongsPanel) {
                // Calculate the position to scroll to
                const panelRect = playedSongsPanel.getBoundingClientRect();
                const itemRect = songItem.getBoundingClientRect();
                const scrollTop = playedSongsPanel.scrollTop;
                const itemTop = itemRect.top - panelRect.top + scrollTop;
                
                // Scroll to center the item in the panel
                playedSongsPanel.scrollTo({
                    top: itemTop - (playedSongsPanel.clientHeight / 2) + (itemRect.height / 2),
                    behavior: 'smooth'
                });
                
                // Add a brief highlight effect
                songItem.style.transition = 'box-shadow 0.3s ease';
                songItem.style.boxShadow = '0 0 20px rgba(200, 16, 46, 0.6)';
                setTimeout(() => {
                    songItem.style.boxShadow = '';
                }, 1500);
            }
        }
    }
    
    showSuccess(title, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: 'success'
            })
        );
    }
    
    
    showError(title, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: 'error'
            })
        );
    }
}

