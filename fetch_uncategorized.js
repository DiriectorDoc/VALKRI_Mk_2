function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms, "sleep"));
}

export async function fetchUncategorized() {
	let cont = null,
		pagesList = new Set;
	do {
		void await async function retry(){
			let extention = "";
			for(let [k, v] of Object.entries(cont ?? {})){
				extention += `&${k}=${encodeURIComponent(v)}`
			}
			console.log(`Fetching batch of pages starting at ${cont?.qpoffset ?? 0}`)
			let result = await fetch(`https://brawlhalla.wiki.gg/api.php?action=query&format=json&list=querypage&formatversion=2&qppage=Uncategorizedimages&qplimit=5000${extention}`)
			if(result.status == 429 || result.status == 502){
				console.log("Retrying in 5")
				await sleep(5e3)
				return retry()
			}
			result = await result.json()
			cont = result.continue;
			if(result.query?.querypage?.results){
				pagesList = pagesList.union(new Set(result.query.querypage.results.map(e => e.title)))
				return sleep(1000)
			}
		}()
	} while(cont)
	console.log(`Total ${pagesList.size} images indexed`)
	return [...pagesList]
}