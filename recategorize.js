const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const fs = require("node:fs");
const readline = require("readline");

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

	let pagesList = [...new Set(fs.readFileSync("to_recache.txt").toString().split(/\r?\n/))];
	console.log(pagesList)

	bot.batchOperation(
		pagesList,
		(page, _idx) => {
			return Promise.race([bot.edit(page, (rev) => {
				if(/\[\[\s*[cC]ategory\s*:\s*[^\|]+\|\s*{{PAGENAME}}\s*\]\]/.test(rev.content)){
					return {
						// return parameters needed for [[mw:API:Edit]]
						text: rev.content.replaceAll(/\[\[\s*[cC]ategory\s*:\s*([^\|]+)\|\s*{{PAGENAME}}\s*\]\]/g, `[[Category:$1|${pagename(page)}]]`),
						summary: "Fixed category",
						minor: true
					}
				}
				if(rev.content.includes("{{doc/end}}")){
					return {
						// return parameters needed for [[mw:API:Edit]]
						text: rev.content.replaceAll(/\n+\{\{doc\/end\}\}/g, "{{Doc/end}}"),
						summary: "Fixed category",
						minor: true
					}
				}
				if(rev.content.includes("{{Doc/end}}")){
					return {
						// return parameters needed for [[mw:API:Edit]]
						text: rev.content.replaceAll(/\n+\{\{Doc\/end\}\}/g, "\n{{doc/end}}"),
						summary: "Fixed category",
						minor: true
					}
				}
				if(rev.content.includes("[[Category")){
					return {
						// return parameters needed for [[mw:API:Edit]]
						text: rev.content.replaceAll("[[Category", "[[category"),
						summary: "Fixed category",
						minor: true
					}
				}
				if(rev.content.includes("[[category")){
					return {
						// return parameters needed for [[mw:API:Edit]]
						text: rev.content.replaceAll("[[category", "[[Category"),
						summary: "Fixed category",
						minor: true
					}
				}
				return false
			}).catch(err => console.log(err)).then(() => done.push(page)), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 2750));
		},
		/* concurrency */ 3,
		/* retries */ 2
	).then(exit);

	interval = setInterval(() => {
		fs.writeFileSync("done.log", JSON.stringify(done))
	}, 10000)
}()