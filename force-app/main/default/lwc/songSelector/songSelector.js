import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getActiveGame from '@salesforce/apex/GameController.getActiveGame';
import getAvailableSongs from '@salesforce/apex/CallerController.getAvailableSongs';
import getPlayedSongsForCaller from '@salesforce/apex/CallerController.getPlayedSongsForCaller';
import markSongAsPlayed from '@salesforce/apex/CallerController.markSongAsPlayed';
import removePlayedSong from '@salesforce/apex/CallerController.removePlayedSong';
import clearAllPlayedSongs from '@salesforce/apex/CallerController.clearAllPlayedSongs';
// Admin imports
import getAllSongs from '@salesforce/apex/AdminController.getAllSongs';
import getAllSongLists from '@salesforce/apex/AdminController.getAllSongLists';
import getAllGames from '@salesforce/apex/AdminController.getAllGames';
import getListSongs from '@salesforce/apex/AdminController.getListSongs';
import getListSongsImperative from '@salesforce/apex/AdminController.getListSongs';
import getSongsNotInList from '@salesforce/apex/AdminController.getSongsNotInList';
import createSong from '@salesforce/apex/AdminController.createSong';
import updateSong from '@salesforce/apex/AdminController.updateSong';
import deleteSong from '@salesforce/apex/AdminController.deleteSong';
import createSongList from '@salesforce/apex/AdminController.createSongList';
import updateSongList from '@salesforce/apex/AdminController.updateSongList';
import deleteSongList from '@salesforce/apex/AdminController.deleteSongList';
import addSongToList from '@salesforce/apex/AdminController.addSongToList';
import removeSongFromList from '@salesforce/apex/AdminController.removeSongFromList';
import createGame from '@salesforce/apex/AdminController.createGame';
import updateGame from '@salesforce/apex/AdminController.updateGame';
import setActiveGame from '@salesforce/apex/AdminController.setActiveGame';
import deleteGame from '@salesforce/apex/AdminController.deleteGame';

export default class SongSelector extends LightningElement {
    @track activeGame;
    @track availableSongs = [];
    @track playedSongs = [];
    @track isLoading = true;
    @track searchTerm = '';
    
    // Admin mode
    @track adminMode = false;
    @track adminTab = 'songs'; // 'songs', 'lists', 'games'
    
    // Admin data
    @track allSongs = [];
    @track allLists = [];
    @track allGames = [];
    @track selectedList = null;
    @track selectedGame = null;
    @track editingSong = null;
    @track editingList = null;
    @track editingGame = null;
    @track listSongs = [];
    @track availableSongsForList = [];
    
    // Search and filtering
    @track adminSongSearchTerm = '';
    
    // List management - working copies
    @track workingListSongs = []; // Songs currently in the list (working copy)
    @track workingAvailableSongs = []; // Songs not in the list (working copy)
    @track hasUnsavedChanges = false;
    
    // Form data
    @track newSongName = '';
    @track newSongArtist = '';
    @track newListName = '';
    @track newGameDescription = '';
    @track newGameListId = '';
    @track newGameActive = false;
    
    // Form visibility flags
    @track showSongForm = false;
    @track showListForm = false;
    @track showGameForm = false;
    
    wiredAvailableSongs;
    wiredPlayedSongs;
    wiredAllSongs;
    wiredAllLists;
    wiredAllGames;
    wiredListSongs;
    wiredAvailableSongsForList;
    
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
    
    // ========== ADMIN MODE TOGGLE ==========
    
    handleToggleAdminMode() {
        this.adminMode = !this.adminMode;
        if (this.adminMode) {
            // Refresh admin data when entering admin mode
            refreshApex(this.wiredAllSongs);
            refreshApex(this.wiredAllLists);
            refreshApex(this.wiredAllGames);
        }
    }
    
    handleAdminTabChange(event) {
        this.adminTab = event.currentTarget.dataset.tab;
        // Clear selections and forms when switching tabs
        this.selectedList = null;
        this.selectedGame = null;
        this.editingSong = null;
        this.editingList = null;
        this.editingGame = null;
        this.showSongForm = false;
        this.showListForm = false;
        this.showGameForm = false;
    }
    
    // ========== ADMIN WIRE METHODS ==========
    
