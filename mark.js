const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const fs = require("node:fs");
const readline = require("readline");
const { fetchMembers } = require("./fetch_members.js");

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

	let pagesList = new Set(fs.readFileSync("mark_for_deletion.txt").toString().split(/\r?\n/).map(e => `File:${e}`));
	for(let m of await fetchMembers("Candidates_for_deletion")){
		pagesList.delete(m)
	}
	pagesList = [...pagesList];
	console.log(pagesList)

	bot.batchOperation(
		pagesList,
		(page, _idx) => {
			return Promise.race([bot.edit(page, (rev) => {
                let content = rev.content.trim()
				return !(/\{\{\s*delete/i.test(content)) && ({
					// return parameters needed for [[mw:API:Edit]]
					text: content ? `{{delete|Duplicate file}}

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