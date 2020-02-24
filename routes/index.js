var express = require('express');
var router = express.Router();
const cheerio = require('cheerio');
const https = require('https');

/* GET home page. */
router.get('/', function(req, res, next) {
	let html = '';
	let searchArr = [];
	let url = 'https://www.iqiyi.com/dianying_new/i_list_paihangbang.html';

	https.get(url, (resc) => {
		resc.on('data', (chunk) => html += chunk);

		resc.on('end', () => {
			let $ = cheerio.load(html);
			$('.J_videoLi').each((i, elem) => {
				searchArr.push({
					title: $(elem).children('.site-piclist_info').children('.site-title_score').children('.title').children('.site-piclist_info_title').children('a').text(),
					score: $(elem).children('.site-piclist_info').children('.site-title_score').children('.score').text(),
					info: $(elem).children('.site-piclist_info').children('.site-piclist_info_describe').text(),
					imgsrc: $(elem).children('.site-piclist_pic').children('.site-piclist_pic_link').children('img').attr('src'),
					href: $(elem).children('.site-piclist_pic').children('.site-piclist_pic_link').attr('href')
				});
			});
			res.render('index', { data: searchArr });
		});
	});
});

router.get('/search', function(req, res, next) {
	let html = '';
	let searchArr = [];
	let url = 'https://so.iqiyi.com/so/q_' + encodeURI(req.query.s);

	https.get(url, (resc) => {
		resc.on('data', (chunk) => html += chunk);

		resc.on('end', () => {
			let $ = cheerio.load(html);
			$('li[class = list_item]', 'ul[class = mod_result_list]').each((i, elem) => {
				searchArr.push({
					imgsrc: $(elem).children('a').children('img').attr('src'),
					title: $(elem).children('div').children('h3[class = result_title]').text(),
					txt: $(elem).find('.result_info_txt').text(),
					list: []
				});

				// 多集数电视剧
				if($(elem).find('.mt15').find('ul[data-tvlist-elem = list]').length > 0) {
					$(elem).find('.mt15').find('ul[data-tvlist-elem = list]').each((ii, elemm) => {
						$(elemm).children('li').each((iii, elemmm) => {
							searchArr[i].list.push({
								num: $(elemmm).children('a').text(),
								href: $(elemmm).children('a').attr('href')
							});
						});
					});					
				}

				// 剧场版分集
				if($(elem).find('.mt15').find('ul[data-documelist-elem = defaultlist]').length > 0) {
					$(elem).find('.mt15').find('ul[data-documelist-elem = defaultlist]').children('li').each((ia, elema) => {
						searchArr[i].list.push({
							num: $(elema).children('a').text(),
							href: $(elema).children('a').attr('href')
						});
					});
				}

				// 电影
				if($(elem).find('.bottom_left').length > 0) {
					searchArr[i].list.push({
						num: $(elem).find('.bottom_left').children('a').text(),
						href: $(elem).find('.bottom_left').children('a').attr('href')
					});
				}
			});

			// 去除爱奇艺以外的资源
			for(let i=0; i<searchArr.length; i++) {
				if(searchArr[i].list.length>0) {
					let a = searchArr[i].list[0].href;
					if(a.slice(7,9) == 'so') {
						searchArr[i].list.splice(0, searchArr[i].list.length);
					}
					
				}
			}

			res.render('search', { data: searchArr });
		});
	});
});

router.get('/play', function(req, res, next) {
	res.render('play', {url: req.query.url});
});
module.exports = router;