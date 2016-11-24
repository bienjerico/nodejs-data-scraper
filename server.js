var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

/* get GUITAR ARTIST */
app.get('/', function (req, res) {
		

	request('http://www.tcelectronic.com/artists/guitar-artists', function (error, response, body) {
		
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var list = $("#featured-guitar-artists");
			var listDetails = list.find("ul li h3 a");
			var obj = {guitarArtists: []};
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
								
							console.log(productdata);
							obj.guitarArtists.push({
											image : $(".artist-banner-image").attr('src'),
											h2 : $("#variable-banner-text h2").text(),
											h3 : $("#variable-banner-text h3").text(),
											p : $("#variable-banner-text p").text(),
											desc : $("#artist-description").children().text(),
											products : productdata
										}) 
							fs.writeFile('data.json', JSON.stringify(obj, null, 4), 'utf-8');
							cnt++;
						  	console.log(cnt);
						}
				  	})

				
			});

		}
	})

})

/* display GUITAR ARTIST */
app.get('/guitar-artists',function(req,res){
	fs.readFile('data.json', 'utf8', function (err, data) {
	    if (err) throw err; // we'll not consider error handling for now
	    var obj = JSON.parse(data);
	    var guitarArtist = obj.guitarArtists;
	    var result = "<html><body><table table=1 cellpadding=0>";
	    var cnt = 1;
	    for(var x = 0 ; x < guitarArtist.length ; x++){
			var image = guitarArtist[x].image; 
			var name = guitarArtist[x].h2; 
			var bandname = guitarArtist[x].h3; 
			var message = guitarArtist[x].p; 
			var desc = guitarArtist[x].desc; 
			var products = guitarArtist[x].products; 

			result += "<tr><td>"+cnt+"</td><td>"+image+"</td><td>"+name+"</td><td>"+bandname+"</td><td>"+message+"</td><td>"+desc+"</td><td>"+products+"</td></tr>";
			cnt++;
	    }

	    result += "</table></body></html>";
	    res.send(result);
	
	});
});



app.listen(3000);