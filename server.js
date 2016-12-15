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

/* get software downloads */
app.get('/process-software-downloads',function(req,res){
	request('http://www.tcelectronic.com/software-downloads.html',function(error,response,body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var obj = [];

			$("article#main section ul li").each(function(){
				if($(this).find('h2').text()){

					var objSub = [];
					var softwareProduct = $(this).find('h2').text();
					var softwareImage = $(this).find('img').attr('src');

						$(this).find('.software-group').each(function(){
							var softwareGroup = $(this).children().first().text();
							var objSubList = [];

							$(this).find('a.download-button').each(function(){
								var softwareUrl = $(this).attr('href');

								var dataDesc = $(this).attr('onclick');
								var dataDescSplit = dataDesc.split('|');

								var dataVersion = dataDescSplit[1];
								var dataVersionSplit = dataVersion.split(':');
								var softwareVersion = dataVersionSplit[1];
								var dataPlatform = dataDescSplit[2];
								var dataPlatformSplit = dataPlatform.split(':');
								var softwarePlatform = dataPlatformSplit[1];
								var dataIsCurrent = dataDescSplit[3];
								var dataIsCurrentSplit = dataIsCurrent.split(':');
								var softwareIsCurrent = dataIsCurrentSplit[1];

								console.log(softwareProduct+" - "+softwareGroup+" - "+softwareUrl+" - "+softwareVersion+" - "+softwarePlatform+" - "+softwareIsCurrent);
								objSubList.push({softwareUrl: softwareUrl,
											softwareVersion: softwareVersion,
											softwarePlatform: softwarePlatform,
											softwareIsCurrent: softwareIsCurrent
										})
							})
						objSub.push({ softwareGroup: softwareGroup,
									softwareList: objSubList

							})	
					})
					obj.push({
						softwareProduct: softwareProduct,
						softwareImage: softwareImage,
						softwareDownloads: objSub
					})
				}
			});
			fs.writeFile('tcelectronic-software-downloads.json', JSON.stringify(obj, null, 4), 'utf-8');
		}	
	});
});

/* display tc electronic products */
app.get('/tcelectronic-software-downloads',function(req,res){
	fs.readFile('tcelectronic-software-downloads.json', 'utf8', function (err, data) {

	    if (err) throw err; // we'll not consider error handling for now
	    
	    var cnt = 1;
	    var obj = JSON.parse(data);
	    var result = "<html><body><table table=1 cellpadding=0>";
	    console.log(obj.length);
	    for( var x = 0 ; x < obj.length ; x++ ) {

	    	console.log(obj[x].softwareProduct);
	    	// console.log(obj[x].softwareImage);

	    	for(var y = 0 ; y < obj[x].softwareDownloads.length ; y++){
	    		console.log(obj[x].softwareDownloads[y].softwareGroup);

	    		for(var z = 0; z < obj[x].softwareDownloads[y].softwareList.length ; z++){
	    			console.log(obj[x].softwareDownloads[y].softwareList[z].softwareUrl);
	    			console.log(obj[x].softwareDownloads[y].softwareList[z].softwareVersion);
	    			console.log(obj[x].softwareDownloads[y].softwareList[z].softwarePlatform);
	    			console.log(obj[x].softwareDownloads[y].softwareList[z].softwareIsCurrent);
	    			result += "<tr>";
	    			result += "<td>"+obj[x].softwareProduct+"</td>";
	    			result += "<td>"+obj[x].softwareDownloads[y].softwareGroup+"</td>";
	    			result += "<td>"+obj[x].softwareDownloads[y].softwareList[z].softwareIsCurrent+"</td>";
	    			result += "<td>"+obj[x].softwareDownloads[y].softwareList[z].softwarePlatform+"</td>";
	    			result += "<td>"+obj[x].softwareDownloads[y].softwareList[z].softwareVersion+"</td>";
	    			result += "<td>"+obj[x].softwareDownloads[y].softwareList[z].softwareUrl+"</td>";
	    			result += "</tr>";

	    		}

	    	}
	    
	    	cnt++;
	    }

	    result += "</table></body></html>";

	    res.send(result);
	
	});
});

