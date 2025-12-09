# 🎄 Christmas Music Bingo 🎄

A Salesforce-based Christmas Music Bingo game that allows players to play bingo using Christmas songs instead of numbers. Perfect for holiday parties, family gatherings, and festive events!

## ✨ Features

### For Players
- **Unique Bingo Boards**: Each player gets a randomly generated 5x5 bingo board on every page load
- **Mobile Optimized**: Responsive design that works great on phones, tablets, and desktops
- **Manual Marking**: Tap/click squares to mark them yourself
- **Bingo Detection**: Automatically detects when you get 5 in a row (horizontal, vertical, or diagonal) and shows a celebration animation
- **Free Center Square**: The center square is always marked as FREE
- **Christmas Theme**: Beautiful red and green color scheme with decorative backgrounds

### For Callers
- **Song Selector**: Search and filter available Christmas songs by name or artist
- **One-Click Marking**: Simply click a song to mark it as played
- **Caller Display**: Large-screen optimized display showing the last called song with flash animation
- **Played Songs List**: View all songs that have been played in a horizontal grid
- **Song Management**: Remove individual songs or clear all played songs
- **Real-time Updates**: Changes appear instantly on all player boards

## 🎯 Use Cases

- Family Christmas parties
- Office holiday events
- School Christmas celebrations
- Community holiday gatherings
- Virtual Christmas parties

## 🚀 Quick Start

### Prerequisites

