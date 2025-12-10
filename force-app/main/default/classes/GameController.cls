public without sharing class GameController {
    
    /**
     * Get the active game
     */
    @AuraEnabled(cacheable=true)
    public static Game__c getActiveGame() {
        try {
            // Check CRUD permission
            if (!Schema.sObjectType.Game__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game object');
            }
            
            List<Game__c> games = [
                SELECT Id, Name, Active__c, Event_Description__c, Game_Song_List__c 
                FROM Game__c 
                WHERE Active__c = true 
                LIMIT 1
            ];
            if (games.isEmpty()) {
                return null;
            }
            return games[0];
        } catch (Exception e) {
            throw new AuraHandledException('Error loading game: ' + e.getMessage());
        }
    }
    
    /**
     * Get all available game songs from the active game's song list
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song__c> getAllGameSongs() {
        try {
            // Get the active game
            Game__c activeGame = getActiveGame();
            if (activeGame == null || activeGame.Game_Song_List__c == null) {
                return new List<Game_Song__c>();
            }
            
            // Get songs through Game -> Game_Song_List -> Game_Song_List_Item -> Game_Song
            return [
                SELECT Id, Name 
                FROM Game_Song__c 
                WHERE Id IN (
                    SELECT Game_Song__c 
                    FROM Game_Song_List_Item__c 
                    WHERE Game_Song_List__c = :activeGame.Game_Song_List__c
                )
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching game songs: ' + e.getMessage());
        }
    }
    
    /**
     * Generate a random bingo board (5x5 grid, 24 songs + 1 free space)
     */
    @AuraEnabled
    public static List<Game_Song__c> generateBoard() {
        try {
            List<Game_Song__c> allSongs = getAllGameSongs();
            
            if (allSongs.size() < 24) {
                throw new AuraHandledException('Not enough songs available. Need at least 24 songs.');
            }
            
            // Shuffle the songs
            List<Game_Song__c> shuffled = new List<Game_Song__c>(allSongs);
            Integer n = shuffled.size();
            for (Integer i = 0; i < n; i++) {
                Integer j = Math.mod(Integer.valueOf(Math.random() * 1000), n);
                Game_Song__c temp = shuffled[i];
                shuffled[i] = shuffled[j];
                shuffled[j] = temp;
            }
            
            // Take first 24 songs for the board
            List<Game_Song__c> boardSongs = new List<Game_Song__c>();
            for (Integer i = 0; i < 24; i++) {
                boardSongs.add(shuffled[i]);
            }
            
            return boardSongs;
        } catch (Exception e) {
            throw new AuraHandledException('Error generating board: ' + e.getMessage());
        }
    }
    
    /**
     * Get all songs that have been played for a game, ordered by play order
     */
    @AuraEnabled(cacheable=true)
    public static List<Game_Song__c> getPlayedSongs(String gameId) {
        try {
            // Check CRUD permission
            if (!Schema.sObjectType.Game_Song_Played__c.isAccessible()) {
                throw new AuraHandledException('Insufficient access to Game Song Played object');
            }
            
            List<Game_Song_Played__c> playedRecords = [
                SELECT Id, Game_Song__r.Id, Game_Song__r.Name, Order__c
                FROM Game_Song_Played__c
                WHERE Game__c = :gameId
                ORDER BY Order__c ASC
            ];
            
            List<Game_Song__c> playedSongs = new List<Game_Song__c>();
            for (Game_Song_Played__c played : playedRecords) {
                playedSongs.add(played.Game_Song__r);
            }
            
            return playedSongs;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching played songs: ' + e.getMessage());
        }
    }
    
    /**
     * Check if a song has been played in the active game
     */
    @AuraEnabled(cacheable=true)
    public static Boolean isSongPlayed(String gameId, String songId) {
        try {
            // Check CRUD permission
            if (!Schema.sObjectType.Game_Song_Played__c.isAccessible()) {
                return false;
            }
            
            List<Game_Song_Played__c> played = [
                SELECT Id 
                FROM Game_Song_Played__c 
                WHERE Game__c = :gameId 
                AND Game_Song__c = :songId 
                LIMIT 1
            ];
            return !played.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}