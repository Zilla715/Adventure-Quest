PlayQuest Demo

What this is
A working web page that stands in for the phone app. It runs in any phone browser. No app store install is needed to prove the concept. A tag tap opens this page, the page speaks the next clue out loud, and it tracks your progress through the ten tag locations.

Files in this folder
index.html   the page
styles.css   the look
playquest.js the game logic
manifest.json lets a phone add this to the home screen like a real app icon
icon.svg     the home screen icon
urls_template.csv  the ten URLs you will write onto your tags
README.txt   this file

Step 1, host the folder
Put all six files on any free static site host. GitHub Pages, Netlify, or Vercel all work and are free. Once hosted you will have one real web address, for example
https://yourname.github.io/playquest

Step 2, fill in the CSV
Open urls_template.csv and replace YOURDOMAIN with your real address from step 1. Keep the rest of each line the same.

Step 3, write the NFC tags
Use an NFC writing app on an Android phone, such as NFC Tools. Write each row from the CSV as a URL record onto one tag. You need ten tags, one per row. Plastic or wood mounting is fine. Avoid taping a tag directly onto metal, since metal can block the read.

Step 4, add it to your phone as an app
Open the hosted page in your phone browser, then use Add to Home Screen. This gives you an app icon and a full screen view with no browser bar, so it feels like a real installed app during the demo.

Step 5, pick a game and go
Open the app, pick a game from the dropdown, and tap Start. Then walk to the playground and tap tags in the order the game calls for. The page speaks each clue and buzzes the phone on a correct or wrong tap.

Note on tags and games
Each tag URL only carries the playground ID and the location code, not a fixed game. This means the same ten tags work for all five games in this demo. The game itself is chosen inside the app before you start walking. This is the simplest setup and it is what the CSV in this folder gives you.

Testing without tags
Open the Demo controls section on the game screen. It has buttons to simulate a correct tap, a wrong tap, or jump straight to the finish. Use this to check the flow before you have tags in hand.

If audio does not play
Tap the Play clue button once. Some phone browsers need one tap on the page before they allow audio to play on their own.

What this demo does not do
It does not use real NFC hardware inside the browser. The tag itself is what does the work, by opening a URL. It does not store data anywhere but your own phone browser, so progress will not show up on another phone or in a shared dashboard. It is meant to prove the idea, not to be the final built app.
