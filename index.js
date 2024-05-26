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

	const pagesRename = {
		"Modular Riff Ember": "Modular Rift Ember",
		"Grau Mestra Batista": "Grã-mestra Batista",
		"Lacrimosa": "Scythe of Mercy",
		"Adagio": "Bow of Mercy",
		"Beach Ball Orb": "Beach Ball",
		"PegaSwift Boots": "PegaSwift Runners",
		"Irridium Engine": "Iridium Engine"
	},
		pats = {};
	Object.keys(pagesRename).forEach(k => pats[k] = new RegExp(k.replaceAll(" ", "[\\s_]"), "i"))
	let pagesList = [];
	function patany(k){
		return new RegExp(`File:${k.replaceAll(" ", "[\\s_]")}([\\s_](${colours.join("|").replaceAll(" ", "[\\s_]")}))?.png`, "i")
	}

	let cont = null;
	try {
		for(let r of Object.keys(pagesRename)){
			console.log(r)
			do {
				void await async function retry(){
					let extention = "";
					for(let [k, v] of Object.entries(cont ?? {})){
						extention += `&${k}=${encodeURIComponent(v)}`
					}
					let result = await fetch(`https://brawlhalla.wiki.gg/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(r)}&srnamespace=6&srlimit=5000${extention}`)
					if(result.status == 429 || result.status == 502){
						console.log("Retrying in 5")
						await sleep(5e3)
						return retry()
					}
					result = await result.json()
					cont = result.continue;
					if(result.query?.search){
						pagesList.push(result.query.search.map(e => e.title).filter(e => patany(r).test(e)))
						return sleep(1000)
					}
				}()
			} while(cont)
		}
	} catch(err){
		console.error(err)
		exit()
	}

	pagesList = pagesList.flat(Infinity);

	console.log(pagesList)

	/*
	
	If there are too many requests, instead of retrying, this bot will just skip renaming.
	To fix this (in the future), after the batchOperation is "done", check how many pf the
	pages were actually renamed, and remove those from the pageList and retry. Keep retrying
	for as long as the pageList shrinks.
	
	*/

	bot.batchOperation(
		pagesList,
		(page, idx) => {
			let newPage = false;
			for(let [k, v] of Object.entries(pagesRename)){
				if(pats[k].test(page)){
					newPage = page.replace(pats[k], v)
				}
			}
			return newPage && Promise.race([bot.move(page, newPage, "Fixed name", {
				movesubpages: true,
				movetalk: true
			}).catch(err => console.log(err)).then(() => {done.push(page); return sleep(3000)}), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 2750))
		},
		1,//* concurrency */ 3,
		/* retries */ 2
	).then(exit);

	interval = setInterval(() => {
		fs.writeFileSync("done.log", JSON.stringify(done))
	}, 10000)
}()