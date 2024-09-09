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

	let pagesList = new Set;

	let cont = null;
	try{
		// for(let c of catlist){
		// 	console.log(c)
			do {
				void await async function retry(){
					let extention = "";
					for(let [k, v] of Object.entries(cont ?? {})){
						extention += `&${k}=${encodeURIComponent(v)}`
					}
					console.log("Fetching batch of pages")
					let result = await fetch(`https://brawlhalla.wiki.gg/api.php?action=query&format=json&prop=&list=querypage&formatversion=2&qppage=Uncategorizedimages&qplimit=5000${extention}`)
					if(result.status == 429 || result.status == 502){
						console.log("Retrying in 5")
						await sleep(5e3)
						return retry()
					}
					result = await result.json()
					cont = result.continue;
					if(result.query?.querypage){
						pagesList = pagesList.union(new Set(result.query.querypage.results))
						return sleep(1000)
					}
				}()
			} while(cont)
			console.log("Pagelist fetched")
		// }
	} catch(err){
		console.error(err)
		exit()
	}

	bot.batchOperation(
		[...pagesList].map(e => e.title),
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
				if(page.includes("Classic Colors.png") || /1 \d+x\d+.png/.test(page)){
					cats.add(flag = "{{delete|Duplicate file}}")
					break skinOrWeapon
				}
				// if(skins.some(e => e.test(page))){
				// 	cats.add(flag = "[[Category:Skin images]]")
				// 	break skinOrWeapon
				// }
				// if(legends.some(e => page == `File:${e}.png`)){
				// 	cats.add(flag = "[[Category:Legend images]]")
				// 	break skinOrWeapon
				// }
				// if(weapons.some(e => page.includes(`File:${e}`))){
				// 	cats.add(flag = "[[Category:Weapon skin images]]")
				// }
			}
			avatar: if(page.includes("File:Avatar")){
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
			ani: if(page.includes("File:Ani")){
				if(page.includes("AniAvatar")){
					cats.add(flag = "[[Category:Animated avatar images]]")
				}
				if(/\(\d*x?\d+px\)\.png/.test(page)){
					cats.add("[[Category:Alternate resolution images]]")
					break ani
				}
				if(/File:Ani.+\.png/.test(page)){
					cats.add("[[Category:Animated PNGs]]")
				}
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
			if((page.includes("File:Bot ") && cats.size == 0) || page.includes("File:AniBot")){
				cats.add(flag = "[[Category:Sidekick images]]")
			}
			if(page.includes("File:BotIcon")){
				cats.add(flag = "[[Category:Sidekick icons]]")
			}
			if(/BG( \d)?.png/.test(page)){
				cats.add(flag = "[[Category:Epic backgrounds]]")
			}
			if(page.includes("bundle.png")){
				cats.add("[[Category:Prime Bundle icons]]")
			}
			if(page.includes("File:Achievement")){
				cats.add("[[Category:Achievement images]]")
			}
			if(page.includes("Brawlhalla Logo") || page.includes("File:Logo") || page.includes("Logo.png")){
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
			if(page.includes("Example.png")){
				cats.add("[[Category:Weapon composite images]]")
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
			if(page.includes("File:Nav")){
				cats.add("[[Category:Navigation button images]]")
			}
			if(page.includes("Official Artwork")){
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
				cats.add(flag = "[[Category:Portrait images]]")
			}
			if(page.includes("File:Profile")){
				cats.add("[[Category:Profiles of people]]")
			}
			if(page.includes("File:STC")){
				cats.add("[[Category:Steam Trading Cards images]]")
			}
			if(page.includes("File:Setting")){
				cats.add("[[Category:Demonstration images]]")
			}
			if(page.includes("File:Sig ")){
				cats.add(flag = "[[Category:Signature images]]")
			}
			if(page.includes("SkinIcon")){
				cats.add(flag = "[[Category:Skin icons]]")
			}
			if(/File:Stats\d\w*1?\.png/.test(page)){
				cats.add(flag = "[[Category:Stats images]]")
			}
			if(page.includes("StatIcon")){
				cats.add("[[Category:Stat icons]]")
			}
			if(uiImages.includes(page)){
				cats.add(flag = "[[Category:UI images]]")
			}
			if(page.includes("File:Dice")){
				cats.add("[[Category:Dice icons]]")
			}
			if(page.includes("Pack.jpg")){
				cats.add(flag = "[[Category:DLC images]]")
			}
			if(page.includes("File:Queue")){
				cats.add("[[Category:Queue images]]")
			}
			if(/File:Taunt.+\.png/.test(page)){
				cats.add(flag = "[[Category:Taunt images]]")
			}
			if(/File:Taunt.+\.mp3/.test(page)){
				cats.add("[[Category:Taunt sound effects]]")
			}
			if(page.includes("Theme.mp3") || /Level.+\.mp3/i.test(page)){
				cats.add(flag = "[[Category:Music]]")
			} else if(page.includes(".mp3")){
				return new Promise((resolve) => {
					setTimeout(() => resolve("Timeout"), 10e3)
					console.log("mp3 detected")
					fetch(`https://brawlhalla.wiki.gg/api.php?action=query&format=json&titles=${encodeURIComponent(page)}&prop=imageinfo&iiprop=timestamp|user|url`)
						.then(e => e.json())
						.then(json => {
							let key, src;
							try {
								key = Object.keys(json.query?.pages)[0];
								if(+key > 0){
									src = json.query.pages[key].imageinfo?.[0]?.url
								} else {
									console.log("Cannot fetch file info")
									return resolve("Cannot fetch file info")
								}
							} catch {
								console.log("Cannot fetch file info")
								resolve("Cannot fetch file info")
							}
							if(src){
								fetch(src)
									.then(e => e.arrayBuffer())
									.then(arrayBuffer => {
										const buffer = Buffer.from(new Uint8Array(arrayBuffer))
										// if track is longer than 45 seconds, it's probably music, not a sound effect
										if(getMP3Duration(buffer) >= 45e3){
											resolve(Promise.race([bot.edit(page, (rev) => ({
												// return parameters needed for [[mw:API:Edit]]
												text: (() => {
													if(rev.content === "")
														return "[[Category:Music]]";
													if(rev.content.includes("[[Category:Music]]"))
														return rev.content.replace("[[Category:Music]]", "[[category:Music]]")
													if(/\[\[category:\s*Music\s*\]\]/i.test(rev.content))
														return rev.content.replace(/\[\[category:\s*Music\s*\]\]/i, "[[Category:Music]]")
													return `${rev.content.trim()}\n[[Category:Music]]`
												})(),
												summary: "Added|Fixed category",
												minor: true
											})).catch(err => console.log(err)).then(() => done.push(page)), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 2750)))
										} else {
											console.log("Skipped")
											resolve("Skipped")
										}
									})
							} else {
								console.log("Cannot fetch file info")
								resolve("Cannot fetch file info")
							}
						})
				})
			}
			if(/\bpromo\b/i.test(page)){
				cats.add("[[Category:Promo images]]")
			}
			if(/icon\.png/i.test(page) || page.includes("EventIcon") || page.includes("File:Icon")){
				cats.add("[[Category:Icon images]]")
			}
			if(/weapons?( skins)?\.(png|jpe?g)/i.test(page)){
				cats.add("[[Category:Skin set images]]")
			}
			if(page.includes("File:ROA") || page.includes("File:Roblox") || page.includes("File:Growtopia")){
				cats.add("[[Category:Images from other games]]")
			}
			return cats.size == 0 ? Promise.resolve("Skipped") : Promise.race([bot.edit(page, (rev) => {
				let currentCats = [...rev.content.matchAll(/\[\[\s*category\s*:[^\]]+\]\]/ig)].map(e => e?.[0].replaceAll("_", " ")),
					content = rev.content.replaceAll("_", " "),
					message = "Added";
				switch(flag){
					case "{{delete|Duplicate file}}":
						return {
							// return parameters needed for [[mw:API:Edit]]
							text: content === "" ? sortAndJoin(cats) : `${content.trim()}\n${sortAndJoin(cats)}`,
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
					case "[[Category:Music]]":
					case "[[Category:Ranked banner images]]":
					case "[[Category:Portrait images]]":
						for(let r of ["Skin icons", "Stats", "ranked avatars", "avatars", "Animated Avatars", "realm images", "UI images", "Taunt images", "Podium images", "Chest images", "Patch images", "Color scheme palettes", "DLC images", "Music", "Sidekick icons", "Sidekick images", "Logo images", "Concept art", "Gadget images", "Emoji images", "Animated KO images", "Podium sounds", "Signature images", "icon images", "chest tiles", "ranked banners", "Portrait images", "Official artwork"]){
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