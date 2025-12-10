public without sharing class AdminController {
    
    // ========== SONG MANAGEMENT ==========
    
    /**
     * Get all songs (for admin management)
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song__c> getAllSongs() {
        try {
            if (!Schema.sObjectType.Game_Song__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song object');
            }
            
            return [
                SELECT Id, Name, Artist__c 
                FROM Game_Song__c 
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching songs: ' + e.getMessage());
        }
    }
    
    /**
     * Create a new song
     */
    @AuraEnabled
    public static Game_Song__c createSong(String name, String artist) {
        try {
            if (!Schema.sObjectType.Game_Song__c.isCreateable()) {
                throw new AuraHandledException('Insufficient access to create Game Song records');
            }
            
            Game_Song__c song = new Game_Song__c(
                Name = name,
                Artist__c = artist
            );
            
            insert song;
            
            return [
                SELECT Id, Name, Artist__c 
                FROM Game_Song__c 
                WHERE Id = :song.Id 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error creating song: ' + e.getMessage());
        }
    }
    
    /**
     * Update a song
     */
    @AuraEnabled
    public static Game_Song__c updateSong(String songId, String name, String artist) {
        try {
            if (!Schema.sObjectType.Game_Song__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient access to update Game Song records');
            }
            
            Game_Song__c song = new Game_Song__c(
                Id = songId,
                Name = name,
                Artist__c = artist
            );
            
            update song;
            
            return [
                SELECT Id, Name, Artist__c 
                FROM Game_Song__c 
                WHERE Id = :songId 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error updating song: ' + e.getMessage());
        }
    }
    
    /**
     * Delete a song (with validation)
     */
    @AuraEnabled
    public static void deleteSong(String songId) {
        try {
            if (!Schema.sObjectType.Game_Song__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song records');
            }
            
            // Check if song is used in any list items
            List<Game_Song_List_Item__c> listItems = [
                SELECT Id 
                FROM Game_Song_List_Item__c 
                WHERE Game_Song__c = :songId 
                LIMIT 1
            ];
            
            if (!listItems.isEmpty()) {
                throw new AuraHandledException('Cannot delete song: It is used in one or more song lists. Remove it from all lists first.');
            }
            
            // Check if song is used in any played songs
            List<Game_Song_Played__c> playedSongs = [
                SELECT Id 
                FROM Game_Song_Played__c 
                WHERE Game_Song__c = :songId 
                LIMIT 1
            ];
            
            if (!playedSongs.isEmpty()) {
                throw new AuraHandledException('Cannot delete song: It has been played in one or more games.');
            }
            
            Game_Song__c song = new Game_Song__c(Id = songId);
            delete song;
        } catch (DmlException e) {
            throw new AuraHandledException('Error deleting song: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting song: ' + e.getMessage());
        }
    }
    
    // ========== LIST MANAGEMENT ==========
    
    /**
     * Get all song lists
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song_List__c> getAllSongLists() {
        try {
            if (!Schema.sObjectType.Game_Song_List__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song List object');
            }
            
            return [
                SELECT Id, Name 
                FROM Game_Song_List__c 
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching song lists: ' + e.getMessage());
        }
    }
    
    /**
     * Create a new song list
     */
    @AuraEnabled
    public static Game_Song_List__c createSongList(String name) {
        try {
            if (!Schema.sObjectType.Game_Song_List__c.isCreateable()) {
                throw new AuraHandledException('Insufficient access to create Game Song List records');
            }
            
            Game_Song_List__c songList = new Game_Song_List__c(
                Name = name
            );
            
            insert songList;
            
            return [
                SELECT Id, Name 
                FROM Game_Song_List__c 
                WHERE Id = :songList.Id 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error creating song list: ' + e.getMessage());
        }
    }
    
    /**
     * Update a song list name
     */
    @AuraEnabled
    public static Game_Song_List__c updateSongList(String listId, String name) {
        try {
            if (!Schema.sObjectType.Game_Song_List__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient access to update Game Song List records');
            }
            
            Game_Song_List__c songList = new Game_Song_List__c(
                Id = listId,
                Name = name
            );
            
            update songList;
            
            return [
                SELECT Id, Name 
                FROM Game_Song_List__c 
                WHERE Id = :listId 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error updating song list: ' + e.getMessage());
        }
    }
    
    /**
     * Get all songs in a list
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song_List_Item__c> getListSongs(String listId) {
        try {
            if (!Schema.sObjectType.Game_Song_List_Item__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song List Item object');
            }
            
            return [
                SELECT Id, Game_Song__c, Game_Song__r.Id, Game_Song__r.Name, Game_Song__r.Artist__c, Order__c
                FROM Game_Song_List_Item__c 
                WHERE Game_Song_List__c = :listId 
                ORDER BY Order__c ASC NULLS LAST, Game_Song__r.Name ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching list songs: ' + e.getMessage());
        }
    }
    
    /**
     * Get all songs NOT in a list (for adding to list)
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song__c> getSongsNotInList(String listId) {
        try {
            if (!Schema.sObjectType.Game_Song__c.isAccessible() ||
                !Schema.sObjectType.Game_Song_List_Item__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song objects');
            }
            
            // Get songs already in the list
            Set<Id> songsInList = new Set<Id>();
            for (Game_Song_List_Item__c item : [
                SELECT Game_Song__c 
                FROM Game_Song_List_Item__c 
                WHERE Game_Song_List__c = :listId
            ]) {
                songsInList.add(item.Game_Song__c);
            }
            
            // Get all songs not in the list
            return [
                SELECT Id, Name, Artist__c 
                FROM Game_Song__c 
                WHERE Id NOT IN :songsInList 
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching available songs: ' + e.getMessage());
        }
    }
    
    /**
     * Add a song to a list
     */
    @AuraEnabled
    public static Game_Song_List_Item__c addSongToList(String listId, String songId, Integer order) {
        try {
            if (!Schema.sObjectType.Game_Song_List_Item__c.isCreateable()) {
                throw new AuraHandledException('Insufficient access to create Game Song List Item records');
            }
            
            // Check if song is already in the list
            List<Game_Song_List_Item__c> existing = [
                SELECT Id 
                FROM Game_Song_List_Item__c 
                WHERE Game_Song_List__c = :listId 
                AND Game_Song__c = :songId 
                LIMIT 1
            ];
            
            if (!existing.isEmpty()) {
                throw new AuraHandledException('This song is already in the list.');
            }
            
            // If no order specified, get the next order number
            if (order == null) {
                List<Game_Song_List_Item__c> items = [
                    SELECT Order__c 
                    FROM Game_Song_List_Item__c 
                    WHERE Game_Song_List__c = :listId 
                    ORDER BY Order__c DESC 
                    LIMIT 1
                ];
                order = 1;
                if (!items.isEmpty() && items[0].Order__c != null) {
                    order = Integer.valueOf(items[0].Order__c) + 1;
                }
            }
            
            Game_Song_List_Item__c listItem = new Game_Song_List_Item__c(
                Game_Song_List__c = listId,
                Game_Song__c = songId,
                Order__c = order
            );
            
            insert listItem;
            
            return [
                SELECT Id, Game_Song__c, Game_Song__r.Id, Game_Song__r.Name, Game_Song__r.Artist__c, Order__c
                FROM Game_Song_List_Item__c 
                WHERE Id = :listItem.Id 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error adding song to list: ' + e.getMessage());
        }
    }
    
    /**
     * Remove a song from a list
     */
    @AuraEnabled
    public static void removeSongFromList(String listItemId) {
        try {
            if (!Schema.sObjectType.Game_Song_List_Item__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song List Item records');
            }
            
            Game_Song_List_Item__c item = new Game_Song_List_Item__c(Id = listItemId);
            delete item;
        } catch (DmlException e) {
            throw new AuraHandledException('Error removing song from list: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException('Error removing song from list: ' + e.getMessage());
        }
    }
    
    /**
     * Delete a song list (with validation)
     */
    @AuraEnabled
    public static void deleteSongList(String listId) {
        try {
            if (!Schema.sObjectType.Game_Song_List__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song List records');
            }
            
            // Check if list is used by any games
            List<Game__c> games = [
                SELECT Id, Name 
                FROM Game__c 
                WHERE Game_Song_List__c = :listId 
                LIMIT 1
            ];
            
            if (!games.isEmpty()) {
                throw new AuraHandledException('Cannot delete list: It is assigned to one or more games. Remove the list from all games first.');
            }
            
            Game_Song_List__c songList = new Game_Song_List__c(Id = listId);
            delete songList;
        } catch (DmlException e) {
            throw new AuraHandledException('Error deleting song list: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting song list: ' + e.getMessage());
        }
    }
    
    // ========== GAME MANAGEMENT ==========
    
    /**
     * Get all games
     */
    @AuraEnabled(cacheable=true)
    public static List<Game__c> getAllGames() {
        try {
            if (!Schema.sObjectType.Game__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game object');
            }
            
            return [
                SELECT Id, Name, Active__c, Event_Description__c, Game_Song_List__c, Game_Song_List__r.Name
                FROM Game__c 
                ORDER BY Active__c DESC, Name ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching games: ' + e.getMessage());
        }
    }
    
    /**
     * Create a new game
     */
    @AuraEnabled
    public static Game__c createGame(String eventDescription, String songListId, Boolean active) {
        try {
            if (!Schema.sObjectType.Game__c.isCreateable()) {
                throw new AuraHandledException('Insufficient access to create Game records');
            }
            
            // If setting as active, deactivate all other games
            if (active == true) {
                List<Game__c> activeGames = [
                    SELECT Id 
                    FROM Game__c 
                    WHERE Active__c = true
                ];
                for (Game__c game : activeGames) {
                    game.Active__c = false;
                }
                if (!activeGames.isEmpty()) {
                    update activeGames;
                }
            }
            
            Game__c game = new Game__c(
                Event_Description__c = eventDescription,
                Game_Song_List__c = songListId,
                Active__c = active == true
            );
            
            insert game;
            
            return [
                SELECT Id, Name, Active__c, Event_Description__c, Game_Song_List__c, Game_Song_List__r.Name
                FROM Game__c 
                WHERE Id = :game.Id 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error creating game: ' + e.getMessage());
        }
    }
    
    /**
     * Update a game
     */
    @AuraEnabled
    public static Game__c updateGame(String gameId, String eventDescription, String songListId, Boolean active) {
        try {
            if (!Schema.sObjectType.Game__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient access to update Game records');
            }
            
            // If setting as active, deactivate all other games
            if (active == true) {
                List<Game__c> activeGames = [
                    SELECT Id 
                    FROM Game__c 
                    WHERE Active__c = true 
                    AND Id != :gameId
                ];
                for (Game__c game : activeGames) {
                    game.Active__c = false;
                }
                if (!activeGames.isEmpty()) {
                    update activeGames;
                }
            }
            
            Game__c game = new Game__c(
                Id = gameId,
                Event_Description__c = eventDescription,
                Game_Song_List__c = songListId,
                Active__c = active == true
            );
            
            update game;
            
            return [
                SELECT Id, Name, Active__c, Event_Description__c, Game_Song_List__c, Game_Song_List__r.Name
                FROM Game__c 
                WHERE Id = :gameId 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error updating game: ' + e.getMessage());
        }
    }
    
    /**
     * Set a game as active (deactivates others)
     */
    @AuraEnabled
    public static void setActiveGame(String gameId) {
        try {
            if (!Schema.sObjectType.Game__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient access to update Game records');
            }
            
            // Deactivate all games
            List<Game__c> allGames = [
                SELECT Id, Active__c 
                FROM Game__c
            ];
            for (Game__c game : allGames) {
                game.Active__c = (game.Id == gameId);
            }
            update allGames;
        } catch (Exception e) {
            throw new AuraHandledException('Error setting active game: ' + e.getMessage());
        }
    }
    
    /**
     * Delete a game (with validation)
     */
    @AuraEnabled
    public static void deleteGame(String gameId) {
        try {
            if (!Schema.sObjectType.Game__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game records');
            }
            
            // Check if game has played songs
            List<Game_Song_Played__c> playedSongs = [
                SELECT Id 
                FROM Game_Song_Played__c 
                WHERE Game__c = :gameId 
                LIMIT 1
            ];
            
            if (!playedSongs.isEmpty()) {
                throw new AuraHandledException('Cannot delete game: It has played songs. Clear all played songs first.');
            }
            
            Game__c game = new Game__c(Id = gameId);
            delete game;
        } catch (DmlException e) {
            throw new AuraHandledException('Error deleting game: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting game: ' + e.getMessage());
        }
    }
}

