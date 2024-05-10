const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const pagesList = require("./uncategorized.json");
const fs = require("node:fs");
const readline = require("readline");
let { colours, skins, uiImages, weapons, legends } = require("./patterns.json");

skins = skins.map(e => new RegExp(`${e}\\.(png|gif)`, "i"));

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

	bot.batchOperation(
		pagesList,
		(page, idx) => {
			let cats = new Set,
				flag = "none";
			skinOrWeapon: {
				for(let c of colours){
					if(page.includes(` ${c}.png`)){
						cats.add(`[[Category:${c} images]]`)
						break skinOrWeapon
					}
				}
				if(page.includes("Classic Colors.png")){
					cats.add(flag = "{{delete|Duplicate file}}")
					break skinOrWeapon
				}
				if(skins.some(e => e.test(page))){
					cats.add(flag = "[[Category:Skin images]]")
					break skinOrWeapon
				}
				if(legends.some(e => page == `File:${e}.png`)){
					cats.add(flag = "[[Category:Legend images]]")
					break skinOrWeapon
				}
				if(weapons.some(e => page.includes(`File:${e}`))){
					cats.add(flag = "[[Category:Weapon skin images]]")
				}
			}
			if(uiImages.includes(page.substring(5))){
				cats.add(flag = "[[Category:UI images]]")
			}
			avatar: if(page.includes("File:Avatar")){
				if(page.includes("AniAvatar")){
					cats.add(flag = "[[Category:Animated avatar images]]")
					break avatar
				}
				if(page.includes("Avatar Flag")){
					cats.add(flag = "[[Category:Flag avatar images]]")
					break avatar
				}
				let match = /Avatar (Diamond|Gold|Participation|Platinum) \d+/.exec(page)
				if(match){
					cats.add(`[[Category:${match[1]} ranked avatar images]]`)
					cats.add(flag = "[[Category:Ranked avatar images]]")
					break avatar
				}
				if(page.includes("Avatar Doodle")){
					cats.add("[[Category:Doodle avatar images]]")
					break avatar
				}
				cats.add(flag = "[[Category:Avatar images]]")
			}
			if(page.includes("File:BGS ")){
				cats.add("[[Category:Brawlhalla Grand Slam images]]")
			}
			// if(page.indexOf(".mp3") == page.length - 4){
			// 	cats.push("[[Category:Sound files]]")
			// }
			if(/Battlepass BP\d/.test(page)){
				cats.add(flag = "[[Category:Battle Pass images]]")
			}
			if(/Battlepass.+\.mp3/.test(page)){
				cats.add(flag = "[[Category:Battle Pass music]]")
			}
			if(/Border .+ Chest/.test(page)){
				cats.add("[[Category:Chest border images]]")
			}
			if(page.includes("File:Bot ") && cats.size == 0){
				cats.add(flag = "[[Category:Sidekick images]]")
			}
			if(page.includes("File:BotIcon")){
				cats.add(flag = "[[Category:Sidekick icons]]")
			}
			if(page.includes("File:Achievement")){
				cats.add("[[Category:Achievement images]]")
			}
			if(page.includes("File:Button ")){
				cats.add("[[Category:Controls images]]")
			}
			if(page.includes("Brawlhalla Logo") || page.includes("File:Logo")){
				cats.add(flag = "[[Category:Logo images]]")
			}
			if(page.includes("File:Color ")){
				cats.add("[[Category:Color icon images]]")
			}
			if(/Concept\s?Art/i.test(page)){
				cats.add(flag = "[[Category:Concept art]]")
			}
			if(page.includes("File:Demo ")){
				cats.add("[[Category:Mechanics demos]]")
			}
			if(page.includes("File:Emoji ")){
				cats.add(flag = "[[Category:Emoji images]]")
			}
			if(page.includes("File:Flag of ")){
				cats.add(flag = "[[Category:Region flags]]")
			}
			if(/Gadget [^0-9]+\.png/.test(page)){
				cats.add(flag = "[[Category:Gadget images]]")
			}
			if(/KO .+\.gif/.test(page)){
				cats.add(flag = "[[Category:Animated KO images]]")
			}
			if(page.includes("File:KO SFX")){
				cats.add("[[Category:KO sound effects]]")
			}
			if(page.includes("File:Loading")){
				cats.add("[[Category:Loading frame images]]")
			}
			if(page.includes("File:Map ")){
				cats.add(flag = "[[Category:Map images]]")
			}
			if(page.includes("File:Nav ")){
				cats.add("[[Category:Navigation button images]]")
			}
			if(page.includes("Official artwork")){
				cats.add(flag = "[[Category:Official artwork]]")
			}
			if(page.includes("File:Palette")){
				cats.add(flag = "[[Category:Color scheme palettes]]")
			}
			if(/Patch\d+/.test(page)){
				cats.add(flag = "[[Category:Patch images]]")
			}
			if(page.includes("Chest.png")){
				cats.add(flag = "[[Category:Chest images]]")
			}
			if(page.includes("Chest Tile.jpg")){
				cats.add(flag = "[[Category:Chest tiles]]")
			}
			if(/File:Podium.+.png/.test(page)){
				cats.add(flag = "[[Category:Podium images]]")
			}
			if(page.includes("File:Podium SFX")){
				cats.add(flag = "[[Category:Podium sounds]]")
			}
			if(page.includes("File:Portrait")){
				cats.add("[[Category:Portrait images]]")
			}
			if(page.includes("File:Profile")){
				cats.add("[[Category:Profiles of people]]")
			}
			if(page.includes("File:STC")){
				cats.add("[[Category:Steam Trading Cards images]]")
			}
			if(page.includes("File:Sig ")){
				cats.add(flag = "[[Category:Signature images]]")
			}
			if(page.includes("SkinIcon")){
				cats.add(flag = "[[Category:Skin icons]]")
			}
			if(/File:Stats\d\w*?\d\.png/.test(page)){
				cats.add(flag = "[[Category:Stats images]]")
			}
			if(page.includes("StatIcon")){
				cats.add("[[Category:Stat icons]]")
			}
			if(page.includes("Pack.jpg")){
				cats.add(flag = "[[Category:DLC images]]")
			}
			if(/File:Taunt.+\.png/.test(page)){
				cats.add(flag = "[[Category:Taunt images]]")
			}
			if(/File:Taunt.+\.mp3/.test(page)){
				cats.add("[[Category:Taunt sound effects]]")
			}
			return cats.size == 0 ? Promise.resolve("Skipped") : Promise.race([bot.edit(page, (rev) => {
				let currentCats = [...rev.content.matchAll(/\[\[\s*category\s*:[^\]]+\]\]/ig)].map(e => e?.[0].replaceAll("_", " ")),
					content = rev.content,
					message = "Added";
				switch(flag){
					case "{{delete|Duplicate file}}":
						return {
							// return parameters needed for [[mw:API:Edit]]
							text: content + `${content.trim()}\n${sortAndJoin(cats)}`,
							summary: "Tagging for deletion",
							minor: true
						}
					case "[[Category:Ranked avatar images]]":
					case "[[Category:Avatar images]]":
					case "[[Category:Flag avatar images]]":
					case "[[Category:Animated avatar images]]":
					case "[[Category:Animated KO images]]":
					case "[[Category:Skin images]]":
					case "[[Category:Skin icons]]":
					case "[[Category:DLC images]]":
					case "[[Category:UI images]]":
					case "[[Category:Stat images]]":
					case "[[Category:Map images]]":
					case "[[Category:Battle Pass music]]":
					case "[[Category:Sidekick icons]]":
					case "[[Category:Sidekick images]]":
					case "[[Category:Logo images]]":
					case "[[Category:Concept art]]":
					case "[[Category:Gadget images]]":
					case "[[Category:Emoji images]]":
					case "[[Category:Map images]]":
					case "[[Category:Color scheme palettes]]":
					case "[[Category:Patch images]]":
					case "[[Category:Podium images]]":
					case "[[Category:Taunt images]]":
					case "[[Category:Podium sounds]]":
					case "[[Category:Chest images]]":
					case "[[Category:Chest tiles]]":
					case "[[Category:Signature images]]":
					case "[[Category:Stats images]]":
						for(let r of ["Skin icons", "Stats", "ranked avatars", "avatars", "Animated Avatars", "Realm images", "UI images", "Taunt images", "Podium images", "Chest images", "Patch images", "Color scheme palettes", "DLC images", "Music", "Sidekick icons", "Sidekick images", "Logo images", "Concept art", "Gadget images", "Emoji images", "Animated KO images", "Podium sounds", "Signature images", "icon images", "chest tiles"]){
							let found = currentCats.find(e => new RegExp(`\\[\\[\\s*category\\s*:\\s*${r}\\s*\\]\\]`, "i").test(e));
							if(found){
								content = content.replace(found, "");
								currentCats = currentCats.filter(e => e != found)
								if(found == `[[Category:${r}]]`){
									cats.delete(`[[Category:${r}]]`)
									cats.add(`[[category:${r}]]`)
								}
							}
						}
						message = "Tweaked";
					default:
						for(let c of currentCats){
							let exec = /\[\[\s*category\s*:\s*(.+)\s*\]\]/i.exec(c);
							cats.add(`[[Category:${exec[1][0].toUpperCase()}${exec[1].substring(1)}]]`)
							content = content.replace(exec[0], "")
						}
						content = content === "" ? sortAndJoin(cats) : `${content.trim()}\n${sortAndJoin(cats)}`
						return {
							// return parameters needed for [[mw:API:Edit]]
							text: content == rev.content ? content.replace("Category", "category") : content,
							summary: `${message} categor${cats.size == 1 ? "y" : "ies"}`,
							minor: true
						}
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