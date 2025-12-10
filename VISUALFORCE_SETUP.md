# Visualforce Pages Setup Guide

## Overview
This guide explains how to set up the Christmas Music Bingo game using Visualforce pages. Visualforce pages are simpler to set up and work well for public-facing sites with guest user access.

## Created Pages

1. **ChristmasBingoBoard.page** - The player's bingo board page
2. **BingoCaller.page** - The caller's read-only display board (for TV/projector)
3. **SongSelector.page** - The caller's song selection interface

## Step 1: Deploy the Pages

Deploy the Visualforce pages:

```bash
sfdx force:source:deploy -p force-app/main/default/pages -u YourOrgAlias
```

## Step 2: Create a Salesforce Site

1. Go to **Setup** → **Sites** (search for "Sites" in Setup)
2. Click **New** (or **New Site**)
3. Fill in:
   - **Site Label**: Christmas Bingo
   - **Site Name**: christmasbingo (or your preferred name - must be unique)
   - **Default Web Address**: christmasbingo
4. Click **Save**

## Step 2a: Set Up Custom Domain (Required for External Access)

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

## Step 3: Configure Site Pages

1. In your Site, go to **Public Access Settings**
2. Click **Edit**
3. Under **Visualforce Pages**, add:
   - `ChristmasBingoBoard` - Set as **Default Landing Page** (optional)
   - `BingoCaller` - Add as additional page
   - `SongSelector` - Add as additional page
4. Click **Save**

## Step 4: Set Up Guest User Permissions

1. Go to **Setup** → **Sites** → Your Site → **Public Access Settings**
2. Click **Edit** on the Guest User Profile
3. Grant permissions:

### Object Permissions:
- **Game__c**: Read
- **Game_Song_List__c**: Read
- **Game_Song_List_Item__c**: Read
- **Game_Song__c**: Read
- **Game_Song_Played__c**: Read, Create, **Delete** (required for removing songs)

### Field Permissions:
- All fields on the above objects

### Apex Class Access:
- **GameController**: Enabled
- **CallerController**: Enabled

### Visualforce Page Access:
- **ChristmasBingoBoard**: Enabled
- **BingoCaller**: Enabled

## Step 5: Configure Site Settings

1. In your Site settings:
   - **Enable HTTPS**: Recommended (set to true)
   - **Clickjack Protection**: SameOriginOnly or Allow framing by same origin only
   - **Active**: Set to true to make the site live

## Step 6: Configure Site Settings

1. In your Site settings:
   - **Enable HTTPS**: Recommended (set to true)
   - **Clickjack Protection**: SameOriginOnly or Allow framing by same origin only
   - **Active**: Set to true to make the site live
   - **Require Secure Connections (HTTPS)**: Recommended (set to true)

## Step 7: Access Your Pages

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

## Step 8: Create Initial Data

1. Create at least one **Game** record with:
   - `Active__c = true`
   - `Event_Description__c` = Your event description (e.g., "Family Christmas Party 2024")

2. Create **Game Song** records with:
   - `Name` = Song name
   - `Artist__c` = Artist name (optional but recommended)

3. Create a **Game Song List** record:
   - `Name` = List name (e.g., "Classic Christmas Songs")
   - Add at least 24 songs to the list via **Game Song List Items** related list

4. Create a **Game** record with:
   - `Active__c = true`
   - `Event_Description__c` = Your event description
   - `Game_Song_List__c` = Select the song list you created

## Advantages of Visualforce Pages

- **Simpler Setup**: No need for Experience Cloud configuration
- **Faster Deployment**: Easier to deploy and test
- **Public Access**: Works well for unauthenticated users
- **Mobile Friendly**: The LWC components are already mobile-optimized
- **Cost Effective**: No additional licensing needed (if you have Sites)

## Customization

### Styling
The Visualforce pages include basic styling with a green background. You can customize the CSS in the `<style>` section of each page.

### Adding Navigation
You can add navigation links between pages:

```html
<div style="text-align: center; padding: 10px;">
    <a href="/ChristmasBingoBoard" style="color: white; margin: 0 10px;">Bingo Board</a>
    <a href="/BingoCaller" style="color: white; margin: 0 10px;">Caller</a>
</div>
```

## Troubleshooting

### Components Not Showing:
- Verify LWC components are exposed for Visualforce
- Check Guest User has access to Apex classes
- Verify object and field permissions

### Permission Errors:
- Check Guest User Profile permissions
- Verify Apex class access is enabled
- Check field-level security

### Page Not Loading:
- Verify the site is active
- Check the page is added to the site
- Verify HTTPS settings if using secure connection

## Quick Reference

**Site URL Format:** `https://[your-domain].force.com/[site-name]`

**Page URLs:**
- Board: `/ChristmasBingoBoard`
- Caller Display: `/BingoCaller`
- Song Selector: `/SongSelector`

**Required Permissions:**
- Game__c: Read
- Game_Song_List__c: Read
- Game_Song_List_Item__c: Read
- Game_Song__c: Read  
- Game_Song_Played__c: Read, Create, **Delete** (required for removing songs)
- GameController: Enabled
- CallerController: Enabled

