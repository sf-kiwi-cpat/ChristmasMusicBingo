import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getActiveGame from '@salesforce/apex/GameController.getActiveGame';
import getAvailableSongs from '@salesforce/apex/CallerController.getAvailableSongs';
import getPlayedSongsForCaller from '@salesforce/apex/CallerController.getPlayedSongsForCaller';
import markSongAsPlayed from '@salesforce/apex/CallerController.markSongAsPlayed';
import removePlayedSong from '@salesforce/apex/CallerController.removePlayedSong';
import clearAllPlayedSongs from '@salesforce/apex/CallerController.clearAllPlayedSongs';

export default class SongSelector extends LightningElement {
    @track activeGame;
    @track availableSongs = [];
    @track playedSongs = [];
    @track isLoading = true;
    @track searchTerm = '';
    
    wiredAvailableSongs;
    wiredPlayedSongs;
    
    @wire(getActiveGame)
    wiredGame({ error, data }) {
        if (data) {
            this.activeGame = data;
            this.isLoading = false;
        } else if (error) {
            this.showError('Error loading game', error.body?.message || 'Unknown error');
            this.isLoading = false;
        }
    }
    
    @wire(getAvailableSongs, { gameId: '$activeGame.Id' })
    wiredAvailableSongsResult(result) {
        this.wiredAvailableSongs = result;
        const { data, error } = result;
        if (data) {
            this.availableSongs = data.map(song => ({
                ...song,
                cssClass: 'song-card'
            }));
        } else if (error) {
            console.error('Error loading available songs:', error);
        }
    }
    
    @wire(getPlayedSongsForCaller, { gameId: '$activeGame.Id' })
    wiredPlayedSongsResult(result) {
        this.wiredPlayedSongs = result;
        const { data, error } = result;
        if (data) {
            this.playedSongs = data;
        } else if (error) {
            console.error('Error loading played songs:', error);
        }
    }
    
    handleSongSelect(event) {
        const songId = event.currentTarget.dataset.songid;
        
        if (!this.activeGame?.Id) {
            this.showError('No Active Game', 'No active game found.');
            return;
        }
        
        const song = this.availableSongs.find(s => s.Id === songId);
        if (!song) return;
        
        // Mark as played
        markSongAsPlayed({ 
            gameId: this.activeGame.Id, 
            songId: songId 
        })
            .then(() => {
                // Remove from available songs
                this.availableSongs = this.availableSongs.filter(s => s.Id !== songId);
                
                // Clear search
                this.searchTerm = '';
                
                // Show success message
                this.showSuccess('Song Added', `${song.Artist__c} - ${song.Name} has been marked as played.`);
                
                // Refresh both available and played songs in background
                Promise.all([
                    refreshApex(this.wiredAvailableSongs),
                    refreshApex(this.wiredPlayedSongs)
                ]).catch(error => {
                    console.error('Background refresh error:', error);
                });
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Unknown error');
                // Refresh to get correct state
                refreshApex(this.wiredAvailableSongs);
            });
    }
    
    get filteredSongs() {
        let songs = this.availableSongs;
        
        if (this.searchTerm && this.searchTerm.trim() !== '') {
            const searchLower = this.searchTerm.toLowerCase().trim();
            songs = songs.filter(song => {
                const artist = (song.Artist__c || '').toLowerCase();
                const name = (song.Name || '').toLowerCase();
                return artist.includes(searchLower) || name.includes(searchLower);
            });
        }
        
        return songs.map(song => ({
            ...song,
            cssClass: 'song-card'
        }));
    }
    
    handleSearchInput(event) {
        this.searchTerm = event.target.value;
    }
    
    get hasAvailableSongs() {
        return this.availableSongs && this.availableSongs.length > 0;
    }
    
    handleRemoveSong(event) {
        event.stopPropagation();
        const playedSongId = event.currentTarget.dataset.playedsongid;
        
        if (!playedSongId) return;
        
        // Optimistically remove from UI
        const playedSong = this.playedSongs.find(p => p.Id === playedSongId);
        if (!playedSong) return;
        
        removePlayedSong({ playedSongId: playedSongId })
            .then(() => {
                // Remove from played songs
                this.playedSongs = this.playedSongs.filter(p => p.Id !== playedSongId);
                
                // Add back to available songs
                const songData = {
                    Id: playedSong.Game_Song__r.Id,
                    Name: playedSong.Game_Song__r.Name,
                    Artist__c: playedSong.Game_Song__r.Artist__c,
                    Spotify_URL__c: playedSong.Game_Song__r.Spotify_URL__c,
                    cssClass: 'song-card'
                };
                this.availableSongs = [...this.availableSongs, songData].sort((a, b) => {
                    return (a.Name || '').localeCompare(b.Name || '');
                });
                
                // Refresh in background
                Promise.all([
                    refreshApex(this.wiredAvailableSongs),
                    refreshApex(this.wiredPlayedSongs)
                ]).catch(error => {
                    console.error('Background refresh error:', error);
                });
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Failed to remove song');
                // Refresh to get correct state
                Promise.all([
                    refreshApex(this.wiredAvailableSongs),
                    refreshApex(this.wiredPlayedSongs)
                ]);
            });
    }
    
    handleClearAll() {
        if (!this.activeGame?.Id) {
            this.showError('No Active Game', 'No active game found.');
            return;
        }
        
        if (!confirm('Are you sure you want to clear all played songs?')) {
            return;
        }
        
        clearAllPlayedSongs({ gameId: this.activeGame.Id })
            .then(() => {
                // Optimistically clear the list
                this.playedSongs = [];
                
                // Refresh both to get all songs back
                Promise.all([
                    refreshApex(this.wiredAvailableSongs),
                    refreshApex(this.wiredPlayedSongs)
                ]);
                
                this.showSuccess('Cleared', 'All played songs have been cleared.');
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Failed to clear songs');
                // Refresh to get correct state
                Promise.all([
                    refreshApex(this.wiredAvailableSongs),
                    refreshApex(this.wiredPlayedSongs)
                ]);
            });
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

