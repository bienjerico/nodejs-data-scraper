var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var Entities = require('html-entities').AllHtmlEntities;
 
entities = new Entities();

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
				

				var artistsUrl = $(this).attr("href");
				var artistsName = $(this).find("span").text();
				var artistsImage = $(this).find("img").attr("data-src");
				var objSub = [];


				request('http://www.tc-helicon.com'+artistsUrl, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							var $ = cheerio.load(body);
							var aboutData = $('#umbraco-current-partial-id .col-xs-12.col-sm-6.clearfix').html();
								// aboutData += $(this).html();
							// })
							var artistsMessage = $("#umbraco-current-partial-id .col-xs-12.col-sm-6 blockquote").text();
						}
				obj.push({
					artistsName: artistsName,
					artistsImage: artistsImage,
					artistsMessage: artistsMessage,
					artistsAbout: aboutData
				});
				fs.writeFile('tc-helicon-artist.json', JSON.stringify(obj, null, 4), 'utf-8');
				cnt++;

				console.log(cnt);
				})
			});
		}
	})

});

/* display tc helicon artist */
app.get('/tchelicon-artists',function(req,res){
	fs.readFile('tc-helicon-artist.json', 'utf8', function (err, data) {

	    if (err) throw err; // we'll not consider error handling for now

	    var cnt = 1;
	    var obj = JSON.parse(data);
	    var result = "<html><body><table table=1 cellpadding=0>";
	    obj.forEach(function(value) {
	    	result += "<tr>";
	    	result += "<td>"+cnt+"</td>";
	    	result += "<td>"+value.artistsName+"</td>";
	    	result += "<td>"+value.artistsImage+"</td>";
	    	result += "<td>"+value.artistsMessage+"</td>";
	    	result += "<td>"+value.artistsAbout+"</td>";
	    	result += "</tr>";
	    	cnt++;
	    })
	    result += "</table></body></html>";

	    res.send(result);
	
	});
});

/* display tc helicon artist */
app.get('/products-manual',function(req,res){
	fs.readFile('tcelectronic-products-manual.json', 'utf8', function (err, data) {

	    if (err) throw err; // we'll not consider error handling for now
	    
	    var cnt = 1;
	    var obj = JSON.parse(data);
	    var result = "<html><body><table table=1 cellpadding=0>";
	    obj.forEach(function(value) {
	    	var data = "";	
	    	value.productManuals.forEach(function(val) {
	    		
	    		for(var x = 0 ; x < val.length ; x++){
	    			data += val[x].manualName+" | ";
	    			data += val[x].manualPdf+" | ";
	    			data += val[x].manualLang+" , ";

	    		}
	    	})
	    	console.log(data);
	    	result += "<tr>";
	    	result += "<td>"+cnt+"</td>";
	    	result += "<td>"+value.productName+"</td>";
	    	result += "<td>"+value.productImage+"</td>";
	    	result += "<td>"+data+"</td>";
	    	result += "</tr>";
	    	cnt++;
	    })
	    result += "</table></body></html>";

	    res.send(result);
	
	});
});




/* get scrap HTML code artist*/
app.get('/solo-artist',function(){
	request('http://www.tc-helicon.com/en/artists/anthrax', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			$('#umbraco-current-partial-id .col-xs-12.col-sm-6.clearfix p').each(function(){
				console.log("Scraping.......");
				console.log($(this).html());
			})
		}

	})
});


/* get scrap HTML code product*/
app.get('/product',function(req,res){
	request('http://www.tcelectronic.com/clarity-m', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);

			var data = ""; 
			$('#main section').not('#sign-up-to-newsletter, #tc-loudness-customers, #links, #related-products, #feature-diagram, #resume, #videos ').each(function(){
				console.log("Scraping.......");
				console.log(" entry = "+$(this).hasClass('entry')+" : hide-ruler = "+$(this).hasClass('hide-ruler'));
				console.log($(this).attr('id'));
				data += $(this).html();
			})

			res.send(data);
		}

	})
});


