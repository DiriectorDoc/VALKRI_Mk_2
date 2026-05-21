const { Mwn } = require("mwn");
const credentials = require("./password.json"/* Local file */);
const fs = require("node:fs");
const readline = require("readline");
let { colours, weapons, legends } = require("./patterns.json");
const os = require("os");
const path = require("path");

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
	done = [],
	omit = [
		"desktop.ini"
	];

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

function handleWildcardLocation(pathWithWildcards){
	if(fs.existsSync(pathWithWildcards) && fs.lstatSync(pathWithWildcards).isFile()) return pathWithWildcards;
	let [baseRoot, ...parts] = pathWithWildcards.split(/[\\\/]/),
		file = parts.pop();
	if(/\w\:/i.test(baseRoot)) baseRoot += "\\";
	let roots = [baseRoot || ".\\"];

	for(const part of parts){
		let newRoots = []
		for(let root of roots){
			const currentPath = path.join(root, part);

			if(part.includes("*")){
				let pat = currentPath.split("*").map(e => RegExp.escape(e)).join(".*") + "$";
				let dirs = fs.readdirSync(root).map(e => `${root}\\${e}`).filter(e => new RegExp(pat).test(e) && fs.existsSync(e) && fs.lstatSync(e).isDirectory());
				newRoots.push(...dirs)
			} else {
				newRoots.push(currentPath)
			}
		}
		roots = newRoots
	}

	let matchesFound = [];
	for(let root of roots){
		const filePattern = file ? new RegExp(`^${file.split("*").map(e => RegExp.escape(e)).join(".*")}$`) : /.?/;
		for(let found of fs.readdirSync(root)){
			if(filePattern.test(found)){
				let location = `${root}\\${found}`,
					lstat = fs.lstatSync(location)
				if(lstat.isFile())
					matchesFound.push(location);
				else if(lstat.isDirectory())
					matchesFound.push(...fs.readdirSync(location).filter(e => fs.lstatSync(`${location}\\${e}`).isFile()));
			}
		}
	}

	return matchesFound;
}

const fetchFromDir = (dir) => fs.readdirSync(dir).map(e => `${dir}\\${e}`).filter(e => fs.lstatSync(e).isFile());

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
	bot.enableEmergencyShutoff({
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

	let args = process.argv.slice(2),
		dirs = [];
	
	console.log(args)
	for(let i = 0; i < args.length; i++){
		let c = args[i];
		switch(c){
			case "-preset":
				switch(args[++i].toLowerCase()){
					case "renders":
						dirs.push(...fetchFromDir(`C:\\Users\\${os.userInfo().username}\\BrawlhallaRenders`))
						break;
					default:
						throw `Preset "${args[i]}" does not exist.`
				}
				break;
			default:
				if(c.includes("*")){
					dirs.push(...handleWildcardLocation(c))
				} else if(fs.existsSync(c)){
					let lstat = fs.lstatSync(c)
					if(lstat.isFile())
						dirs.push(c);
					else if(lstat.isDirectory())
						dirs.push(...fetchFromDir(c))
				} else {
					throw `Location "${c}" does not exist.`
				}
		}
	}
	dirs = dirs.filter(d => omit.every(f => path.basename(d) !== f))

	console.log(dirs)

	bot.batchOperation(
		dirs,
		(location, _idx) => {
			let page = path.basename(location);
			return Promise.race([/\.mediawiki$/i.test(page) ? bot.create(path.basename(location, ".mediawiki"), fs.readFileSync(location).toString(), "Created page") : bot.upload(location, page, `File uploaded programmatically by VALKRI MK 2

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