const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
let pagesList = [];
const fs = require("node:fs");
const readline = require("readline");
let { colours, weapons, legends } = require("./patterns.json");

const getMP3Duration = require('get-mp3-duration');

const uiImages = require("./uiImages.json");

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

	const catlist = [
		{
			"from": "Category:Achievement Images",
			"to": "Category:Achievement images"
		},
		{
			"from": "Category:Animated Avatars",
			"to": "Category:Animated avatar images"
		},
		{
			"from": "Category:Animated KO Images",
			"to": "Category:Animated KO images"
		},
		{
			"from": "Category:Character images",
			"to": "Category:Legend images"
		},
		{
			"from": "Category:Chest Borders",
			"to": "Category:Chest border images"
		},
		{
			"from": "Category:Chest Tiles",
			"to": "Category:Chest tiles"
		},
		{
			"from": "Category:Color Scheme Palettes",
			"to": "Category:Color scheme palettes"
		},
		{
			"from": "Category:Concept Art",
			"to": "Category:Concept art"
		},
		{
			"from": "Category:Demonstration Images",
			"to": "Category:Demonstration images"
		},
		{
			"from": "Category:Kira-Kira images",
			"to": "Category:Kira-kira images"
		},
		{
			"from": "Category:Old Design Images",
			"to": "Category:Unused Content"
		},
		{
			"from": "Category:Podium Sounds",
			"to": "Category:Podium sounds"
		},
		{
			"from": "Category:Ranked banners",
			"to": "Category:Ranked banner images"
		},
		{
			"from": "Category:Realm images",
			"to": "Category:Map images"
		},
		{
			"from": "Category:Realms",
			"to": "Category:Maps"
		},
		{
			"from": "Category:Sidekick Icons",
			"to": "Category:Sidekick icons"
		},
		{
			"from": "Category:Stats",
			"to": "Category:Stats images"
		},
		{
			"from": "Category:Taunts",
			"to": "Category:Emotes"
		},
		{
			"from": "Category:Team Emotes",
			"to": "Category:Buddy Emotes"
		},
		{
			"from": "Category:UI Images",
			"to": "Category:UI images"
		}
	]

	let pagesList = new Set;

	let cont = null;
	try {
		for(let c of catlist.map(e => e.from)){
			console.log(c)
			do {
				void await async function retry(){
					let extention = "";
					for(let [k, v] of Object.entries(cont ?? {})){
						extention += `&${k}=${encodeURIComponent(v)}`
					}
					console.log("Fetching batch of pages")
					let result = await fetch(`https://brawlhalla.wiki.gg/api.php?action=query&format=json&prop=&list=categorymembers&cmtitle=${encodeURIComponent(c)}&cmlimit=5000${extention}`)
					if(result.status == 429 || result.status == 502){
						console.log("Retrying in 5")
						await sleep(5e3)
						return retry()
					}
					result = await result.json()
					cont = result.continue;
					if(result.query?.categorymembers){
						pagesList = pagesList.union(new Set(result.query.categorymembers))
						return sleep(1000)
					}
				}()
			} while(cont)
			console.log("Pagelist fetched")
		}
	} catch(err){
		console.error(err)
		exit()
	}

	console.log([...pagesList].map(e => e.title))

	bot.batchOperation(
		[...pagesList].map(e => e.title),
		(page, idx) => {
			return Promise.race([bot.edit(page, (rev) => {
				let content = rev.content;
				for(let cat of catlist){
					let regex = new RegExp(`\\[\\[[cC]ategory\\:\\s*${cat.from.substring(9).replaceAll(" ", "[_\\s]").replaceAll("-", "\\-")}\\s*\\]\\]`, "mg");
					content = content.replaceAll(regex, `[[${cat.to}]]`)
				}
				let allCats = new Set;
				for(let existCats of content.matchAll(/\[\[category:.+\]\]/ig)){
					allCats.add(existCats[0])
					content = content.replaceAll(existCats[0], "")
				}
				if(content.trim() == ""){
					content = [...allCats].join("\n")
				} else {
					content = `${content.trim()}\n\n${[...allCats].join("\n")}`
				}
				return {
					// return parameters needed for [[mw:API:Edit]]
					text: content,
					summary: "Moved to correct category",
					minor: true
				}
			}).catch(err => console.log(err)).then(() => done.push(page)), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 2750))
		},
		/* concurrency */ 3,
		/* retries */ 2
	).then(exit);

	interval = setInterval(() => {
		fs.writeFileSync("done.log", JSON.stringify(done))
	}, 10000)
}()