app.get('/process-product',function(req,res){
	request('http://www.tcelectronic.com/production/products',function(error,response,body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var obj = [];
			var cnt = 1;

					$('#products ul li').each(function(){
					var productName = $(this).find('span').first().text();
					var productURL = $(this).find('a').attr('href');
					var productImage = $(this).find('img').attr('src');
					var objSub = [];
					
						request('http://www.tcelectronic.com'+productURL, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var $ = cheerio.load(body);

								$('article#main section').each(function(){
									console.log("Scraping.......");
									console.log(productName);
									var productHtml = $(this).html();
									obj.push({ productCnt : cnt,
												productName: productName,
													productURL:productURL,
													productImage: productImage,
													productHtml: productHtml })

									
									
								})
							}
						fs.writeFile('tcelectronic-products.json', JSON.stringify(obj, null, 4), 'utf-8');
						cnt++;
						})
						
				});
			
		}
	});
});


app.get('/process-site-map-products',function(req,res){
	request('http://www.tcelectronic.com/site-map',function(error,response,body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var obj = [];
			var cnt = 1;

			$('article#main section .column-1 ul li').each(function(){
				var productURL = $(this).find('a').attr('href');
				var productName = $(this).find('a').text();

						request('http://www.tcelectronic.com'+productURL, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var $ = cheerio.load(body);
								var objSub = [];

								$('article#main section').not('#sign-up-to-newsletter, #production-banner').each(function(){

									console.log("Scraping.......");
									console.log(productURL);
									console.log(cnt);

									var productHtmlTitle = $(this).find('h2').first().text();
									$(this).find('h2').first().remove();
									var productHtml = $(this).html();
									objSub.push({ productSectionTitle: productHtmlTitle,
													productSection: productHtml })
								})
							}
						obj.push({ productCnt : cnt,
									productURL:productURL,
									productName: productName,
									productHtml: objSub })

						fs.writeFile('tcelectronic-products.json', JSON.stringify(obj, null, 4), 'utf-8');
						cnt++;
						})

			});
		}
	})
})

/* display tc electronic products */
app.get('/tcelectronic-products',function(req,res){
	fs.readFile('tcelectronic-products.json', 'utf8', function (err, data) {

	    if (err) throw err; // we'll not consider error handling for now
	    
	    var cnt = 1;
	    var obj = JSON.parse(data);
	    var result = "<html><body><table table=1 cellpadding=0>";
	    console.log(obj.length);
	    for( var x = 0 ; x < obj.length ; x++ ) {

	    	console.log(obj[x].productName);
	    	console.log(obj[x].productURL);
	    	if(obj[x].productHtml==null){
	    		console.log("empty");
	    	}else{
	    		console.log(obj[x].productHtml.length);

	    		for( var y = 0 ; y < obj[x].productHtml.length ; y ++){
	    			result += "<tr>";
	    			result += "<td>"+cnt+"</td>";
		    		result += "<td>"+obj[x].productName+"</td>";
		    		result += "<td>"+obj[x].productURL+"</td>";
		    		if(obj[x].productHtml[y].productSectionTitle==null){
		    			result += "<td></td>";
		    		}else{
			    		result += "<td>"+obj[x].productHtml[y].productSectionTitle+"</td>";
		    		}
		    		result += "<td>"+entities.encode(obj[x].productHtml[y].productSection)+"</td>";
		    		result += "</tr>";
	    		}
	    	}
	    	cnt++;
	    }

	    result += "</table></body></html>";

	    res.send(result);
	
	});
});