- Salesforce org (Production, Sandbox, or Developer Edition)
- Salesforce CLI installed ([Install Guide](https://developer.salesforce.com/tools/salesforcecli))
- Experience Cloud or Sites enabled in your org

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ChristmasMusicBingo.git
   cd ChristmasMusicBingo
   ```

2. **Authenticate to your Salesforce org**
   ```bash
   sfdx auth:web:login -a YourOrgAlias
   ```

3. **Deploy the package**
   ```bash
   sfdx force:source:deploy -p force-app -u YourOrgAlias
   ```

4. **Set up the application**
   - Follow the [Complete Setup Guide](SETUP_GUIDE.md) for detailed instructions
   - Create a Salesforce Site and configure custom domain
   - Set up guest user permissions
   - Create initial game data

## 📋 Setup Steps Overview

1. **Deploy Components** - Deploy all custom objects, Apex classes, and Lightning Web Components
2. **Create Salesforce Site** - Set up a site to host the Visualforce pages
3. **Configure Custom Domain** - Set up domain for external guest user access
4. **Set Guest Permissions** - Grant necessary permissions to guest users to the Apex classes & custom objects
5. **Create Game Data** - Create at least one active Game and 24+ Game Songs (recommend 75 songs)
6. **Test & Play!** - Access the pages and start playing, using a spotify playlist that matches the game data.

For detailed setup instructions, see:
- **[Complete Setup Guide](SETUP_GUIDE.md)** - Comprehensive setup instructions
- **[Visualforce Setup Guide](VISUALFORCE_SETUP.md)** - Visualforce-specific details
- **[Deployment Guide](DEPLOYMENT.md)** - Deployment instructions
- **[Guest User Troubleshooting](GUEST_USER_TROUBLESHOOTING.md)** - Common issues and solutions

## 🎮 How to Play

### For Players

1. Navigate to the **Bingo Board** page (e.g., `https://yourdomain.com/ChristmasBingoBoard`)
2. You'll see a unique 5x5 bingo board with Christmas songs
3. As songs are called, click/tap the corresponding square on your board
4. When you get 5 in a row (horizontal, vertical, or diagonal), a celebration animation appears!

### For Callers

1. Use the **Song Selector** page to search for and select songs
2. Click a song to mark it as played
3. Display the **Caller Display** page on a TV or projector for all players to see
4. The last called song appears with a flash animation, then moves to the played songs list

## 📁 Project Structure

```
ChristmasMusicBingo/
├── force-app/main/default/
│   ├── applications/          # Custom Salesforce app
│   ├── aura/                 # Aura apps for Lightning Out
│   ├── classes/              # Apex controllers
│   │   ├── GameController.cls
│   │   └── CallerController.cls
│   ├── lwc/                  # Lightning Web Components
│   │   ├── christmasBingoBoard/
│   │   ├── bingoCaller/
│   │   └── songSelector/
│   ├── objects/              # Custom objects
│   │   ├── Game__c/
│   │   ├── Game_Song__c/
│   │   └── Game_Song_Played__c/
│   ├── pages/                # Visualforce pages
│   │   ├── ChristmasBingoBoard.page
│   │   ├── BingoCaller.page
│   │   └── SongSelector.page
│   ├── staticresources/      # App icon
│   └── tabs/                 # Custom object tabs
├── SETUP_GUIDE.md            # Complete setup instructions
├── VISUALFORCE_SETUP.md      # Visualforce-specific setup
├── DEPLOYMENT.md              # Deployment guide
└── GUEST_USER_TROUBLESHOOTING.md  # Troubleshooting guide
```

## 🛠️ Components

### Custom Objects
- **Game__c**: Represents a bingo game session
- **Game_Song__c**: All available Christmas songs
- **Game_Song_Played__c**: Tracks which songs have been played and in what order

### Lightning Web Components
- **christmasBingoBoard**: Player's interactive bingo board
- **bingoCaller**: Read-only display for showing played songs (TV/projector)
- **songSelector**: Caller's interface for selecting and marking songs

### Apex Classes
- **GameController**: Handles board generation and game state
- **CallerController**: Handles marking songs, removing songs, and clearing played songs

### Visualforce Pages
- **ChristmasBingoBoard.page**: Player's bingo board page
- **BingoCaller.page**: Caller's display board of which songs have been played
- **SongSelector.page**: Caller's song selection interface to select song that played

## 🔧 Configuration

### Minimum Requirements
- **1 Active Game**: Create a Game record with `Active__c = true`
- **24+ Songs**: Create at least 24 Game Song records with `Included_In_Game__c = true`
- **Salesforce Site**: Configure a site with custom domain for external access
- **Guest User Permissions**: Grant Read, Create, and Delete permissions on custom objects and apex classes

### Customization
- **Event Description**: Set `Event_Description__c` on the Game record to customize the heading
- **Songs**: Add as many Christmas songs as you want (minimum 24)
- **Styling**: Customize colors and styling in the Visualforce page CSS

## 🌐 Access URLs

After setup, your pages will be accessible at:

- **Bingo Board**: `https://yourdomain.com/ChristmasBingoBoard`
- **Caller Display**: `https://yourdomain.com/BingoCaller`
- **Song Selector**: `https://yourdomain.com/SongSelector`

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions with custom domain configuration
- **[VISUALFORCE_SETUP.md](VISUALFORCE_SETUP.md)** - Visualforce-specific setup details
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Step-by-step deployment guide
- **[GUEST_USER_TROUBLESHOOTING.md](GUEST_USER_TROUBLESHOOTING.md)** - Common guest user issues and solutions

## 🐛 Troubleshooting

### Common Issues

**"No active game found"**
- Ensure you have a Game record with `Active__c = true`
- Only one game should be active at a time

**"Not enough songs error"**
- Create at least 24 Game Song records with `Included_In_Game__c = true`

**Permission errors**
- Check Guest User Profile permissions (see [SETUP_GUIDE.md](SETUP_GUIDE.md))
- Verify Apex class access is enabled
- Ensure Delete permission is granted for `Game_Song_Played__c`

**Pages not accessible**
- Verify the site is Active
- Check custom domain configuration
- Verify pages are added to site's Public Access Settings

For more troubleshooting help, see [GUEST_USER_TROUBLESHOOTING.md](GUEST_USER_TROUBLESHOOTING.md).

## 🎨 Features in Detail

### Bingo Detection
- Automatically detects 5 in a row (horizontal, vertical, or diagonal)
- Includes the free center square in detection
- Only triggers when manually clicking a square (not auto-marked)
- Shows a celebration animation when bingo is achieved

### Real-time Updates
- Caller Display polls for new songs every few seconds
- Last called song appears with flash animation
- Auto-scrolls to newly added songs
- Optimized for large displays (1920px+, 2560px+)

### Mobile Optimization
- Responsive design works on all screen sizes
- Touch-friendly interface
- Optimized for phones and tablets
- Christmas-themed decorative backgrounds

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available for use in your Salesforce orgs.

## 🙏 Acknowledgments

Built with ❤️ for Christmas celebrations everywhere!

---

**Happy Holidays! 🎅🎄🎁**
