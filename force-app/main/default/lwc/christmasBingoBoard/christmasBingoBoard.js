import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveGame from '@salesforce/apex/GameController.getActiveGame';
import generateBoard from '@salesforce/apex/GameController.generateBoard';
import getPlayedSongs from '@salesforce/apex/GameController.getPlayedSongs';

export default class ChristmasBingoBoard extends LightningElement {
    @track boardSongs = [];
    @track markedSongs = new Set();
    @track activeGame;
    @track playedSongs = [];
    @track isLoading = true;
    @track autoMarkEnabled = false; // Default to manual marking
    @track showBingoFlash = false;
    @track boardGenerationFailed = false; // Track if board generation failed
    hadBingoBefore = false; // Track if bingo existed before current action
    bingoFlashTimeout = null; // Store timeout ID for bingo flash auto-hide
    
    // Center square is always marked (free space)
    centerIndex = 12; // 5x5 grid, center is index 12 (row 2, col 2)
    
    @wire(getActiveGame)
    wiredGame({ error, data }) {
        try {
            if (error) {
                console.error('Error loading game:', error);
                let errorMessage = 'Unknown error. Please check that an active game exists and guest user has proper permissions.';
                if (error.body) {
                    if (error.body.message) {
                        errorMessage = error.body.message;
                    } else if (error.body.pageErrors && error.body.pageErrors.length > 0) {
                        errorMessage = error.body.pageErrors[0].message;
                    } else if (error.body.fieldErrors) {
                        const fieldErrors = Object.values(error.body.fieldErrors);
                        if (fieldErrors.length > 0 && fieldErrors[0].length > 0) {
                            errorMessage = fieldErrors[0][0].message;
                        }
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }
                this.showError('Error loading game', errorMessage);
                this.isLoading = false;
            } else if (data !== undefined) {
                // data is defined (could be null or an object)
                if (data) {
                    this.activeGame = data;
                    this.loadBoard();
                    // Only refresh played songs if auto-marking is enabled
                    if (this.autoMarkEnabled) {
                        this.refreshPlayedSongs();
                    }
                } else {
                    // data is null - no active game found
                    this.showError('No Active Game', 'No active game found. Please create a game and set it as active.');
                    this.isLoading = false;
                }
            }
            // If data is undefined, the wire is still loading - keep isLoading = true
        } catch (e) {
            console.error('Unexpected error in wiredGame:', e);
            this.showError('Unexpected Error', 'An unexpected error occurred. Please refresh the page.');
            this.isLoading = false;
        }
    }
    
    
    loadBoard() {
        this.isLoading = true;
        this.boardGenerationFailed = false;
        generateBoard()
            .then(result => {
                if (result && result.length > 0) {
                    this.boardSongs = result;
                    this.arrangeBoard();
                    this.boardGenerationFailed = false;
                } else {
                    this.boardSongs = [];
                    this.boardGenerationFailed = true;
                    this.showError('No Songs Available', 'No songs found. Please add at least 24 songs to the game.');
                }
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error generating board:', error);
                this.boardSongs = [];
                this.boardGenerationFailed = true;
                const errorMessage = error.body?.message || error.message || 'Unknown error. Please check guest user permissions for Game_Song__c object.';
                this.showError('Error generating board', errorMessage);
                this.isLoading = false;
            });
    }
    
    arrangeBoard() {
        try {
            // Arrange 24 songs into a 5x5 grid with center as FREE
            // We'll create a 5x5 array structure
            const grid = [];
            let songIndex = 0;
            
            if (!this.boardSongs || this.boardSongs.length < 24) {
                console.error('Not enough songs to arrange board:', this.boardSongs?.length);
                this.boardSongs = [];
                this.boardGenerationFailed = true;
                this.showError('Insufficient Songs', 'Not enough songs available. Need at least 24 songs.');
                this.isLoading = false;
                return;
            }
            
            for (let row = 0; row < 5; row++) {
                const rowArray = [];
                for (let col = 0; col < 5; col++) {
                    if (row === 2 && col === 2) {
                        // Center square - FREE
                        rowArray.push({ id: 'FREE', name: 'FREE', isFree: true, songId: 'FREE', cssClass: 'bingo-square marked' });
                    } else {
                        const song = this.boardSongs[songIndex++];
                        if (!song) {
                            console.error('Missing song at index:', songIndex - 1);
                            continue;
                        }
                        const songId = song.Id ? song.Id : (song.id ? song.id : 'UNKNOWN');
                        song.songId = songId; // Store for easy access
                        const isMarked = this.markedSongs.has(songId);
                        song.cssClass = isMarked ? 'bingo-square marked' : 'bingo-square';
                        rowArray.push(song);
                    }
                }
                // Create a row object with a unique key based on first song
                const firstSongId = rowArray[0]?.songId || rowArray[0]?.Id || rowArray[0]?.id || `row-${row}`;
                const rowObj = {
                    rowKey: firstSongId,
                    items: rowArray
                };
                grid.push(rowObj);
            }
            
            this.boardSongs = grid;
        } catch (e) {
            console.error('Error arranging board:', e);
            this.showError('Error Arranging Board', 'An error occurred while arranging the board. Please refresh the page.');
            this.isLoading = false;
        }
    }
    
    updateBoardClasses() {
        // Update CSS classes for all squares based on marked state
        if (Array.isArray(this.boardSongs) && this.boardSongs.length > 0) {
            for (let row = 0; row < this.boardSongs.length; row++) {
                const rowObj = this.boardSongs[row];
                if (rowObj && rowObj.items && Array.isArray(rowObj.items)) {
                    for (let col = 0; col < rowObj.items.length; col++) {
                        const song = rowObj.items[col];
                        if (song) {
                            if (song.isFree) {
                                song.cssClass = 'bingo-square marked';
                            } else {
                                const songId = song.songId ? song.songId : (song.Id ? song.Id : song.id);
                                const isMarked = this.markedSongs.has(songId);
                                song.cssClass = isMarked ? 'bingo-square marked' : 'bingo-square';
                            }
                        }
                    }
                }
            }
            // Force re-render by creating a new array
            this.boardSongs = this.boardSongs.map(row => ({
                ...row,
                items: row.items.map(song => ({ ...song }))
            }));
        }
    }
    
    refreshPlayedSongs() {
        if (this.activeGame?.Id) {
            getPlayedSongs({ gameId: this.activeGame.Id })
                .then(result => {
                    this.playedSongs = result;
                    // Auto-mark played songs on the board only if auto-marking is enabled
                    if (this.autoMarkEnabled) {
                        result.forEach(song => {
                            this.markedSongs.add(song.Id);
                        });
                        // Update board classes
                        this.updateBoardClasses();
                        // Check for bingo after auto-marking (don't show flash for auto-mark)
                        this.checkForBingo(false, false);
                    }
                })
                .catch(error => {
                    console.error('Error refreshing played songs:', error);
                });
        }
    }
    
    handleSquareClick(event) {
        const songId = event.currentTarget.dataset.songid;
        
        if (songId === 'FREE') {
            return; // Free square is always marked
        }
        
        // Check if bingo existed before this click
        this.hadBingoBefore = this.checkForBingo(false); // Check without showing flash
        
        // Toggle mark
        if (this.markedSongs.has(songId)) {
            this.markedSongs.delete(songId);
        } else {
            this.markedSongs.add(songId);
        }
        
        // Force re-render
        this.markedSongs = new Set(this.markedSongs);
        
        // Update board classes
        this.updateBoardClasses();
        
        // Check for bingo - only show flash if this click caused it
        this.checkForBingo(true, true); // true = from click, true = show flash if new
    }
    
    checkForBingo(fromClick = false, showFlashIfNew = false) {
        // Check rows, columns, and diagonals
        const grid = this.boardSongs;
        if (!grid || grid.length !== 5) {
            return false; // Board not ready
        }
        
        let hasBingo = false;
        
        // Helper function to check if a square is marked
        const isSquareMarked = (song) => {
            if (!song) return false;
            if (song.isFree) return true; // FREE square is always marked
            const songId = song.songId || song.Id || song.id;
            return this.markedSongs.has(songId);
        };
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            const rowObj = grid[row];
            if (!rowObj || !rowObj.items || rowObj.items.length !== 5) continue;
            
            let rowMarked = true;
            for (let col = 0; col < 5; col++) {
                if (!isSquareMarked(rowObj.items[col])) {
                    rowMarked = false;
                    break;
                }
            }
            if (rowMarked) {
                hasBingo = true;
                break;
            }
        }
        
        // Check columns
        if (!hasBingo) {
            for (let col = 0; col < 5; col++) {
                let colMarked = true;
                for (let row = 0; row < 5; row++) {
                    const rowObj = grid[row];
                    if (!rowObj || !rowObj.items || !rowObj.items[col]) {
                        colMarked = false;
                        break;
                    }
                    if (!isSquareMarked(rowObj.items[col])) {
                        colMarked = false;
                        break;
                    }
                }
                if (colMarked) {
                    hasBingo = true;
                    break;
                }
            }
        }
        
        // Check diagonals
        if (!hasBingo) {
            // Top-left to bottom-right diagonal
            let diag1Marked = true;
            for (let i = 0; i < 5; i++) {
                const rowObj = grid[i];
                if (!rowObj || !rowObj.items || !rowObj.items[i]) {
                    diag1Marked = false;
                    break;
                }
                if (!isSquareMarked(rowObj.items[i])) {
                    diag1Marked = false;
                    break;
                }
            }
            if (diag1Marked) {
                hasBingo = true;
            }
            
            // Top-right to bottom-left diagonal
            if (!hasBingo) {
                let diag2Marked = true;
                for (let i = 0; i < 5; i++) {
                    const rowObj = grid[i];
                    const col = 4 - i;
                    if (!rowObj || !rowObj.items || !rowObj.items[col]) {
                        diag2Marked = false;
                        break;
                    }
                    if (!isSquareMarked(rowObj.items[col])) {
                        diag2Marked = false;
                        break;
                    }
                }
                if (diag2Marked) {
                    hasBingo = true;
                }
            }
        }
        
        // Only show flash if:
        // 1. There's a bingo now
        // 2. It was triggered by a click (fromClick = true)
        // 3. There wasn't a bingo before (showFlashIfNew = true means check if it's new)
        // 4. Flash isn't already showing
        if (hasBingo && fromClick && showFlashIfNew && !this.hadBingoBefore && !this.showBingoFlash) {
            this.showBingo();
        }
        
        return hasBingo; // Return whether bingo exists
    }
    
