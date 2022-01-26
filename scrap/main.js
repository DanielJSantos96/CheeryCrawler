const Apify = require('apify');



var seenTable = {};

Apify.main(async () => {
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: 'https://www.edeka24.de/' });

    const handlePageFunction = async ({ request, body, $ }) => {
		const title = $('title').text();
		if (request.loadedUrl.includes(".html")) {
			const kvs = await Apify.openKeyValueStore("product-pages");
			await kvs.setValue(request.loadedUrl.replace('https://', '').replaceAll(/-|\//g,'_'), {html: body});
		} else {
			const regex = /out\/|\/modules\/|^(?!https:\/\/www.edeka24.de)/;
			const baseLinks = $("[href]")
					.filter((i, el) => {return ($(el).attr("href")!= "#" && !($(el).attr("href").match(regex)))})
					.map((i,el) => {return ($(el).attr("href").includes("?force_sid=")) ? $(el).attr("href").substring(0, $(el).attr("href").indexOf("?force_sid=")) : $(el).attr("href")})
					.get();
			
			
			var uBaseLinks = baseLinks.filter((h)=> { return seenTable.hasOwnProperty(h) ? false : seenTable[h] = true});
			
			for (const url of uBaseLinks) {
				await requestQueue.addRequest({ url: url });
			}
		}
    };

    const crawler = new Apify.CheerioCrawler({
		maxRequestsPerCrawl: 1000,
        requestQueue,
        handlePageFunction,
    });

    await crawler.run();
});