    @wire(getAllSongs)
    wiredAllSongsResult(result) {
        this.wiredAllSongs = result;
        const { data, error } = result;
        if (data) {
            this.allSongs = data;
        } else if (error) {
            console.error('Error loading all songs:', error);
        }
    }
    
    get filteredAdminSongs() {
        if (!this.adminSongSearchTerm || this.adminSongSearchTerm.trim() === '') {
            return this.allSongs;
        }
        const searchLower = this.adminSongSearchTerm.toLowerCase().trim();
        return this.allSongs.filter(song => {
            const name = (song.Name || '').toLowerCase();
            const artist = (song.Artist__c || '').toLowerCase();
            return name.includes(searchLower) || artist.includes(searchLower);
        });
    }
    
    handleAdminSongSearchInput(event) {
        this.adminSongSearchTerm = event.target.value;
    }
    
    @wire(getAllSongLists)
    wiredAllListsResult(result) {
        this.wiredAllLists = result;
        const { data, error } = result;
        if (data) {
            this.allLists = data.map(list => ({
                ...list,
                cssClass: this.selectedList === list.Id ? 'admin-list-item selected' : 'admin-list-item',
                isSelected: list.Id === this.newGameListId
            }));
        } else if (error) {
            console.error('Error loading all lists:', error);
        }
    }
    
    @wire(getAllGames)
    wiredAllGamesResult(result) {
        this.wiredAllGames = result;
        const { data, error } = result;
        if (data) {
            this.allGames = data;
        } else if (error) {
            console.error('Error loading all games:', error);
        }
    }
    
    @wire(getListSongs, { listId: '$selectedList' })
    wiredListSongsResult(result) {
        this.wiredListSongs = result;
        const { data, error } = result;
        if (data && this.selectedList) {
            this.listSongs = data;
            // Initialize working copies when list is selected
            this.workingListSongs = data.map(item => ({
                ...item,
                songId: item.Game_Song__c,
                songName: item.Game_Song__r.Name,
                songArtist: item.Game_Song__r.Artist__c
            }));
            this.hasUnsavedChanges = false;
        } else if (error) {
            console.error('Error loading list songs:', error);
        }
    }
    
    @wire(getSongsNotInList, { listId: '$selectedList' })
    wiredAvailableSongsForListResult(result) {
        this.wiredAvailableSongsForList = result;
        const { data, error } = result;
        if (data && this.selectedList) {
            this.availableSongsForList = data;
            // Initialize working copies when list is selected
            this.workingAvailableSongs = data.map(song => ({
                ...song,
                songId: song.Id
            }));
        } else if (error) {
            console.error('Error loading available songs for list:', error);
        }
    }
    
    // ========== SONG MANAGEMENT ==========
    
    handleEditSong(event) {
        const songId = event.currentTarget.dataset.songid;
        const song = this.allSongs.find(s => s.Id === songId);
        if (song) {
            this.editingSong = { ...song };
            this.newSongName = song.Name;
            this.newSongArtist = song.Artist__c || '';
            this.showSongForm = true;
        }
    }
    
    handleCancelEditSong() {
        this.editingSong = null;
        this.newSongName = '';
        this.newSongArtist = '';
        this.showSongForm = false;
    }
    
    handleSaveSong() {
        if (!this.newSongName || this.newSongName.trim() === '') {
            this.showError('Validation Error', 'Song name is required.');
            return;
        }
        
        if (this.editingSong) {
            // Update existing song
            updateSong({
                songId: this.editingSong.Id,
                name: this.newSongName.trim(),
                artist: this.newSongArtist.trim()
            })
                .then(() => {
                    this.showSuccess('Song Updated', 'Song has been updated successfully.');
                    this.handleCancelEditSong();
                    refreshApex(this.wiredAllSongs);
                    // Refresh caller songs if active game uses this song
                    if (this.activeGame?.Id) {
                        refreshApex(this.wiredAvailableSongs);
                    }
                })
                .catch(error => {
                    this.showError('Error', error.body?.message || 'Failed to update song');
                });
        } else {
            // Create new song
            createSong({
                name: this.newSongName.trim(),
                artist: this.newSongArtist.trim()
            })
                .then(() => {
                    this.showSuccess('Song Created', 'New song has been created successfully.');
                    this.handleCancelEditSong();
                    refreshApex(this.wiredAllSongs);
                })
                .catch(error => {
                    this.showError('Error', error.body?.message || 'Failed to create song');
                });
        }
    }
    
