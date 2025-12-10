# Guest User Access Troubleshooting

## Common Issues and Solutions

### Issue: Board Stuck on Loading

If the bingo board gets stuck on the loading spinner for guest users, check the following:

### 1. Apex Class Access

**Problem:** Guest user profile doesn't have access to the Apex classes.

**Solution:**
1. Go to **Setup** → **Users** → **Profiles**
2. Find your **Guest User Profile** (usually named "Guest User" or similar)
3. Click **Edit**
4. Scroll to **Apex Class Access**
5. Click **Edit**
6. Add the following classes with **Enabled** access:
   - `GameController`
   - `CallerController`
7. Click **Save**

### 2. Object Permissions

**Problem:** Guest user doesn't have read access to the custom objects, or can't delete records.

**Solution:**
1. In the Guest User Profile, go to **Object Settings**
2. Enable the following:
   - **Game__c**: Read
   - **Game_Song_List__c**: Read
   - **Game_Song_List_Item__c**: Read
   - **Game_Song__c**: Read
   - **Game_Song_Played__c**: Read, Create, **Delete** (required for removing songs)
3. Click **Save**

**Note:** Delete permission is required for the Song Selector page to remove individual songs or clear all played songs.

### 3. Field-Level Security

**Problem:** Guest user can't access required fields.

**Solution:**
1. In the Guest User Profile, go to **Field-Level Security**
2. For each object (Game__c, Game_Song_List__c, Game_Song_List_Item__c, Game_Song__c, Game_Song_Played__c):
   - Click **View Field Accessibility**
   - Ensure all fields are set to **Readable** (and **Editable** for Game_Song_Played__c fields)
3. Required fields:
   - **Game__c**: Id, Name, Active__c, Event_Description__c, Game_Song_List__c
   - **Game_Song_List__c**: Id, Name
   - **Game_Song_List_Item__c**: Id, Game_Song_List__c, Game_Song__c, Order__c
   - **Game_Song__c**: Id, Name, Artist__c
   - **Game_Song_Played__c**: Id, Game__c, Game_Song__c, Order__c

### 4. No Active Game

**Problem:** No game record exists with `Active__c = true`.

**Solution:**
1. Go to the **Game** tab
2. Create a new Game record
3. Set **Active** checkbox to `true`
4. Optionally set **Event Description** (e.g., "Christmas Bingo 2024")
5. Save

### 5. Not Enough Songs

**Problem:** Less than 24 songs are marked as `Included_In_Game__c = true`.

**Solution:**
1. Go to the **Game Song** tab
2. Ensure at least 24 songs exist
3. For each song, ensure **Included In Game** checkbox is `true`
4. If needed, bulk update:
   - Go to **Setup** → **Data Management** → **Mass Update Records**
   - Select **Game Song** object
   - Update **Included In Game** to `true` for all records

### 6. Check Browser Console

**Problem:** Errors might be logged in the browser console but not displayed.

**Solution:**
1. Open browser Developer Tools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Look for red error messages
4. Common errors:
   - `INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY` - Object/field permissions issue
   - `NO_ACCESS_TO_ENTITY` - Apex class access issue
   - `INVALID_FIELD` - Field-level security issue

### 7. Visualforce Page Access (if using Visualforce)

**Problem:** Guest user can't access the Visualforce pages.

**Solution:**
1. In the Guest User Profile, go to **Visualforce Page Access**
2. Enable:
   - `ChristmasBingoBoard`
   - `BingoCaller`

### 8. Experience Cloud Site Settings (if using Experience Cloud)

**Problem:** Guest access not enabled or configured incorrectly.

**Solution:**
1. Go to your Experience Cloud site
2. Navigate to **Administration** → **Members** → **Public Access Settings**
3. Ensure guest access is enabled
4. Verify all permissions are granted as described above

## Quick Checklist

- [ ] Guest User Profile has Apex Class Access to `GameController` and `CallerController`
- [ ] Guest User Profile has Read access to `Game__c`, `Game_Song__c`, and `Game_Song_Played__c`
- [ ] Guest User Profile has Create access to `Game_Song_Played__c` (for caller)
- [ ] Guest User Profile has **Delete** access to `Game_Song_Played__c` (for removing songs)
- [ ] All required fields are readable in Field-Level Security
- [ ] At least one Game record exists with `Active__c = true`
- [ ] At least 24 Game Song records exist with `Included_In_Game__c = true`
- [ ] Visualforce pages are enabled for guest users (if using Visualforce)
- [ ] Experience Cloud site has guest access enabled (if using Experience Cloud)

## Testing

After making changes:
1. Clear browser cache
2. Open the site in an incognito/private window
3. Check browser console for errors
4. Verify the board loads and displays songs

## Still Not Working?

If the board is still stuck:
1. Check the browser console for specific error messages
2. Verify the error message displayed in the toast notification
3. Test with a logged-in user to see if the issue is guest-user specific
4. Check Salesforce debug logs for Apex errors:
   - Setup → Debug Logs
   - Create a new log for the Guest User
   - Reproduce the issue
   - Check the logs for errors

