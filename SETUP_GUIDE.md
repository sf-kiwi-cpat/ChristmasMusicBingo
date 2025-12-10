# Christmas Music Bingo - Complete Setup Guide

## Overview
This Salesforce package creates a Christmas Music Bingo game that can be played through Visualforce pages. Players get a unique 5x5 bingo board on each page load, and a caller can mark songs as played. The game is optimized for mobile devices and works for guest users (unauthenticated access).

## Components Created

### Custom Objects
1. **Game__c** - Represents a bingo game
   - `Name` (Auto-number)
   - `Active__c` (Checkbox) - Only one game should be active at a time
   - `Event_Description__c` (Text) - Description/name of the event (e.g., "Family Christmas Party 2024")
   - `Game_Song_List__c` (Lookup to Game_Song_List__c) - The song list to use for this game

2. **Game_Song_List__c** - Pre-defined list of songs that can be used for games
   - `Name` (Text) - List name (e.g., "Classic Christmas Songs", "Modern Holiday Hits")

3. **Game_Song_List_Item__c** - Junction object linking songs to song lists
   - `Game_Song_List__c` (Master-Detail to Game_Song_List__c)
   - `Game_Song__c` (Master-Detail to Game_Song__c)
   - `Order__c` (Number) - Optional ordering of songs in the list

4. **Game_Song__c** - All available Christmas songs
   - `Name` (Text) - Song name
   - `Artist__c` (Text) - Artist name
   - `Included_In_Game__c` (Checkbox) - **Note: This field is no longer used. Songs are now associated with games through Game_Song_List__c.**

5. **Game_Song_Played__c** - Junction object tracking played songs
   - `Game__c` (Lookup to Game__c)
   - `Game_Song__c` (Lookup to Game_Song__c)
   - `Order__c` (Number) - The order in which the song was played

### Apex Classes
- **GameController** - Handles board generation and game state for players
- **CallerController** - Handles marking songs as played, removing songs, and clearing all played songs

### Lightning Web Components
- **christmasBingoBoard** - The player's bingo board (5x5 grid with bingo detection)
- **bingoCaller** - The caller's read-only display board showing played songs
- **songSelector** - The caller's interface for searching and selecting songs to mark as played

### Visualforce Pages
- **ChristmasBingoBoard.page** - Player's bingo board page
- **BingoCaller.page** - Caller's display board (read-only, shows on TV)
- **SongSelector.page** - Caller's song selection interface

### Custom Application
- **Christmas Bingo** - Custom app with tabs for all three custom objects

### Static Resources
- **ChristmasBingoIcon** - SVG icon for the app and favicon

## Step 1: Deploy the Package

Deploy all components to your Salesforce org using Salesforce CLI:

```bash
cd "/Users/cpaterson/Documents/Xmas Bingo/ChristmasMusicBingo"
sfdx force:source:deploy -p force-app -u YourOrgAlias
```

**Alternative:** If you want to see what will be deployed first:
```bash
sfdx force:source:deploy -p force-app -u YourOrgAlias --dry-run
```

## Step 2: Create Initial Data

