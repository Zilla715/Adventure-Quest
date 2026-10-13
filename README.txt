PlayQuest Demo, fun edition

What this is
A working web page that stands in for the phone app. A tag tap opens this page, the page speaks the next clue out loud, and it tracks your progress through ten tag locations. This version adds a 3 2 1 GO start, points and streaks, a countdown ring in Power Outage, character icons, confetti, stars and badges.

Files
index.html          the page
styles.css          the look
playquest.js        the game logic
manifest.json       lets a phone add this to the home screen
icon.svg            the home screen icon
urls_template.csv   the ten URLs for your tags
README.txt          this file

Updating GitHub
Open your repository and click Add file, then Upload files. Drag in all the files from this folder, including the ones that already exist. Click Commit changes. GitHub Pages updates in a minute or two. Then reload the page on your phone. If you still see the old look, close the tab and open it again.

Your tags do not change
The tag URLs use the same format as before, so any tags you already wrote still work. Only urls_template.csv changed in a small way and you do not need to replace your edited copy.

Games
Rescue the Playground Critters   find six hiding critters by clue
Power Outage                     30 seconds per step with a countdown ring
High and Low Challenge           exact order, no skipping
The Great Playground Loop        the floor is lava, keep moving
Memory Mode                      ten secret numbers, a wrong tag reveals its number

Scoring
100 points for each correct tag. A streak adds 25 more for each tag in a row, up to 125 extra. Power Outage adds 3 points for each second left. A hint costs 50 points. Finishing adds 250. A run with no mistakes adds another 250. Stars are 3 for no mistakes, 2 for one or two mistakes, and 1 for more.

Think games and Run games
Each game tile is labeled Think or Run. Think games are clue and puzzle games, so players walk and climb. Run games are about speed, so the phone stays in the pocket the whole time. Right now Think games are Critters, High and Low, and Memory. Run games are Power Outage and the Playground Loop.

Put the phone in your pocket
After every clue the app says to put the phone in your pocket. About 6 seconds later the screen locks itself, which turns it black and ignores all touches so nothing gets tapped by accident. The sound and voice keep playing. Take the phone out only at the next tag, tap it, and the black screen flashes green for right or red for wrong.
Auto pocket can be switched off with the Auto pocket button on the game screen. It never locks while sound is off or while a Tap to hear the clue banner is showing, because then the screen is the only clue.
To unlock the screen, press and hold anywhere for 2 seconds. While locked, the clue repeats every 25 seconds.
Keep in mind the phone still has to be near each tag to read it, so it has to come out of the pocket at each tag.

Safety
Do not run while holding the phone. Use an arm strap or a neck lanyard pouch, or let a grown up carry it.

Important limits of a web demo
Browsers often block a web page from speaking until the screen has been touched at least once. If a tag opens the page and you hear nothing, a big Tap to hear the clue button appears. Tap it once. A real app would not have this limit.
Progress is stored in the phone browser only. It does not show up on another phone.
Avoid placing tags directly on metal. Plastic and wood are fine.

Testing without tags
Open Demo controls on the game screen. It has buttons to simulate a correct tap, a wrong tap, or jump to the finish.
