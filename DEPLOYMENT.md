# Deployment Guide - Christmas Music Bingo

## Prerequisites

1. **Salesforce CLI** - Make sure you have SFDX CLI installed
   - Check: `sfdx --version`
   - Install: https://developer.salesforce.com/tools/salesforcecli

2. **Authenticated Salesforce Org** - You need to be logged into a Salesforce org
   - Production, Sandbox, or Developer Edition org
   - Experience Cloud must be enabled (available in most orgs)

## Step 1: Authenticate to Your Org

If you haven't already authenticated:

```bash
sfdx auth:web:login -a YourOrgAlias
```

Or if you have a username/password:
```bash
sfdx auth:username:password -u your-username@example.com -p YourPassword -a YourOrgAlias
```

## Step 2: Deploy All Components

Deploy everything to your org:

```bash
cd "/Users/cpaterson/Documents/Xmas Bingo/ChristmasMusicBingo"
sfdx force:source:deploy -p force-app -u YourOrgAlias
```

**Alternative:** If you want to see what will be deployed first:
```bash
sfdx force:source:deploy -p force-app -u YourOrgAlias --dry-run
```

## Step 3: Set Up Object Permissions

After deployment, you need to grant permissions:

1. Go to **Setup** → **Users** → **Profiles** (or **Permission Sets**)
2. For the profile/users who will access the site:
   - **Object Settings** → **Game** → Enable Read access
   - **Object Settings** → **Game Song** → Enable Read access  
   - **Object Settings** → **Game Song Played** → Enable Read access (and Create for callers)
   - **Field Settings** → Grant access to all fields on these objects
   - **Apex Class Access** → Add `GameController` and `CallerController`

## Step 4: Create Initial Data

### Create a Game:
1. Go to **Game** tab (or use Developer Console)
2. Create a new Game record
3. Set **Active** checkbox to `true`
4. Save

### Create Game Songs:
1. Go to **Game Song** tab
2. Create at least 24 songs (you need 24 for a 5x5 board)
3. For each song:
   - Enter the **Song Name** (e.g., "Jingle Bells")
   - Optionally add **Spotify URL**
4. Save all songs

**Quick Data Entry Tip:** You can use Data Loader or the Salesforce API to bulk import songs.

## Step 5: Set Up Visualforce Pages and Salesforce Site

**Note:** This application uses Visualforce pages instead of Experience Cloud. See `SETUP_GUIDE.md` for complete setup instructions including custom domain configuration.

### Create a Salesforce Site:
1. Go to **Setup** → **Sites** (search for "Sites" in Setup)
2. Click **New** (or **New Site**)
3. Fill in:
   - **Site Label**: Christmas Bingo
   - **Site Name**: christmasbingo (or your preferred name)
   - **Default Web Address**: christmasbingo
4. Click **Save**

### Configure Site Pages:
1. In your Site, go to **Public Access Settings**
2. Click **Edit**
3. Under **Visualforce Pages**, add:
   - `ChristmasBingoBoard` - Set as **Default Landing Page** (optional)
   - `BingoCaller` - Add as additional page
   - `SongSelector` - Add as additional page
4. Click **Save**

### Set Up Custom Domain (Required for External Access):
See `SETUP_GUIDE.md` Step 5 for detailed instructions on setting up a custom domain. This is required to make pages accessible externally to guest users.

### Configure Guest User Access:
1. In your Site, go to **Public Access Settings**
2. Click **Edit** on the Guest User Profile
3. Grant the Guest User Profile:
   - **Object Permissions:**
     - Game__c: Read
     - Game_Song__c: Read
     - Game_Song_Played__c: Read, Create, **Delete** (required for removing songs)
   - **Field Permissions:** All fields on the above objects
   - **Apex Class Access:**
     - GameController: Enabled
     - CallerController: Enabled
   - **Visualforce Page Access:**
     - ChristmasBingoBoard: Enabled
     - BingoCaller: Enabled
     - SongSelector: Enabled

### Activate the Site:
1. In your Site settings:
   - **Enable HTTPS**: Recommended (set to true)
   - **Active**: Set to true to make the site live
2. Note the site URL (e.g., `https://yourinstance.force.com/christmasbingo` or your custom domain)

## Step 6: Test the Deployment

1. **As a Player:**
   - Visit your site URL: `https://yourinstance.force.com/christmasbingo/ChristmasBingoBoard`
   - You should see a bingo board that generates on each page load
   - Try clicking squares to mark them
   - Verify bingo detection works (5 in a row)

2. **As a Caller:**
   - Navigate to the Song Selector page: `https://yourinstance.force.com/christmasbingo/SongSelector`
   - Search for a song and click it to mark as played
   - Open the Caller Display page: `https://yourinstance.force.com/christmasbingo/BingoCaller`
   - Verify the song appears in the "Last Called" section with flash animation
   - Verify it moves to the played songs list when the next song is called

## Troubleshooting

### Deployment Errors:
- **Permission errors:** Make sure you have the right permissions in your org
- **API version:** Ensure your org supports API version 65.0
- **Missing features:** Experience Cloud must be enabled

### Runtime Errors:
- **"No active game found":** Create a Game record with Active = true
- **"Not enough songs":** Create at least 24 Game Song records with Included_In_Game__c = true
- **Permission errors:** Check Guest User Profile permissions (see `SETUP_GUIDE.md` Step 6)
- **Components not loading:** Verify Lightning Out is working and LWC components have `lightning__Visualforce` target
- **Pages not accessible:** Verify site is Active and custom domain is configured (see `SETUP_GUIDE.md` Step 5)

### Check Deployment Status:
```bash
sfdx force:source:deploy:report -u YourOrgAlias
```

## Quick Reference Commands

```bash
# Deploy everything
sfdx force:source:deploy -p force-app -u YourOrgAlias

# Deploy specific component
sfdx force:source:deploy -p force-app/main/default/classes/GameController.cls -u YourOrgAlias

# Check deployment status
sfdx force:source:deploy:report -u YourOrgAlias

# Open org in browser
sfdx force:org:open -u YourOrgAlias
```

## Next Steps

After deployment:
1. Create your game data (Game + 24+ songs with Included_In_Game__c = true)
2. Set up Salesforce Site and custom domain (see `SETUP_GUIDE.md` Step 3-5)
3. Configure guest user permissions (see `SETUP_GUIDE.md` Step 6)
4. Test all three pages (Bingo Board, Caller Display, Song Selector)
5. Test with players!

For detailed setup instructions, see `SETUP_GUIDE.md`.
For Visualforce-specific setup, see `VISUALFORCE_SETUP.md`.
For guest user troubleshooting, see `GUEST_USER_TROUBLESHOOTING.md`.

