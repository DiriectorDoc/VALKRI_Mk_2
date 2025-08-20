const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const fs = require("node:fs");
const readline = require("readline");
let { colours, weapons, legends } = require("./patterns.json");
const os = require("os");

// const getMP3Duration = require('get-mp3-duration');

// const uiImages = require("./uiImages.json");

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

	let pagesList = [];
	const dir = `C:\\Users\\${os.userInfo().username}\\BrawlhallaRenders`;
	try {
		pagesList = fs.readdirSync(dir)
	} catch(err){
		console.error(err)
		return exit()
	}
	console.log(pagesList)

	bot.batchOperation(
		pagesList,
		(page, _idx) => {
			return Promise.race([bot.upload(`${dir}\\${page}`, page, `File uploaded programmatically by VALKRI MK 2

== Licensing ==
{{License/BMG}}${(() => {
	for(let e of colours){
		if(page.includes(`${e}.png`)) return `

[[Category:${e} images]]`
	}
	return ""
})()}`, {ignorewarnings: false}), sleep(4500)]).then(e => sleep(e == "sleep" ? 10000 : 3750))
			// return Promise.resolve("Skipped")
		},
		/* concurrency */ 3,
		/* retries */ 2
	).then(exit);

	interval = setInterval(() => {
		fs.writeFileSync("done.log", JSON.stringify(done))
	}, 10000)
}()