    handleDeleteSong(event) {
        event.stopPropagation();
        const songId = event.currentTarget.dataset.songid;
        const song = this.allSongs.find(s => s.Id === songId);
        
        if (!confirm(`Are you sure you want to delete "${song?.Name}"? This action cannot be undone.`)) {
            return;
        }
        
        deleteSong({ songId: songId })
            .then(() => {
                this.showSuccess('Song Deleted', 'Song has been deleted successfully.');
                refreshApex(this.wiredAllSongs);
                // Refresh list songs if this song was in a selected list
                if (this.selectedList) {
                    refreshApex(this.wiredListSongs);
                    refreshApex(this.wiredAvailableSongsForList);
                }
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Failed to delete song');
            });
    }
    
    handleNewSong() {
        this.editingSong = null;
        this.newSongName = '';
        this.newSongArtist = '';
        this.showSongForm = true;
    }
    
    handleSongNameChange(event) {
        this.newSongName = event.target.value;
    }
    
    handleSongArtistChange(event) {
        this.newSongArtist = event.target.value;
    }
    
    handleListNameChange(event) {
        this.newListName = event.target.value;
    }
    
    handleGameDescriptionChange(event) {
        this.newGameDescription = event.target.value;
    }
    
    handleGameListChange(event) {
        this.newGameListId = event.target.selectedOptions[0].value;
        // Update selected state for options
        this.allLists = this.allLists.map(list => ({
            ...list,
            isSelected: list.Id === this.newGameListId
        }));
    }
    
    handleGameActiveChange(event) {
        this.newGameActive = event.target.checked;
    }
    
    // ========== LIST MANAGEMENT ==========
    
    handleSelectList(event) {
        const listId = event.currentTarget.dataset.listid;
        
        // Warn if there are unsaved changes
        if (this.hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to switch lists? Changes will be lost.')) {
                return;
            }
        }
        