app.get('/sample',function(req,res){
	res.send('\n      \n    <a name=\"backstage-pass---all-access\"></a>\n\n            \n\n     \n\n\n\n  \n<h3></h3>\n<p>The BG combo series builds on our smash success BH amps and pair portability with playability.  Plus a feature set and tonal quality that makes them truly great! 250 Watt of raw power with different speaker configurations for different needs, intelligent EQ section, built-in tuner and TonePrint functionality combined with killer tone. - True greatness comes from the ability to be small, but these combos are the next big thing!</p>\n<figure style=\"position: relative\">\n  <img src=\"http://cdn-assets.tcelectronic.com/ImageGen.ashx?image=/media/2828535/tce-bg250-208-feature-overlay.jpg&amp;Constrain=True&amp;AllowUpSizing=false&amp;width=920\">\n\n\n\n  <figcaption style=\"text-indent: 0;\">\n    \n        <div class=\"feature-overlay-item\" style=\"width: 260px; top: 50px; left: 33px; position: absolute;\">\n           <h4 style=\"margin: 0; padding: 0 0 3px 0;\">Follow that Cab!</h4>\n           <p style=\"margin: 0; font-size: 12px;\">Though the BG-208 is the amp that keeps on giving, sometimes, an extra cab is what&#x2019;s needed to get you through a rehearsal/gig. No problem! You can hook up an 8 Ohm cab any time, quick and easy.</p>\n           \n        </div>\n        <div class=\"feature-overlay-item\" style=\"width: 260px; top: 50px; left: 331px; position: absolute;\">\n           <h4 style=\"margin: 0; padding: 0 0 3px 0;\">TonePrint </h4>\n           <p style=\"margin: 0; font-size: 12px;\">BG250-208 sports Bass TonePrint, a unique feature that lets you load signature effects into the TonePrint slot. We&#x2019;ve got an ever-expanding roster of the coolest people in bass today give us their signature versions of TC effects.</p>\n           \n        </div>\n        <div class=\"feature-overlay-item\" style=\"width: 260px; top: 50px; left: 630px; position: absolute;\">\n           <h4 style=\"margin: 0; padding: 0 0 3px 0;\">Bass Tuner </h4>\n           <p style=\"margin: 0; font-size: 12px;\">The built&#x2013;in tuner will tune up your bass regardless of whether you play 4, 5 or 6 strings. The four LEDs match a standard 4&#x2013;string bass, but if you have a low B&#x2013;string the E and A LEDs will light up together, and if you have a high C&#x2013;string, look at the D and G LEDs.</p>\n           \n        </div>\n        <div class=\"feature-overlay-item\" style=\"width: 260px; top: 560px; left: 309px; position: absolute;\">\n           <h4 style=\"margin: 0; padding: 0 0 3px 0;\">Intelligent EQ Section</h4>\n           <p style=\"margin: 0; font-size: 12px;\">The Tone Controls are tailored specifically for bass as each knob will boost and cut at different frequencies, making sure that you can dial in any tone you want with ease. </p>\n           \n        </div>\n        <div class=\"feature-overlay-item\" style=\"width: 260px; top: 560px; left: 630px; position: absolute;\">\n           <h4 style=\"margin: 0; padding: 0 0 3px 0;\">Plug &amp; Play</h4>\n           <p style=\"margin: 0; font-size: 12px;\">Use your iPod, phone, MP3 player or similar to jam along your favorite tracks. Just plug it into the AUX input and you&#x2019;re ready for a rehearsal session, combining your favorite music with your favorite bass tone!  </p>\n           \n        </div>\n        <div class=\"feature-overlay-item\" style=\"width: 280px; top: 802px; left: 290px; position: absolute;\">\n           <h4 style=\"margin: 0; padding: 0 0 3px 0;\">Foot Control </h4>\n           <p style=\"margin: 0; font-size: 12px;\">With the optional Switch-3 footswitch, you can switch TonePrints, change them on the fly or mute &#x2013; whatever you need to create your tones.</p>\n           \n        </div>\n  \n</figcaption></figure>\n\n  ')
})




app.listen(3000);