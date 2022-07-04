const tmi = require('@twurple/auth-tmi');
const { StaticAuthProvider, RefreshingAuthProvider } = require('@twurple/auth');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const ServerApiVersion = require('mongodb').ServerApiVersion;

var session        = require('express-session');
var passport       = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var request        = require('request');
var handlebars     = require('handlebars');

//Initializing variables
var screamcount = 0.0
var totalscreams = 0.0
const PREFIX = "*";

// Define our constants, you will change these with your own
const TWITCH_CLIENT_ID = process.env.CLIENT_ID;
const TWITCH_SECRET    = process.env.CLIENT_SECRET;
const SESSION_SECRET   = process.env.SESSION_SECRET;
const CALLBACK_URL     = "http://localhost:8080/followup";

//We create a single connection to the Mongo Database to avoid resource exhaustion
const uri = process.env.MONGO_URI
var mongo = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

///////////////////////////////////////////
//EXPRESS BLOCK TO DISPLAY THE ACTUAL COUNT
///////////////////////////////////////////
const express = require('express');
const path = require('path');
const app = express();
app.use(session({secret: SESSION_SECRET, resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
const port = process.env.PORT || 8080;

//Necessary to get the font files
app.use('/static', express.static('public'))

//The actual index.html
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

//Sending the screamcount as JSON for a quick refresh
app.get('/countjson', function(req, res) {
	res.json({ count: screamcount })
});

//Twitch OAuth Callback method
app.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/', failureRedirect: '/' }));

// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
	var options = {
	  url: 'https://api.twitch.tv/helix/users',
	  method: 'GET',
	  headers: {
		'Client-ID': TWITCH_CLIENT_ID,
		'Accept': 'application/vnd.twitchtv.v5+json',
		'Authorization': 'Bearer ' + accessToken
	  }
	};
  
	request(options, function (error, response, body) {
	  if (response && response.statusCode == 200) {
		done(null, JSON.parse(body));
	  } else {
		done(JSON.parse(body));
	  }
	});
  }
  
  passport.serializeUser(function(user, done) {
	  done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
	  done(null, user);
  });
  
  passport.use('twitch', new OAuth2Strategy({
	  authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
	  tokenURL: 'https://id.twitch.tv/oauth2/token',
	  clientID: TWITCH_CLIENT_ID,
	  clientSecret: TWITCH_SECRET,
	  callbackURL: CALLBACK_URL,
	  state: true
	},

	function(accessToken, refreshToken, profile, done) {
		console.log(accessToken, refreshToken, profile)
		profile.accessToken = accessToken;
	  	profile.refreshToken = refreshToken;
	
		//Securely store user profile in your DB
		mongo.db("kscreams").collection("alltimecount").findAndModify({
			query: { _id: "some potentially existing id" },
			update: {
			$setOnInsert: { foo: "bar" }
			},
			new: true,   // return new doc if one is upserted
			upsert: true // insert the document if it does not exist
		})
	
		done(null, profile);
	}
  ));
  
  // Set route to start OAuth link, this is where you define scopes to request
  app.get('/auth/twitch', passport.authenticate('twitch', { scope: 'user_read' }));
  
  // Set route for OAuth redirect
  app.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/followup', failureRedirect: '/followup' }));
  
  // Define a simple template to safely generate HTML with values from user's profile
  var template = handlebars.compile(`
  <html><head><title>Twitch Auth Sample</title></head>
  <table>
	  <tr><th>Access Token</th><td>{{accessToken}}</td></tr>
	  <tr><th>Refresh Token</th><td>{{refreshToken}}</td></tr>
	  <tr><th>Display Name</th><td>{{display_name}}</td></tr>
	  <tr><th>Bio</th><td>{{bio}}</td></tr>
	  <tr><th>Image</th><td>{{logo}}</td></tr>
  </table></html>`);
  
  // If user has an authenticated session, display it, otherwise display link to authenticate
  app.get('/followup', function (req, res) {
	if(req.session && req.session.passport && req.session.passport.user) {
	  res.send(template(req.session.passport.user));
	} else {
	  res.send('<html><head><title>Twitch Auth Sample</title></head><a href="/auth/twitch"><img src="http://ttv-api.s3.amazonaws.com/assets/connect_dark.png"></a></html>');
	}
});

//We launch the Express server
app.listen(port);

//SIGTERM Handler just to make sure we save the values when the server reboots
process.on('SIGTERM', () => {
	debug('SIGTERM signal received: closing HTTP server')
	server.close(() => {
		mongo.db("kscreams").collection("alltimecount").updateMany({}, {$set: { count: totalscreams }})
		debug('HTTP server closed')
	})
})

//Lil log line
console.log('Server started at http://localhost:' + port);

/////////////////////////////////////
//Connection to the Twitch IRC Server
/////////////////////////////////////
mongo.connect(err => {
	mongo.db("kscreams").collection("alltimecount").findOne().then(function(res){
		totalscreams = res.count;
	})		
});
const authProvider = new StaticAuthProvider(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

const client = new tmi.Client({
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	authProvider: authProvider,
	channels: ['kaylascreambot', 'kayayluh']
});

client.connect().catch(console.error);

//Setting up the recurrent messages about the current scream count
client.on('connected', (address, port) => {
mongo.db("kscreams").collection("alltimecount").findOne().then(function(res){
	totalscreams = res.count;
});

client.say('kaylascreambot', `Kayla has screamed ${screamcount} times today and ${totalscreams} times overall.`);

setInterval(() => {
		client.say('kaylascreambot', `Kayla has screamed ${totalscreams} times overall.`);
		client.say('kaylascreambot', `Kayla has screamed ${screamcount} times today.`);
		mongo.db("kscreams").collection("alltimecount").updateMany({}, {$set: { count: totalscreams }});
	}, 600000);	
});

client.on('message', (channel, tags, message, self) => {
	let [command, ...args] = message.toLowerCase().slice(PREFIX.length).split(/ +/g);

	if (self) return;

	if (command === 'hello') {
		client.say(channel, `@${tags.username}, heya!`);
	}

	if (command === 'help') {
		client.say(channel, `@${tags.username} List of commands : addscream, addhalfscream, addquarterscream, save, info, help`);
	}

	if (command === 'info') {
		client.say(channel, `@${tags.username} Kayla has screamed ${screamcount} times today and ${totalscreams} times overall.`);
	}

	if ("moderator" in tags.badges || "broadcaster" in tags.badges || tags.username == "teoledozo" ){
		if (command === 'addscream') {
			screamcount = screamcount + 1
			totalscreams = totalscreams + 1
			client.say(channel, `Scream added. Current scream count : ${screamcount}`);
		}

		if (command === 'addhalfscream') {
			screamcount = screamcount + 0.5
			totalscreams = totalscreams + 0.5
			client.say(channel, `Scream added. Current scream count : ${screamcount}`);
		}

		if (command === 'addquarterscream') {
			screamcount = screamcount + 0.25
			totalscreams = totalscreams + 0.25
			client.say(channel, `Scream added. Current scream count : ${screamcount}`);
		}

		if (command === 'save') {
			mongo.db("kscreams").collection("alltimecount").updateMany({}, {$set: { count: totalscreams }})
			client.say(channel, `@${tags.username} Saved total scream count : ${totalscreams}`);
		}
	}
});

console.log('🔫🥔 kaylascream is online !');