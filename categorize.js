const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const fs = require("node:fs");
const readline = require("readline");
const { fetchMembers } = require("./fetch_members.js");
const { add: toCategorize, remove: toUncategorize, fix: toFix, empty: toEmpty } = require("./to_categorize.json");

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

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms, "sleep"));
}

const pagename = (page) => page.includes(":") ? page.substring(page.indexOf(":") + 1) : page;

const normalizeCatName = (str) => {
	let temp = str.trim().replace(/\[?\[?category\s*:([^\]]+)\s*\]?\]?/i, "$1");
	return `[[Category:${temp[0].toUpperCase()}${temp.substring(1).replaceAll(/[\s_]+/g, "_")}]]`
};
const catNameToRegEx = (str) => {
	let temp = str.trim().replace(/\[?\[?category\s*:([^\]]+)\s*\]?\]?/i, "$1");
	return new RegExp(`\\[\\[\\s*[cC]ategory\\s*:\\s*[${temp[0].toUpperCase()}${temp[0].toLowerCase()}]${temp.substring(1).replaceAll(/[\s_]+/g, "[\\s_]+")}\\s*\\]\\]`, "g")
};
const liftCats = (str) => {
	let reg = /\[\[category\s*:\s*([^\]]+)\s*\]\]/ig;
	return [str.replaceAll(reg, "").trim(), new Set([...(str.matchAll(/\[\[category\s*:\s*([^\]]+)\s*\]\]/ig))].map(e => normalizeCatName(e[0])))]
};
const standardizePagename = (str) => {
	let [ns, page] = str.split(":").map(e => e.trim());
	return `${ns[0].toUpperCase()}${ns.substring(1).toLowerCase()}:${page[0].toUpperCase()}${page.substring(1).replaceAll(/[\s_]/g, "_")}`
};

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

	let [pagesList, instructions] = await (async () => {
		let ps = [],
			ins = {};
		for(let c of toEmpty)
			ps.push(...(await fetchMembers(c.replace(/\[?\[?category\s*:([^\]]+)\s*\]?\]?/i, "$1"))).map(standardizePagename));
		for(let [k, v] of Object.entries(toCategorize)){
			for(let i = 0; i < v.length; i++){
				if("object" == typeof v[i]){
					v[i] = (await fetchMembers(v[i].category))//.filter(e => e.ns == v[i].ns)
				}
			}
			v = v.flat().map(p => standardizePagename(p));
			ps.push(...v)
			for(let p of v){
				if(p in ins){
					if("add" in ins[p])
						ins[p].add.add(normalizeCatName(k))
					else
						ins[p].add = new Set([normalizeCatName(k)])
					
				} else {
					ins[p] = {
						add: new Set([normalizeCatName(k)])
					}
				}
			}
			console.log(k)
		}
		for(let [k, v] of Object.entries(toUncategorize)){
			v = v.map(p => standardizePagename(p))
			ps.push(...v)
			for(let p of v){
				if(p in ins){
					if("remove" in ins[p])
						ins[p].remove.push(catNameToRegEx(k));
					else
						ins[p].remove = [catNameToRegEx(k)];
				} else {
					ins[p] = {
						remove: [catNameToRegEx(k)]
					}
				}
				if("add" in ins[p]) ins[p].add.delete(normalizeCatName(k))
			}
		}
		for(let [k, v] of Object.entries(toFix)){
			v = v.map(p => standardizePagename(p))
			ps.push(...v)
			for(let p of v){
				if(p in ins && "add" in ins[p]){
					ins[p].add.add(normalizeCatName(k))
					ins[p].fix = true
				} else {
					ins[p] = {
						add: new Set([normalizeCatName(k)]),
						fix: true
					}
				}
			}
		}
		for(let c of toEmpty.map(normalizeCatName))
		for(let p of ps){
			if(!ins[p]?.add?.has(c)){
				if(p in ins){
					if("remove" in ins[p])
						ins[p].remove.push(catNameToRegEx(c));
					else
						ins[p].remove = [catNameToRegEx(c)];
				} else {
					ins[p] = {
						remove: [catNameToRegEx(c)]
					}
				}
			}
		}
		return [[...new Set(ps)].sort(), ins]
	})();

	// console.log(pagesList)
	// console.log(instructions)

	bot.batchOperation(
		pagesList,
		(page, i) => {
			return Promise.race([bot.edit(page, (rev) => {
				let [content, cats] = liftCats(rev.content);
				if(instructions[page].add)
					for(let e of instructions[page].add){
						cats.add(e)
					}
				if(instructions[page].remove)
					cats = new Set([...cats].filter(e => {
						for(let r of instructions[page].remove){
							if(r.test(e)) return false
						}
						return true
					}));
				let catsArr = [...cats].map(normalizeCatName).sort()
				if(/^template\s*:/i.test(page)){
					let i = content.search(/<\s*\/\s*noinclude\s*>/i);
					if(i == -i){
						content = `${content.trim}<noinclude>${catsArr.join("\n")}</noinclude>`
					} else {
						content = (content.substring(0, i) + catsArr.join("\n") + content.substring(i)).trim();
					}
				} else {
					content = `${content.trim()}\n\n${catsArr.join("\n")}`.trim();
				}
				return {
					// return parameters needed for [[mw:API:Edit]]
					text: instructions[page].fix && content == rev.content.trim() ? content.replace("[[Category:", "[[category:") : content,
					summary: instructions[page].add ? `Categorized into ${[...instructions[page].add].sort().join(", ")}${instructions[page].fix ? "; Fixing" : ""}` : "Removing from category",
					minor: true
				}
			}).catch(err => console.log(err)).then(() => done.push(page)), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 3750));
		},
		/* concurrency */ 2,
		/* retries */ 2
	).then(exit);

	interval = setInterval(() => {
		fs.writeFileSync("done.log", JSON.stringify(done))
	}, 10000)
}()