/* get tcelectronic tech-specs */
app.get('/process-tcelectronic-tech-specs',function(req,res){
	/* access site map */
	request('http://www.tcelectronic.com/site-map',function(error,response,body){
			if (!error && response.statusCode == 200) {
				var $ = cheerio.load(body);
				var cnt = 1;
				

				$('article#main section .column-1 ul li').each(function(){
					var productURL = $(this).find('a').attr('href'); /* get URL */
					var productName = $(this).find('a').text();/* get product name */

						/* access all product url concatinate tech-specs */
						request('http://www.tcelectronic.com'+productURL+'tech-specs',function(error,response,body){
							if (!error && response.statusCode == 200) {
								var $ = cheerio.load(body);

								var iframeSource = $('#main-content article#main iframe').attr('src');/* get the asp iframe */
								var specsBrand = $('#main-content article#main header h1').first().text();/* get the specs brand name*/
								console.log(cnt);
								cnt++;
								

								/* if iframe is available */
								if(iframeSource!=undefined){
									var specs = [];
									/* access the iframe asp */
									request(iframeSource,function(error,response,body){
										var $ = cheerio.load(body);
										var objArray = {};
										var objData = [];
							
										var parentTable = $('body > table').first().find('div');
										var specsTempoCategories;
											parentTable.find('table').each(function(){
												var tableTD = $(this).children();
												

												if(tableTD.find('td').length==1){
													var specsCategories = tableTD.find('td').eq(0).text(); 
													specsTempoCategories = specsCategories;
													// console.log('*'+specsCategories);
												}
												if(tableTD.find('td').eq(0).text()!="" && tableTD.find('td').eq(2).text()!=""){
													var specsLabel = tableTD.find('td').eq(0).text();
													var specsLabelValue = tableTD.find('td').eq(2).text();
													// console.log(tableTD.find('td').eq(0).text()+' = '+tableTD.find('td').eq(2).text()); 
												}
												if(specsLabel!=undefined && specsLabelValue!=undefined){
													// console.log(specsBrand+' | '+specsLabel+' | '+specsLabelValue);
													
													// objData['specsBrand'] = specsBrand;
													// objData['specsLabel'] = specsLabel;
													// objData['specsLabelValue'] = specsLabelValue;
													// objData['specsURL'] = 'http://www.tcelectronic.com'+productURL;
													// objData['specsIframe'] = iframeSource;
														
													
													objData.push({ specsTempoCategories: specsTempoCategories,
														specsLabel: specsLabel,
														specsLabelValue: specsLabelValue,
														specsURL: 'http://www.tcelectronic.com'+productURL,
														specsIframe: iframeSource
													})
													console.log(objData);
												}
											});
											// objArray.push({ specsBrand: specsBrand,
											// 	specsData: objData })
											objArray['specsBrand'] = specsBrand;
											objArray['specsData'] = objData;
											specs.push(objArray);
						
										fs.appendFile('tcelectronic-tech-specs.json', JSON.stringify(specs, null, 4), 'utf-8');
									})
							
								}
							}
						})
						
				})
		}
	})

})


/* get tcelectronic tech-specs */
app.get('/tcelectronic-tech-specs',function(req,res){

	fs.readFile('tcelectronic-tech-specs.json', 'utf8', function (err, data) {
		if (err) throw err; // we'll not consider error handling for now
		    
		    // var cnt = 1;
		    var obj = JSON.parse(data);
		    var count = 1;
		    var result = "<html><body><table table=1 cellpadding=0>";

		    for( var x = 0 ; x < obj.length ; x++ ) {
		    	console.log(obj[x].specsBrand);

		    	if(obj[x].specsData.length > 0){
		    	console.log(count);
		    	
			    	for( var y = 0 ; y < obj[x].specsData.length ; y++ ) {
			    		result += "<tr>";
			    		result += "<td>"+count+"</td>";
		    			result += "<td>"+obj[x].specsBrand+"</td>";
		    			if(obj[x].specsData[y].specsTempoCategories!=undefined){
			    			result += "<td>"+obj[x].specsData[y].specsTempoCategories+"</td>";
		    			}else{
		    				result += "<td></td>";
		    			}
		    			result += "<td>"+obj[x].specsData[y].specsLabel+"</td>";
		    			result += "<td>"+obj[x].specsData[y].specsLabelValue+"</td>";
		    			result += "</tr>";
			    	}
			    	count++;	
		    	}
		    }
		     result += "</table></body></html>";


		res.send(result);
	})

})


