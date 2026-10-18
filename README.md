# Kitty Cat Run

A browser game for young kids. A cat eats every treat in a room, the sleeping mouse wakes up, and
the cat runs over to say hi. It plays on Chrome or Safari on a computer or an iPad, and there is no
build step: open `index.html`.

The movement comes from the Jetpack Christmas Special rebuild (`../../REA/targets/jetpack-christmas/rebuild`),
with the same walking, climbing, flying and gravity, and the same frame rate of 31.6 frames a second.
The cat climbs cat posts where Santa climbed ladders. Yarn balls fill a yarn meter, the way fuel
tanks filled the jetpack, and with yarn the cat's tail spins like a helicopter and it flies. A paw
swipe knocks boxes away where the Phase Shifter tunnelled through brick, and swiped boxes stay gone.
The exit is a mouse instead of a door, and the robot that chased Santa is now a dog.

## The ten rooms

Each level has its own cat and mouse colour, always in the same order: Pumpkin the orange tabby,
Smokey the grey tabby, Midnight the black cat, Snowball the white cat, Tux the tuxedo, Patches the
calico, Butterscotch the cream cat, Cocoa the brown tabby, Luna the Siamese, and Candy, the pink and
blue striped kitten from the reference picture. The mice go grey, brown, white, tan, charcoal,
fawn, cinnamon, silver, chocolate and cream.

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

The cat starts with 5 lives and gets another one every 1000 points or from a heart. Being caught by
the dog, the vacuum or a ball, or touching a cactus, costs a life and starts the room over. Esc does
the same when a kid gets stuck. Now and then a bubble (the cat is safe for a while), a bone (dogs
sit, the vacuum stops and the balls hold still) or a yarn ball pops up somewhere in the room.

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
- `levels.js`, the ten rooms drawn as text, with the key to every character at the top. Edit a room
  there and run the level check.
- `art.js`, all the drawing: rooms, cats, mice, the dog, the vacuum, the ball and everything else.
- `game.js`, the rules, the sounds and the screens.
- `leaderboard.js`, the shared high score board.
- `tools/check-levels.js`, checks every treat and the mouse can be reached in each room
  (`node tools/check-levels.js`).
- `tools/fuzz.js`, random play on every room, checking nothing breaks (`node tools/fuzz.js`).
- `tools/sim.js`, plays a room with a key script and prints where the cat is.
- `tools/gallery.html`, every cat in every pose and the rest of the art, drawn big.

For testing in a browser, `index.html?level=4` starts that room straight away (and counts as a cheat,
so no score is posted).
