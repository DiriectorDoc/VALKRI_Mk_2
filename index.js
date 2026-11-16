const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const fs = require("node:fs");
const readline = require("readline");
let { colours, weapons, legends } = require("./patterns.json");
const { fetchMembers } = require("./fetch_members.js");
const { fetchUncategorized } = require("./fetch_uncategorized.js");

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

const justFileName = (name) => name.replace(/^File:(.+)\.\w{3,4}$/, "$1");

void async function(){
	console.log("Logging in")

	const bot = await Mwn.init({
		apiUrl: "https://brawlhalla.wiki.gg/api.php",
	
		...credentials,
	
		defaultParams: {
			assert: "user" // ensure we're logged in
		},
		userAgent: "VALKRI_Mk_2/1.0.0 (https://github.com/DiriectorDoc/VALKRI_Mk_2) mwn/3.0.1"
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

	console.log("Fetching Skin names")
	let skins = await fetchMembers("Skins"),
		weaponSkins = await fetchMembers("Weapon_skins");

	let pagesList = [];
	try {
		console.log("Fetching uncategorized")
		pagesList = await fetchUncategorized()
	} catch(err){
		console.error(err)
		return exit()
	}
	console.log(pagesList)

	bot.batchOperation(
		pagesList,
		(page, _idx) => {
			return Promise.race([bot.edit(page, (rev) => {
				let content = rev.content.trim(),
					cats = new Set;
				if(!(/==\s*licensing\s*==/i.test(content))){
					content = content === "" ? "== Licensing ==\n{{License/BMG}}" : `${content}\n\n== Licensing ==\n{{License/BMG}}`
				}
				let filename = page.replace(/^File:/, "");
				if(filename.includes(" Classic Colors.png") || /\d+x\d+\.png$/i.test(filename)){
					content = `{{delete|duplicate}}\n${content}`
				}
				for(let c of colours){
					if(filename.includes(` ${c}.png`)){
						cats.add(`[[Category:${c} images]]`)
						break
					}
				}
				if(skins.includes(justFileName(page))){
					cats.add("[[Category:Skin images]]")
				}
				if(weaponSkins.includes(justFileName(page))){
					cats.add("[[Category:Weapon skin images]]")
				}
				if(/^Bot[_\s]/.test(filename)){
					cats.add("[[Category:Sidekick images]]")
				}
				if(/^SkinIcon[_\s]/.test(filename)){
					cats.add("[[Category:Skin icons]]")
				}
				if(/^Avatar[_\s]/.test(filename)){
					cats.add("[[Category:Avatar images]]")
				}
				if(/^AniAvatar[_\s]/.test(filename)){
					cats.add("[[Category:Animated avatar images]]")
				}
				if(/^Emoji[_\s]/.test(filename)){
					cats.add("[[Category:Emoji images]]")
				}
				if(/^Map[_\s]/.test(filename)){
					cats.add("[[Category:Map images]]")
				}
				if(/^Podium[_\s]/.test(filename)){
					cats.add("[[Category:Podium images]]")
				}
				if(/^Patch\d+[_\s]/i.test(filename)){
					cats.add("[[Category:Patch images]]")
				}
				if(/^Bundle[_\s]/i.test(filename)){
					cats.add("[[Category:Bundle images]]")
				}
				if(/^SplashArt[_\s]/i.test(filename)){
					cats.add("[[Category:Event splash art]]")
				}
				if(/^Official[_\s]Artwork[_\s]/i.test(filename)){
					cats.add("[[Category:Official artwork]]")
				}
				if(/^\w+weapon\.png$/i.test(filename)){
					cats.add("[[Category:Weapon drop images]]")
				}
				if(cats.size)
					content = `${content}\n\n${[...cats].join("\n")}`;
				return content !== rev.content.trim() && ({
					// return parameters needed for [[mw:API:Edit]]
					text: content,
					summary: cats.size ? `Categorized into ${[...cats].sort().join(", ")}` : "Added license info",
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