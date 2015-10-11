var express = require('express');
var router = express.Router();
var Pusher = require('pusher');
var debug = require('debug')('rest api');

var pusher = new Pusher({
	appId: '147199',
	key: 'app_key',
	secret: 'app_secret'
});

/* GET home page. */
router.post('/start_session', function(req, res, next) {
    debug(req.body);

    var username = req.body.username;
    if (username) {
        username = username.trim(); //should alway sanitize the input
        req.session.username = username;
        req.session.userId = username + '_' + new Date().getTime();
    }

    res.json({
        success: true
    });
});

router.post('/pusher_auth', function(req, res, next) {
	var socketId = req.body.socket_id;
	var channel = req.body.channel_name;
	var presenceData;
	if (req.session.username && req.session.userId) {
		debug('pusher authentication passed....');

		var presenceData = {
			user_id: req.session.userId,
			user_info: {
				name: req.session.username
			}
		};
		res.send(pusher.authenticate(socketId, channel, presenceData));
	} else {
		debug('pusher authentication failed');

		res.sendStatus(403);
	}
});

router.post('/send_message', function(req, res, next) {
	var message = req.body.message;
	if (message) {
		message = message.trim(); //should also sanitize the input
	}

	if (req.session.username && req.session.userId) {
		pusher.trigger('presence-nettuts', 'new_message', {
			username: req.session.username,
			message: message
		});

		res.json({
			success: true
	    });
	} else {
		debug('pusher authentication failed');

		res.sendStatus(403);
	}
});

module.exports = router;
