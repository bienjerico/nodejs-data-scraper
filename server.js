var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

/* get artist */
app.get('/process-artists', function (req, res) {

	request('http://www.tcelectronic.com/artists/studio-pros', function (error, response, body) {

		console.log("Start Data Scraping...");

		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var list = $("#featured-studio-pros");
			var listDetails = list.find("ul li h3 a");
			var obj = {artists: []};
			var cnt = 0;

			listDetails.each(function(){

				var artist = $(this).attr("href");
				var artistUrl = 'http://www.tcelectronic.com/'+artist;

				  	request('http://www.tcelectronic.com/'+artist, function (error, response, body) {

						if (!error && response.statusCode == 200) {
							var $ = cheerio.load(body);
							var productdata = "";

							$("#artist-products li").each(function(){
								productdata += $(this).find("span").first().text();
								productdata += ',';
							})
								
							obj.artists.push({
											image : $(".artist-banner-image").attr('src'),
											h2 : $("#variable-banner-text h2").text(),
											h3 : $("#variable-banner-text h3").text(),
											p : $("#variable-banner-text p").text(),
											desc : $("#artist-description").children().text(),
											products : productdata
										}) 
							fs.writeFile('tcelectronic-studio-pros.json', JSON.stringify(obj, null, 4), 'utf-8');
							cnt++;
						  	console.log(cnt +' - '+ $("#variable-banner-text h2").text());
						}
			  		})
			})
		}
	})
})

/* display artist */
app.get('/artists',function(req,res){
	fs.readFile('tcelectronic-studio-pros.json', 'utf8', function (err, data) {

	    if (err) throw err; // we'll not consider error handling for now

	    var obj = JSON.parse(data);
	    var artists = obj.artists;
	    var result = "<html><body><table table=1 cellpadding=0>";
	    var cnt = 1;

	    for(var x = 0 ; x < artists.length ; x++){
			var image = artists[x].image; 
			var name = artists[x].h2; 
			var bandname = artists[x].h3; 
			var message = artists[x].p; 
			var desc = artists[x].desc; 
			var products = artists[x].products; 

			result += "<tr><td>"+cnt+"</td><td>"+image+"</td><td>"+name+"</td><td>"+bandname+"</td><td>"+message+"</td><td>"+desc+"</td><td>"+products+"</td></tr>";
			cnt++;
	    }

	    result += "</table></body></html>";
	    res.send(result);
	
	});
});

/* get manuals */
app.get('/process-manuals',function(){
	
	request('http://www.tcelectronic.com/support/manuals', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);

			var manuals = $("#manuals");
			var manualsList = manuals.find("ul > li");
			var cnt = 0;
			var obj = [];

			manualsList.each(function(){
				cnt++;

				console.log(cnt);
				
				var productName  = "";
				var productImage = "";
				var objSub = [];

				productName = $(this).find("h3 > span").text();
				productImage = $(this).find("h3 > img").attr("src");

				$(this).find("li").each(function(){

					var manualName = $(this).find("a").text();
					var manualPdf = $(this).find("a").attr("href");
					var manualLang = $(this).find("a > span").text();

					objSub.push({
						manualName: manualName,
						manualPdf: manualPdf,
						manualLang: manualLang
					})

				})

				obj.push({
					productName: productName,
					productImage: productImage,
					productManuals: [objSub]
				});

			})

			console.log(obj);
			fs.writeFile('tcelectronic-products-manual.json', JSON.stringify(obj, null, 4), 'utf-8');

		}
	})

});

/* get TC helicon artists */
app.get('/process-helicon-artists',function(){

	request('http://www.tc-helicon.com/en/artists/', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var cnt = 0;
			var obj = [];
			var manuals = $(".row");

			manuals.find("a.circle-view").each(function(){
				cnt++;

				console.log(cnt);

				var artistsUrl = $(this).attr("href");
				var artistsName = $(this).find("span").text();
				var artistsImage = $(this).find("img").attr("src");
				var objSub = [];


				request('http://www.tc-helicon.com'+artistsUrl, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							var $ = cheerio.load(body);
							var aboutData = "";
							$('#umbraco-current-partial-id .col-xs-12.col-sm-6.clearfix p').each(function(){
								aboutData += $(this).html();
							})
							var artistMessage = $("#umbraco-current-partial-id .col-xs-12.col-sm-6 blockquote").text();
						}
				obj.push({
					artistsName: artistsName,
					artistsImage: artistsImage,
					artistsMessage: artistMessage,
					artistsAbout: aboutData
				});
				fs.writeFile('tc-helicon-artist.json', JSON.stringify(obj, null, 4), 'utf-8');
				})
			});
		}
	})

});

/* get scrap HTML code */
app.get('/solo-artist',function(){
	request('http://www.tc-helicon.com/en/artists/daughter', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			$('#umbraco-current-partial-id .col-xs-12.col-sm-6.clearfix p').each(function(){
				console.log("Scraping.......");
				console.log($(this).html());
			})
		}

	})
});






app.listen(3000);