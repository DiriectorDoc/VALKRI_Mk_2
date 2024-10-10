Promise.race([bot.edit(page, (rev) => {
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