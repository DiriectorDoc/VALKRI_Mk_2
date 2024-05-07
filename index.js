const { Mwn } = require('mwn');
const credentials = require("./password.json"/* Local file */);
const pagesList = require("./skin_pages.json"/* Local file */);

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

	const patterns = [
		"Armageddon",
		"Black",
		"Blue",
		"Brown",
		"Charged OG",
		"Coat of Lions",
		"Community Colors v.2",
		"Community Colors",
		"Cyan",
		"Darkheart",
		"Esports v.2",
		"Esports v.3",
		"Esports v.4",
		"Esports",
		"Frozen Forest",
		"Gala",
		"Goldforged",
		"Green",
		"Grey",
		"Haunting",
		"Heatwave",
		"Home Team",
		"Lovestruck",
		"Lucky Clover",
		"Orange",
		"Pact of Poison",
		"Pink",
		"Purple",
		"Raven's Honor",
		"Red",
		"Skyforged",
		"Soul Fire",
		"Starlight",
		"Sunset",
		"Synthwave",
		"Team Blue Secondary",
		"Team Blue Tertiary",
		"Team Blue",
		"Team Red Secondary",
		"Team Red Tertiary",
		"Team Red",
		"Team Yellow Quaternary",
		"Team Yellow Secondary",
		"Team Yellow Tertiary",
		"Team Yellow",
		"Verdant Bloom",
		"White",
		"Willow Leaves",
		"Winter Holiday",
		"Yellow"
	];

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	bot.batchOperation(
		pagesList,
		(page, idx) => {
			for(let p of patterns){
				if(page.indexOf(p) > -1 && page.indexOf(p) == page.length - p.length - 4)
					return bot.edit(page, (rev) => rev.content.indexOf(`[[Category:${p} images]]`) >= 0 ? (console.log("Aborted; Category already exists"), false) : ({
						// return parameters needed for [[mw:API:Edit]]
						text: rev.content === "" ? `[[Category:${p} images]]` : `${rev.content}\n[[Category:${p} images]]`,
						summary: "Added category",
						minor: true
					})).then(() => sleep(2000))
			}
			return Promise.resolve("Skipped")
		},
		/* concurrency */ 2,
		/* retries */ 2
	);
}()