### Create Game Songs:
1. Go to **Game Song** tab
2. Create all your Christmas songs (you'll need at least 24 songs per list)
3. For each song:
   - Enter the **Song Name** (e.g., "Jingle Bells")
   - Enter the **Artist** (e.g., "Bing Crosby")
4. Save all songs

**Quick Data Entry Tip:** You can use Data Loader or the Salesforce API to bulk import songs.

### Create a Game Song List:
1. Go to **Game Song List** tab
2. Create a new Game Song List record
3. Enter a **List Name** (e.g., "Classic Christmas Songs", "Modern Holiday Hits")
4. Save the list
5. Add songs to the list:
   - On the Game Song List record, use the related list "Game Song List Items"
   - Click **New** to add songs to the list
   - Select a **Game Song** from the dropdown
   - Optionally set an **Order** number to control the sequence
   - Repeat until you have at least 24 songs in the list

**Note:** You can create multiple song lists (e.g., one for kids, one for adults) and swap between them by changing the Game Song List on a Game record.

### Create a Game:
1. Go to **Game** tab (or use Developer Console)
2. Create a new Game record
3. Set **Active** checkbox to `true`
4. Enter **Event Description** (e.g., "Family Christmas Party 2024")
5. **Select a Game Song List** - Choose the song list you created above
6. Save

**Important:** 
- Only one Game should have `Active__c = true` at a time
- The Game must have a Game Song List assigned for songs to appear
- The Game Song List must have at least 24 songs for boards to generate

## Step 3: Create a Salesforce Site

Salesforce Sites allow you to host Visualforce pages that are accessible to guest users (unauthenticated).

1. Go to **Setup** → **Sites** (or search for "Sites" in Setup)
2. Click **New** (or **New Site**)
3. Fill in:
   - **Site Label**: Christmas Bingo
   - **Site Name**: christmasbingo (or your preferred name - must be unique)
   - **Default Web Address**: christmasbingo
4. Click **Save**

## Step 4: Configure Site Pages

1. In your Site, go to **Public Access Settings**
2. Click **Edit**
3. Under **Visualforce Pages**, add:
   - `ChristmasBingoBoard` - Set as **Default Landing Page** (optional)
   - `BingoCaller` - Add as additional page
   - `SongSelector` - Add as additional page
4. Click **Save**

## Step 5: Set Up Custom Domain (Required for External Access)

To make your Visualforce pages accessible externally to guest users, you need to set up a custom domain.

### Option A: Use Salesforce Domain (Easiest)

Your pages will be accessible at:
- `https://yourinstance.force.com/christmasbingo/ChristmasBingoBoard`
- `https://yourinstance.force.com/christmasbingo/BingoCaller`
- `https://yourinstance.force.com/christmasbingo/SongSelector`

Where `yourinstance` is your Salesforce instance name (e.g., `na1`, `eu1`, etc.)

### Option B: Custom Domain (Recommended for Production)

1. Go to **Setup** → **Sites** → Your Site → **Domain Management**
2. Click **Register a Salesforce Domain** (if not already done)
3. Enter your desired domain name (e.g., `christmasbingo`)
4. Follow the prompts to verify domain ownership
5. Once verified, your pages will be accessible at:
   - `https://christmasbingo.yourdomain.com/ChristmasBingoBoard`
   - `https://christmasbingo.yourdomain.com/BingoCaller`
   - `https://christmasbingo.yourdomain.com/SongSelector`

**Note:** Custom domain setup may require DNS configuration and can take 24-48 hours to propagate.

## Step 6: Configure Guest User Permissions

This is critical for guest users to access the pages and functionality.

1. Go to **Setup** → **Sites** → Your Site → **Public Access Settings**
2. Click **Edit** on the Guest User Profile
3. Grant the following permissions:

### Object Permissions:
- **Game__c**: Read
- **Game_Song_List__c**: Read
- **Game_Song_List_Item__c**: Read
- **Game_Song__c**: Read
- **Game_Song_Played__c**: Read, Create, **Delete** (required for removing songs)

### Field Permissions:
For each object above, ensure all fields are accessible:
- **Game__c**: Id, Name, Active__c, Event_Description__c, Game_Song_List__c
- **Game_Song_List__c**: Id, Name
- **Game_Song_List_Item__c**: Id, Game_Song_List__c, Game_Song__c, Order__c
- **Game_Song__c**: Id, Name, Artist__c
- **Game_Song_Played__c**: Id, Game__c, Game_Song__c, Order__c

### Apex Class Access:
1. Scroll to **Apex Class Access**
2. Click **Edit**
3. Add the following classes with **Enabled** access:
   - `GameController`
   - `CallerController`
4. Click **Save**

### Visualforce Page Access:
1. Scroll to **Visualforce Page Access**
2. Click **Edit**
3. Add the following pages with **Enabled** access:
   - `ChristmasBingoBoard`
   - `BingoCaller`
   - `SongSelector`
4. Click **Save**

**Important:** The **Delete** permission on `Game_Song_Played__c` is required for the Song Selector page to remove individual songs or clear all played songs.

## Step 7: Configure Site Settings

1. In your Site settings:
   - **Enable HTTPS**: Recommended (set to true)
   - **Clickjack Protection**: SameOriginOnly or Allow framing by same origin only
   - **Active**: Set to true to make the site live
   - **Require Secure Connections (HTTPS)**: Recommended (set to true)

2. **Error Pages** (optional):
   - You can customize error pages if desired

## Step 8: Access Your Pages

After setup, your pages will be accessible at:

### Using Salesforce Domain:
- **Bingo Board**: `https://yourinstance.force.com/christmasbingo/ChristmasBingoBoard`
- **Caller Display**: `https://yourinstance.force.com/christmasbingo/BingoCaller`
- **Song Selector**: `https://yourinstance.force.com/christmasbingo/SongSelector`

### Using Custom Domain:
- **Bingo Board**: `https://christmasbingo.yourdomain.com/ChristmasBingoBoard`
- **Caller Display**: `https://christmasbingo.yourdomain.com/BingoCaller`
- **Song Selector**: `https://christmasbingo.yourdomain.com/SongSelector`

If you set ChristmasBingoBoard as the default landing page:
- **Bingo Board**: `https://yourinstance.force.com/christmasbingo` (or your custom domain root)

## Step 9: Set Up the Custom App (Optional)

The custom app "Christmas Bingo" includes tabs for all three custom objects:

1. Go to **Setup** → **App Manager**
2. Find **Christmas Bingo** app
3. Click the dropdown → **Edit**
4. Verify tabs are included:
   - Game
   - Game Song
   - Game Song Played
5. Assign the app to users who need to manage game data

## Features

### Player Features (ChristmasBingoBoard):
- **Unique Board**: Each page load generates a new random 5x5 board
- **Manual Marking**: Tap/click any square to mark it yourself
- **Bingo Detection**: Automatically detects when you have a bingo (5 in a row, column, or diagonal) and shows a celebration flash
- **Free Center Square**: The center square is always marked as FREE
- **Mobile Optimized**: Responsive design works great on phones and tablets
- **Christmas Theme**: Red and green color scheme with decorative background
- **Auto-Scroll**: Automatically scrolls to newly marked songs

### Caller Features:

#### Song Selector Page:
- **Search Songs**: Filter available songs by name or artist
- **Mark as Played**: Single-click to mark a song as played
- **View Played Songs**: See all songs that have been played
- **Remove Songs**: Delete individual songs or clear all played songs
- **Real-time Updates**: Changes appear immediately on the Caller Display page

#### Caller Display Page (BingoCaller):
- **Last Called Section**: Shows the most recently called song with flash animation
- **Played Songs List**: Horizontal grid showing all played songs
- **TV Optimized**: Designed for large displays (1920px+, 2560px+)
- **Read-Only**: No editing capabilities (use Song Selector for changes)
- **Auto-Scroll**: Automatically scrolls to newly added songs
- **Real-time Updates**: Polls for new songs every few seconds

## Usage Workflow

1. **Setup Phase:**
   - Create a Game record and set it as Active
   - Create at least 24 Game Song records
   - Set up the Salesforce Site and permissions

2. **During the Game:**
   - **Caller**: Use the Song Selector page to search and mark songs as played
   - **Players**: Use the Bingo Board page to view their board and mark squares
   - **Display**: Show the Bingo Caller page on a TV/projector for all to see

3. **Game Flow:**
   - Caller searches for a song in Song Selector
   - Caller clicks the song to mark it as played
   - Song appears in "Last Called" section on Caller Display (with flash)
   - Song moves to the played songs list when next song is called
   - Players can manually mark squares on their boards
   - When a player gets 5 in a row, a bingo celebration appears

## Troubleshooting

### Pages Not Accessible:
- Verify the site is **Active**
- Check that pages are added to the site's **Public Access Settings**
- Verify custom domain is configured (if using custom domain)
- Check that HTTPS is enabled if required

### Guest User Permission Errors:
- Verify Guest User Profile has **Read** access to Game__c, Game_Song__c
- Verify Guest User Profile has **Read, Create, Delete** access to Game_Song_Played__c
- Check that Apex classes (GameController, CallerController) are enabled for Guest User
- Verify all required fields are accessible in Field-Level Security

### Components Not Loading:
- Check browser console for JavaScript errors
- Verify Lightning Out is working (`<apex:includeLightning />` is included)
- Check that LWC components have `lightning__Visualforce` target in metadata
- Verify `ltng:allowGuestAccess` is set in LWC metadata

### "No active game found":
- Ensure you have a Game record with `Active__c = true`
- Only one game should be active at a time

### "Not enough songs error":
- Create at least 24 Game Song records with `Included_In_Game__c = true`

### Bingo Not Detecting:
- Bingo detection only triggers when you manually click a square that completes a line
- Auto-marked squares don't trigger bingo detection
- Bingo requires 5 in a row (horizontal, vertical, or diagonal), including the free center square

### Songs Not Appearing on Caller Display:
- Verify the active game ID matches between pages
- Check that `Game_Song_Played__c` records are being created
- Check browser console for errors
- Verify polling is working (check network tab)

## Quick Reference

**Site URL Format:** 
- Salesforce Domain: `https://[instance].force.com/[site-name]`
- Custom Domain: `https://[site-name].[your-domain].com`

**Page URLs:**
- Board: `/ChristmasBingoBoard`
- Caller Display: `/BingoCaller`
- Song Selector: `/SongSelector`

**Required Permissions (Guest User):**
- Game__c: Read
- Game_Song_List__c: Read
- Game_Song_List_Item__c: Read
- Game_Song__c: Read
- Game_Song_Played__c: Read, Create, **Delete**
- GameController: Enabled
- CallerController: Enabled
- All Visualforce pages: Enabled

**Minimum Data Requirements:**
- 1 Game Song List with at least 24 songs (via Game_Song_List_Item__c records)
- 1 Game record with `Active__c = true` and `Game_Song_List__c` assigned

## Additional Resources

- **Deployment Guide**: See `DEPLOYMENT.md` for detailed deployment instructions
- **Guest User Troubleshooting**: See `GUEST_USER_TROUBLESHOOTING.md` for common guest user issues
- **Visualforce Setup**: See `VISUALFORCE_SETUP.md` for Visualforce-specific details

## Notes

- Only one Game should have `Active__c = true` at a time
- Games must have a Game_Song_List__c assigned to work
- The Game_Song_List__c must have at least 24 songs (via Game_Song_List_Item__c records) to generate boards
- The center square (row 3, column 3) is always FREE
- The `Included_In_Game__c` field on Game_Song__c is no longer used - songs are now associated with games through Game_Song_List__c
- Each player gets a unique random board on page load
- Bingo detection only works for manually clicked squares
- The Caller Display page is optimized for TV viewing (large screens)
- All pages are mobile-optimized with responsive design
