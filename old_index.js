const winston = require('winston');
let http = require('http');

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'kaylascream.log' }),
	],
});

logger.add(new winston.transports.Console({
	format: winston.format.simple(),
}));

client.once('ready', () => {
	logger.info('🚀 kaylascream is online !');
	client.user.setActivity('SCREAM COUNT', { type: 'COMPETING' });
});

screamcount = 0

const whitelist = ["Couaque#3615", "kayayluh#7905", "Meep#5585"]

client.on('interactionCreate', async interaction => {
	if (whitelist.includes(interaction.user.tag)) {
		if (!interaction.isCommand()) return;
		const { commandName } = interaction;
		if (commandName === 'ping') {
			logger.info('Asked for a ping command')
			await interaction.reply('Pong!');
		} else if (commandName === 'adds') {
			screamcount = screamcount + 1
			logger.info('Current scream count : ' + screamcount)
			await interaction.reply('Scream added. Current scream count : ' + screamcount)
		} else if (commandName == 'resets') {
			logger.info('Asked for the resets command')
			screamcount = 0
			await interaction.reply('Scream added. Current scream count : ' + screamcount)
		} else if (commandName === 'sets') {
			logger.info('Asked for the sets command')
			screamcount = interaction.options.getInteger("value")
			await interaction.reply('Scream counter set ! Current scream count : ' + screamcount)
		}
	}else{
		interaction.reply(`Sorry, you're not one of my masters :/`)
	}

});

client.login(token);

// EXPRESS CONFIG
const express = require('express')
const app = express()
const port = 8080
app.use('/static', express.static('public'))

app.get('/', (req, res) => {
	res.send(`<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta http-equiv="Refresh" content="10">
		<style>
		@font-face {
			font-family: 'Kon Tiki Aloha JF';
			font-style: normal;
			font-weight: 700;
			font-display: swap;
			src: url(https://kscreams.haysberg.io/static/kontiki.woff2) format('woff2');
			unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
		  }
		</style>
		<title>Kayla's scream counter</title>
	</head>
	<body style="background-color:transparent">
		<p style="font-size:300px; font-family: 'Kon Tiki Aloha JF', sans-serif;">${screamcount}</p>
	</body>
	</html>`)
})

app.listen(port, () => {
	console.log(`KAYLA SCREAM COUNTER LISTENING ON PORT ${port}`)
})