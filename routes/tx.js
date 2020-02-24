var express = require('express');
var router = express.Router();
const cheerio = require('cheerio');
const https = require('https');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/search', function(req, res, next) {
    let html = '';
    let searchArr = [];
    let url = 'https://v.qq.com/x/search/?q=' + encodeURI(req.query.s);

    https.get(url, (resc) => {
        resc.on('data', (chunk) => html += chunk);

        resc.on('end', () => {
            let $ = cheerio.load(html);
            let p1 = new Promise((resolve1, reject1) => {
                $('.result_item_v').each((i, elem) => {
                    searchArr.push({
                        title: $(elem).find('h2').text(),
                        imgsrc: $(elem).find('img').attr('src'),
                        list: []
                    });

                    let p2 = new Promise((resolve2, reject2) => {
                        // 如果是电影
                        if( $(elem).find('.btn_primary').length > 0 ) {
                            $('.btn_primary', elem).each((ic, elemc) => {
                                searchArr[i].list.push({
                                    num: $(elemc).text(),
                                    href: $(elemc).attr('href')
                                });
                            });
                        }
                        // 如果是电视剧
                        if($(elem).find('.item').length > 1) {
                            let videoId = $(elem).find('a.result_figure').attr('href').split('/').pop().replace('.html','');
                            let htmld = '';
                            let p3 = new Promise((resolve3, reject3) => {
                                https.get('https://s.video.qq.com/get_playsource?id='+videoId+'&type=4&range=1-1000', (resd) => {
                                    resd.on('data', (chunkd) => {
                                        htmld += chunkd;
                                    });

                                    resd.on('end', () => {
                                        let $d = cheerio.load(htmld);
                                        resolve3($d);
                                    });
                                });
                            });
                            p3.then(($d) => {

                                $d('videoPlayList', 'PlayListItem').each((id, elemd) => {

                                    searchArr[i].list.push({
                                        num: $d(elemd).find('episode_number').text(),
                                        href: $d(elemd).find('playUrl').text()
                                    });

                                });
                                
                                console.log(searchArr[0].list[0].href);
                                resolve2();
                            }).catch((err) => {
                                console.log(err);
                            });
                        }
                    });
                    p2.then(() => {
                        resolve1();
                    }).catch((err) => {
                        console.log(err);
                    });
                });
            });
            p1.then(() => {
                res.render('search', { data: searchArr });
            }).catch((err) => {
                console.log(err);
            });
        });
    });
});

module.exports = router;