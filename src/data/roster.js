// Survivor roster. story[] unlock at trust 25/50/75, heart unlocks at 100.
// portraits: 9 frames to draw per character (see docs/CHARACTERS.md).
export const PORTRAITS = ['Neutral', 'Happy', 'Angry', 'Sad', 'Shocked', 'Suspicious', 'Scared', 'Exhausted', 'Evil'];
export const ROSTER = [
  { name: 'Ravi', gender: 'M', age: 52, profession: 'Temple priest (pandit)', role: 'Medic & spiritual guide', hair: 0x14101a, shirt: 0xf28c28, pants: 0xf5f0e0, skin: 0xb87a4a, outfit: 'pandit',
    perk: 'Calm Presence: nearby survivors recover stress 15% faster; blessing gives +10% morale for a day.', stats: { health: 70, morale: 85, stress: 80, work: 55 },
    look: 'Brown skin, grey-streaked black hair, round glasses, torn saffron kurta, tulsi beads, slight stoop.',
    backstory: 'Flying to officiate his nephew\'s wedding. Lost his faith when his wife died two years ago and still performs rituals from habit.',
    story: ['"I light the lamp each dawn. Not because I believe, but because my hands remember how."', '"My wife asked me to pray for her. I did. She died anyway. I never told anyone I stopped."', '"Out here, when the others kneel beside me, I feel something again. Is that faith, or only loneliness?"'],
    heart: 'The Unlit Lamp: build a dawn shrine with him; he says his wife\'s name aloud. Reward: permanent morale aura + Blessed Shrine.',
    likes: 'Marigolds, tea, rice pudding, quiet mornings, old books', dislikes: 'Meat, loud arguments, mocking rituals',
    paranoia: 'Unburied bodies and long nights without prayer.', betrayal: 'Decides the island is cursed. Burns the storehouse and temple offerings at night and refuses to heal.',
    lines: { greet: ['Good morning! The sea is gentle today. A sign, perhaps.', 'Tea is ready. Sit, sit. No one works on an empty heart.', 'I found marigolds by the rocks. Small joys, yes?'], tired: ['I have blessed so many... who blesses the blesser?', 'Forgive me. My words are tired today.'], paranoid: ['Someone moved the offerings. Who touches what is not theirs?', 'The island is watching us. Can you not feel it?'], funeral: 'We return them to the earth with respect. Let me say the words, even if I am not sure who hears them.' } },

  { name: 'Marisol', gender: 'F', age: 34, profession: 'Agronomist / vineyard manager', role: 'Farmer', hair: 0x3a2418, shirt: 0x6aa84f, pants: 0x8a6a3a, skin: 0xc98a5a, outfit: 'apron',
    perk: 'Green Thumb: crops she tends grow 20% faster and give +1 yield.', stats: { health: 85, morale: 70, stress: 55, work: 90 },
    look: 'Tan skin, thick dark braid, hazel eyes, sun hat, green work shirt with dirt on the knees. Stands with hands on hips.',
    backstory: 'Flying home to sell her family vineyard. She secretly signed it over to a developer to pay her brother\'s debts and never told her mother.',
    story: ['"Dirt does not lie to you. People do. I like dirt."', '"I sold Papa\'s vines. I told Mama I was \'visiting\'. She thinks they are still ours."', '"If I keep this garden alive, maybe I am not the person who sold the land."'],
    heart: 'Roots: plant a vine cutting from her bag. Harvest it with her after 3 days. Reward: wine barrel + permanent crop yield bonus.',
    likes: 'Seeds, rain, strong coffee, honest work, grapes', dislikes: 'Wasted food, trampled plots, being pitied',
    paranoia: 'Hunger and failing crops. Sanity drops when food stores run low.', betrayal: 'Hoards food, burns the crop plots, and locks the storehouse while shouting that no one deserves it.',
    lines: { greet: ['The tomatoes are up! Come look, quick!', 'Morning. Water first, talk after.', 'Smell that? Rain by noon. My knees never lie.'], tired: ['My hands are cracked and the soil is stubborn. Both of us are tired.', 'Not today. Ask me again after I sit.'], paranoid: ['Who has been in my rows? Someone took berries.', 'Count the food. Count it again. It does not add up.'], funeral: 'Every harvest ends in the ground. I did not think it would be one of us.' } },

  { name: 'Dana', gender: 'F', age: 41, profession: 'Police officer (off duty)', role: 'Guard', hair: 0x1a1a22, shirt: 0x2a3f6a, pants: 0x2a2f3a, skin: 0xe8b48a, outfit: 'shirt',
    perk: 'Night Owl: no night penalty while on guard duty; +25% damage to hostile survivors and creatures.', stats: { health: 100, morale: 55, stress: 70, work: 75 },
    look: 'Pale skin, short black hair, grey eyes, navy uniform shirt, scar on left brow. Straight back, arms crossed.',
    backstory: 'Flying home from a transfer hearing. She covered for a partner who took a bribe, and a witness later vanished. She protects people to make up for it.',
    story: ['"Rule one: know where the exits are. Rule two: do not trust anyone who does not."', '"I signed a report I knew was false. A man lost his case. I still see his face."', '"If I hold the line here, maybe it counts for something back there."'],
    heart: 'Off the Record: find her lost badge in the wreck, then let her confess to you at the fire. Reward: permanent guard post and +damage aura.',
    likes: 'Order, black coffee, dogs, clear plans, night shifts', dislikes: 'Lies, surprises, being ordered around, loud arguments',
    paranoia: 'Betrayal and disorder. Drops when other NPCs go hostile or steal.', betrayal: 'Declares martial law: attacks anyone out after dark, takes the weapons from storage, and treats you as a suspect.',
    lines: { greet: ['Perimeter is quiet. Good.', 'Morning. I counted everyone twice. All here.', 'Sit by the fire, I have the watch.'], tired: ['Twenty hours on watch. Do not ask me to be polite.', 'I need ten minutes. Alone.'], paranoid: ['Where were you last night? Be specific.', 'Someone is lying to me. I always find out who.'], funeral: 'I should have been there. That is the job. I was not.' } },

  { name: 'Tomas', gender: 'M', age: 29, profession: 'Carpenter & shipyard worker', role: 'Builder', hair: 0x6b4423, shirt: 0xb03a3a, pants: 0x2f5aa8, skin: 0xd8a070, outfit: 'overalls', cap: 0x6b4a2a,
    perk: 'Heavy Lifter: gathers wood 30% faster and builds structures for 15% fewer materials.', stats: { health: 95, morale: 75, stress: 45, work: 85 },
    look: 'Tan skin, messy brown hair, stubble, brown cap, red shirt, blue overalls. Big hands, easy grin.',
    backstory: 'Flying to a new job after being fired. He built a balcony that collapsed at a party, injuring five people, and fled instead of facing it.',
    story: ['"A good joint holds forever. A bad one holds until it matters."', '"I built a balcony once. I trusted the bolts. I should have checked."', '"I build walls so no one gets hurt this time. If one fails, I do not know what I will do."'],
    heart: 'Load Bearing: rebuild the broken wall with him and let him test it himself. Reward: reinforced walls and gates.',
    likes: 'Fresh sawdust, jokes, hot food, tools, music', dislikes: 'Shoddy work, being rushed, silence at night',
    paranoia: 'Structural failure. Sanity drops when walls and fences are damaged.', betrayal: 'Tears down his own walls and gates at night "so nothing can collapse on anyone", leaving the camp open.',
    lines: { greet: ['Morning, boss! New wall goes up today.', 'Hold this. No, the other end. Perfect.', 'Heard a hammer? That was me being brilliant.'], tired: ['My back says no. My pride says one more plank.', 'Give me a minute. The saw is heavier today.'], paranoid: ['That wall is cracked. Did you crack it?', 'Everything is going to fall. Everything.'], funeral: 'Should have built something stronger. Maybe it would have held.' } },

  { name: 'Yuki', gender: 'F', age: 23, profession: 'Urban explorer / photographer', role: 'Scavenger', hair: 0xe05a8a, shirt: 0x2a2a3a, pants: 0x3a3a4a, skin: 0xf2d0b0, outfit: 'coat',
    perk: 'Sharp Eyes: finds 25% more loot and spots hidden chests and ruins from farther away.', stats: { health: 65, morale: 60, stress: 40, work: 70 },
    look: 'Pale skin, pink-dyed bob, dark eyes, black hoodie and cargo pants, cracked camera on a strap. Hunched, quick, always looking around.',
    backstory: 'Flying to photograph an abandoned city. She sold a friend\'s location to a magazine; the friend was arrested trespassing and has not spoken to her since.',
    story: ['"I collect abandoned things. Nobody comes back for them. That is the point."', '"I sold my friend\'s secret spot for a cover credit. She got arrested. I got the cover."', '"Everyone here thinks I find things. Really I am just hiding in the wreckage."'],
    heart: 'Lost and Found: recover her friend\'s memory card from the wreck. Reward: map reveal and permanent loot bonus.',
    likes: 'Ruins, candy, flash photos, shiny junk, night walks', dislikes: 'Being watched, crowds, forced small talk',
    paranoia: 'Being watched or left alone. Sanity drops when isolated or at night in dark places.', betrayal: 'Steals supplies and tools and hides them in the ruins, then disappears at night and leaves false clues.',
    lines: { greet: ['Found something shiny! Wanna see?', 'Morning. Do not move, the light is perfect.', 'The ruins are weirdly beautiful today.'], tired: ['I walked all night. Tell me it was worth it.', 'Do not talk. Just let me sit in the dark.'], paranoid: ['Something is following me. Do not look.', 'You were in my stash. Admit it.'], funeral: 'I should take a photo. I cannot. Not this one.' } }
];