        this.selectedList = listId;
        this.editingList = null;
        this.hasUnsavedChanges = false;
        // Update CSS classes for lists
        this.allLists = this.allLists.map(list => ({
            ...list,
            cssClass: listId === list.Id ? 'admin-list-item selected' : 'admin-list-item'
        }));
        refreshApex(this.wiredListSongs);
        refreshApex(this.wiredAvailableSongsForList);
    }
    
    handleEditList(event) {
        event.stopPropagation();
        const listId = event.currentTarget.dataset.listid;
        const list = this.allLists.find(l => l.Id === listId);
        if (list) {
            this.editingList = { ...list };
            this.newListName = list.Name;
            this.showListForm = true;
        }
    }
    
    handleCancelEditList() {
        this.editingList = null;
        this.newListName = '';
        this.showListForm = false;
    }
    
    handleSaveList() {
        if (!this.newListName || this.newListName.trim() === '') {
            this.showError('Validation Error', 'List name is required.');
            return;
        }
        
        if (this.editingList) {
            // Update existing list
            updateSongList({
                listId: this.editingList.Id,
                name: this.newListName.trim()
            })
                .then(() => {
                    this.showSuccess('List Updated', 'List has been updated successfully.');
                    this.handleCancelEditList();
                    refreshApex(this.wiredAllLists);
                })
                .catch(error => {
                    this.showError('Error', error.body?.message || 'Failed to update list');
                });
        } else {
            // Create new list
            createSongList({ name: this.newListName.trim() })
                .then((newList) => {
                    this.showSuccess('List Created', 'New list has been created successfully.');
                    this.handleCancelEditList();
                    refreshApex(this.wiredAllLists);
                    // Select the new list
                    this.selectedList = newList.Id;
                    refreshApex(this.wiredListSongs);
                    refreshApex(this.wiredAvailableSongsForList);
                })
                .catch(error => {
                    this.showError('Error', error.body?.message || 'Failed to create list');
                });
        }
    }
    
    handleDeleteList(event) {
        event.stopPropagation();
        const listId = event.currentTarget.dataset.listid;
        const list = this.allLists.find(l => l.Id === listId);
        
        if (!confirm(`Are you sure you want to delete "${list?.Name}"? This will also delete all songs in the list. This action cannot be undone.`)) {
            return;
        }
        
        deleteSongList({ listId: listId })
            .then(() => {
                this.showSuccess('List Deleted', 'List has been deleted successfully.');
                this.selectedList = null;
                refreshApex(this.wiredAllLists);
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Failed to delete list');
            });
    }
    
    handleCloneList(event) {
        event.stopPropagation();
        const listId = event.currentTarget.dataset.listid;
        const list = this.allLists.find(l => l.Id === listId);
        
        if (!list) return;
        
        // Prompt for new list name
        const newName = prompt(`Enter a name for the cloned list:`, `${list.Name} (Copy)`);
        
        if (!newName || newName.trim() === '') {
            return; // User cancelled or entered empty name
        }
        
        // Show loading
        this.isLoading = true;
        
        // Create new list
        createSongList({ name: newName.trim() })
            .then((newList) => {
                // Get all songs from the original list (using imperative call)
                return getListSongsImperative({ listId: listId })
                    .then((songs) => {
                        if (!songs || songs.length === 0) {
                            // List is empty
                            this.showSuccess('List Cloned', `"${newName}" has been created (empty list).`);
                            this.isLoading = false;
                            refreshApex(this.wiredAllLists);
                            this.selectedList = newList.Id;
                            // Update CSS classes for lists
                            this.allLists = this.allLists.map(l => ({
                                ...l,
                                cssClass: this.selectedList === l.Id ? 'admin-list-item selected' : 'admin-list-item'
                            }));
                            refreshApex(this.wiredListSongs);
                            refreshApex(this.wiredAvailableSongsForList);
                            return;
                        }
                        
                        // Add all songs to the new list
                        const addPromises = songs.map((item, index) => 
                            addSongToList({
                                listId: newList.Id,
                                songId: item.Game_Song__c,
                                order: index + 1
                            })
                        );
                        
                        return Promise.all(addPromises)
                            .then(() => {
                                this.showSuccess('List Cloned', `"${newName}" has been created with ${songs.length} songs.`);
                                this.isLoading = false;
                                refreshApex(this.wiredAllLists);
                                // Select the new list
                                this.selectedList = newList.Id;
                                // Update CSS classes for lists
                                this.allLists = this.allLists.map(l => ({
                                    ...l,
                                    cssClass: this.selectedList === l.Id ? 'admin-list-item selected' : 'admin-list-item'
                                }));
                                refreshApex(this.wiredListSongs);
                                refreshApex(this.wiredAvailableSongsForList);
                            });
                    });
            })
            .catch(error => {
                this.isLoading = false;
                this.showError('Error', error.body?.message || 'Failed to clone list');
            });
    }
    
    handleNewList() {
        this.editingList = null;
        this.newListName = '';
        this.selectedList = null;
        this.showListForm = true;
    }
    
    handleMoveSongToIncluded(event) {
        event.stopPropagation();
        const songId = event.currentTarget.dataset.songid;
        
        // Find the song in available list
        const songIndex = this.workingAvailableSongs.findIndex(s => s.songId === songId);
        if (songIndex === -1) return;
        
        const song = this.workingAvailableSongs[songIndex];
        
        // Move to included list
        this.workingListSongs = [...this.workingListSongs, {
            songId: song.Id,
            songName: song.Name,
            songArtist: song.Artist__c,
            isNew: true // Mark as new for saving
        }];
        
        // Remove from available list
        this.workingAvailableSongs = this.workingAvailableSongs.filter(s => s.songId !== songId);
        
        this.hasUnsavedChanges = true;
    }
    
    handleMoveSongToAvailable(event) {
        event.stopPropagation();
        const songId = event.currentTarget.dataset.songid;
        
        // Find the song in included list
        const songIndex = this.workingListSongs.findIndex(s => s.songId === songId);
        if (songIndex === -1) return;
        
        const song = this.workingListSongs[songIndex];
        
        // Move to available list
        this.workingAvailableSongs = [...this.workingAvailableSongs, {
            Id: song.songId,
            Name: song.songName,
            Artist__c: song.songArtist,
            songId: song.songId
        }];
        
        // Remove from included list
        this.workingListSongs = this.workingListSongs.filter(s => s.songId !== songId);
        
        this.hasUnsavedChanges = true;
    }
    
    handleSaveListChanges() {
        if (!this.selectedList) {
            this.showError('No List Selected', 'Please select a list first.');
            return;
        }
        
        // Get current list item IDs to delete
        const currentListItemIds = this.listSongs.map(item => item.Id);
        const workingSongIds = new Set(this.workingListSongs.map(s => s.songId));
        const currentSongIds = new Set(this.listSongs.map(item => item.Game_Song__c));
        
        // Find items to delete (in current but not in working)
        const itemsToDelete = this.listSongs
            .filter(item => !workingSongIds.has(item.Game_Song__c))
            .map(item => item.Id);
        
        // Find songs to add (in working but not in current)
        const songsToAdd = this.workingListSongs
            .filter(s => !currentSongIds.has(s.songId))
            .map(s => s.songId);
        
        // Perform deletions
        const deletePromises = itemsToDelete.map(itemId => 
            removeSongFromList({ listItemId: itemId })
        );
        
        // Perform additions
        const addPromises = songsToAdd.map(songId => 
            addSongToList({
                listId: this.selectedList,
                songId: songId,
                order: null
            })
        );
        
        Promise.all([...deletePromises, ...addPromises])
            .then(() => {
                this.showSuccess('List Updated', 'Songs have been saved successfully.');
                this.hasUnsavedChanges = false;
                refreshApex(this.wiredListSongs);
                refreshApex(this.wiredAvailableSongsForList);
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Failed to save list changes');
            });
    }
    
    handleCancelListChanges() {
        if (this.hasUnsavedChanges) {
            if (!confirm('Discard all unsaved changes?')) {
                return;
            }
        }
        // Reload from server
        refreshApex(this.wiredListSongs);
        refreshApex(this.wiredAvailableSongsForList);
        this.hasUnsavedChanges = false;
    }
    
    get listSongCount() {
        return this.workingListSongs.length;
    }
    
    get isListSongCountValid() {
        return this.listSongCount >= 24;
    }
    
    get isListSongCountInvalid() {
        return !this.isListSongCountValid;
    }
    
    get hasNoUnsavedChanges() {
        return !this.hasUnsavedChanges;
    }
    
    get counterValueClass() {
        return this.isListSongCountInvalid ? 'counter-value invalid' : 'counter-value';
    }
    
    // ========== GAME MANAGEMENT ==========
    
    handleSelectGame(event) {
        const gameId = event.currentTarget.dataset.gameid;
        this.selectedGame = gameId;
        this.editingGame = null;
    }
    
    handleEditGame(event) {
        event.stopPropagation();
        const gameId = event.currentTarget.dataset.gameid;
        const game = this.allGames.find(g => g.Id === gameId);
        if (game) {
            this.editingGame = { ...game };
            this.newGameDescription = game.Event_Description__c || '';
            this.newGameListId = game.Game_Song_List__c || '';
            this.newGameActive = game.Active__c || false;
            this.showGameForm = true;
            // Update selected state for options
            this.allLists = this.allLists.map(list => ({
                ...list,
                isSelected: list.Id === this.newGameListId
            }));
        }
    }
    
    handleCancelEditGame() {
        this.editingGame = null;
        this.newGameDescription = '';
        this.newGameListId = '';
        this.newGameActive = false;
        this.showGameForm = false;
    }
    
    handleSaveGame() {
        if (!this.newGameDescription || this.newGameDescription.trim() === '') {
            this.showError('Validation Error', 'Event description is required.');
            return;
        }
        
        if (!this.newGameListId) {
            this.showError('Validation Error', 'Please select a song list.');
            return;
        }
        
        if (this.editingGame) {
            // Update existing game
            updateGame({
                gameId: this.editingGame.Id,
                eventDescription: this.newGameDescription.trim(),
                songListId: this.newGameListId,
                active: this.newGameActive
            })
                .then(() => {
                    this.showSuccess('Game Updated', 'Game has been updated successfully.');
                    this.handleCancelEditGame();
                    refreshApex(this.wiredAllGames);
                    // Refresh active game if it was updated
                    refreshApex(this.wiredGame);
                    if (this.activeGame?.Id === this.editingGame.Id) {
                        refreshApex(this.wiredAvailableSongs);
                    }
                })
                .catch(error => {
                    this.showError('Error', error.body?.message || 'Failed to update game');
                });
        } else {
            // Create new game
            createGame({
                eventDescription: this.newGameDescription.trim(),
                songListId: this.newGameListId,
                active: this.newGameActive
            })
                .then(() => {
                    this.showSuccess('Game Created', 'New game has been created successfully.');
                    this.handleCancelEditGame();
                    refreshApex(this.wiredAllGames);
                    refreshApex(this.wiredGame);
                })
                .catch(error => {
                    this.showError('Error', error.body?.message || 'Failed to create game');
                });
        }
    }
    
    handleDeleteGame(event) {
        event.stopPropagation();
        const gameId = event.currentTarget.dataset.gameid;
        const game = this.allGames.find(g => g.Id === gameId);
        
        if (!confirm(`Are you sure you want to delete "${game?.Event_Description__c || game?.Name}"? This action cannot be undone.`)) {
            return;
        }
        
        deleteGame({ gameId: gameId })
            .then(() => {
                this.showSuccess('Game Deleted', 'Game has been deleted successfully.');
                this.selectedGame = null;
                refreshApex(this.wiredAllGames);
                refreshApex(this.wiredGame);
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Failed to delete game');
            });
    }
    
    handleSetActiveGame(event) {
        event.stopPropagation();
        const gameId = event.currentTarget.dataset.gameid;
        
        if (!confirm('Set this game as the active game? This will deactivate all other games.')) {
            return;
        }
        
        setActiveGame({ gameId: gameId })
            .then(() => {
                this.showSuccess('Active Game Set', 'Game has been set as active.');
                refreshApex(this.wiredAllGames);
                refreshApex(this.wiredGame);
                refreshApex(this.wiredAvailableSongs);
            })
            .catch(error => {
                this.showError('Error', error.body?.message || 'Failed to set active game');
            });
    }
    
    handleNewGame() {
        this.editingGame = null;
        this.newGameDescription = '';
        this.newGameListId = '';
        this.newGameActive = false;
        this.showGameForm = true;
    }
    
    // ========== GETTERS ==========
    
    get hasSelectedList() {
        return this.selectedList !== null;
    }
    
    get selectedListName() {
        if (!this.selectedList) return '';
        const list = this.allLists.find(l => l.Id === this.selectedList);
        return list ? list.Name : '';
    }
    
    get isEditingSong() {
        return this.editingSong !== null;
    }
    
    get isCreatingSong() {
        return !this.editingSong && (this.newSongName || this.newSongArtist || true); // Always show form when not editing
    }
    
    get isEditingList() {
        return this.editingList !== null;
    }
    
    get isCreatingList() {
        return !this.editingList && (this.newListName || true); // Always show form when not editing
    }
    
    get isEditingGame() {
        return this.editingGame !== null;
    }
    
    get isCreatingGame() {
        return !this.editingGame && (this.newGameDescription || this.newGameListId || true); // Always show form when not editing
    }
    
    get adminToggleTitle() {
        return this.adminMode ? 'Back to Caller' : 'Admin Settings';
    }
    
    get isSongsTab() {
        return this.adminTab === 'songs';
    }
    
    get isListsTab() {
        return this.adminTab === 'lists';
    }
    
    get isGamesTab() {
        return this.adminTab === 'games';
    }
    
    get isSongsTabActive() {
        return this.adminTab === 'songs';
    }
    
    get isListsTabActive() {
        return this.adminTab === 'lists';
    }
    
    get isGamesTabActive() {
        return this.adminTab === 'games';
    }
    
    get songFormTitle() {
        return this.isEditingSong ? 'Edit Song' : 'New Song';
    }
    
    get listFormTitle() {
        return this.isEditingList ? 'Edit List' : 'New List';
    }
    
    get gameFormTitle() {
        return this.isEditingGame ? 'Edit Game' : 'New Game';
    }
    
    get songsTabClass() {
        return this.adminTab === 'songs' ? 'admin-tab active' : 'admin-tab';
    }
    
    get listsTabClass() {
        return this.adminTab === 'lists' ? 'admin-tab active' : 'admin-tab';
    }
    
    get gamesTabClass() {
        return this.adminTab === 'games' ? 'admin-tab active' : 'admin-tab';
    }
    
}

