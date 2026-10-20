# Kitty Cat Run

A browser game for young kids. A cat eats every treat in a room, the sleeping mouse wakes up, and
the cat runs over to say hi. Play it at https://deloy4.github.io/kitty-cat-run/ in Chrome or Safari
on a computer or an iPad. There is no build step: `index.html` also runs straight from the folder,
and GitHub Pages serves the `main` branch as it is, so pushing to `main` updates the site.

The movement comes from the Jetpack Christmas Special rebuild (`../../REA/targets/jetpack-christmas/rebuild`),
with the same walking, climbing, flying and gravity, and the same frame rate of 31.6 frames a second.
The cat climbs cat posts where Santa climbed ladders. Yarn balls fill a yarn meter, the way fuel
tanks filled the jetpack, and with yarn the cat's tail spins like a helicopter and it flies. A paw
swipe knocks boxes away where the Phase Shifter tunnelled through brick, and swiped boxes stay gone.
The exit is a mouse instead of a door, and the robot that chased Santa is now a dog.

## The thirty rooms

Each level has its own cat and mouse colour, always in the same order: Pumpkin the orange tabby,
Smokey the grey tabby, Midnight the black cat, Snowball the white cat, Tux the tuxedo, Patches the
calico, Butterscotch the cream cat, Cocoa the brown tabby, Luna the Siamese, and Candy, the pink and
blue striped kitten from the reference picture. Rooms 11 to 20 bring Ginger the orange and white cat,
Bluebell the Russian Blue, Tortie the tortoiseshell, Silver the silver tabby, Socks the grey and white
cat, Mocha the chocolate cat, Sunny the flame point Siamese, Domino the black and white cat, Lilac,
and Sprinkles, a lavender and mint striped kitten. Rooms 21 to 30 bring Cinnamon the cinnamon tabby,
Peaches the peach and white cat, Frost the blue point Siamese, Pepper the dark grey tabby, Maple the
maple calico, Biscuit the fawn cat, Clover the soft grey calico, Hazel the golden tabby, Mittens the
brown and white cat, and Twinkle, a lemon and sky striped kitten. The mice go grey, brown, white, tan,
charcoal, fawn, cinnamon, silver, chocolate, cream, agouti, lilac, champagne, blue, black, dove, ivory,
smoke, honey, pearl, russet, snow, ash, caramel, peach, slate, butter, mink, rose and sable.

| Level | Room | What it adds |
| --- | --- | --- |
| 1 | The Kitchen | Walking, cat posts and treats |
| 2 | The Living Room | Boxes to swipe, a box floor to drop through, small hops |
| 3 | The Laundry Room | Yarn and flying, the first dog |
| 4 | Bath Time | A sprinkler and its pounce button, a sprinkler with no button, slippery floors |
| 5 | The Garden | Cactus pots, a gap to jump, a bone that makes the dog sit |
| 6 | The Playroom | Tunnels, treadmills, bouncy balls |
| 7 | The Attic | A maze of boxes, robot vacuums |
| 8 | The Garage | Sticky tape, two dogs, sprinklers on two floors |
| 9 | Bedtime | Floating pillows that need flying |
| 10 | The Whole House | A bit of everything |
| 11 | The Pantry | Boxes, sticky tape and a dog together |
| 12 | The Sunroom | Long slippery floors with cactus pots and a vacuum |
| 13 | The Library | The top floor only through a tunnel |
| 14 | The Music Room | Two sprinklers whose buttons are on other floors, bouncy balls |
| 15 | The Greenhouse | Flying between floating hedges with cactus pots on them |
| 16 | The Craft Room | A tall box wall and box floors |
| 17 | The Basement | Two sprinklers pressed in order, a dog and a vacuum |
| 18 | The Treehouse | Two tall trunks to climb, balls on the branches |
| 19 | The Snowy Porch | Ice on every floor |
| 20 | The Rooftop | A bit of everything again, three hazards at once |
| 21 | The Front Hall | Keys and gates: the red key opens the way to the gold key |
| 22 | The Mud Room | Cat flaps, one way only, around a loop the dog can't follow |
| 23 | The Closets | Three keys locked inside each other, behind a sprinkler and boxes |
| 24 | The Dining Room | A one-way ring of flaps that has to be gone round twice |
| 25 | The Night Lights | The light switch, which swaps the pink and mint blocks |
| 26 | The Workshop | A mint bridge for the red key, a pink bridge to the mouse |
| 27 | The Cellar | A maze of flaps and three gates, two laps of it |
| 28 | The Clock Tower | Two bridges that are never there together, two switches |
| 29 | The Secret Garden | Keys, flaps, a tunnel and three flips of the switch |
| 30 | The Toy Castle | Everything, with a switch up on a shelf |

From room 21 on, the rooms are mazes with locks. A key opens every gate of its colour (red, gold or
purple) for the rest of the room. A cat flap in a wall only swings the way its arrow points, and dogs
and vacuums don't fit through one, so a flap can keep the dog out. Each time the cat walks onto a light
switch, the pink blocks and the mint blocks swap: the solid ones open and the open ones (a dashed
outline) fill in. Pink starts solid. Every level card from room 21 on has a one-line tip.

The cat starts with 5 lives and gets another one every 1000 points or from a heart. Being caught by
the dog, the vacuum or a ball, or touching a cactus, costs a life and starts the room over. Esc does
the same when a kid gets stuck. Now and then a bubble (the cat is safe for a while), a bone (dogs
sit, the vacuum stops and the balls hold still) or a yarn ball pops up somewhere in the room.

## The lives cheat

Typing KITTY on the keyboard, or tapping the hearts at the bottom five times within two seconds on
an iPad, gives five more lives, with a "+5 lives!" on screen. It works on the level card and during
play. Like the original game's cheat keys (Tab and 2 held, then L for a life, F for a full yarn meter,
I for the bubble or N to skip the room), it keeps that game off the high score board.

## Controls

The arrows walk and climb. Space or Z jumps, and flies while there is yarn in the meter. X or Enter
swipes; with no arrow held it swipes the way the cat faces, and Up or Down swipes above or below.
Walking onto a pounce button presses it. Down inside a tunnel goes through. P pauses, M turns the
sound off, and + and − change the speed. On an iPad, buttons appear under the game.

## High scores

The board is the shared `arcade-scores` Supabase project that Jetpack Christmas and Graveyard
Gridiron use, under the game name `kitty-cat-run` (added 2026-10-18, scores up to 999999).
`leaderboard.js` is the same file as in those two repos, so copy any change to it across. Games where
a cheat key was used don't post a score.

## Files

- `index.html`, the page and the touch buttons.
- `levels.js`, the thirty rooms drawn as text, with the key to every character at the top. Edit a room
  there and run the level check.
- `art.js`, all the drawing: rooms, cats, mice, the dog, the vacuum, the ball and everything else.
- `game.js`, the rules, the sounds and the screens.
- `leaderboard.js`, the shared high score board.
- `tools/check-levels.js`, checks every treat and the mouse can be reached in each room, and that the
  cat can't get stuck anywhere it can no longer finish, such as behind a flap or on the wrong side
  of the switch (`node tools/check-levels.js`). With `--needs` it also lists the keys, buttons and
  switches a room can't be finished without, which shows a lock really is a lock.
- `tools/fuzz.js`, random play on every room, checking nothing breaks (`node tools/fuzz.js`).
- `tools/sim.js`, plays a room with a key script and prints where the cat is.
- `tools/gallery.html`, every cat in every pose and the rest of the art, drawn big.

For testing in a browser, `index.html?level=4` starts that room straight away (and counts as a cheat,
so no score is posted).