    showBingo() {
        // Clear any existing timeout
        if (this.bingoFlashTimeout) {
            clearTimeout(this.bingoFlashTimeout);
            this.bingoFlashTimeout = null;
        }
        
        // Show the big flash overlay
        this.showBingoFlash = true;
        
        // Also show toast notification
        this.dispatchEvent(
            new ShowToastEvent({
                title: '🎄 BINGO! 🎄',
                message: 'Congratulations! You have BINGO!',
                variant: 'success',
                mode: 'sticky'
            })
        );
        
        // Hide the flash after 5 seconds
        this.bingoFlashTimeout = setTimeout(() => {
            this.showBingoFlash = false;
            this.bingoFlashTimeout = null;
        }, 5000);
    }
    
    handleBingoFlashClick() {
        // Clear the auto-hide timeout
        if (this.bingoFlashTimeout) {
            clearTimeout(this.bingoFlashTimeout);
            this.bingoFlashTimeout = null;
        }
        
        // Allow clicking to dismiss the flash
        this.showBingoFlash = false;
    }
    
    handleRefresh() {
        // Clear bingo flash timeout if exists
        if (this.bingoFlashTimeout) {
            clearTimeout(this.bingoFlashTimeout);
            this.bingoFlashTimeout = null;
        }
        
        this.loadBoard();
        this.markedSongs = new Set(['FREE']); // Reset marks, keep FREE
        this.showBingoFlash = false; // Hide bingo flash if showing
        // Only refresh played songs if auto-marking is enabled
        if (this.autoMarkEnabled) {
            this.refreshPlayedSongs();
        }
    }
    
