const tmi = require('tmi.js');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const ServerApiVersion = require('mongodb').ServerApiVersion;

//Initializing variables
var screamcount = 0.0
var totalscreams = 0.0
const PREFIX = "*";

// Define our constants, you will change these with your own
const CLIENT_ID = process.env.CLIENT_ID;
const TWITCH_SECRET    = process.env.CLIENT_SECRET;
const ACCESS_TOKEN   = process.env.ACCESS_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

console.log(`CLIENT_ID : ${CLIENT_ID}`)
console.log(`TWITCH_SECRET : ${TWITCH_SECRET}`)
console.log(`ACCESS_TOKEN : ${ACCESS_TOKEN}`)
console.log(`MONGO_URI : ${MONGO_URI}`)

//We create a single connection to the Mongo Database to avoid resource exhaustion
var mongo = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

///////////////////////////////////////////
//EXPRESS BLOCK TO DISPLAY THE ACTUAL COUNT
///////////////////////////////////////////
const express = require('express');
const path = require('path');
const app = express();
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

const client = new tmi.Client({
	options: { 
		debug: true,
		clientId: CLIENT_ID
	},
	identity: {
		username: 'KaylaScreamBot',
		password: `oauth:${ACCESS_TOKEN}`
	},
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
	let badges = badges = tags.badges || {};

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

	if (badges.moderator || badges.broadcaster || tags.username == "teoledozo" ){
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