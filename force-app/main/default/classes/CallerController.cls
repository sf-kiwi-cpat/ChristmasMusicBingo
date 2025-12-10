public without sharing class CallerController {
    
    /**
     * Mark a song as played in a game
     */
    @AuraEnabled
    public static Game_Song_Played__c markSongAsPlayed(String gameId, String songId) {
        try {
            // Check CRUD permissions
            if (!Schema.sObjectType.Game_Song_Played__c.isCreateable() || 
                !Schema.sObjectType.Game_Song_Played__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to create Game Song Played records');
            }
            
            // Get the next order number
            List<Game_Song_Played__c> existingPlays = [
                SELECT Order__c 
                FROM Game_Song_Played__c 
                WHERE Game__c = :gameId 
                ORDER BY Order__c DESC 
                LIMIT 1
            ];
            
            Decimal nextOrder = 1;
            if (!existingPlays.isEmpty() && existingPlays[0].Order__c != null) {
                nextOrder = existingPlays[0].Order__c + 1;
            }
            
            // Check if song is already played
            List<Game_Song_Played__c> alreadyPlayed = [
                SELECT Id 
                FROM Game_Song_Played__c 
                WHERE Game__c = :gameId 
                AND Game_Song__c = :songId 
                LIMIT 1
            ];
            
            if (!alreadyPlayed.isEmpty()) {
                throw new AuraHandledException('This song has already been played.');
            }
            
            // Create the record
            Game_Song_Played__c played = new Game_Song_Played__c(
                Game__c = gameId,
                Game_Song__c = songId,
                Order__c = nextOrder
            );
            
            insert played;
            
            // Return the full record with related data
            return [
                SELECT Id, Game__c, Game_Song__c, Game_Song__r.Name, Game_Song__r.Artist__c, Order__c
                FROM Game_Song_Played__c
                WHERE Id = :played.Id
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error marking song as played: ' + e.getMessage());
        }
    }
    
    /**
     * Get all available songs for the caller (excluding already played ones)
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song__c> getAvailableSongs(String gameId) {
        try {
            // Check CRUD permissions
            if (!Schema.sObjectType.Game__c.isAccessible() ||
                !Schema.sObjectType.Game_Song_List_Item__c.isAccessible() ||
                !Schema.sObjectType.Game_Song__c.isAccessible() || 
                !Schema.sObjectType.Game_Song_Played__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song objects');
            }
            
            // Get the game and its song list
            List<Game__c> games = [
                SELECT Id, Game_Song_List__c 
                FROM Game__c 
                WHERE Id = :gameId 
                LIMIT 1
            ];
            
            if (games.isEmpty() || games[0].Game_Song_List__c == null) {
                return new List<Game_Song__c>();
            }
            
            // Get all songs from the game's song list
            List<Game_Song__c> allSongs = [
                SELECT Id, Name, Artist__c 
                FROM Game_Song__c 
                WHERE Id IN (
                    SELECT Game_Song__c 
                    FROM Game_Song_List_Item__c 
                    WHERE Game_Song_List__c = :games[0].Game_Song_List__c
                )
                ORDER BY Name
            ];
            
            // Get played song IDs
            Set<Id> playedSongIds = new Set<Id>();
            for (Game_Song_Played__c played : [
                SELECT Game_Song__c 
                FROM Game_Song_Played__c 
                WHERE Game__c = :gameId
            ]) {
                playedSongIds.add(played.Game_Song__c);
            }
            
            // Filter out played songs
            List<Game_Song__c> availableSongs = new List<Game_Song__c>();
            for (Game_Song__c song : allSongs) {
                if (!playedSongIds.contains(song.Id)) {
                    availableSongs.add(song);
                }
            }
            
            return availableSongs;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching available songs: ' + e.getMessage());
        }
    }
    
    /**
     * Get all played songs for the caller view
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song_Played__c> getPlayedSongsForCaller(String gameId) {
        try {
            // Check CRUD permission
            if (!Schema.sObjectType.Game_Song_Played__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song Played object');
            }
            
            return [
                SELECT Id, Game_Song__r.Id, Game_Song__r.Name, Game_Song__r.Artist__c, Order__c
                FROM Game_Song_Played__c
                WHERE Game__c = :gameId
                ORDER BY Order__c ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching played songs: ' + e.getMessage());
        }
    }
    
    /**
     * Remove a song from the played list
     */
    @AuraEnabled
    public static void removePlayedSong(String playedSongId) {
        try {
            // Check if object is accessible (read permission)
            if (!Schema.sObjectType.Game_Song_Played__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song Played records');
            }
            
            // Query the record - using without sharing allows us to access it
            List<Game_Song_Played__c> playedRecords = [
                SELECT Id 
                FROM Game_Song_Played__c 
                WHERE Id = :playedSongId 
                LIMIT 1
            ];
            
            if (playedRecords.isEmpty()) {
                throw new AuraHandledException('Song not found');
            }
            
            // Delete the record - without sharing allows deletion even if user doesn't have explicit delete permission
            delete playedRecords;
        } catch (DmlException e) {
            throw new AuraHandledException('Error removing song: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException('Error removing song: ' + e.getMessage());
        }
    }
    
    /**
     * Clear all played songs for a game
     */
    @AuraEnabled
    public static void clearAllPlayedSongs(String gameId) {
        try {
            // Check if object is accessible (read permission)
            if (!Schema.sObjectType.Game_Song_Played__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song Played records');
            }
            
            // Query the records - using without sharing allows us to access them
            List<Game_Song_Played__c> playedSongs = [
                SELECT Id 
                FROM Game_Song_Played__c 
                WHERE Game__c = :gameId
            ];
            
            if (!playedSongs.isEmpty()) {
                // Delete the records - without sharing allows deletion even if user doesn't have explicit delete permission
                delete playedSongs;
            }
        } catch (DmlException e) {
            throw new AuraHandledException('Error clearing played songs: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException('Error clearing played songs: ' + e.getMessage());
        }
    }
}

