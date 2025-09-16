const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const fs = require("node:fs");
const readline = require("readline");
let { colours, weapons, legends } = require("./patterns.json");
const { fetchUncategorized } = require("./fetch_uncategorized.js")

// const getMP3Duration = require('get-mp3-duration');

// const uiImages = require("./uiImages.json");

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY)
		process.stdin.setRawMode(true);

console.log("press q to exit, or any key to print log")

process.stdin.on("keypress", (chunk, key) => {
	if(key && key.name == "q"){
	console.log('"q" received; Exiting');
		exit();
	}
});

let interval,
	done = [];

function exit(){
	clearInterval(interval)
	fs.writeFileSync("done.log", JSON.stringify(done))
	console.trace()
	process.exit()
}

function sortAndJoin(aset){
	return [...aset].sort().join("\n")
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms, "sleep"));
}

void async function(){
	console.log("Logging in")

	const bot = await Mwn.init({
		apiUrl: "https://brawlhalla.wiki.gg/api.php",
	
		...credentials,
	
		defaultParams: {
			assert: "user" // ensure we're logged in
		}
	});

	console.log("Logged in")

	console.log("Enabling Emergency Shutoff")
	await bot.enableEmergencyShutoff({
		// The name of the page to check
		page: "User:VALKRI_Mk_2/shutoff",
	
		// check shutoff page every 5 seconds
		intervalDuration: 5000,
		
		// function to determine whether the bot should continue to run or not
		// If returns true, the bot continues to run. Else, onShutoff is called
		condition: (pagetext) => pagetext.length > 2,
		
		// function to trigger when shutoff is activated
		onShutoff: (_pagetext) => {
			console.log("Emergency Shutoff Triggered; Stopping")
			exit()
		}
	});
	console.log("Emergency Shutoff activated")

	let pagesList = `The Boulders Classic Colors.png
The Claymores Classic Colors.png
The Heavyweights Classic Colors.png
The Mittens Classic Colors.png
The Punchlines Classic Colors.png
The Taggers Classic Colors.png
Treble Makers Classic Colors.png
Vampiric Embrace Classic Colors.png
Wave Breakers Classic Colors.png
Winter's Grasp Classic Colors.png
Wipeouts Classic Colors.png
Wooden Knuckles Classic Colors.png
Wrecking Crew Classic Colors.png
Axe-bladed Multi-Tool Classic Colors.png
Bellow's Breath Classic Colors.png
Ceremonial Axe Classic Colors.png
Chopsicle Classic Colors.png
Darkheart Axe Classic Colors.png
Dimensional Divide Classic Colors.png
Disgrace Classic Colors.png
El Carnicero Classic Colors.png
Emerald Blade Classic Colors.png
Eternal Blade Classic Colors.png
Fate Cleaver Classic Colors.png
Gear Death Experience Classic Colors.png
Glory Classic Colors.png
Golem's Heart Classic Colors.png
Hack and Slash Classic Colors.png
Heartbreaker Classic Colors.png
Heaven Cleaver Classic Colors.png
Hit Hard Classic Colors.png
Holiday Fear Classic Colors.png
Hook Setter Classic Colors.png
In Case of Brawl Classic Colors.png
Ivaldi's Wings Classic Colors.png
Jade Crescent Classic Colors.png
Magni Classic Colors.png
Mortal Coil Classic Colors.png
Painkiller Classic Colors.png
Panic Maker Classic Colors.png
Phoenix Wings Classic Colors.png
Rick's Hatchet Classic Colors.png
Ritual Blade Classic Colors.png
Spitebringer Classic Colors.png
The Furnace Classic Colors.png
The Mountain Classic Colors.png
The Renegade Classic Colors.png
The Test Classic Colors.png
Tusk Classic Colors.png
World Cleaver Classic Colors.png
Bitrate Blade Black.png
Bitrate Blade Blue.png
Bitrate Blade Brown.png
Bitrate Blade Charged OG.png
Bitrate Blade Coat of Lions.png
Bitrate Blade Community Colors.png
Bitrate Blade Cyan.png
Bitrate Blade Esports v.2.png
Bitrate Blade Esports.png
Bitrate Blade Frozen Forest.png
Bitrate Blade Gala.png
Bitrate Blade Goldforged.png
Bitrate Blade Green.png
Bitrate Blade Grey.png
Bitrate Blade Haunting.png
Bitrate Blade Heatwave.png
Bitrate Blade Home Team.png
Bitrate Blade Lovestruck.png
Bitrate Blade Lucky Clover.png
Bitrate Blade Orange.png
Bitrate Blade Pink.png
Bitrate Blade Purple.png
Bitrate Blade Red.png
Bitrate Blade Skyforged.png
Bitrate Blade Soul Fire.png
Bitrate Blade Sunset.png
Bitrate Blade Synthwave.png
Bitrate Blade Verdant Bloom.png
Bitrate Blade White.png
Bitrate Blade Winter Holiday.png
Bitrate Blade Yellow.png
Demon's Malice Black.png
Demon's Malice Blue.png
Demon's Malice Brown.png
Demon's Malice Charged OG.png
Demon's Malice Coat of Lions.png
Demon's Malice Community Colors.png
Demon's Malice Cyan.png
Demon's Malice Esports v.2.png
Demon's Malice Esports.png
Demon's Malice Frozen Forest.png
Demon's Malice Gala.png
Demon's Malice Goldforged.png
Demon's Malice Green.png
Demon's Malice Grey.png
Demon's Malice Haunting.png
Demon's Malice Heatwave.png
Demon's Malice Home Team.png
Demon's Malice Lovestruck.png
Demon's Malice Lucky Clover.png
Demon's Malice Orange.png
Demon's Malice Pink.png
Demon's Malice Purple.png
Demon's Malice Red.png
Demon's Malice Skyforged.png
Demon's Malice Soul Fire.png
Demon's Malice Sunset.png
Demon's Malice Synthwave.png
Demon's Malice Verdant Bloom.png
Demon's Malice White.png
Demon's Malice Winter Holiday.png
Demon's Malice Yellow.png
Galactic Gavel Classic Colors.png
Gemini's Wrath Classic Colors.png
Infinite & Absolute Classic Colors.png
Jupiter Rising Classic Colors.png
Photon Sphere Classic Colors.png
Retrograde Rocket Classic Colors.png
Sagittarius Crescent Classic Colors.png
Singularity Sickle Classic Colors.png
The Big Bang Classic Colors.png
Twilight Cleaver Classic Colors.png
Twin Solstice Classic Colors.png
Zenith Daggers Classic Colors.png
Core Collapse Classic Colors.png
Thermal Runaway Classic Colors.png
Cygnus Level 1 Classic Colors.png
Cygnus Level 2 Classic Colors.png
Cygnus Level 3 Classic Colors.png
Quasar Level 1 Classic Colors.png
Quasar Level 2 Classic Colors.png
Quasar Level 3 Classic Colors.png
Bitrate Blade Starlight Level 2.png
Half-Halberd Starlight.png
Pavonini Talon Gray.png
Elder Wild Ragnir Lovestruck.png
Elder Wild Ragnir Lucky Clover.png
Elder Wild Ragnir Orange.png
Elder Wild Ragnir Pink.png
Elder Wild Ragnir Purple.png
Elder Wild Ragnir Red.png
Elder Wild Ragnir Skyforged.png
SkinIcon EzioClassic.png
Goldforged Hammer Pact of Poison.png
Fists Pact of Poison.png
Teatime Scarlet Classic Colors.png
Spear Mega Wrench Classic Colors 1 135x183.png
SEVEN Firefighter Seven Classic Colors Idle 1 208x177.png
SEVEN Tinyfigure Seven Classic Colors Idle 1 197x196.png
Golden Gears Armageddon.png
Venom Spitters Armageddon.png
Malady Wear Armageddon.png
Orb Sealed Infernum Armageddon 1 1281x1435.png
Orb Searing Sphere Armageddon 1 1035x1279.png
Orb Shot Caller Armageddon 1 1044x1280.png
Orb Sidekick Souvenir Orb Armageddon 1 1187x1281.png
Orb Sleeping Demon Armageddon 1 1186x1280.png
Orb Snarler Armageddon 1 1193x1282.png
Orb Snow Globe Armageddon 1 1187x1281.png
Orb Soul Battery Armageddon 1 1163x1281.png
Orb Stone of Malice Armageddon 1 1217x1279.png
Orb Terra Firma Armageddon 1 1281x937.png
Orb The Last Ride Armageddon 1 995x1280.png
Orb The Giver's Grasp Armageddon 1 1331x1280.png
Orb The Obol Armageddon 1 1250x1279.png
Orb The Unblinking Armageddon 1 1279x1190.png
Orb Vial of Crows Armageddon 1 1279x1274.png
Orb Von Evilstein's Heart Armageddon 1 1247x1280.png
Orb Whitewater Gem Armageddon 1 1280x1240.png
Orb Tiercel Orb Armageddon 1 1279x1306.png
Blasters of Mercy Classic Colors.png
Boots of Mercy Classic Colors.png
Greatsword of Mercy Classic Colors.png
Hardlight Blasters Classic Colors.png
Sword of Mercy Classic Colors.png
Wasteland Treaders Classic Colors.png
Hardlight Greatsword Classic Colors.png
Orb of Mercy Classic Colors.png
Sealed Infernum Classic Colors.png
MK Katana Team Yellow.png
Neon Surfer Esports v.5.png
Obi-Wan's Lightsaber Esports v.5.png
Obsidian Edge Esports v.5.png
Sprocketeer Esports v.5.png
Bowcaster & E-11 Blaster Ancient Curse.png
DL-44 Pistol & E-11 Blaster Ancient Curse.png
IB-94 Pistol & E-11 Blaster Ancient Curse.png
Snake Eyes Ancient Curse.png
VM-19 Pistol & E-11 Blaster Ancient Curse.png
Corellian Flight Gloves Ancient Curse.png
Haunting Terrors level 2 Ancient Curse.png
MPL Rocket Launcher Ancient Curse.png
Scrapyard Bruiser Pool Party.png`.split("\n").map(e => `File:${e}`)
	console.log(pagesList)

	bot.batchOperation(
		pagesList,
		(page, _idx) => {
			return Promise.race([bot.edit(page, (rev) => {
                let content = rev.content.trim()
				return !(/\{\{\s*delete/i.test(content)) && ({
					// return parameters needed for [[mw:API:Edit]]
					text: content? `{{delete|Duplicate file}}

${content}` : "{{delete|Duplicate file}}",
					summary: "Unused file marked for deletion",
					minor: true
				})
			}).then(() => done.push(page)).catch(err => console.log(err)), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 3750))
			// return Promise.resolve("Skipped")
		},
		/* concurrency */ 3,
		/* retries */ 2
	).then(exit);

	interval = setInterval(() => {
		fs.writeFileSync("done.log", JSON.stringify(done))
	}, 10000)
}()