/* get tcelectronic tech-specs */
app.get('/process-tcelectronic-tech-specs-noiframe',function(req,res){
	/* access site map */
	request('http://www.tcelectronic.com/site-map',function(error,response,body){
			if (!error && response.statusCode == 200) {
				var $ = cheerio.load(body);
				var cnt = 1;

				$('article#main section .column-1 ul li').each(function(){
					var productURL = $(this).find('a').attr('href'); /* get URL */
					var productName = $(this).find('a').text();/* get product name */
						console.log(' * '+productName)

						/* access all product url concatinate tech-specs */
							request('http://www.tcelectronic.com'+productURL+'tech-specs',function(error,response,body){
							if (!error && response.statusCode == 200) {
								var $ = cheerio.load(body);
								var obj = [];
								var objData = [];

								var iframeSource = $('#main-content article#main iframe').attr('src');/* get the asp iframe */
								var specsBrand = $('#main-content article#main header h1').first().text();/* get the specs brand name*/


								$('#main-content article#main section div strong').each(function(){
										objData.push({
											specsLabel: $(this).text(),
											specsValue:  $(this).next().text() 	
										});
										console.log(objData);
								});
								obj.push({
											specsProduct : productName,
											specsData: objData
										});
							fs.appendFile('tcelectronic-tech-specs-notIframe.json', JSON.stringify(obj, null, 4), 'utf-8');

							}
						})
		

					})

				
			}
	})
})


/* get tcelectronic tech-specs */
app.get('/process-tcelectronic-tech-specs-table',function(req,res){
	request('http://www.tcelectronic.com/upcon/tech-specs/',function(error,response,body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var result = "<html><body><table table=1 cellpadding=0>";

			$('#main-content article#main section table tr').each(function(){
				console.log($(this).children().first().text());
				console.log($(this).children().last().text());
				result += "<tr>";
    			result += "<td>"+$(this).children().first().text()+"</td>";
				result += "<td>"+$(this).children().last().text()+"</td>";
    			result += "</tr>";

			});
			result += "</table></body></html>";

		res.send(result);

		}
	})
})

app.get('/process-tcelectronic-tech-specs-list',function(req,res){

	request('http://www.tcelectronic.com/k-410/tech-specs/',function(error,response,body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var result = "<html><body><table table=1 cellpadding=0>";

			$('#main-content article#main section div strong').each(function(){
				console.log($(this).text());
				console.log($(this).next().text());
				result += "<tr>";
				result += "<td>"+$(this).text()+"</td>";
				result += "<td>"+$(this).next().text()+"</td>";
				result += "</tr>";
			});
			result += "</table></body></html>";

			res.send(result);
		}
	})
})

app.get('/process-tcelectronic-tech-specs-column',function(req,res){

	request('http://www.tcelectronic.com/upcon/tech-specs/',function(error,response,body){
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var result = "<html><body><table table=1 cellpadding=0>";

			$('#main-content article#main section div').each(function(){
				var specsTitle = $(this).children().find('h3').text();

				$(this).children().find('ul li').each(function(){
					console.log(specsTitle);
					console.log($(this).text());
					result += "<tr>";
					result += "<td>"+specsTitle+"</td>";
					result += "<td>"+$(this).text()+"</td>";
					result += "</tr>";
				});
			});
			result += "</table></body></html>";

			res.send(result);
		}
	})
})


app.get('/process-tcelectronic-tech-specs-iframe-2',function(req,res){
	request('http://service.tcgroup.tc/db4db8mkii-tech-specs-custom.asp',function(error,response,body){
		var $ = cheerio.load(body);
		var result = "<html><body><table table=1 cellpadding=0>";

		$('div table tr td').each(function(){

			var list = $(this);

			list.find('ul li').each(function(){
				$(this).each(function(){
					var subList = $(this).text();
					var subListSplit =  subList.split(":");
					console.log(subListSplit[0]+' = '+subListSplit[1]);
					result += "<tr>";
					result += "<td>"+subListSplit[0]+"</td>";
					result += "<td>"+subListSplit[1]+"</td>";
					result += "</tr>";
				})
			})

		});

		result += "</table></body></html>";

		res.send(result);
		
	})
		
})


app.get('/process-tcelectronic-tech-specs-iframe-3',function(req,res){
	request('http://service.tcgroup.tc/lm2-tech-specs-custom.asp',function(error,response,body){
		var $ = cheerio.load(body);
		var result = "<html><body><table table=1 cellpadding=0>";
		var divList = $('div');

		divList.find('table').each(function(){
			$(this).find('td').each(function(){

				var divTitle = $(this).find('span').text();
				var paraTitle = $(this).find('p strong'); 

				paraTitle.each(function(){
					var titleList = $(this).text();

					$(this).next().each(function(){
						console.log(' == '+$(this).text());
						var list = $(this).text();

						result += "<tr>";
						result += "<td>"+divTitle+"</td>";
						result += "<td>"+titleList+"</td>";
						result += "<td>"+list+"</td>";
						result += "</tr>";

					})


				})
			})
		})
		result += "</table></body></html>";

			res.send(result);

	})

})





app.listen(3000);