    handleAutoMarkToggle(event) {
        this.autoMarkEnabled = event.target.checked;
        
        // If enabling auto-mark, refresh played songs and set up interval
        if (this.autoMarkEnabled) {
            this.refreshPlayedSongs();
            this.startAutoRefresh();
        } else {
            // If disabling, stop the interval
            this.stopAutoRefresh();
        }
    }
    
    startAutoRefresh() {
        // Clear any existing interval
        this.stopAutoRefresh();
        
        // Set up auto-refresh for played songs every 5 seconds
        this.refreshInterval = setInterval(() => {
            if (this.activeGame?.Id && this.autoMarkEnabled) {
                this.refreshPlayedSongs();
            }
        }, 5000);
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    connectedCallback() {
        // Mark center square as free
        this.markedSongs.add('FREE');
        
        // Don't start auto-refresh by default (autoMarkEnabled is false)
    }
    
    disconnectedCallback() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        // Clear bingo flash timeout
        if (this.bingoFlashTimeout) {
            clearTimeout(this.bingoFlashTimeout);
            this.bingoFlashTimeout = null;
        }
    }
    
    get isMarked() {
        return (songId) => {
            return this.markedSongs.has(songId);
        };
    }
    
    getSquareClass(songId) {
        let classes = 'bingo-square';
        if (this.markedSongs.has(songId)) {
            classes += ' marked';
        }
        return classes;
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
    
    // Getters for setup instructions
    get showSetupInstructions() {
        return !this.activeGame || this.boardGenerationFailed || !this.boardSongs || this.boardSongs.length === 0;
    }
    
    get hasNoGame() {
        return !this.activeGame;
    }
    
    get hasNoSongs() {
        // If there's a game but board generation failed or board is empty, it means no songs
        return this.activeGame && (this.boardGenerationFailed || !this.boardSongs || this.boardSongs.length === 0);
    }
    
    get stepNumberForSongs() {
        return this.hasNoGame ? '2' : '1';
    }
    
    get stepNumberForAssign() {
        return this.hasNoGame ? '3' : '2';
    }
}

