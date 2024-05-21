const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
let pagesList = [];
const fs = require("node:fs");
const readline = require("readline");
let { colours, skins, uiImages, weapons, legends } = require("./patterns.json");

skins = skins.map(e => new RegExp(`File:(Ani)?${e}\\s?(Level \\d|\\(idle\\)|\\(lock-in\\))?\\.(png|gif)`, "i"));

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
		"Category: Black_skin_images",
		"Category: Black_weapon_skin_images",
		"Category: Blue_skin_images",
		"Category: Blue_weapon_skin_images",
		"Category: Brown_skin_images",
		"Category: Brown_weapon_skin_images",
		"Category: Charged_OG_skin_images",
		"Category: Charged_OG_weapon_skin_images",
		"Category: Community_Colors_skin_images",
		"Category: Community_Colors_weapon_skin_images",
		"Category: Cyan_skin_images",
		"Category: Cyan_weapon_skin_images",
		"Category: Darkheart_skin_images",
		"Category: Darkheart_weapon_skin_images",
		"Category: Esports_skin_images",
		"Category: Esports_weapon_skin_images",
		"Category: Esports_v.2_skin_images",
		"Category: Esports_v.2_weapon_skin_images",
		"Category: Frozen_Forest_skin_images",
		"Category: Frozen_Forest_weapon_skin_images",
		"Category: Gala_skin_images",
		"Category: Gala_weapon_skin_images",
		"Category: Goldforged_skin_images",
		"Category: Goldforged_weapon_skin_images",
		"Category: Green_skin_images",
		"Category: Green_weapon_skin_images",
		"Category: Grey_skin_images",
		"Category: Grey_weapon_skin_images",
		"Category: Haunting_skin_images",
		"Category: Haunting_weapon_skin_images",
		"Category: Heatwave_skin_images",
		"Category: Heatwave_weapon_skin_images",
		"Category: Home_Team_skin_images",
		"Category: Home_Team_weapon_skin_images",
		"Category: Lovestruck_skin_images",
		"Category: Lovestruck_weapon_skin_images",
		"Category: Lucky_Clover_skin_images",
		"Category: Lucky_Clover_weapon_skin_images",
		"Category: Orange_skin_images",
		"Category: Orange_weapon_skin_images",
		"Category: Pink_skin_images",
		"Category: Pink_weapon_skin_images",
		"Category: Purple_skin_images",
		"Category: Purple_weapon_skin_images",
		"Category: Red_skin_images",
		"Category: Red_weapon_skin_images",
		"Category: Skyforged_skin_images",
		"Category: Skyforged_weapon_skin_images",
		"Category: Soul_Fire_skin_images",
		"Category: Soul_Fire_weapon_skin_images",
		"Category: Starlight_skin_images",
		"Category: Starlight_weapon_skin_images",
		"Category: Sunset_skin_images",
		"Category: Sunset_weapon_skin_images",
		"Category: Synthwave_skin_images",
		"Category: Synthwave_weapon_skin_images",
		"Category: Verdant_Bloom_skin_images",
		"Category: Verdant_Bloom_weapon_skin_images",
		"Category: White_skin_images",
		"Category: White_weapon_skin_images",
		"Category: Winter_Holiday_skin_images",
		"Category: Winter_Holiday_weapon_skin_images",
		"Category: Yellow_skin_images",
		"Category: Yellow_weapon_skin_images"
	],
		catpatterns = catlist.map(e => new RegExp(`\\[\\[\\s*${e.replaceAll("_", "[_\\s]+").replaceAll(/:\s*/, ":\\s*")}\\s*\\]\\]\\s*(\\n|$)?`, "i"));

	let cont = null;
	try{
		for(let c of catlist){
			console.log(c)
			do {
				void await async function retry(){
					let extention = "";
					for(let [k, v] of Object.entries(cont ?? {})){
						extention += `&${k}=${encodeURIComponent(v)}`
					}
					let result = await fetch(`https://brawlhalla.wiki.gg/api.php?action=query&format=json&prop=&list=categorymembers&cmtitle=${encodeURIComponent(c)}&cmlimit=5000${extention}`)
					if(result.status == 429 || result.status == 502){
						console.log("Retrying in 5")
						await sleep(5e3)
						return retry()
					}
					result = await result.json()
					cont = result.continue;
					if(result.query?.categorymembers){
						pagesList.push(result.query.categorymembers)
						return sleep(1000)
					}
				}()
			} while(cont)
		}
	} catch(err){
		console.error(err)
		exit()
	}

	pagesList = pagesList.flat(Infinity).filter(e => e?.title).map(e => e.title);

	bot.batchOperation(
		pagesList,
		(page, idx) => {
			return Promise.race([bot.edit(page, (rev) => {
				let content = rev.content;
				top: {
					for(let p of catpatterns){
						if(p.test(content)){
							content = content.replace(p, "\n")
							break top
						}
					}
					console.log("Can't find category; Canceling")
					return false
				}
				return {
					// return parameters needed for [[mw:API:Edit]]
					text: content,
					summary: "Removed category",
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