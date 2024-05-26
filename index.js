const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
let pagesList = [];
const fs = require("node:fs");
const readline = require("readline");
let { colours, weapons, legends } = require("./patterns.json");

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

	const pagesList = [
		"File:Cannon_The_Big_Bang_Esports_v.5_1_983x1280.png",
		"File:Cannon_Tactical_Cannon_Esports_v.5_1_821x1280.png",
		"File:Cannon_Swamp_Serum_Esports_v.5_1_905x1280.png",
		"File:Cannon_Stryge_Esports_v.5_1_915x1280.png",
		"File:Cannon_Stalwart_Screech_Esports_v.5_1_1090x1280.png",
		"File:Cannon_SPNKr_Rocket_Launcher_Esports_v.5_1_861x1281.png",
		"File:Cannon_Sonic_Boom_Esports_v.5_1_1092x1280.png",
		"File:Cannon_Snowsmoke_Esports_v.5_1_986x1280.png",
		"File:Cannon_Royal_Decree_Esports_v.5_1_923x1281.png",
		"File:Cannon_Royal_Allegiance_Esports_v.5_1_966x1281.png",
		"File:Cannon_RGB_Cannon_Esports_v.5_1_959x1280.png",
		"File:Cannon_Revolver_Cannon_Esports_v.5_1_1067x1280.png",
		"File:Cannon_Railgun_Esports_v.5_1_1076x1280.png",
		"File:Cannon_Pyrois_Blast_Esports_v.5_1_1056x1280.png",
		"File:Cannon_Power_Flash_Esports_v.5_1_892x1280.png",
		"File:Cannon_Plasma_Cannon_Esports_v.5_1_883x1279.png",
		"File:Cannon_Orchard_Barrel_Esports_v.5_1_895x1281.png",
		"File:Cannon_Optimized_Odzutsu_Esports_v.5_1_914x1280.png",
		"File:Cannon_Ol'_Faithful_Esports_v.5_1_937x1280.png",
		"File:Cannon_Nightmare_Mandible_Esports_v.5_1_981x1279.png",
		"File:Cannon_Modern_Thunder_Esports_v.5_1_910x1281.png",
		"File:Cannon_Mk1_Cannon_Esports_v.5_1_1119x1280.png",
		"File:Cannon_Mammothade_Cooler_Esports_v.5_1_954x1280.png",
		"File:Cannon_Locker_Boom_Esports_v.5_1_994x1281.png",
		"File:Cannon_Laser_Light_Cannon_Esports_v.5_1_974x1280.png",
		"File:Cannon_Koi_Cannon_Esports_v.5_1_1110x1280.png",
		"File:Cannon_Kanabo_Esports_v.5_1_979x1280.png",
		"File:Cannon_Jade_Dragon_Esports_v.5_1_1024x1281.png",
		"File:Cannon_Howling_Siren_Esports_v.5_1_1309x1281.png"
	]

	const pat = new RegExp(`File:(${weapons.join("|").replaceAll(" ", "_")})_(.+)_(${colours.join("|").replaceAll(" ", "_")})_\\d+_\\d+x\\d+.png`, "i");

	/*
	
	If there are too many requests, instead of retrying, this bot will just skip renaming.
	To fix this (in the future), after the batchOperation is "done", check how many pf the
	pages were actually renamed, and remove those from the pageList and retry. Keep retrying
	for as long as the pageList shrinks.
	
	*/

	bot.batchOperation(
		pagesList,
		(page, idx) => {
			let exec = pat.exec(page),
				newPage = `File:${exec[2]}_${exec[3]}.png`;
			return Promise.race([bot.move(page, newPage, "Fixed name", {
				movesubpages: true,
				movetalk: true
			}).catch(err => console.log(err)).then(() => done.push(page)), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 2750))
		},
		1,//* concurrency */ 3,
		/* retries */ 2
	).then(exit);

	interval = setInterval(() => {
		fs.writeFileSync("done.log", JSON.stringify(done))
	}, 10000)
}()